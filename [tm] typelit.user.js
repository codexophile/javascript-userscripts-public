waitFor( '.MuiGrid-item' ).then( ( ) => {
    $items = $( '.MuiGrid-item' )
    console.log( $items )
    $items.sort( function ( a, b ) {
        var contentA = parseInt( $( a ).find( 'p' ).text().replace( ' Pages', '' ) )
        var contentB = parseInt( $( b ).find( 'p' ).text().replace( ' Pages', '' ) )
        console.log( contentA, contentB )
        return (contentA < contentB) ? -1 : (contentA > contentB) ? 1 : 0;
    }).appendTo( $items.parent() )
} )