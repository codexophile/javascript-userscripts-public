( function () {
    'use strict'

    $( `.js-post-body a` ).attr( 'target', '_blank' )

    $( '#answers' )[ 0 ].scrollIntoView()

    // code block -> clipboard functionality
    const $codeBlocks = $( 'pre:has(code)' )
    $codeBlocks.append( '<button class=copyRole>😊</button>' )
    $( '.copyRole' ).on( 'click', function () {
        const $this = $( this )
        const text = $this.parent().find( 'code' ).text()
        GM_setClipboard( text )
    } )

} )()