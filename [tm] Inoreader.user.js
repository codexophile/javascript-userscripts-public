( function () {
    'use strict'

    waitFor( `#show_articles_menu` ).then( ( unreadIndicator ) => {
        document.querySelector( `.heading-wrapper > div > h2` ).prepend( unreadIndicator )
    } )

    // const scrollEl = document.getElementById( 'reader_pane' )
    const scrollEl = document.body

    scrollEl.onscroll = function () {

        const noMoreDiv = document.querySelector( '#no_more_div' )
        const olderArticlesEl = document.querySelector( '#older_articles_hint' )
        if ( !noMoreDiv ) return // 🛑
        if ( !isElementInViewport( olderArticlesEl ) ) return // 🛑

        window.setTimeout( function () {
            if ( isElementInViewport( olderArticlesEl ) ) {
                console.log( 'test' )
                return
                const targetEl = document.querySelector( `#reader_pane` )
                targetEl.dispatchEvent( new KeyboardEvent( 'keydown', { key: 'j', shiftKey: true } ) )
            }
        }, 1500 )

    }

} )()