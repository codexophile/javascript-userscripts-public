( async function () {
    'use strict'

    const active = await waitFor( 'ytd-macro-markers-list-item-renderer.ytd-macro-markers-list-renderer[active]' )

    document.querySelector( `video` ).addEventListener( 'timeupdate', ( event ) => {

        const thisVideo = event.target
        const currentTime = thisVideo.currentTime

        const currentChapter = document.querySelector( `ytd-macro-markers-list-item-renderer.ytd-macro-markers-list-renderer[active]` )
        const nextChapter = next( currentChapter )

        const startTime = toSeconds( currentChapter.querySelector( '#time' ).textContent )
        const endTime = toSeconds( nextChapter.querySelector( '#time' ).textContent )
        const chapterDuration = endTime - startTime
        const chapterProgress = ( currentTime - startTime ) / chapterDuration * 100

        // removes the progress bars in inactive chapter elements
        document.querySelector( `ytd-macro-markers-list-item-renderer.ytd-macro-markers-list-renderer:not([active]) #chapterProgressBar` )?.remove()

        currentChapter.style.display = `ruby`
        if ( !currentChapter.querySelector( '#chapterProgressBar' ) ) {
            const progressBar = generateElements( `<input type="range" id="chapterProgressBar" min="0" max="100" step="1">`, currentChapter )
            progressBar.style.width = '-webkit-fill-available'
        }
        document.querySelector( `#chapterProgressBar` ).value = chapterProgress

    } )

} )()