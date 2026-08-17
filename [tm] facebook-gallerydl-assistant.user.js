(function () {
  'use strict';

  GM_addStyle(`
    .gallery-dl-checkbox {
      position: absolute;
      top: 5px;
      right: 5px;
    }
  `);

  waitForEach('[href*="/photo.php?"]', el => {
    const checkboxEl = generateElements(
      `<input type="checkbox">`,
      el.parentElement,
    );
    checkboxEl.classList.add('gallery-dl-checkbox');
    console.log(el);
  });
})();
