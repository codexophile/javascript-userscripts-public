document.body.style.overflow = 'scroll'
let videoId
if ( document.querySelector( 'input[name=fileCode]' ) )
    videoId = document.querySelector( 'input[name=fileCode]' )?.value
else
    videoId = document.querySelector( '.html-embed-code' ).value.match( /\/e\/(.+?)"/ )[ 1 ]
const imageUrl = `https://i.voe.sx/cache/${ videoId }_storyboard_L0.jpg`
const videoEl = document.querySelector( 'video' )
const $sbParent = $( `<div id=sbParent></div>` )
if ( location.href.includes( '/e/' ) )
    $sbParent.appendTo( document.body )
else
    $sbParent.insertAfter( '.stream' )
storyboard( $sbParent[ 0 ], 10, 10, null, videoEl, null, 100, imageUrl )