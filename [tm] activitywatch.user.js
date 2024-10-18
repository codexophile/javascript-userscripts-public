( async function () {
    'use strict';
    if ( window.top != window.self ) return; //don't run on frames or iframes

    const lb = await waitFor( `select.custom-select-sm` );
    sortOptions( lb );

    function sortOptions ( selectEl ) {

        const options = Array.from( selectEl.options );

        // Sort options alphabetically by the visible text
        options.sort( ( a, b ) => a.text.localeCompare( b.text ) );

        // Remove existing options
        while ( selectEl.firstChild ) {
            selectEl.removeChild( selectEl.firstChild );
        }

        // Append sorted options back to the select
        options.forEach( option => selectEl.appendChild( option ) );
    }


} )();