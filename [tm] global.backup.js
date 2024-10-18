( function () {
        'use strict';

        //* Global toolbar

        const squareLength = 40;
        const { collapsibleStructure, collapsibleToggler, collapsibleContent } = collapsibleHorizontal( '40px' );
        dragElement( collapsibleStructure, collapsibleToggler );
        style( collapsibleStructure, `
                z-index: 2147483646;
                display: fixed;
                bottom:  100px;
                left:    500px;
                border:  0;
                margin:  0;
                padding: 0;
        ` );

        GM_addStyle( `
                #collapsibleContent > button{

                        min-width: ${ squareLength }px;
                        height: ${ squareLength }px;

                        display:inline-block;
                        /* padding:0.2em 1.45em; */
                        /* margin:0.1em; */
                        border:0.15em solid #CCCCCC;
                        box-sizing: border-box;
                        text-decoration:none;
                        font-family:'Segoe UI','Roboto',sans-serif;
                        font-weight:400;
                        color:#000000;
                        background-color:#CCCCCC;
                        text-align:center;
                        position:relative;
                }
                #collapsibleContent > button:hover{
                        border-color:#7a7a7a;
                }
                #collapsibleContent > button:active{
                        background-color:#999999;
                }

                .ribbon {
                        display:   none;
                        width:     60px;
                        font-size: 14px;
                        padding:   4px;
                        position:  absolute;
                        right:     -25px;
                        top:       -12px;
                        text-align:    center;
                        border-radius: 25px;
                        transform:     rotate(20deg);
                        background-color: #ff9800;
                        color:            white;
                }

        ` );

        const iframesLinksContainer = createToolbarPopup();
        const headersContainer = createToolbarPopup();

        generateToolbarButton( '🔝', collapsibleContent, null, () => window.scrollTo( 0, 0 ) );
        generateToolbarButton( '📜', collapsibleContent, scrollToolsCntnr );
        const iframesButton = generateToolbarButton( 'ⅈ', collapsibleContent, iframesLinksContainer );
        const headerIndicatorBtn = generateToolbarButton( 'h', collapsibleContent, headersContainer );

        document.addEventListener( 'click', ( event ) => {
                if ( event.target.classList.contains( 'popupButton' ) ) return;
                if (
                        !event.target.classList.contains( 'toolbarPopup' ) &&
                        !event.target.parentElement.classList.contains( 'toolbarPopup' )
                )
                        document.querySelectorAll( `.toolbarPopup` ).forEach( item => { item.style.display = 'none'; } );
        } );

        collapsibleToggler.addEventListener( 'click', () => {
                document.querySelectorAll( `.toolbarPopup` ).forEach( item => { item.style.display = 'none'; } );
        } );

        //* Rest

        generateToolbarButton( '🔉', collapsibleContent, null, () => {
                const text = window.getSelection().toString().replaceAll( '\n', '. ' );
                if ( !text ) return; // 🛑
                location.href = `edge-tts:${ text }`;
        } );

        const rssLinks = document.querySelectorAll( 'link[rel="alternate"][type="application/rss+xml"], link[rel="alternate"][type="application/atom+xml"]' );
        if ( rssLinks.length ) {
                const rssFeedsContainer = createToolbarPopup();
                generateToolbarButton( '📶', collapsibleContent, rssFeedsContainer );
                rssLinks.forEach( link => {
                        generateElements( `<a
                        href='${ link.href }'
                        target=_blank
                        style='display: block;'
                >${ link.title }</a>`, rssFeedsContainer );
                } );
        }

        //? Not impossible to make it work with an iframe. use the below code if/when needed
        // Checkout: https://web.archive.org/web/20240423123905/https://wiki.greasespot.net/CSS_Independent_Content

        //* ------------------------------------------------------

        let iframeCount = 0;
        let headerCount = 0;

        let observer = new MutationObserver( () => {

                const queryForHeaders =
                        ':is(article,#main,[role=main]) :is(h1,h2,h3,h4,.open-list-header):not([data-processed=true])';
                const headers = document.querySelectorAll( queryForHeaders );
                headers.forEach( header => {
                        const encodedText = header.textContent.replace( /[\u00A0-\u9999<>\&]/g, function ( i ) {
                                return '&#' + i.charCodeAt( 0 ) + ';';
                        } );
                        const headerDiv = generateElements( `<div>${ encodedText }</div>`, null, true );
                        headerDiv.style = `
                                font-size: large;
                                display  : block;
                                max-width: 600px;
                                white-space: nowrap;
                                overflow   : hidden;
                                text-overflow: ellipsis;
                        `;
                        headerDiv.addEventListener( 'click', () => {
                                header.scrollIntoView( { behavior: 'smooth', block: 'center' } );
                        } );
                        headersContainer.append( headerDiv );

                        header.setAttribute( 'data-processed', 'true' );
                        headerCount++;
                        headerIndicatorBtn.textContent = `h:${ headerCount }`;
                } );
                // return

                const iframes = document.querySelectorAll( 'iframe' );
                iframes.forEach( ( iframe ) => {

                        const iframeW = getComputedStyle( iframe ).width.replace( 'px', '' );
                        const iframeH = getComputedStyle( iframe ).height.replace( 'px', '' );
                        if ( iframesLinksContainer.querySelectorAll( `[href="${ iframe.src }"]` ).length ) return; // 🛑
                        if ( !( iframeW * iframeH ) ) return; // 🛑
                        if ( iframeW * iframeH === 0 ) return; // 🛑

                        const iframeLink = document.createElement( 'a' );
                        iframeLink.target = '_blank';
                        iframeLink.href = iframe.src;
                        iframeLink.textContent = iframe.src;
                        iframeLink.style = `
                                display: block;
                                max-width: 300px;
                                white-space: nowrap;
                                overflow: hidden;
                                text-overflow: ellipsis;
                        `;
                        iframesLinksContainer.append( iframeLink );
                        iframeCount++;
                        iframesButton.textContent = `ⅈ:${ iframeCount }`;
                        // document.querySelector( `#iframesIndicator > .ribbon` ).style.display = ''

                } );

        } );
        observer.observe( document.body, { childList: true, subtree: true } );

        //* Beep -------------------------------------------------
        if ( isInIframe() ) return; // does not run if this is an iframe

        window.addEventListener( 'load', () => {
                if ( document.hidden ) return;
                console.log( `%c✅`, 'font-size: large; color: gold' );
                GM_setClipboard( 'global-document-ready' );
        } );



} )();