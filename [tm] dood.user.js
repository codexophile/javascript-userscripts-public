//# This script runs only on the top frame to avoid confusion

if ( location.href.includes( '/d/' ) && !location.href.includes( '#noRedirect' ) ) {
    window.stop()
    const iframeSrc = document.querySelector( 'iframe' ).src
    location.href = iframeSrc
    // location.href = location.href.replace( '/d/', '/e/' )
}
if ( location.href.includes( '/e/' ) ) {

    $( `<a href="${ location.href.replace( '/e/', '/d/' ) }#noRedirect"> 'Redirect D' </button>` ).prependTo( document.body )

    if ( !document.querySelector( `[name="og:image"]` ) ) return // 🛑
    let imageUrl = document.querySelector( `[name="og:image"]` ).getAttribute( 'content' ).replace( '/splash/', '/slides/' )
    let $storyboard = createStoryboard( 6, 6, imageUrl )
    document.body.append( $storyboard[ 0 ] )
    $storyboard[ 0 ].scrollIntoView()
}
