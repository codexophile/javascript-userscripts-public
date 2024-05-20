( function () {
    'use strict'

    let $activePost

    if ( !location.href.includes( '/comments/' ) ) {
        document.querySelector( `main` )?.addEventListener( 'wheel', ( event ) => {
            event.preventDefault()

            if ( !$activePost?.length ) {
                $activePost = jQuery( `article` ).first()
                markAsActive( $activePost[ 0 ] )
            }
            let $scrollTo
            if ( event.deltaY > 0 ) {
                $scrollTo = $activePost.nextAll( 'article' ).first()
                if ( !$scrollTo.length )
                    $scrollTo = $activePost.nextAll().find( 'article ' ).first()
            }
            if ( event.deltaY < 0 ) { $scrollTo = $activePost.prevAll( 'article' ).first() }
            if ( !$scrollTo.length ) return // 🛑

            $scrollTo[ 0 ].scrollIntoView( { block: 'end', behaviour: 'smooth' } )
            markAsActive( $scrollTo[ 0 ], $activePost[ 0 ] )

            function markAsActive ( el, formerEl ) {
                if ( formerEl ) formerEl.style.outline = ''
                el.style.outline = 'solid red'
                $activePost = jQuery( el )
            }

        } )

        function scrollToNext () {

        }
        function scrollToPrev () {
            if ( !$activePost )
                $activePost = document.querySelector( `article` )
            const nextPost = $activePost.nextElementSibling.nextElementSibling
            nextPost.scrollIntoView( { block: 'center' } )
            $activePost.style.outline = ''
            nextPost.style.outline = 'solid red'
            $activePost = nextPost
        }
    }
    waitFor( '#collapsibleContent' ).then( ( el ) => {

        const redditPopup = createToolbarPopup()
        redditPopup.id = 'redditPopup'
        generateToolbarButton( 'Reddit', el, redditPopup )
        const match = location.href.match( /\/\/.+?\.(.*)/ )
        // const Link = `https://undelete.pullpush.io/r/Bitcoin/comments/7jzpir/`
        const oldLink = `https://old.${ match[ 1 ] }`
        const newLink = `https://new.${ match[ 1 ] }`
        const shLink = `https://sh.${ match[ 1 ] }`

        function blockAnchor ( href, text ) {
            generateElements( `<a href=${ href }>${ text }</a>`, redditPopup ).style.display = 'block'
        }
        blockAnchor( oldLink, 'Old' )
        blockAnchor( newLink, 'New' )
        blockAnchor( shLink, 'SH' )

        if ( !location.href.includes( '/comments/' ) ) {
            generateToolbarButton( '⬆️', el, null, () => {
            } )
            generateToolbarButton( '⬇️', el, null, () => {
            } )
        }
    } )

    let observer = new MutationObserver( () => {

        //* Adding an anchor element with src to each <img> element so the imagus extension can catch it easily
        jQuery( `:is(shreddit-post,[data-testid="post-container"]) img:not(.imgDone)` ).each( function () {
            // 'shreddit-post' is for the 'new new' reddit ui. 
            // [data-testid="poste-container"] is for the 'old new' reddit ui
            let $this = jQuery( this )
            $this.after( `<a href=${ this.src } style='
                position: absolute;
                right   : 0px;
                bottom  : 0px;
            '> Img </a>`)
            this.classList.add( 'imgDone' )
        } )

        //* Enabling controls for "gif" video elements
        //? Only aplicable to the 'new' new reddit UI
        jQuery( `[gif]` ).removeAttr( 'gif' )

        //* Wrapping a link around each post title
        //? Only aplicable to the 'new' new reddit UI
        jQuery( `shreddit-post > [id*=post-title-]` ).each( function () {
            let $this = jQuery( this )
            let $siblingAnchor = $this.siblings( 'a' )
            let postHref = $siblingAnchor.attr( 'href' )
            let $wrapper = jQuery( `<a href=${ postHref } class=wrapper-anchor target=_blank></a>` )
            $this.wrap( $wrapper )
            //// siblingAnchor.remove() // to prevent the link being clicked when trying to interact with the video
        } )

        //* Reddit old links
        let $links = jQuery( '[href^="/r/"]:not(.wwwToOldDone)' )
        $links.each( function () {
            let thisHref = this.href
            if ( !thisHref.includes( '/comments/' ) ) return // 🛑 // Checks if it's a post link as opposed to a subreddit link
            this.href = thisHref.replace( 'https://www.', 'https://old.' )
            this.classList.add( 'wwwToOldDone' )
        } )

        // if( !document.querySelector( `#oldHome` ) ) {
        // console.log( 'test' )
        // }

    } )
    observer.observe( document.body, { childList: true, subtree: true } )

} )()