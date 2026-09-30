(function () {
  'use strict';

  waitForEach(
    '.markAllRead[style="visibility: hidden;"]',
    bigMarkAsReadWhenAllIsReadEl => {
      const btnEl = bigMarkAsReadWhenAllIsReadEl.closest(
        'button#bigMarkAsRead',
      );
      btnEl.click();
    },
  );
})();
