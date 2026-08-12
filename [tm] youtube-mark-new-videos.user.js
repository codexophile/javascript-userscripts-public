(function () {
  'use strict';

  const STYLE_ID = 'yt-new-gradient-style';
  const MARK_ATTR = 'data-new-gradient';
  const BADGE_SELECTORS = ['.ytBadgeShapeText'].join(',');

  // YouTube-themed gradient: red -> pink -> magenta/purple, animated shift.
  const css = `
    .new-item::before {
      content: "";
      position: absolute;
      inset: 0;
      padding: 2.5px;
      border-radius: 12px;
      background: linear-gradient(135deg, #ff0033, #ff2d78, #ff4dd2, #cc33ff, #ff0033);
      background-size: 300% 300%;
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
      z-index: 6;
      animation: yt-new-gradient-shift 5s ease infinite;
      box-shadow: 0 0 8px rgba(255, 0, 90, 0.35);
    }

    @keyframes yt-new-gradient-shift {
      0%   { background-position: 0% 50%; }
      50%  { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
  `;

  function injectStyle() {
    GM_addStyle(css);
  }

  function isNewBadge(el) {
    const text = el.textContent && el.textContent.trim().toLowerCase();
    return text === 'new';
  }

  function findThumbnailContainer(badgeEl) {
    return (
      badgeEl.closest('.ytLockupViewModelHost') ||
      badgeEl.closest('ytd-thumbnail') ||
      badgeEl.closest('ytd-rich-grid-media') ||
      badgeEl.closest('yt-thumbnail-view-model') ||
      badgeEl.closest('ytd-grid-video-renderer')
    );
  }

  waitForEach(BADGE_SELECTORS, el => {
    if (!isNewBadge(el)) return;
    console.log(el);
    const mainEl = el.closest('yt-lockup-view-model');
    const thumbEl = mainEl.querySelector('.ytLockupViewModelContentImage');
    if (thumbEl) {
      thumbEl.classList.add('new-item');
    }
  });

  function markNewThumbnails(root = document) {
    const badges = root.querySelectorAll(BADGE_SELECTORS);
    badges.forEach(badge => {
      if (!isNewBadge(badge)) return;
      const container = findThumbnailContainer(badge);
      if (container && !container.hasAttribute(MARK_ATTR)) {
        container.setAttribute(MARK_ATTR, '');
      }
    });
  }

  let scheduled = false;
  function scheduleScan() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      markNewThumbnails();
    });
  }

  function init() {
    injectStyle();
    markNewThumbnails();

    const observer = new MutationObserver(mutations => {
      for (const m of mutations) {
        if (m.addedNodes.length) {
          scheduleScan();
          break;
        }
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    // YouTube is an SPA — re-scan after client-side navigations.
    document.addEventListener('yt-navigate-finish', () => {
      setTimeout(() => markNewThumbnails(), 600);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
