(function () {
  'use strict';

  GM_addStyle(`
    .gallery-dl-checkbox {
      position: absolute;
      top: 5px;
      right: 5px;
    }
  `);

  const SELECTORS = ['/photo.php?', '/stories/'];
  const selector = SELECTORS.map(s => `[href*="${s}"]`).join(',');
  waitForEach(selector, el => {
    const checkboxEl = generateElements(
      `<input type="checkbox">`,
      el.parentElement,
    );
    checkboxEl.classList.add('gallery-dl-checkbox');
    console.log(el);
  });
})();
