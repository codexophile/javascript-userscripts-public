( function () {
    'use strict'

    const videoId = location.href.match( /tv-shows\/(.+?)\// )[ 1 ]
    let storyboardUrls = []
    repeat( 25, ( index ) => {
        const imgUrl = `http://img.adrise.tv/${ videoId }/5x-${ index }.jpg`
        storyboardUrls.push( imgUrl )
    } )

    setTimeout( () => {

        const locator = document.querySelector( '[data-test-id="web-ui-grid-container"]' ).parentElement.parentElement
        const sbContainer = generateElements( '<div id=sbContainer></div>' )
        locator.prepend( sbContainer )
        const video = document.querySelector( `video` )

        console.clear()
        const sb = storyboard( sbContainer, 20, 1, null, video, null, 500, ...storyboardUrls )
        console.log( sb )

    }, 5000 )


} )()