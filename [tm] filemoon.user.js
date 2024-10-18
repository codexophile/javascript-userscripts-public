( async function () {
    'use strict';

    //https://filemoon.sx/
    //https://gaystream.click/
    //https://vidhideplus.com/

    GM_addStyle( `html, body { overflow: auto !important }` );

    const title = document.title;
    if ( title ) {
        const titleEl = generateElements( `<div>${ document.title }</div>` );
        document.body.prepend( titleEl );
        style( titleEl, `
            color: aliceblue;
            font-size: larger;
        `);
    }

    let thumbElement;
    thumbElement = document.querySelector( `.jw-time-thumb` );
    if ( !thumbElement )
        thumbElement = await waitFor( '.jw-time-thumb' );
    alert( thumbElement );
    const sbUrl = thumbElement.style.backgroundImage.match( /url\("(.+?)"/ )[ 1 ];
    const $sbParent = $( `<div id=sbMain></div>` ).appendTo( document.body );
    const vidOnPage = $( 'video' )[ 0 ];
    vidOnPage.addEventListener( 'loadeddata', () => {
        alert();
        const samplingFq = vidOnPage.duration / 100;
        storyboard( {
            storyboardParent: $sbParent[ 0 ],
            horizontal: 3,
            vertical: 34,
            vidOnPage,
            samplingFq,
            trueNoOfSlots: 100,
            imgUrls: [ sbUrl ]
        } );
    } );


} )();