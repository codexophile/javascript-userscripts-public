( function () {
  'use strict';

  // Automatically clicking 'New post notifications for ' item
  const notifQuery = '[data-testid="notification"]';
  waitForEach( notifQuery, ( notifEl ) => {
    if ( notifEl.textContent.includes( "New post notifications for " ) ) {
      notifEl.click();
    }
  } );

  // Automatically clicking "show" button on censored tweets
  const query = '[role=article] [role=button]:contains("Show"), [role=button] > span:contains("Show")';
  waitForEach( query, ( showEl ) => showEl.click() );

} )();