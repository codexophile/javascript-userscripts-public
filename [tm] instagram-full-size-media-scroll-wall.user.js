// ==UserScript==
// @name         Instagram Full-Size Media Wall (DOM-based)
// @description  Enlarges Instagram grid media into a full-size scrollable wall by reading what the page already renders and driving its own native infinite scroll. No private API calls, no spoofed headers.
// @match        https://www.instagram.com/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const config = {
    VIEWPORT_HEIGHT_PERCENTAGE: 0.85,
    VIEWPORT_WIDTH_PERCENTAGE: 0.6,
    AUTO_SCROLL_DELAY_MS: 900,
    AUTO_SCROLL_MAX_IDLE_ROUNDS: 6, // stop auto-load after this many scrolls with 0 new posts
    HARVEST_DEBOUNCE_MS: 250,
  };

  const state = {
    isWallActive: false,
    wallEl: null,
    contentEl: null,
    observer: null,
    seenShortcodes: new Set(),
    autoScrollTimer: null,
    idleRounds: 0,
    isAutoMode: false,
    harvestDebounceTimer: null,
  };

  // --- small DOM builder ---
  function el(tag, props = {}, children = []) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
      else if (k in node) node[k] = v;
      else node.setAttribute(k, v);
    }
    for (const child of [].concat(children)) {
      if (child == null) continue;
      node.appendChild(
        typeof child === 'string' ? document.createTextNode(child) : child,
      );
    }
    return node;
  }

  function injectStyles() {
    const vh = config.VIEWPORT_HEIGHT_PERCENTAGE * 100;
    const vw = config.VIEWPORT_WIDTH_PERCENTAGE * 100;
    const css = `
      #ig-wall-trigger {
        cursor: pointer;
        text-align: center;
        padding: 14px;
        margin: 8px 0;
        font-weight: 600;
        font-family: sans-serif;
        color: #ccc;
        border: 1px solid #363636;
        border-radius: 8px;
      }
      #ig-wall-trigger:hover { background: rgba(255,255,255,0.05); }

      #ig-wall-overlay {
        position: fixed; inset: 0; width: 100vw; height: 100vh;
        background: rgba(10,10,15,0.98); z-index: 999999;
        overflow-y: auto; -webkit-backdrop-filter: blur(5px); backdrop-filter: blur(5px);
      }
      #ig-wall-content {
        display: flex; flex-wrap: wrap; gap: 14px;
        justify-content: center; align-items: flex-start;
        padding: 70px 20px 100px;
      }
      #ig-wall-close {
        position: fixed; top: 10px; right: 15px; z-index: 1000000;
        background: rgba(255,255,255,0.2); color: #fff; border: none;
        border-radius: 50%; width: 34px; height: 34px; font-size: 22px;
        line-height: 32px; text-align: center; cursor: pointer;
      }
      #ig-wall-close:hover { background: rgba(255,255,255,0.4); }

      #ig-wall-toolbar {
        position: fixed; top: 10px; left: 15px; z-index: 1000000;
        display: flex; gap: 8px;
      }
      #ig-wall-toolbar button {
        background: rgba(255,255,255,0.15); color: #fff; border: none;
        border-radius: 6px; padding: 8px 14px; font-size: 13px; cursor: pointer;
        font-family: sans-serif;
      }
      #ig-wall-toolbar button:hover { background: rgba(255,255,255,0.3); }
      #ig-wall-toolbar button.active { background: #4a9eff; }

      .ig-wall-item {
        width: 300px; max-width: ${vw}vw;
        border: 1px solid #303030; border-radius: 8px; overflow: hidden;
        background: #111;
      }
      .ig-wall-item img {
        display: block; width: 100%; max-height: ${vh}vh; object-fit: contain; background: #000;
      }
      .ig-wall-item .ig-wall-meta {
        display: flex; justify-content: space-between; align-items: center;
        padding: 6px 10px; font-family: sans-serif; font-size: 11px; color: #999;
      }
      .ig-wall-item a { color: #4a9eff; text-decoration: none; }
      .ig-wall-item a:hover { text-decoration: underline; }
      .ig-wall-badge {
        display: inline-block; font-size: 10px; padding: 2px 6px;
        border-radius: 4px; background: #222; color: #ccc; margin-right: 6px;
      }
      #ig-wall-status {
        width: 100%; text-align: center; color: #888; font-family: sans-serif;
        font-size: 13px; padding: 20px;
      }
    `;
    const styleTag = document.createElement('style');
    styleTag.textContent = css;
    document.head.appendChild(styleTag);
  }

  // --- helpers ---
  function getShortcodeFromHref(href) {
    try {
      const path = new URL(href, location.origin).pathname;
      const match = path.match(/\/(p|reel)\/([^/]+)/);
      return match ? match[2] : null;
    } catch {
      return null;
    }
  }

  function isReelHref(href) {
    try {
      return new URL(href, location.origin).pathname.startsWith('/reel/');
    } catch {
      return false;
    }
  }

  // Grid items for multi-media posts carry a small "stacked squares" icon
  // purely for accessibility, so look for an aria-label rather than a class
  // name — labels tend to survive redesigns much better than class names.
  function isCarouselLink(link) {
    const labelled = link.querySelectorAll('[aria-label]');
    for (const node of labelled) {
      const label = node.getAttribute('aria-label') || '';
      if (/carousel|album|multiple photos/i.test(label)) return true;
    }
    return false;
  }

  function bestSrcFromImg(img) {
    const srcset = img.getAttribute('srcset');
    if (!srcset) return img.currentSrc || img.src || '';
    let best = { url: img.currentSrc || img.src || '', width: 0 };
    for (const part of srcset.split(',')) {
      const [url, size] = part.trim().split(/\s+/);
      const width = parseInt(size, 10) || 0;
      if (url && width > best.width) best = { url, width };
    }
    return best.url;
  }

  function findPostLinks() {
    return Array.from(
      document.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]'),
    ).filter(a => getShortcodeFromHref(a.href));
  }

  function harvestFromDocument() {
    if (!state.contentEl) return 0;
    const links = findPostLinks();
    let added = 0;
    for (const link of links) {
      const shortcode = getShortcodeFromHref(link.href);
      if (!shortcode || state.seenShortcodes.has(shortcode)) continue;
      const img = link.querySelector('img');
      if (!img) continue;
      state.seenShortcodes.add(shortcode);
      addWallItem({
        shortcode,
        href: new URL(link.href, location.origin).href,
        imgSrc: bestSrcFromImg(img),
        alt: img.getAttribute('alt') || '',
        isReel: isReelHref(link.href),
        isCarousel: isCarouselLink(link),
      });
      added++;
    }
    return added;
  }

  function scheduleHarvest() {
    if (state.harvestDebounceTimer) return;
    state.harvestDebounceTimer = setTimeout(() => {
      state.harvestDebounceTimer = null;
      harvestFromDocument();
    }, config.HARVEST_DEBOUNCE_MS);
  }

  function addWallItem(item) {
    const card = el('div', { className: 'ig-wall-item' });
    const link = el('a', {
      href: item.href,
      target: '_blank',
      rel: 'noopener noreferrer',
    });
    const img = el('img', { src: item.imgSrc, alt: item.alt, loading: 'lazy' });
    link.appendChild(img);
    card.appendChild(link);

    const meta = el('div', { className: 'ig-wall-meta' });
    if (item.isReel) {
      meta.appendChild(el('span', { className: 'ig-wall-badge' }, 'Reel'));
    }
    if (item.isCarousel) {
      meta.appendChild(el('span', { className: 'ig-wall-badge' }, 'Carousel'));
    }
    meta.appendChild(
      el(
        'a',
        { href: item.href, target: '_blank', rel: 'noopener noreferrer' },
        item.isCarousel ? 'View all slides →' : 'Open original',
      ),
    );
    card.appendChild(meta);

    const status = document.getElementById('ig-wall-status');
    state.contentEl.insertBefore(card, status);
  }

  function setStatus(text) {
    const status = document.getElementById('ig-wall-status');
    if (status) status.textContent = text;
  }

  function scrollRealPage(amount) {
    const scroller = document.scrollingElement || document.documentElement;
    scroller.scrollBy(0, amount);
    window.scrollBy(0, amount);
  }

  function stopAutoScroll() {
    if (state.autoScrollTimer) {
      clearInterval(state.autoScrollTimer);
      state.autoScrollTimer = null;
    }
    state.isAutoMode = false;
    const btn = document.getElementById('ig-wall-auto-btn');
    if (btn) {
      btn.classList.remove('active');
      btn.textContent = 'Auto-load: off';
    }
  }

  function startAutoScroll() {
    if (state.autoScrollTimer) return;
    state.isAutoMode = true;
    state.idleRounds = 0;
    const btn = document.getElementById('ig-wall-auto-btn');
    if (btn) {
      btn.classList.add('active');
      btn.textContent = 'Auto-load: on';
    }
    setStatus('Auto-loading…');

    state.autoScrollTimer = setInterval(() => {
      scrollRealPage(window.innerHeight * 2);
      setTimeout(() => {
        const added = harvestFromDocument();
        if (added === 0) {
          state.idleRounds++;
          if (state.idleRounds >= config.AUTO_SCROLL_MAX_IDLE_ROUNDS) {
            stopAutoScroll();
            setStatus(
              `Stopped — no new posts after several scrolls (${state.seenShortcodes.size} loaded). Instagram may have reached the end, or just needs a manual nudge with "Load more".`,
            );
          }
        } else {
          state.idleRounds = 0;
          setStatus(`Loaded ${state.seenShortcodes.size} posts so far…`);
        }
      }, 500);
    }, config.AUTO_SCROLL_DELAY_MS);
  }

  function onKeyDown(e) {
    if (e.key === 'Escape' && state.isWallActive) closeWall();
  }

  function openWall() {
    if (state.isWallActive) return;
    state.isWallActive = true;

    const overlay = el('div', { id: 'ig-wall-overlay' });
    const content = el('div', { id: 'ig-wall-content' });
    const status = el(
      'div',
      { id: 'ig-wall-status' },
      'Scroll, click "Load more", or turn on Auto-load to pull in more posts',
    );
    content.appendChild(status);

    const closeBtn = el(
      'button',
      { id: 'ig-wall-close', title: 'Close (Esc)' },
      '×',
    );
    closeBtn.onclick = closeWall;

    const toolbar = el('div', { id: 'ig-wall-toolbar' });
    const loadMoreBtn = el('button', {}, 'Load more');
    loadMoreBtn.onclick = () => {
      scrollRealPage(window.innerHeight * 3);
      setTimeout(harvestFromDocument, 600);
    };
    const autoBtn = el('button', { id: 'ig-wall-auto-btn' }, 'Auto-load: off');
    autoBtn.onclick = () => {
      if (state.isAutoMode) stopAutoScroll();
      else startAutoScroll();
    };
    toolbar.appendChild(loadMoreBtn);
    toolbar.appendChild(autoBtn);

    overlay.appendChild(closeBtn);
    overlay.appendChild(toolbar);
    overlay.appendChild(content);
    document.body.appendChild(overlay);

    state.wallEl = overlay;
    state.contentEl = content;

    harvestFromDocument();

    state.observer = new MutationObserver(scheduleHarvest);
    state.observer.observe(document.body, { childList: true, subtree: true });

    document.addEventListener('keydown', onKeyDown);
  }

  function closeWall() {
    stopAutoScroll();
    if (state.observer) {
      state.observer.disconnect();
      state.observer = null;
    }
    if (state.harvestDebounceTimer) {
      clearTimeout(state.harvestDebounceTimer);
      state.harvestDebounceTimer = null;
    }
    document.removeEventListener('keydown', onKeyDown);
    if (state.wallEl) state.wallEl.remove();
    state.wallEl = null;
    state.contentEl = null;
    state.isWallActive = false;
    state.seenShortcodes = new Set();
  }

  function insertTriggerButton() {
    if (document.getElementById('ig-wall-trigger')) return;

    const target =
      document.querySelector('main header') || document.querySelector('main');
    if (!target || !target.parentElement) {
      setTimeout(insertTriggerButton, 500);
      return;
    }

    const trigger = el(
      'div',
      { id: 'ig-wall-trigger' },
      'Open Full-Size Media Wall',
    );
    trigger.onclick = openWall;
    target.parentElement.insertBefore(trigger, target.nextSibling);
  }

  function initialize() {
    injectStyles();
    insertTriggerButton();
    // Instagram is a client-rendered SPA that swaps out the DOM on
    // navigation, so keep checking that the trigger button still exists.
    setInterval(insertTriggerButton, 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
