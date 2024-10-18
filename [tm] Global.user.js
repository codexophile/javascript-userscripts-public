( async function () {
    'use strict';
    if ( window.top != window.self ) return; //don't run on frames or iframes

    //* main
    const collapsible = await Collapsible( "", {
        width: "300px",
        height: "50px",
        collapsedWidth: "40px",
    } );
    collapsible.collapsibleToggler.click();

    collapsible.addButton( "🔝", null, () => window.scrollTo( 0, 0 ) );
    const headersPopup = collapsible.addPopup();
    collapsible.addButton( "🇭", headersPopup );
    const iframesPopup = collapsible.addPopup();
    collapsible.addButton( "ℹ️", iframesPopup );

    waitForEach( "h,h1,h2,iframe", ( element ) => {
        switch ( element.tagName ) {
            case "H":
            case "H1":
            case "H2":
                generateElements(
                    `<div>${ element.textContent }</div>`,
                    headersPopup
                ).addEventListener( "click", () => {
                    element.scrollIntoView();
                } );
                break;
            case "IFRAME":
                generateElements(
                    `<a href=${ element.src } target=_blank>${ element.src }</a>`
                );
                break;

            default:
                break;
        }
    } );
} )();
