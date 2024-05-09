(function() {
'use strict';

let imgSource = $( '[webkit-playsinline]' )[1].poster.replace( '.mp4.jpg', '.mp4_vtt.jpg' )
let $imgEl    = $( `<img src=${imgSource}>` )
$imgEl.on( 'load', function() {
    let $storyboard = createStoryboard( 1, 100, this )
    $( document.body ).append( $storyboard )
    $storyboard[0].scrollIntoView()
} )

})();