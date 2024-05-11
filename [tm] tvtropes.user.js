( async function () {
    'use strict'

    markTropeAsSeen()

    const query = `:is(#main-article,.folder) > ul > li > [href*='/laconic/']:first-child`
    waitFor( '#collapsibleContent' ).then( ( el ) => {
        generateToolbarButton( '🕳️', el, null, () => {
            document.querySelectorAll( query ).forEach( link => {
                if ( !getComputedStyle( link ).outline.includes( 'solid' ) )
                    toggle( link.parentElement )
            } )
        } )
        generateToolbarButton( '📤', el, null, async () => {
            let currentTropes = await GM.getValue( 'tropesSeen' )
            downloadText( 'browser - tvtropes_alreadySeenTropes.txt', JSON.stringify( currentTropes ) )
        } )
    } )

    const tropesSeen = await GM.getValue( 'tropesSeen' )

    $( `[href*="/Main/"]` ).each( function () {

        let $tropeLink = $( this )

        if ( !location.href.includes( '/laconic/' ) ) {
            $tropeLink.attr( 'href', $tropeLink.attr( 'href' ).replace( '/Main/', '/laconic/' ) )
            $tropeLink.attr( 'target', '_blank' )
        }

        let tropeName = $tropeLink.attr( 'href' ).match( /\.php\/\w+\/(\w+)$/ )[ 1 ]

        $( `<span class=ant>🐜</span>` ).insertAfter( $tropeLink ).on( 'click', function () {
            let allToCopy = `\n[href*=${ tropeName }],`
            GM_setClipboard( allToCopy )
        } )
        $( `<span class=ant>➕</span>` ).insertAfter( $tropeLink ).on( 'click', async () => {
            let currentTropes = await GM.getValue( 'tropesSeen' )
            if ( !currentTropes ) currentTropes = []
            if ( currentTropes.includes( tropeName ) ) {
                GM_notification( {
                    text: 'Already exists!',
                    silent: true,
                    timeout: 4000
                } )
                return // 🛑
            }
            currentTropes.push( tropeName )
            await GM.setValue( 'tropesSeen', currentTropes )
            markTropeAsSeen()
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
                    event.target.title = mainCont.textContent
                }
            } )
            // addTooltip( event.target, generateElements( '<button>test</button>' ) )
        } )

    } )

    async function markTropeAsSeen () {
        const tropesSeen = await GM.getValue( 'tropesSeen' )
        $( `[href*="/pmwiki/pmwiki.php/"]:first-child` ).each( function () {
            const match = this.href.match( /\.php\/\w+\/(\w+)$/ )
            if ( !match ) return // 🛑
            const tropeName = match[ 1 ]
            if ( tropesSeen.includes( tropeName ) ) {
                style( $( this ).parent( 'li' )[ 0 ], `
                    background-color: brown;
                    border-radius: 4px;
                `)
            }
        } )
    }

} )()