( function () {
    'use strict';

    //? events in order they occur
    // window.addEventListener( 'yt-navigate', findStuff )
    // window.addEventListener( 'urlchange', findStuff )
    //
    window.addEventListener( 'yt-navigate-finish', addStoryboard );
    // window.addEventListener( 'yt-page-data-updated', addStoryboard )
    //# window.addEventListener( 'yt-player-updated', addStoryboard )
    //? these didn't fire
    // window.addEventListener( 'yt-page-type-changed', findStuff )

    //* adding the main storyboard for the video page
    async function addStoryboard () {
        console.log( 'yt-player-updated' );

        if ( !location.href.includes( '/watch?v=' ) ) return; // 🛑

        document.querySelector( `#storyboardParent` )?.remove();
        document.querySelectorAll( `#collapsibleContent > .storyboardControl` ).forEach( item => { item.remove(); } );

        const sbLocator = await waitFor( '#above-the-fold > #top-row' );
        const sbParent = generateElements( `<div id=storyboardParent></div>` );
        sbLocator.after( sbParent );
        const ytHtml = await GMXmlHttpReqResponse( location.href );
        const { allUrls, trueNoOfSlots, samplingFq } = generateAllYouTubeSbUrls( ytHtml );
        const video = document.querySelector( `video` );
        storyboard( {
            storyboardParent: sbParent,
            horizontal: 5,
            vertical: 5,
            vidOnPage: video,
            samplingFq: samplingFq,
            trueNoOfSlots: trueNoOfSlots,
            imgUrls: [ ...allUrls ]
        } );

    }

    const modalBoxEl = new modalBox();

    GM_addStyle( `

        :is(
            ytd-rich-item-renderer,
            ytd-compact-video-renderer,
            ytd-video-renderer,
            ytd-playlist-video-renderer > #content
        ):hover > #buttonsContainer { display: flex }
        #buttonsContainer { display: none }

        #buttonsContainer > * {

            width: 30px;
            height: 25px;
            line-height: 25px;
            /* making height = line-height, makes text center vertically */
            text-align: center;
            color: white;
            text-shadow: white 0px 0px 10px;

            display: block;
            border-radius: 4px;
            margin: 1px;
            border: none;
            background-color: #000000;
        }
        #buttonsContainer > *:hover {
        background: #202020;
        }
        #buttonsContainer > *:active {
            transform: matrix( 0.9, 0, 0, 0.9, 0, 2 );
        }
        #peekFullResThumb {
            text-decoration: none;
        }

    ` );

    let observer = new MutationObserver( observerHandler );
    observer.observe( document.body, { childList: true, subtree: true } );

    function observerHandler () {

        //* adding peek buttons

        let peekParentQuery;
        let videoLinkWithTitleQuery;
        if ( location.href.includes( '/results?' ) ) {
            peekParentQuery = 'ytd-video-renderer';
            videoLinkWithTitleQuery = 'a#video-title';
        }
        if ( location.href.includes( '/watch?v=' ) ) {
            peekParentQuery = 'ytd-compact-video-renderer';
            videoLinkWithTitleQuery = 'a:has(#video-title)';
        }
        if ( location.href.match( /https:\/\/www.youtube.com\/$/ )
            // matches: https://www.youtube.com/ 
            || location.href.match( /\/(@.+?|channel)\// ) ) {
            // matches https://www.youtube.com/@comedyland573/videos or https://www.youtube.com/channel/UClfq6WEgQm3MG6b30xJhX3g/videos
            peekParentQuery = `ytd-rich-item-renderer`;
            videoLinkWithTitleQuery = '#video-title-link';
        }
        if ( location.href === 'https://www.youtube.com/playlist?list=WL' )
            peekParentQuery = 'ytd-playlist-video-renderer > #content';

        const videoThumbs = document.querySelectorAll( peekParentQuery );
        videoThumbs.forEach( function ( thumb ) {

            if ( thumb.querySelectorAll( '#buttonsContainer' ).length ) return; // 🛑

            const buttonsContainer = generateElements( `<div id=buttonsContainer></div>` );
            thumb.append( buttonsContainer );
            buttonsContainer.style = 'position: absolute; left: 5px; top: 5px;';

            if ( !buttonsContainer.querySelectorAll( '.peekButton' ).length ) {
                const peekButton = generateElements( `<button class=peekButton>🫣</button>` );
                buttonsContainer.append( peekButton );
                peekButton.addEventListener( 'click', async () => {

                    const videoLink = thumb.querySelector( videoLinkWithTitleQuery );
                    const videoUrl = videoLink.href;

                    const ytHtml = await GMXmlHttpReqResponse( videoUrl );
                    const { allUrls, trueNoOfSlots, samplingFq } = generateAllYouTubeSbUrls( ytHtml );

                    const headerLink = generateElements(
                        `<a href=${ videoUrl } target=_blank> ${ videoLink.textContent } </a>` );
                    const modalBody = generateElements( '<div></div>' );

                    const modal = new ModalBox( {
                        width: '95vw',
                        backgroundColor: '#f0f0f0',
                        headerColor: '#3498db',
                        animation: true,
                        closeOnEscape: true,
                        closeOnOutsideClick: true
                    } );

                    console.log( modal );

                    modal.setTitle( headerLink );
                    modal.setContent( modalBody );
                    modal.show();

                    await storyboard( {
                        storyboardParent: modalBody,
                        horizontal: 5,
                        vertical: 5,
                        linkToVid: videoUrl,
                        trueNoOfSlots,
                        imgUrls: [ ...allUrls ]
                    } );

                } );
            }

            if ( !buttonsContainer.querySelectorAll( ' #sbHorzBtn' ).length ) {

                const sbHorzBtn = generateElements( `<button id=sbHorzBtn>🎞️</button>` );
                buttonsContainer.append( sbHorzBtn );
                sbHorzBtn.addEventListener( 'click', async ( event ) => {

                    const nextElIsSbParent = next( event.target.parentElement.parentElement, '.horSbParent' );
                    if ( nextElIsSbParent ) {
                        toggle( nextElIsSbParent );
                        return;
                    }
                    const wrappers = parents( event.target, '#contents.ytd-rich-grid-row, ytd-rich-grid-row' );
                    wrappers.forEach( item => { unwrap( item ); } );

                    const videoLink = thumb.querySelector( videoLinkWithTitleQuery );
                    const videoUrl = videoLink.href;

                    const ytHtml = await GMXmlHttpReqResponse( videoUrl );
                    const { allUrls, trueNoOfSlots, samplingFq } = generateAllYouTubeSbUrls( ytHtml );
                    const horSbParent = generateElements( '<div class=horSbParent style="width: -webkit-fill-available"></div>' );
                    thumb.after( horSbParent );

                    await storyboard( {
                        parent: horSbParent,
                        horizontal: 5,
                        vertical: 5,
                        linkToVid: videoUrl,
                        trueNoOfSlots,
                        imgUrls: [ ...allUrls ]
                    } );

                } );
            }

            if ( !thumb.querySelectorAll( '#peekFullResThumb' ).length ) {
                const videoLink = thumb.querySelector( 'a#thumbnail' );
                if ( !videoLink ) return;
                const videoId = videoLink.href.match( /(\/shorts\/|\?v=)(.{11})/ )[ 2 ];
                const fullResSrc = `https://i.ytimg.com/vi_webp/${ videoId }/maxresdefault.webp`;
                const peekfullResThumbBtn = generateElements( `<a id=peekFullResThumb href=${ fullResSrc } target=_blank>🖼️</a>` );
                buttonsContainer.append( peekfullResThumbBtn );
            }

        } );
    }



} )();