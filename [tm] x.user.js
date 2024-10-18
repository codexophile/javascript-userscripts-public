( function () {
    'use strict';

    let observer = new MutationObserver( () => {

        // Automatically clicking "show" button on censored tweets
        $( '[role=article] [role=button]:contains("Show"), [role=button] > span:contains("Show")' ).click();

        // Automatically clicking 'New post notifications for ' item
        if ( !window.location.href.includes( "#notif" ) ) return;
        $( '[data-testid="notification"]:contains("New post notifications for ")' ).click();

    } );
    observer.observe( document.body, { childList: true, subtree: true } );

} )();