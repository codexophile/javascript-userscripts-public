( function () {
    'use strict'

    async function markAndRefresh () {
        const markedGames = await GM.getValue( 'markedGames' )
        $( `[href^="/cyri/requirements/"]` ).each( function () {
            const thisGame = this.textContent
            const thisRow = this.parentElement.parentElement
            if ( markedGames.includes( thisGame ) ) {
                thisRow.style.backgroundColor = 'darkseagreen'
            }
            else
                thisRow.style.backgroundColor = 'unset'
        } )
    }

    waitForAll( `[href^="/cyri/requirements/"]` ).then( ( els ) => {

        markAndRefresh()

        els.forEach( item => {

            const $this = $( item )
            if ( $this.parent().find( '.extLinks' ).length ) return // 🛑

            const gameName = $this.text()

            $( `<button>🔖</button>` ).insertBefore( $this ).on( 'click', async () => {

                let markedGames = await GM.getValue( 'markedGames' )
                if ( !markedGames ) markedGames = []

                if ( markedGames.includes( gameName ) ) {
                    GM_notification( {
                        text: 'Already exists!',
                        silent: true,
                        timeout: 4000
                    } )
                    const index = markedGames.indexOf( gameName )
                    markedGames.splice( index, 1 )
                }
                else
                    markedGames.push( gameName )

                await GM.setValue( `markedGames`, markedGames )
                markAndRefresh()

            } )

            const $extLinksCtnr = $( `
                <span class=extLinks>
                    <a target=_blank href="https://www.google.com/search?q=${ gameName }">              G</a>
                    <a target=_blank href="https://www.google.com/search?q=${ gameName }&udm=2">       GI</a>
                    <a target=_blank href="https://www.youtube.com/results?search_query=${ gameName }">YT</a>
                </span>`
            ).insertBefore( item )

            style( $extLinksCtnr[ 0 ], `
                background-color: lightgray;
                margin: 5px;
                border-radius: 4px;
            `)

        } )

    } )


} )()