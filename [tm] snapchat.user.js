(function() {
'use strict';

document.addEventListener( 'keydown', doc_keyUp, false );

function doc_keyUp(e) {

    if( e.altKey && e.code == "KeyX" ) {
        
        let $storyItems = $( "[role=img] img[src^='blob:']" )
        console.table( $storyItems )
        $storyItems.each( function() { window.open( this.src ) } )
        
        let $videos     = $( `video` )
        $videos.each( function() { window.open( this.src ) } )

    }
}

})();