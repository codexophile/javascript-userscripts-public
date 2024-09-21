( async function () {
    'use strict';

    $( '[href^=magnet]' ).each( function () {
        const $magnetEl = $( this );
        const $seedrEl = $( `
            <a id=seedrLink href=https://www.seedr.cc/files?link=${ this.href } target=_blank>
                <img src="https://static.seedr.cc/images/seed_v2.png">
            </a>
        ` );
        $magnetEl.after( $seedrEl );

    } );

} )();