(async function () {
  'use strict';
  waitFor('#btn-main').then(btnEl => {
    btnEl.click();
  });
})();
