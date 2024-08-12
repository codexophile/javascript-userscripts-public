( async function () {
    'use strict'

    // let observer = new MutationObserver( ( mutations ) => {
    //     mutations.forEach( mutation => {
    //         mutation.addedNodes.forEach( item => {
    //             if ( item.nodeType === 1 ) {
    //                 console.log( 'xxx', item )
    //             }
    //         } )
    //     } )
    // } )
    // observer.observe( document.body, { childList: true, subtree: true } )

    const match = location.href.match( /\/\?query=(.+)(#|&|$)/ )
    if ( match ) {

        await waitFor( '#enforcement-containerchatgpt-subscription' )

        const queryString = match[ 1 ].replaceAll( '%20', ' ' )

        const $neededChat = $( `.relative.grow.overflow-hidden.whitespace-nowrap:contains('Book Chapter Summaries (No lesser known books)')` )
        $neededChat.click()

        await asyncTimeout( 3000 )

        const promptTextarea = document.querySelector( `#prompt-textarea` )
        promptTextarea.value = queryString

        document.title = '[Expecting] ChatGPT'
        await asyncTimeout( 1000 )

        document.title = 'ChatGPT'
        document.querySelector( `[data-testid="send-button"]` ).click()

    }



    // const match = location.href.match( /\/\?query=(.+)(#|&|$)/ )
    // if ( match ) {
    //     const queryString = match[ 1 ]
    //     const promptTextarea = document.querySelector( `#prompt-textarea` )
    //     console.log( promptTextarea )
    //     // promptTextarea.value = queryString
    // }




    const el = await waitFor( '#collapsibleContent' )

    let currentTurnEl
    let query = '[data-testid^="conversation-turn-"]:has([class*="group/conversation-turn"]:not(.agent-turn))'
    generateToolbarButton( '⬆️', el, null, getNextTurn )
    generateToolbarButton( '⬇️', el, null, getNextTurn )

    function getNextTurn ( event ) {

        if ( !currentTurnEl ) {
            currentTurnEl = [ ...document.querySelectorAll( query ) ].at( -1 )
        }

        switch ( event.target.textContent ) {
            case '⬆️':
                break
            case '⬇️':
                break

            default:
                break
        }
    }



} )()