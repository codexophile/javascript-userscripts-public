let observer = new MutationObserver( () => {
    if ( !document.querySelector( '.jw-time-thumb' ).style.backgroundImage ) return // 🛑
    if ( document.querySelectorAll( '#sbMain' ).length ) return // 🛑
    const thumbElement = document.querySelector( '.jw-time-thumb' )
    const sbUrl = thumbElement.style.backgroundImage.match( /url\("(.+?)"/ )[ 1 ]
    const $sbParent = $( `<div id=sbMain></div>` ).appendTo( document.body )
    const vidOnPage = $( 'video' )[ 0 ]
    observer.disconnect()
    vidOnPage.addEventListener( 'loadeddata', ( ev ) => {
        // const duration = ev.target.duration
        const samplingFq = vidOnPage.duration / 100
        // storyboardMultipleImgs( $sbParent[ 0 ], 3, 34, null, vidOnPage, samplingFq, sbUrl )
        storyboard( $sbParent[ 0 ], 3, 34, null, vidOnPage, samplingFq, 100, sbUrl )
    } )
} )
observer.observe( document.body, { childList: true, subtree: true } )
GM_addStyle( `html, body { overflow: scroll !important }` )