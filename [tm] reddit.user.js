( function () {
    'use strict';

    let filterList = GM_getValue( 'filterList', [] );
    main();
    window.addEventListener( 'urlchange', main );

    async function main () {

        let $activePost;

        if ( location.href.includes( '/comments/' ) ) return;

        const mainEl = await waitFor( 'main:not(.scrollEvAdded)' );
        mainEl.classList.add( 'scrollEvAdded' );

        mainEl.parentElement.parentElement.addEventListener( 'wheel', ( event ) => {
            if ( event.altKey ) return;
            event.preventDefault();

            let $scrollTo;
            if ( !$activePost?.length ) {
                $activePost = jQuery( `article` ).first();
                markAsActive( $activePost[ 0 ] );
                $scrollTo = $activePost;
            }
            else {
                if ( event.deltaY > 0 ) {
                    $scrollTo = $activePost.nextAll( 'article' ).first();
                    if ( !$scrollTo.length )
                        $scrollTo = $activePost.nextAll().find( 'article ' ).first();
                    if ( !$scrollTo.length )
                        $scrollTo = $activePost.parent().nextAll( 'faceplate-batch' ).find( 'article ' ).first();
                }
                if ( event.deltaY < 0 ) {
                    $scrollTo = $activePost.prevAll( 'article' ).first();
                    if ( !$scrollTo.length )
                        $scrollTo = $activePost.parent().prevAll( 'article' ).first();
                    if ( !$scrollTo.length )
                        $scrollTo = $activePost.parent().prevAll( 'faceplate-batch' ).first().find( 'article ' ).last();
                }
            }
            if ( !$scrollTo.length ) return; // 🛑

            $scrollTo[ 0 ].scrollIntoView( { block: 'end', behaviour: 'smooth' } );

            const formerPostId = $activePost.children().attr( 'permalink' ).match( /\/comments\/(.+?)\// )[ 1 ];
            filterList.push( formerPostId );
            filterList = [ ...new Set( filterList ) ];
            GM_setValue( 'filterList', filterList );

            markAsActive( $scrollTo[ 0 ], $activePost[ 0 ] );

            function markAsActive ( el, formerEl ) {
                if ( formerEl ) formerEl.style.outline = '';
                el.style.outline = 'solid red';
                $activePost = jQuery( el );
            }

        } );


        function scrollToNext () {

        }
        function scrollToPrev () {
            if ( !$activePost )
                $activePost = document.querySelector( `article` );
            const nextPost = $activePost.nextElementSibling.nextElementSibling;
            nextPost.scrollIntoView( { block: 'center' } );
            $activePost.style.outline = '';
            nextPost.style.outline = 'solid red';
            $activePost = nextPost;
        }


    }

    waitFor( '#collapsibleContent' ).then( ( el ) => {

        el.parentElement.style.left = '';
        el.parentElement.style.right = '5px';

        const redditPopup = createToolbarPopup();
        redditPopup.id = 'redditPopup';
        generateToolbarButton( 'Reddit', el, redditPopup );
        const match = location.href.match( /\/\/.+?\.(.*)/ );
        // const Link = `https://undelete.pullpush.io/r/Bitcoin/comments/7jzpir/`
        const oldLink = `https://old.${ match[ 1 ] }`;
        const newLink = `https://new.${ match[ 1 ] }`;
        const shLink = `https://sh.${ match[ 1 ] }`;

        function blockAnchor ( href, text ) {
            generateElements( `<a href=${ href }>${ text }</a>`, redditPopup ).style.display = 'block';
        }
        blockAnchor( newLink, 'New' );
        blockAnchor( shLink, 'SH' );
        blockAnchor( oldLink, 'Old' );

        //? regex -> (.+?/r/.+?)(/|$)
        const subredditMatch = location.href.match( /(.+?\/r\/.+?)(\/|$)/ );
        if ( subredditMatch ) {
            generateElements( '<hr>', redditPopup );
            const topAllLink = `${ subredditMatch[ 1 ] }/top/?t=all`;
            blockAnchor( topAllLink, 'TopAll' );
        }

        if ( !location.href.includes( '/comments/' ) ) {
            generateToolbarButton( '⬆️', el, null, () => {
            } );
            generateToolbarButton( '⬇️', el, null, () => {
            } );
        }

        const $filteredCountDiv = jQuery( `<div id=filteredCountDiv style='color:black'>F</div>` );
        $filteredCountDiv.appendTo( el );

    } );

    let filteredCount = 0;

    let observer = new MutationObserver( () => {

        //* filtering

        const allArticles = jQuery( 'article:not(.filterDone)' ).addClass( 'filterDone' ).each( function () {
            const $this = jQuery( this );
            const permalink = $this.children().attr( 'permalink' );
            const title = $this.attr( 'aria-label' );
            const articleId = permalink.match( /\/comments\/(.+?)\// )[ 1 ];
            if ( filterList.includes( articleId ) ) {
                filteredCount++;
                jQuery( '#filteredCountDiv' ).text( filteredCount );

                $this.replaceWith( `<div><h3>Filtered</h3><a target=_blank href=${ permalink }>${ title }</a></div>` );
                // $this.remove()
            }
        } );

        //* gallery
        jQuery( 'gallery-carousel:not(.galleryDone)' ).each( function () {
            const $this = jQuery( this );
            $this.addClass( 'galleryDone' );
            $this.find( 'figure > img' ).prependTo( $this.parent() ).css( `width`, `200px` ).each( function () {

                const $imgEl = jQuery( this );

                let finalSrc;
                let lazySrcSet = $imgEl.attr( 'data-lazy-srcset' );
                let srcSet = $imgEl.attr( 'srcset' );
                let dataLazySrc = $imgEl.attr( 'data-lazy-src' );

                if ( lazySrcSet ) {
                    finalSrc = getBestSrc( lazySrcSet );
                }
                else if ( srcSet ) {
                    finalSrc = getBestSrc( srcSet );
                }
                else
                    finalSrc = dataLazySrc;

                $imgEl.attr( 'src', finalSrc );

                function getBestSrc ( srcSet ) {
                    srcSet = srcSet.split( ' ' ).filter( ( current, index ) => { return !( index % 2 ); } );
                    return srcSet[ srcSet.length - 1 ];
                }

            } );
        } );

        //* Adding an anchor element with src to each <img> element so the imagus extension can catch it easily
        jQuery( `:is(shreddit-post,[data-testid="post-container"]) img:not(.imgDone)` ).each( function () {
            // 'shreddit-post' is for the 'new new' reddit ui. 
            // [data-testid="poste-container"] is for the 'old new' reddit ui
            let $this = jQuery( this );
            $this.after( `<a href=${ this.src } style='
                position: absolute;
                right   : 0px;
                bottom  : 0px;
            '> Img </a>`);
            this.classList.add( 'imgDone' );
        } );

        //* Enabling controls for "gif" video elements
        //? Only aplicable to the 'new' new reddit UI
        jQuery( `[gif]` ).removeAttr( 'gif' );

        //* Wrapping a link around each post title
        //? Only aplicable to the 'new' new reddit UI
        jQuery( `shreddit-post > [id*=post-title-]` ).each( function () {
            let $this = jQuery( this );
            let $siblingAnchor = $this.siblings( 'a' );
            let postHref = $siblingAnchor.attr( 'href' );
            let $wrapper = jQuery( `<a href=${ postHref } class=wrapper-anchor target=_blank></a>` );
            $this.wrap( $wrapper );
            //// siblingAnchor.remove() // to prevent the link being clicked when trying to interact with the video
        } );

        //* Reddit old links
        let $links = jQuery( '[href^="/r/"]:not(.wwwToOldDone)' );
        $links.each( function () {
            let thisHref = this.href;
            if ( !thisHref.includes( '/comments/' ) ) return; // 🛑 // Checks if it's a post link as opposed to a subreddit link
            this.href = thisHref.replace( 'https://www.', 'https://old.' );
            this.classList.add( 'wwwToOldDone' );
        } );

        // if( !document.querySelector( `#oldHome` ) ) {
        // console.log( 'test' )
        // }

    } );
    observer.observe( document.body, { childList: true, subtree: true } );

} )();