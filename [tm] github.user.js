( function () {
    'use strict'

    window.navigation.addEventListener( "navigate", () => {
        $( `article a` ).not( '[href*="#"]' ).attr( 'target', '_blank' )
        $( `article` ).parent().parent()[ 0 ]?.scrollIntoView() //* scrolls post content into view
    } )

} )()