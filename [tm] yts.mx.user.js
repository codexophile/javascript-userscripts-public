( async function () {
    'use strict';

    //* code for movie search page
    const Els_SearchResultItems = document.querySelectorAll( `.browse-movie-wrap` );
    if ( Els_SearchResultItems.length === 1 ) {
        window.stop();
        location.href = Els_SearchResultItems[ 0 ].querySelector( `a` ).href;
    }

    //* code for movie page
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