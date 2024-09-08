const titleEl = generateElements( `<div>${ document.title }</div>` )
document.body.prepend( titleEl )
style( titleEl, `
    color: aliceblue;
    font-size: larger;
`)

const thumbElement = await waitFor( '.jw-time-thumb' )
const sbUrl = thumbElement.style.backgroundImage.match( /url\("(.+?)"/ )[ 1 ]
alert( sbUrl )
const $sbParent = $( `<div id=sbMain></div>` ).appendTo( document.body )
const vidOnPage = $( 'video' )[ 0 ]
vidOnPage.addEventListener( 'loadeddata', ( ev ) => {
    // const duration = ev.target.duration
    const samplingFq = vidOnPage.duration / 100
    // storyboardMultipleImgs( $sbParent[ 0 ], 3, 34, null, vidOnPage, samplingFq, sbUrl )
    storyboard( $sbParent[ 0 ], 3, 34, null, vidOnPage, samplingFq, 100, sbUrl )
} )

GM_addStyle( `html, body { overflow: scroll !important }` )