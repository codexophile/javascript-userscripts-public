( function () {
    'use strict';

    if ( !location.href.includes( 'movie-imdb' ) ) return;

    //* filtering non english items
    document.querySelectorAll( `.sub-lang` ).forEach( item => {
        if ( item.textContent === 'English' ) return;
        item.parentElement.parentElement.style.display = 'none';
    } );

    //* sort table rows by span value
    sortTableRowsBySpanValue();

    // Function to sort table rows by span value in descending order
    function sortTableRowsBySpanValue () {
        // Get the table body
        const tbody = document.querySelector( 'tbody' );

        // Get all tr elements
        const rows = Array.from( tbody.getElementsByTagName( 'tr' ) );

        // Sort the rows
        const sortedRows = rows.sort( ( a, b ) => {
            // Get span values from each row
            const spanA = a.querySelector( 'span.label-success' );
            const spanB = b.querySelector( 'span.label-success' );

            // Extract numeric values, default to 0 if span doesn't exist
            const valueA = spanA ? parseFloat( spanA.textContent ) : 0;
            const valueB = spanB ? parseFloat( spanB.textContent ) : 0;

            // Sort in descending order
            return valueB - valueA;
        } );

        // Remove existing rows
        rows.forEach( row => tbody.removeChild( row ) );

        // Append sorted rows
        sortedRows.forEach( row => tbody.appendChild( row ) );
    }

} )();