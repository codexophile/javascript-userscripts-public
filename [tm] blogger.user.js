(function() {
'use strict';

if ( location.href.includes( '/blogin.g' ) ) {
    let button = document.getElementsByClassName( `maia-button-primary` )[0]
    console.log( button.href )
    console.log( window.parent.location.href )
    // waitFor( `.maia-button-primary` ).then( ( el ) => { 
    //     alert()
    //     console.log( el )
    // } )

}


})();