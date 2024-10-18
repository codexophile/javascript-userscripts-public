( function () {
    'use strict';

    if ( !location.href.includes( 'movie-imdb' ) ) return;

    //* filtering non english items
    document.querySelectorAll( `.sub-lang` ).forEach( item => {
        if ( item.textContent === 'English' ) return;
        item.parentElement.parentElement.style.display = 'none';
    } );


} )();