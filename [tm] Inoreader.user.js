( function () {
    'use strict'

    // const scrollEl = document.getElementById( 'reader_pane' )
    const scrollEl = document.body

    scrollEl.onscroll = function () {

        const noMoreDiv = document.querySelector( '#no_more_div' )
        const olderArticlesEl = document.querySelector( '#older_articles_hint' )
        if ( !noMoreDiv ) return // 🛑
        if ( !isElementInViewport( olderArticlesEl ) ) return // 🛑

        window.setTimeout( function () {
            if ( isElementInViewport( olderArticlesEl ) ) {
                console.log( 'xxxxxxxxx' )
                scrollEl.dispatchEvent( new KeyboardEvent( 'keydown', { key: 'j', shiftKey: true } ) )
                // var e = jQuery.Event( "keydown" )
                // e.which = 74
                // e.shiftKey = true
                // $( "#reader_pane" ).trigger( e )
            }
        }, 1500 )

    }

} )()