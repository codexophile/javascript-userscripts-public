(function() {
'use strict';

//* Removing staff picks
let observer = new MutationObserver( ( mutations ) => {
    mutations.forEach( ( ) => {
        let $targetEl = $( `a[href="/channels/staffpicks"]` )
        if ( !$targetEl.length ) return // 🛑
        $targetEl.parent().parent().parent().remove()
    } )
} )
observer.observe( document.body, { childList: true, subtree: true } )

//* Storyboard
waitFor( '.thumb[style]' ).then( ( el ) => {

    let imgSrc      =  el.style.backgroundImage.match( /url\("(.*)"\)/ )[1]
    let $imgElement = $( `<img src=${imgSrc}>` )
    $imgElement.on( 'load', function() {
       
        let $storyboard = createStoryboard( 11, 11, $imgElement[0] )
        $( document.body ).append( $storyboard )
        
    } )    
} )

})();