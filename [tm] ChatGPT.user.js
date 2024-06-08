( function () {
    'use strict'

    waitFor( '#collapsibleContent' ).then( ( el ) => {

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

    } )

} )()