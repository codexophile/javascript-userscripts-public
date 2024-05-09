( function () {
    'use strict'

    style( $( `#sidebar` )[ 0 ], `
        max-height: 100vh;
        overflow: auto;
        position: sticky;
        top: 0px;
    ` )

    $( `#content-wrapper` )[ 0 ].scrollIntoView()

    let url
    if ( location.href.includes( '/category/' ) )
        url = location.href
    else
        url = $( '.entry-meta' ).find( '[href*="/category/"' )[ 0 ].href

    const category = url.match( /\/category\/(.+?)\// )[ 1 ]
    const $categoryEl = $( `#sidebar [href*=${ category }]` ).first()
    $categoryEl.parent().css( `outline`, '3px solid rgb(40, 85, 127)' ).css( `border-radius`, '3px' )
    $categoryEl[ 0 ].scrollIntoView( { block: 'center' } )

    if ( !$( '.entry-meta' ).find( '[href*="/category/"' )[ 1 ] ) return
    const subCategory = $( '.entry-meta' ).find( '[href*="/category/"' )[ 1 ].href.match( /\/category\/(.+?)\/(.+?)\// )[ 2 ]
    console.log( subCategory )
    const $subCategoryEl = $( `#sidebar [href*=${ subCategory }]` ).first()
    $subCategoryEl.parent().css( `background-color`, `rgb(40, 85, 127)` )


} )()