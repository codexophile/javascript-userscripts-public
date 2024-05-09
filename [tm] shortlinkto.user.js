$( 'a[href*=videobin]' ).each( function() {
    matches = $( this ).attr( 'href' ).match( /(.*\.co\/)(.*)/ )
    console.log( matches )
    newlink = `${matches[1]}embed-${matches[2]}.html`
    console.log( newlink )
    $( this ).attr( 'href', newlink )
    $( this ).text( newlink )

    vb = GM_openInTab( newlink )
    console.log( vb )
} )

GM_openInTab( $( 'a[href*=videobin]' ).first().attr( 'href') )