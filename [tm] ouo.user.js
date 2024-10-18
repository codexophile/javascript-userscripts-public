( async function () {
    'use strict';
    alert();
    if ( window.top != window.self ) return; //don't run on frames or iframes

    const temp = await waitFor( '#btn-main' );
    console.log( temp );

} )();