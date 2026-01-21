(function () {
  'use strict';

  // Automatically clicking 'New post notifications for ' item
  const notifQuery = '[data-testid="notification"]';
  waitForEach(notifQuery, notifEl => {
    if (!location.href.includes('#notif')) return;
    if (notifEl.textContent.includes('New post notifications for ')) {
      notifEl.click();
    }
  });
})();
