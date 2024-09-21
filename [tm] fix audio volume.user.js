( function () {
    'use strict';

    waitForEach( 'audio, video', mediaEl => {
        console.log( mediaEl );
        mediaEl.volume = 0.03;
    } );

} )();