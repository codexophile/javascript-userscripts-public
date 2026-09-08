(function () {
  'use strict';

  waitForEach('video', () => {
    autoTrigger();
  });

  let captured = null;

  // ---------- 1. Capture: hook fetch + XHR, watch for the storyboard shape ----------
  function looksLikeStoryboard(data) {
    return (
      data &&
      typeof data === 'object' &&
      Array.isArray(data.images) &&
      data.images.length > 0 &&
      typeof data.x_len === 'number' &&
      typeof data.y_len === 'number'
    );
  }

  function handlePayload(json) {
    try {
      const data = json && json.data ? json.data : json;
      if (looksLikeStoryboard(data)) {
        captured = data;
        console.log(
          '[storyboard-grabber] captured',
          data.images.length,
          'sprite(s)',
          data,
        );
        // showPanel(data);

        const alreadyOnPageEl = document.querySelector(`.video-play__meta`);
        document
          .querySelectorAll(`.storyboard-container`)
          .forEach(el => el.remove());
        const storyboardParent = generateElements(
          `<div class="storyboard-container"></div>`,
          alreadyOnPageEl,
        );
        console.log({
          storyboardParent,
          horizontal: data.x_len,
          vertical: data.y_len,
          vidOnPage: document.querySelector(`video`),
          imgUrls: data.images,
        });
        try {
          storyboard({
            storyboardParent,
            horizontal: data.x_len,
            vertical: data.y_len,
            vidOnPage: document.querySelector(`video`),
            imgUrls: data.images,
          });
        } catch (error) {
          console.log(error);
        }
      }
    } catch (e) {
      /* not JSON or not our shape — ignore */
    }
  }

  const origFetch = window.fetch;
  window.fetch = function (...args) {
    return origFetch.apply(this, args).then(res => {
      res
        .clone()
        .json()
        .then(handlePayload)
        .catch(() => {});
      return res;
    });
  };

  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._sbUrl = url;
    return origOpen.call(this, method, url, ...rest);
  };
  XMLHttpRequest.prototype.send = function (...args) {
    this.addEventListener('load', function () {
      try {
        handlePayload(JSON.parse(this.responseText));
      } catch (e) {}
    });
    return origSend.apply(this, args);
  };

  // ---------- 2. Auto-trigger: simulate a hover sweep over the player ----------
  // We don't know the exact seek-bar class name (it's a hashed build class),
  // so instead we sweep synthetic mousemove/pointermove events across the
  // bottom strip of the whole player container, which is where the seek bar
  // always lives. This fires the same hover handlers a real mouse would.

  function findPlayerContainer() {
    const video = document.querySelector('video');
    if (!video) return null;
    // walk up a few levels to get a container that wraps the controls, not just the <video> tag
    let el = video;
    for (let i = 0; i < 4 && el.parentElement; i++) el = el.parentElement;
    return el;
  }

  function dispatchHoverSweep(container) {
    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;

    const y = rect.bottom - Math.max(6, rect.height * 0.03); // near the bottom edge, where seek bars sit
    const steps = 8;

    for (let i = 0; i <= steps; i++) {
      const x = rect.left + (rect.width * i) / steps;
      ['pointermove', 'mousemove'].forEach(type => {
        container.dispatchEvent(
          new MouseEvent(type, {
            bubbles: true,
            cancelable: true,
            clientX: x,
            clientY: y,
            view: window,
          }),
        );
      });
    }
    return true;
  }

  function autoTrigger(attempt = 0) {
    if (captured) return; // already have it, stop retrying
    const container = findPlayerContainer();
    const fired = container ? dispatchHoverSweep(container) : false;

    if (!captured && attempt < 12) {
      // player may not be mounted/sized yet — retry with backoff, up to ~20s
      setTimeout(() => autoTrigger(attempt + 1), fired ? 1500 : 800);
    }
  }

  // Kick off once the DOM is interactive, and again on video events as a safety net
  document.addEventListener('DOMContentLoaded', () => autoTrigger());
  window.addEventListener('load', () => autoTrigger());
  document.addEventListener(
    'loadedmetadata',
    e => {
      if (e.target && e.target.tagName === 'VIDEO') autoTrigger();
    },
    true,
  );

  // ---------- 3. UI ----------
  function showPanel(data) {
    let panel = document.getElementById('sb-grabber-panel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'sb-grabber-panel';
      Object.assign(panel.style, {
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        zIndex: 999999,
        background: '#1f1f1f',
        color: '#fff',
        padding: '10px 14px',
        borderRadius: '8px',
        fontFamily: 'sans-serif',
        fontSize: '13px',
        boxShadow: '0 2px 10px rgba(0,0,0,.5)',
        maxWidth: '280px',
      });
      document.body.appendChild(panel);
    }

    const baseId = data.images[0]
      .split('/')
      .pop()
      .replace(/(-\d+)?\.jpg$/, '');

    panel.innerHTML = `
      <div style="margin-bottom:6px;">Storyboard auto-captured</div>
      <div style="opacity:.75;margin-bottom:8px;word-break:break-all;">id: ${baseId} — ${data.images.length} sprite(s), grid ${data.x_len}x${data.y_len}</div>
      <button id="sb-download-btn" style="cursor:pointer;padding:4px 8px;">Download all</button>
      <button id="sb-copy-btn" style="cursor:pointer;padding:4px 8px;margin-left:6px;">Copy URLs</button>
    `;

    document.getElementById('sb-download-btn').onclick = () =>
      downloadAll(data);
    document.getElementById('sb-copy-btn').onclick = () => {
      navigator.clipboard.writeText(data.images.join('\n'));
      const btn = document.getElementById('sb-copy-btn');
      const old = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => (btn.textContent = old), 1200);
    };
  }

  function downloadAll(data) {
    data.images.forEach(url => {
      const name = url.split('/').pop();
      GM_download({ url, name, saveAs: false });
    });
  }

  // expose for console debugging
  window.__sbGrabber = {
    get captured() {
      return captured;
    },
  };
})();
