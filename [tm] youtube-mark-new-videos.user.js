(function () {
  'use strict';

  const BADGE_SELECTORS = ['.ytBadgeShapeText'].join(',');

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
  GM_addStyle(css);

  function isNewBadge(el) {
    const text = el.textContent && el.textContent.trim().toLowerCase();
    return text === 'new';
  }

  waitForEach(BADGE_SELECTORS, el => {
    if (!isNewBadge(el)) return;
    const mainEl = el.closest('yt-lockup-view-model');
    const thumbEl = mainEl.querySelector('.ytLockupViewModelContentImage');
    if (thumbEl) {
      thumbEl.classList.add('new-item');
    }
  });
})();
