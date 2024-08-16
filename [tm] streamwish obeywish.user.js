( async function () {
    'use strict'

    let storyboardUrl

    const thumbEl = await waitFor( '.jw-time-thumb[style*="background-image"]' )
    storyboardUrl = thumbEl.style.backgroundImage.match( /['"](.*)['"]/ )[ 1 ]

    const $videoEl = $( `video[src]` )
    $videoEl.data( 'processed', true )
    $videoEl.prop( 'volume', 0.01 )
    $( '#vplayer' ).css( `height`, `70vh` )

    let parent
    if ( $( '.videoplayer, #vplayer' ).length )
        parent = $( `<div></div>` ).insertAfter( $( '.videoplayer, #vplayer' ).first() )
    else
        parent = $( `<div></div>` ).appendTo( document.body )

    const storyboardEl = storyboard( parent[ 0 ], 10, 10, null, $videoEl[ 0 ], null, 100, storyboardUrl )

    storyboardEl.scrollIntoView()


} )()