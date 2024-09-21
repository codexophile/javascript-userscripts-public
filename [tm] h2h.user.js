( function () {
    'use strict';

    const $items = $( `.content-inner > div` );

    if ( $items.length ) {
        lazyLoad( async ( item ) => {
            const href = item.querySelector( 'a' ).href;
            const doc = await GMXmlHttpRequest( href );
            const deepHref = doc.querySelector( 'a[href*="paste"]' ).href;
            const downloadPageDoc = await GMXmlHttpRequest( deepHref );
            const vidPageLinkEls = downloadPageDoc.querySelectorAll( '[href*="voe"],[href*="dood"]' );
            item.append( ...vidPageLinkEls );

            item.style.display = 'block';
            vidPageLinkEls.forEach( link => { link.style.display = 'block'; } );


        }, ...$items );
    }

    //* Select images wrap them and prepend to the body
    let $chosen = $( 'p[style="text-align: center;"]' );
    if ( !$chosen.length ) return; // 🛑
    $chosen.prependTo( $( document.body ) );
    let $images = $chosen.find( 'img' );
    $images.removeClass();
    let $newDiv = $( '<div id=newDiv></div>' );

    $newDiv.css( 'display', 'flex' );
    $newDiv.css( 'flex-wrap', 'wrap' );
    $newDiv.css( 'justify-content', 'space-around' );

    $images.wrapAll( $newDiv );
    $newDiv = $( '#newDiv' );

    let $otherImages = $( `h2 img` );
    $newDiv.append( $otherImages );

    const $fullWidthDiv = $( `
        <div style = "
            flex-basis: 100%;
            display: flex;
            position: sticky;
            bottom: 0;
        "></div>` ).appendTo( $newDiv );

    //* "DownloadLInk" link
    const $originalLink = $( '[href*="paste.happy2hub"]' ).appendTo( $fullWidthDiv );

    //* New link
    query = document.title.replaceAll( /(web series|episode)(.+added)?/gi, '' );
    query = query.replaceAll( /(\||480p|720p|1080p|in hindi|download & watch online)/gi, '' );
    $fullWidthDiv.append( `<a href="https://paste.happy2hub.org/?s=${ query }" target=_blank>Link</a>` );

    //* 'load()' download links
    $loadedContent = $( `<div style="border-style: outset"></div>` ).appendTo( $newDiv );
    console.log( $originalLink.attr( 'href' ) );
    $loadedContent.load( `${ $originalLink.attr( 'href' ) } #main` );
    console.log( $loadedContent );

} )();