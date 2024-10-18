//* misc
waitFor( `#video-controlPanel` ).then( ( el ) => {
    let $el = $( el );
    $el.offset( { top: 500, left: 1100 } );
} );

//* Capture context menu event
$( document.body ).on( 'contextmenu', '[href*="/t/"]:has(img)', function ( event ) { clickMore( this, event ); } );

//* Adding the filter button
waitFor( `[aria-label="New message"]` ).then( ( el ) => {

    let $this = $( el ).parent().parent();

    let $filterButton = $this.clone();
    $this.before( $filterButton );
    $filterButton.find( 'svg' ).remove();
    $filterButton.find( 'div' ).text( '👁️' );
    $filterButton.on( 'click', filter );

} );

//* Keyboard shortcuts

document.addEventListener( 'keydown', async ( event ) => {

    if ( !event.altKey ) return; // 🛑

    switch ( event.key ) {

        case "d": // next
            event.preventDefault();
            let $item = $( '[aria-label="Chats"] [href*="/t/"]' ).has( 'span[data-visualcompletion="ignore"]:visible' ).first();
            console.log( $item );
            $item[ 0 ].scrollIntoView();
            $item[ 0 ].click();
            break;
        case "f": // photos
            event.preventDefault();
            let $item_ = $( '[aria-label="Chats"] [href*="/t/"]' ).has( 'span[data-visualcompletion="ignore"]:visible' ).first();
            clickMore( $item_, event );
            break;
        case "a": // archive
            event.preventDefault();
            let $item__ = $( '[aria-label="Chats"] [href*="/t/"]' ).has( 'span[data-visualcompletion="ignore"]:visible' ).first();
            $( $item__ ).parent().parent().parent().find( '[aria-label=Menu]' ).click();
            await waitFor( '[role=menuitem]' );
            $( `[role=menuitem]:contains('Archive chat')` ).click();
            break;

        // case "k":
        //     event.preventDefault()
        //     filter()
        //     break

        default:
            break;

    }

}, false );

function clickMore ( element, event ) {
    event.preventDefault();
    $( element ).parent().parent().parent().find( '[aria-label=Menu]' ).click();
    waitFor( '[role=menuitem][href]' ).then( ( el ) => { window.open( `${ el.href }photos_by` ); } );
}

function filter () {
    waitForEach( '[href*="/t/"]:has(img)', ( element ) => {
        const $chatItem = $( element ).parent().parent().parent().parent().parent();
        if ( $chatItem.has( 'span[data-visualcompletion="ignore"]' ).length ) // based on the unread marker
            // if ( $this.has( ':contains("You: ")' ).length )                  // based on text 'You" '
            return;
        $chatItem.slideUp();
    } );
    // observerHandler();
    // observer.observe( document.body, { childList: true, subtree: true } );
}