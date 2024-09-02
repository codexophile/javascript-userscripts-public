( async function () {
    'use strict'

    let observer = new MutationObserver( () => {

        //* Right click to copy
        const items = document.querySelectorAll( `article li,p:not(.processedItem)` )
        items.forEach( item => {
            item.classList.add( 'processedItem' )
            item.addEventListener( 'contextmenu', ( event ) => {
                event.preventDefault()
                GM_setClipboard( event.target.textContent.replaceAll( /(Prompt|Prologue|First Chapter): /, '' ) )
            } )
        } )

    } )
    observer.observe( document.body, { childList: true, subtree: true } )


    //* search queries

    const match = location.href.match( /\/\?query=(.+)(#|&|$)/ )
    if ( match ) {

        await waitFor( 'nav' )
        alert()
        const queryString = decodeURIComponent( match[ 1 ] )

        const $neededChat = $( `.relative.grow.overflow-hidden.whitespace-nowrap:contains('Book Chapter Summaries')` )
        $neededChat.click()

        await waitFor( 'article' )
        await asyncTimeout( 1000 )

        const promptTextarea = document.querySelector( `#prompt-textarea` )
        promptTextarea.value = queryString

        document.title = '[Expecting] ChatGPT'
        await asyncTimeout( 1000 )

        document.title = 'ChatGPT'
        document.querySelector( `[data-testid="send-button"]` ).click()

        // const soundBtnEl = await waitForNew( 'article div.flex.items-center > span:first-child > button' )
        // soundBtnEl.click()

    }

    //* Setting volume of audio els

    const audioEl = await waitFor( 'audio' )
    audioEl.volume = 0.4

    //* Rest

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