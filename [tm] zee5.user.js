( async function () {
    'use strict'

    const element = await waitFor( '.vjs-vtt-thumbnail-display[style]' )
    console.log( element )

    try {
        let nOfImgs = Math.ceil( document.querySelectorAll( `video` )[ 0 ].duration / 5 )
        let baseUrl = element.style.backgroundImage
        baseUrl = baseUrl.substring( 5, baseUrl.length - 14 )

        let container = document.createElement( 'div' )
        container.id = 'storyboard'
        let parent = document.querySelector( `[data-testid="playerWrapper"]` )
        parent.after( container )
        let videoElement = document.querySelectorAll( `video` )[ 0 ]
        const imgUrls = []

        repeat( nOfImgs + 1, index => {
            let id = index.toString().padStart( 8, 0 )
            let imgSrc = `${ baseUrl }${ id }.jpg`
            imgUrls.push( imgSrc )
        } )
        storyboard( container, 1, 1, null, videoElement, null, nOfImgs, ...imgUrls )

    } catch ( error ) {
        alert( error )
    }
} )()