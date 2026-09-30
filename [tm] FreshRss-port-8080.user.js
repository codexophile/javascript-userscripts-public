(function () {
  'use strict';
  if (location.host !== 'localhost:8080') return;

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
