(function() {
'use strict';

window.addEventListener( 'load', () => { waitFor( 'button#download' ).then( ( el ) => {
    el.click() } ) } ) 

})();