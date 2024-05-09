( function () {
    'use strict'


    fixUrl()
    window.addEventListener( 'urlchange', () => { fixUrl() } )

    window.addEventListener( 'load', () => {

        //* Toggle sidebar
        waitFor( '#guide[opened]' ).then( () => { $( `#guide-button.ytd-masthead` ).click() } )

        let video

        //* Initialize stuff once the video element is loaded
        waitFor( 'video' ).then( ( el ) => {

            video = el

            let autoPaused = false

            //* Auto pause on losing focus
            window.addEventListener( 'blur', () => {
                if ( document.visibilityState !== 'hidden' ) {
                    if ( document.querySelector( '#autoPauseChckbx' )?.checked ) return // 🛑
                    if ( video.paused ) return // 🛑
                    video.pause()
                    autoPaused = true
                }
            } )

            window.addEventListener( 'focus', () => {
                if ( document.querySelector( '#autoPauseChckbx' )?.checked ) return // 🛑
                if ( autoPaused ) video.play()
            } )

            video.onclick = () => {
                if ( document.querySelector( '#autoPauseChckbx' ).checked ) return // 🛑
                autoPaused = false
            }

        } )

    } )


    let observer = new MutationObserver( () => {

        //* @channelName links -> @channelName/videos/
        document.querySelectorAll( `[href*='/@']` ).forEach( link => {
            if ( link.href.match( /\/videos\/?$/ ) ) return
            link.href += '/videos/'
        } )

        //* Watch later items
        if ( location.href.includes( '?list=WL' ) ) {
            // const vidLinks = document.querySelectorAll( `a#video-title:not([target])` )
            const vidLinks = document.querySelectorAll( `ytd-playlist-video-renderer a` )
            vidLinks.forEach( link => { link.setAttribute( 'target', '_blank' ) } )
        }

        //* fixing hrefs

        const shortLinks = document.querySelectorAll( `[href*='/shorts/']` )
        shortLinks.forEach( item => {
            item.href = item.href.replace( '/shorts/', '/watch?v=' )
        } )

        const videoLinks = document.querySelectorAll( `:not(#storyboard) :is([href*="&list="],[href*="&index="],[href*="&pp="],[href*="&t="])` )
        videoLinks.forEach( function ( link ) {
            if ( !link.href ) return // 🛑
            const matches = link.href.match( /\?v=(.{11})/ )
            if ( !matches ) return // 🛑
            const videoID = matches[ 1 ]
            link.href = `https://www.youtube.com/watch?v=${ videoID }`
        } )

    } )
    // const peekParentQuery = `ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, ytd-reel-item-renderer, #thumbnail`
    observer.observe( document.body, { childList: true, subtree: true } )

    function fixUrl () {

        const locationHref = location.href

        if ( locationHref.includes( '/shorts/' ) ) {
            let href = location.href
            href = href.replace( '/shorts/', '/watch?v=' )
            stopAndChangeUrl( href )
        }

        if ( locationHref.match( /&list=|&index=|&pp=|&t=/ ) ) {
            const videoID = locationHref.match( /\?v=(...........)/ )[ 1 ]
            stopAndChangeUrl( `https://www.youtube.com/watch?v=${ videoID }` )
        }

    }

    function stopAndChangeUrl ( url ) {
        window.stop()
        location.href = url
    }

} )()