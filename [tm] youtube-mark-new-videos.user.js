(function () {
  'use strict';

  const CONFIG = {
    markerStyle: 'pulse-border', // 'pulse-border' or 'breathing-dot'
  };

  const BADGE_SELECTORS = ['.ytBadgeShapeText'].join(',');
  const MAIN_El_SELECTORS = ['yt-lockup-view-model'].join(',');
  const THUMB_El_SELECTORS = ['.ytLockupViewModelContentImage'].join(',');
  const MARKER_STYLE_CLASSES = {
    'pulse-border': 'new-item--pulse-border',
    'breathing-dot': 'new-item--breathing-dot',
  };
  const markerStyleClass =
    MARKER_STYLE_CLASSES[CONFIG.markerStyle] ||
    MARKER_STYLE_CLASSES['pulse-border'];

  const css = `
    .new-item {
      position: relative;
      overflow: visible;
    }

    .new-item--pulse-border::after {
      content: "";
      position: absolute;
      inset: -3px;
      border: 2px solid #ff0000;
      border-radius: 15px;
      box-shadow: 0 0 10px 1px #ff0000;
      opacity: 0.35;
      pointer-events: none;
      z-index: 2;
      animation: new-item-border-pulse 2.4s ease-in-out infinite;
    }

    .new-item--breathing-dot::before {
      content: "";
      position: absolute;
      top: 8px;
      right: 8px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #ff0000;
      box-shadow: 0 0 0 3px rgba(255, 0, 0, 0.25);
      pointer-events: none;
      z-index: 2;
      animation: new-item-dot-breathe 1.6s ease-in-out infinite;
    }

    @keyframes new-item-border-pulse {
      0%, 100% { opacity: 0.35; }
      50% { opacity: 1; }
    }

    @keyframes new-item-dot-breathe {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.35); opacity: 0.6; }
    }

    @media (prefers-reduced-motion: reduce) {
      .new-item--pulse-border::after,
      .new-item--breathing-dot::before {
        animation: none;
      }
    }
  `;
  GM_addStyle(css);

  function isNewBadge(el) {
    const text = el.textContent && el.textContent.trim().toLowerCase();
    return text === 'new';
  }

  waitForEach(BADGE_SELECTORS, el => {
    if (!isNewBadge(el)) return;
    const mainEl = el.closest(MAIN_El_SELECTORS);
    if (!mainEl) return;
    const thumbEl = mainEl.querySelector(THUMB_El_SELECTORS);
    if (!thumbEl) return;
    thumbEl.classList.add('new-item', markerStyleClass);
  });
})();
