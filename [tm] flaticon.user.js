( function () {
    'use strict';

    waitForEach( '.icon-png-container', newItem => {
        $( `<button>src</button>` ).appendTo( newItem ).on( 'click', ( event ) => {
            const $image = $( event.target ).siblings( 'img' );
            GM_setClipboard( $image[ 0 ].src );
        } );
        $( `<button>Copy Image</button>` ).appendTo( newItem ).on( 'click', ( event ) => {
            const $image = $( event.target ).siblings( 'img' );
            copyImageToClipboard( $image[ 0 ] );
        } );
    } );

} )();