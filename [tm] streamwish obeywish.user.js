( async function () {
    'use strict'

    let storyboardUrl

    const thumbEl = await waitFor( '.jw-time-thumb[style*="background-image"]' )
    storyboardUrl = thumbEl.style.backgroundImage.match( /['"](.*)['"]/ )[ 1 ]

    const $videoEl = $( `video[src]` )
    $videoEl.data( 'processed', true )
    $videoEl.prop( 'volume', 0.01 )
    $( '#vplayer' ).css( `height`, `70vh` )
    const $storyboard = createStoryboard( 10, 10, storyboardUrl )
    if ( $( '.videoplayer, #vplayer' ).length ) $( '.videoplayer, #vplayer' ).first().after( $storyboard )
    else document.body.append( $storyboard[ 0 ] )
    $storyboard[ 0 ].scrollIntoView()


} )()