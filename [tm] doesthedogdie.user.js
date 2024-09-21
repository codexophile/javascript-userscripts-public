( function () {
    'use strict';

    filter();


    function filter () {
        const toBeFiltered = document.querySelectorAll( '[data-answer="no"]' );
        toBeFiltered.forEach( element => element.style.display = 'none' );
    }

} )();