( async function () {
    'use strict';

    const match = location.href.match( /\/create\?prompt=(.+)(#|&|$)/ );
    if ( match ) {
        let queryString = decodeURIComponent( match[ 1 ] );
        const promptTextarea = document.querySelector( `textarea` );
        promptTextarea.value = queryString;
    }

    waitForEach( 'img[alt]', img => {

        const $img = $( img );
        const $toolbarEl = $img.parent().prev().children();
        const imgAlt = img.alt;
        const altLength = imgAlt.length;

        const $characterCountEl = $( `<button>${ altLength }</button>` ).appendTo( $toolbarEl );
        $characterCountEl[ 0 ].style.backgroundColor = 'black';
        // console.log( $toolbarEl.children() );

    } );

} )();