let storyboardUrl
const allScripts = document.querySelectorAll( 'script' )
allScripts.forEach( ( script ) => {
    match = script.innerHTML.match( /file:.*?&url=(.*?)"/ )
    if ( match ) storyboardUrl = match[ 1 ]
} )

let observer = new MutationObserver( () => {
    const $videoEl = $( `video[src]` )
    if ( $videoEl.length && !$videoEl.data( 'processed' ) ) {
        $videoEl.data( 'processed', true )
        $videoEl.prop( 'volume', 0.01 )
        $( '#vplayer' ).css( `height`, `70vh` )
        const $storyboard = createStoryboard( 10, 10, storyboardUrl )
        if ( $( '.videoplayer, #vplayer' ).length ) $( '.videoplayer, #vplayer' ).first().after( $storyboard )
        else document.body.append( $storyboard[ 0 ] )
        $storyboard[ 0 ].scrollIntoView()
    }
} )
observer.observe( document.body, { childList: true, subtree: true } )
