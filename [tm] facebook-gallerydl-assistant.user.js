(function () {
  'use strict';

  const DIMENSIONS = '25px';
  GM_addStyle(`
    .gallery-dl-checkbox {
      width: ${DIMENSIONS};
      height: ${DIMENSIONS};
      position: absolute;
      top: 5px;
      right: 5px;
    }
  `);

  const SELECTORS = ['/photo.php?', '/stories/', '/photo/?fbid='];
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
