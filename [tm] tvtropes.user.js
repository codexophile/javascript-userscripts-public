( async function () {
    'use strict'

    markAndRefresh()

    const query = `:is(#main-article,.folder) > ul > li > [href*='/laconic/']:first-child`
    waitFor( '#collapsibleContent' ).then( ( el ) => {
        generateToolbarButton( '🕳️', el, null, () => {
            document.querySelectorAll( query ).forEach( link => {
                if ( !getComputedStyle( link ).outline.includes( 'solid' ) )
                    toggle( link.parentElement )
            } )
        } )
        generateToolbarButton( '📤', el, null, async () => {
            let tropesSeen = await GM.getValue( 'tropesSeen' )
            let tropesImportant = await GM.getValue( 'tropesImportant' )
            downloadText( 'browser - tvtropes.txt', JSON.stringify( { tropesSeen, tropesImportant } ) )
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
        $( `<span class=ant>✖️</span>` ).insertAfter( $tropeLink ).on( 'click', async () => {
            markTrope( 'Seen' )
        } )
        $( `<span class=ant>✔️</span>` ).insertAfter( $tropeLink ).on( 'click', async () => {
            markTrope( 'Important' )
        } )

        $tropeLink.on( 'mouseenter', ( event ) => {
            if ( !event.target.title.match( /^\/pmwiki\/pmwiki.php\// ) ) return // 🛑
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

    async function markTrope ( which ) {

        let tropesImportant = await GM.getValue( 'tropesImportant' )
        let tropesSeen = await GM.getValue( 'tropesSeen' )
        let currentTropes = await GM.getValue( `tropes${ which }` )

        if ( !currentTropes ) currentTropes = []

        if ( tropesSeen.includes( tropeName ) ) {
            GM_notification( {
                text: 'Already exists in Seen',
                silent: true,
                timeout: 4000
            } )
            return // 🛑
        }
        if ( tropesImportant.includes( tropeName ) ) {
            GM_notification( {
                text: 'Already exists in Important',
                silent: true,
                timeout: 4000
            } )
            return // 🛑
        }

        currentTropes.push( tropeName )
        await GM.setValue( `tropes${ which }`, currentTropes )
        markAndRefresh()
    }

    async function markAndRefresh () {
        const tropesSeen = await GM.getValue( 'tropesSeen' )
        const tropesImportant = await GM.getValue( 'tropesImportant' )
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
            if ( tropesImportant.includes( tropeName ) ) {
                style( $( this ).parent( 'li' )[ 0 ], `
                    background-color: rgb(102 103 23);
                    border-radius: 4px;
                `)
            }
        } )
    }

} )()