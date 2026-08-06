(function () {
  'use strict';
  waitFor('.bt-sw-continue').then(el => {
    if (!el.textContent.toLowerCase().includes('continue to site')) return;
    el.click();
  });
})();
