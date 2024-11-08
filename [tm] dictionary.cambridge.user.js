( function () {
    'use strict';

    //* Setting audio volume to low
    const audioEls = document.querySelectorAll( 'audio' );
    audioEls.forEach( audioEl => {
        audioEl.volume = 0.1;
    } );

    //* Making it possible to copy IPAs and definitions
    const ipaSpans = document.querySelectorAll( '.pron.dpron' );
    const defs = document.getElementsByClassName( 'def' );
    const $copyBtns = $( `<button> ©️ </button>` ).insertAfter( ipaSpans );
    const $copyDefBtns = $( `<button> C </button>` ).insertAfter( defs );
    $copyBtns.on( 'click', ( event ) => {
        const ipaText = $( event.target ).prev().text().replaceAll( '/', '' );
        navigator.clipboard.writeText( ipaText );
    } );
    $copyDefBtns.on( 'click', ( event ) => {
        const defText = $( event.target ).prev().text();
        navigator.clipboard.writeText( defText );
    } );

} )();