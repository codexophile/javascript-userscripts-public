( function () {
    'use strict'

    //* adding the subreddit name to title
    //'Looksmaxxing Feedback? : GayRateMe'
    const match = document.title.match()
    if ( match ) {
        document.title = document.title.replace( /: (.+?)$/, '• /r/$1' )
    }

    //* automatically hiding 'compose comment section and adding the toggle button
    waitFor( '#collapsibleContent' ).then( ( el ) => {
        const $locators = $( `.commentarea` ).children().first().nextUntil( '.sitetable.nestedlisting' ).addBack()
        $locators.hide()
        const $toggleBtn = $( `<button>💬</button>` ).on( 'click', () => { $locators.toggle() } )
        console.log( el )
        el.append( $toggleBtn[ 0 ] )
        calculateWidthAndExpand( el )
    } )

    if ( location.href.match( /\/r\/.+?\/comments\// ) ) { // ==> location.href = ... /r/subreddit/comments/...
    }

    $( `a.expand` ).on( 'click', ( event ) => {

        let $comment = $( event.target ).closest( '.comment' )
        if ( !$comment.hasClass( 'collapsed' ) ) return // 🛑  // do nothing if the comment is NOW expanded
        let $nextExpand = $comment.nextAll( '.comment' ).find( '.expand' )
        if ( !$nextExpand.length ) return // 🛑

        let mouseY = event.clientY
        let elTop = $nextExpand[ 0 ].getBoundingClientRect().top
        let elBot = $nextExpand[ 0 ].getBoundingClientRect().bottom
        let elY = ( elTop + elBot ) / 2
        window.scrollBy( 0, elY - mouseY )

    } )

    let observer = new MutationObserver( () => {

        //* replacing image links with actual <img> elements
        let $allImageLinks = $( `p>a:contains('<image>')` )
        $allImageLinks.each( function () {
            let $this = $( this )
            let imagePath = this.href
            $this.replaceWith( `<img src=${ imagePath } class=converted-from-link>` )
        } )

        //* 'old' to 'www' on links with href ending with a subreddit name
        let $subredditLinks = $( `a[href^='/r/']:not(.converted-to-new-reddit)` )
        $subredditLinks.each( function () {
            let currentHref = this.getAttribute( 'href' )
            // regex for matching links with href ending with a subreddit name
            if ( currentHref.match( /^\/r\/\w+$/ ) ) {
                let newHref = this.href.replace( 'https://old.', 'https://www.' )
                this.setAttribute( 'href', newHref )
            }
            this.classList.add( 'converted-to-new-reddit' )
        } )

        //* Replacing /user/ links with /user/submitted/ links
        let $userLinks = $( `[href^='https://old.reddit.com/user/']:not(.userProcessed)` )
        $userLinks.each( function () {
            let thisHref = this.href
            if ( thisHref.match( /https:\/\/old\.reddit\.com\/user\/(\d|\w|-)+$/ ) )
                this.href = `${ thisHref }/submitted/`
            this.classList.add( 'userProcessed' )
        } )

    } )

    observer.observe( document.body, { childList: true, subtree: true } )

    GM_addStyle( '.entry > form { text-indent: 2em }' )
    GM_addStyle( '.converted-from-link { max-height: 200px }' )

    //* automatically pausing the video after page load
    const videoElement = document.getElementsByTagName( 'video' )[ 0 ]
    if ( !videoElement ) return
    let playAttemptThwarted = false
    console.log( videoElement )
    console.log( playAttemptThwarted )
    videoElement.addEventListener( 'play', ( event ) => {
        if ( playAttemptThwarted ) return // 🛑
        console.log( event.currentTarget )
        event.currentTarget.pause()
        $( 'button.play-pause' )[ 1 ].click()
        playAttemptThwarted = true
    } )

} )()