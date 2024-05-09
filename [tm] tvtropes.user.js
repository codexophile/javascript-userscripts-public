( function () {
    'use strict'

    const query = `:is(#main-article,.folder) > ul > li > [href*='/laconic/']:first-child`
    waitFor( '#collapsibleContent' ).then( ( el ) => {
        generateToolbarButton( '🕳️', el, null, () => {
            document.querySelectorAll( query ).forEach( link => {
                if ( !getComputedStyle( link ).outline.includes( 'solid' ) )
                    toggle( link.parentElement )
            } )
        } )
    } )

    $( `[href*="/Main/"]` ).each( function () {

        let $tropeLink = $( this )

        if ( !location.href.includes( '/laconic/' ) ) {
            $tropeLink.attr( 'href', $tropeLink.attr( 'href' ).replace( '/Main/', '/laconic/' ) )
            $tropeLink.attr( 'target', '_blank' )
        }

        $( `<span class=ant>🐜</span>` ).insertAfter( $tropeLink ).on( 'click', function () {
            let hrefPartToCopy = $tropeLink.attr( 'href' ).match( /\.php\/\w+\/(\w+)$/ )[ 1 ]
            let allToCopy = `\n[href*=${ hrefPartToCopy }],`
            GM_setClipboard( allToCopy )
        } )

        $tropeLink.on( 'mouseenter', ( event ) => {
            GM_xmlhttpRequest( {
                method: 'GET',
                url: event.target.href,
                responseType: 'document',
                onload: function ( response ) {
                    const resText = response.responseText
                    const tempDoc = generateDoc( resText )
                    const mainCont = tempDoc.querySelector( '#main-article' )
                }
            } )
            addTooltip( event.target, generateElements( '<button>test</button>' ) )
        } )

    } )

} )()