waitFor( 'article [class*=actions]' ).then( ( el ) => {

    $el = $( el )
    $el.css( `display`, `flex` )
    console.log( $el )

} )
