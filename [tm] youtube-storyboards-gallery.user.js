( async function () {
    'use strict';
    if ( window.top !== window.self ) return; // Don't run on frames or iframes

    const collapsible = await Collapsible();
    const laterlistCollapsibleBtn = collapsible.addButton( 'G', null, async ( event ) => {
        try {
            const allVideoLinks = gatherAllVideoLinks();
            if ( allVideoLinks.length === 0 ) {
                console.warn( 'No video links found.' );
                return;
            }

            const results = await fetchAllVideoLinks( allVideoLinks );
            console.log( results );
            const storyboardUrls = processStoryboards( results );
            console.log( storyboardUrls );

            openNewWindow( storyboardUrls );

        } catch ( error ) {
            console.error( 'An error occurred:', error );
        }

    } );

    function gatherAllVideoLinks () {
        const videoLinks = Array.from( document.querySelectorAll( 'a[href*="watch?v="]' ), el => el.href );
        return [ ...new Set( videoLinks ) ];
    }

    async function fetchAllVideoLinks ( urls ) {
        const promises = urls.map( url => GMXmlHttpReqResponse( url ) );
        const results = await Promise.allSettled( promises );
        return results.filter( result => result.status === 'fulfilled' ).map( result => result.value );
    }

    function processStoryboards ( responses ) {
        return responses.map( response => {
            // Assuming generateAllYouTubeSbUrls is a function that processes the response
            // and returns a storyboard URL
            return generateAllYouTubeSbUrls( response );
        } );
    }

    function openNewWindow ( urls ) {
        const newWindow = window.open( '', '_blank' );
        if ( newWindow ) {
            const content = urls.map( url => `<div>${ url }</div>` ).join( '' );
            generateElements( content, newWindow.document.body );
        } else {
            console.error( 'Failed to open new window.' );
        }
    }

} )();