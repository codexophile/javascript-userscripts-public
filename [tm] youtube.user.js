( function () {
    'use strict'

    waitFor( `#video-controlPanel` ).then( ( el ) => {
        el.style.top = '0px'
        el.style.left = '120px'
    } )

    fixUrl()
    window.addEventListener( 'urlchange', fixUrl )


    function fixUrl () {

        const locationHref = location.href
        const liveOrShortMatch = locationHref.match( /\/(shorts|live)\// )

        if ( liveOrShortMatch ) {
            let href = location.href
            href = href.replace( liveOrShortMatch[ 0 ], '/watch?v=' )
            stopAndChangeUrl( href )
        }

        //? regex -> https://www.youtube.com/watch
        if ( locationHref.match( /https:\/\/www\.youtube\.com\/watch/ ) ) {
            // if ( !locationHref.match( /https:\/\/www\.youtube\.com\/(watch\?v=...........)?$/ ) ) {

            const videoID = locationHref.match( /[\?&]v=(...........)/ )[ 1 ]

            let hashSlots = locationHref.match( /#slot=\d+?($|#)/ )
            hashSlots = hashSlots ? hashSlots[ 0 ] : ''
            const newUrl = `https://www.youtube.com/watch?v=${ videoID }${ hashSlots }`

            if ( location.href !== newUrl ) {
                history.pushState( { state: 1 }, "new state", newUrl )
            }
            // stopAndChangeUrl( `https://www.youtube.com/watch?v=${ videoID }` )
        }

    }

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

    function stopAndChangeUrl ( url ) {
        window.stop()
        location.replace( url )
    }

} )()