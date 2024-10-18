( function () {
    'use strict';
    if ( window.top != window.self ) return; //don't run on frames or iframes

    let observer = new MutationObserver( () => {

        const originalValue = document.querySelector( `#speed-value` ).textContent;
        const originalUnit = document.querySelector( `#speed-units` ).textContent;
        let newValue;
        let newUnit;
        switch ( originalUnit ) {
            case 'Mbps':
                newValue = originalValue / 8;
                newUnit = 'MBps';
                break;

            default:
                break;
        }
        document.title = `${ newValue } ${ newUnit }`;

    } );
    observer.observe( document.body, { childList: true, subtree: true } );

} )();