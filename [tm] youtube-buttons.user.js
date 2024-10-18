( async function () {
    'use strict';

    function hideWatchedItems () {
        // console.log( $( "ytd-thumbnail-overlay-resume-playback-renderer" ).parent().parent().parent().parent().parent() )
        $( "ytd-thumbnail-overlay-resume-playback-renderer" ).parent().parent().parent().parent().parent().hide();
    }

    let watchedItemsObserver = new MutationObserver( () => { hideWatchedItems(); } );

    window.addEventListener( 'urlchange', () => { main(); } );

    const collapsibleContent = await waitFor( '.collapsible-content' );
    //* Controls that should be available in any kind of page
    const btHideSeen = generateElements( '<button title="Hide Seen">W</button>', collapsibleContent );
    btHideSeen.onclick = function () {
        hideWatchedItems();
        watchedItemsObserver.observe( document.body, { childList: true, subtree: true } );
    };
    const showSbHorizontalBtn = generateElements( '<button>🎞️</button>', collapsibleContent );
    showSbHorizontalBtn.addEventListener( 'click', () => {

        document.querySelectorAll( `ytd-rich-grid-row > #contents` ).forEach( item => { item.replaceWith( ...item.childNodes ); } );
        document.querySelectorAll( `ytd-rich-grid-row            ` ).forEach( item => { item.replaceWith( ...item.childNodes ); } );
        const thumbItems = document.querySelectorAll( `ytd-rich-item-renderer, ytd-compact-video-renderer` );
        lazyLoad( async ( item ) => {
            const horSbParent = generateElements( '<div class=horSbParent style="width: -webkit-fill-available"></div>' );
            item.after( horSbParent );
            const linkToVid = item.querySelector( 'a' ).href;
            const ytHtml = await GMXmlHttpReqResponse( linkToVid );
            const { allUrls, trueNoOfSlots, samplingFq } = generateAllYouTubeSbUrls( ytHtml );
            storyboardToggleable( horSbParent, 5, 5, linkToVid, null, null, trueNoOfSlots, ...allUrls );
        }, ...thumbItems );

    } );

    main();

    async function main () {

        watchedItemsObserver.disconnect();
        const collapsibleContent = await waitFor( '.collapsible-content' );

        document.querySelectorAll(
            `.videoPageControl,.storyboardControl`
        ).forEach( item => { item.remove(); } );
        // calculateWidthAndExpand( collapsibleContent );

        if ( location.href.includes( '/watch?v=' ) ) {

            const btStop = generateElements( '<button>⏹</button>', collapsibleContent );
            btStop.classList.add( 'videoPageControl' );
            btStop.onclick = function () {
                document.getElementById( "movie_player" ).pauseVideo();
                document.getElementById( "movie_player" ).stopVideo();
            };

            const autoPauseCheckbox = GM_addElement( collapsibleContent, 'input', { type: 'checkbox' } );
            autoPauseCheckbox.classList.add( 'videoPageControl' );
            autoPauseCheckbox.id = 'auto-pause-checkbox';

            const btCopyURL = generateElements( '<button>📋</button>', collapsibleContent );
            btCopyURL.classList.add( 'videoPageControl' );
            btCopyURL.onclick = function () {
                const videoId = location.href.match( /\/(watch\?v=.{11})/ )[ 1 ];
                GM_setClipboard( `https://www.youtube.com/${ videoId }` );
            };

            const btExpandRelated = generateElements( '<button>↖️</button>', collapsibleContent );
            btExpandRelated.classList.add( 'videoPageControl' );
            btExpandRelated.addEventListener( 'click', function () {
                const relatedSection = document.querySelector( `#columns > #secondary > #secondary-inner > #related` );
                console.log( relatedSection[ 0 ] );
                document.querySelector( 'ytd-app' ).prepend( relatedSection );
                GM_addStyle( `
                        #masthead-container { position : unset }
                        #related #contents  {
                            flex-wrap: wrap;
                            display  : flex;
                        }
                        #related #contents > * { width: 25% }
                ` );
                relatedSection[ 0 ].scrollIntoView();
            } );

            const linkToVideosOriginal = await waitFor( '#social-links [aria-label=Videos]:not(.done)' );
            linkToVideosOriginal.classList.add( 'done' );
            const linkToVideos =
                generateElements( `
                    <div class=videoPageControl style='
                        display: flex;
                        /* justify-content: space-between; */
                        align-items: center;
                        font-size: large;
                        text-wrap: nowrap;
                    '>
                        <a href=${ linkToVideosOriginal.href } style='
                            text-decoration: none
                        '>•📂</a>
                    </div>` );
            collapsibleContent.append( linkToVideos );

        }
    }

    return;

    $parent.children().remove();

    if ( location.href.includes( '?v=' ) ) {


        let $prevButton = $( `.ytp-prev-button:not([aria-disabled="true"])` );
        if ( $prevButton.length ) {
            var btPrev = GM_addElement( parent, 'button', { textContent: "⏮" } );
            var btPrev = GM_addElement( parent, 'button', { textContent: "⏮" } );
            btPrev.onclick = function () {
                document.getElementsByTagName( "video" )[ 0 ].pause();
                document.getElementsByTagName( "video" )[ 0 ].currentTime = 0;
                // alert(document.getElementsByTagName("video")[0].currentTime);
                document.querySelectorAll( ".ytp-prev-button" )[ 0 ].click();
            };
        }

        waitFor( '.ytp-next-button[href*="youtube.com"]' ).then( ( el ) => {

            let $nextButton = $( el );
            var btNextLink = GM_addElement( parent, 'a', { textContent: "•👉🏻" } );
            var btNextLink = GM_addElement( parent, 'a', { textContent: "•👉🏻" } );
            let $btNextLink = $( btNextLink );
            $btNextLink.on( 'click', function () { el.click(); return false; } );
            $btNextLink.on( 'mouseover', function () {
                $( this ).attr( 'href', $nextButton.attr( 'data-tooltip-text' ) );
                $( this ).attr( 'title', $nextButton.attr( 'data-tooltip-text' ) );
            } );
            $btNextLink.wrap( '<div></div>' );

        } );

    }

    $declutterButton = $( GM_addElement( parent, 'button', { textContent: '', title: 'Declutter' } ) );
    $declutterButton = $( GM_addElement( parent, 'button', { textContent: '', title: 'Declutter' } ) );
    $declutterButton.on( 'click', function () {
        $( '#masthead-container' ).slideUp();            // horizontal bar at the top
        $( '#page-manager' ).css( 'margin', 'unset' );   // moves up page content to fill the gap made by above
        $( '#guide' ).slideUp();                         // left navigation
        $( '#page-manager > ytd-browse > ytd-two-column-browse-results-renderer' ).css( 'padding', 'unset' );
        $( '#page-manager > ytd-browse > ytd-playlist-sidebar-renderer' ).fadeOut();
        $( 'ytd-playlist-video-renderer' ).css( 'width', '20%' ); // playlist items
        $( '[aria-label="Dismiss"]' ).click();
    } );

    // document.body.onscroll = function () {
    //     oldScroll = newScroll
    //     newScroll = window.scrollY
    // }

} )();