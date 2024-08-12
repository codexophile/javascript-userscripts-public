( async function () {
    'use strict'

    const active = await waitFor( 'ytd-macro-markers-list-item-renderer.ytd-macro-markers-list-renderer[active]' )
    document.querySelector( `#container .ytp-chapter-title` ).click() // clicking to automatically open the chapters panel

    document.querySelector( `video` ).addEventListener( 'timeupdate', async ( event ) => {

        const thisVideo = event.target
        const currentTime = thisVideo.currentTime

        const currentChapter = document.querySelector( `ytd-macro-markers-list-item-renderer.ytd-macro-markers-list-renderer[active]` )
        const nextChapter = next( currentChapter, 'ytd-macro-markers-list-item-renderer.ytd-macro-markers-list-renderer' )

        const startTime = toSeconds( currentChapter.querySelector( '#time' ).textContent )

        const endTime = nextChapter ? toSeconds( nextChapter.querySelector( '#time' ).textContent ) : thisVideo.duration
        const chapterDuration = endTime - startTime
        const chapterProgress = ( currentTime - startTime ) / chapterDuration * 100

        // removes the progress bars in inactive chapter elements
        document.querySelector( `ytd-macro-markers-list-item-renderer.ytd-macro-markers-list-renderer:not([active]) #chapterProgressBar` )?.remove()

        currentChapter.style.display = `flex`
        currentChapter.style.flexWrap = `wrap`
        if ( !currentChapter.querySelector( '#chapterProgressBar' ) ) {
            // await asyncTimeout( 2000 )
            const progressBar = generateElements( `<input type="range" id="chapterProgressBar" min="0" max="100" step="1">`, currentChapter )
            progressBar.style.width = '-webkit-fill-available'
            const chapterTitleEl = currentChapter.querySelector( 'h4' )
            progressBar.after( chapterTitleEl )
        }
        document.querySelector( `#chapterProgressBar` ).value = chapterProgress

    } )

} )()