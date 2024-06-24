( function () {
    'use strict'

    waitFor( `#show_articles_menu` ).then( ( unreadIndicator ) => {
        document.querySelector( `.heading-wrapper > div > h2` ).prepend( unreadIndicator )
    } )

    let observer = new MutationObserver( () => {

        const noMoreEl = document.querySelector( `#no_more_press_space[style="visibility: visible;"]` )
        if ( !noMoreEl ) return // 🛑

        setTimeout( () => {
            if ( document.querySelector( `#no_more_press_space[style="visibility: visible;"]` ) ) {
                const kbEvent = new KeyboardEvent( 'keydown', { 'keyCode': 32, 'which': 32 } )
                document.dispatchEvent( kbEvent )
            }
        }, 2000 )

    } )
    observer.observe( document.body, { childList: true, subtree: true } )

} )()