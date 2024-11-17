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
            const storyboardObjs = processStoryboards( results );

            const newWindow = window.open( '', '_blank' );
            if ( !newWindow ) {
                alert( 'Failed to open new window.' );
                return;
            }

            storyboardObjs.forEach( ( item, index ) => {
                item.href = allVideoLinks[ index ];
                createStoryboardGalleryItem( item, newWindow );
            } );

        } catch ( error ) {
            console.error( 'An error occurred:', error );
        }

    } );

    function createStoryboardGalleryItem ( item, window ) {

        const galleryItemEl = generateElements( `<div class="gallery-item"></div>` );
        style( galleryItemEl, `
            border: 1px solid black;
            border-radius: 5px;
            margin: 5px;
        `);
        const galleryItemLink = generateElements( `<a href="${ item.href }">${ item.href }</a>`, galleryItemEl );
        storyboardToggleable( {
            storyboardParent: galleryItemEl,
            horizontal: 5,
            vertical: 5,
            linkToVid: item.href,
            samplingFq: item.samplingFq,
            trueNoOfSlots: item.trueNoOfSlots,
            imgUrls: item.allUrls,
            maxHeight: 'unset'
        } );
        window.document.body.append( galleryItemEl );
    }

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

} )();