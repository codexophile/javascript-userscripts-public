const titleEl = generateElements( `<div>${ document.title }</div>` );
document.body.prepend( titleEl );
style( titleEl, `
    color: aliceblue;
    font-size: larger;
`);

const thumbElement = await waitFor( '.jw-time-thumb' );
const sbUrl = thumbElement.style.backgroundImage.match( /url\("(.+?)"/ )[ 1 ];
const $sbParent = $( `<div id=sbMain></div>` ).appendTo( document.body );
const vidOnPage = $( 'video' )[ 0 ];
vidOnPage.addEventListener( 'loadeddata', ( ev ) => {
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

GM_addStyle( `html, body { overflow: scroll !important }` );