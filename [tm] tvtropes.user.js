( async function () {
    'use strict';

    GM_setValue( 'test', 'test' );

    let unsavedChanges = false;
    GM_addValueChangeListener( 'tropesSeen', () => { unsavedChanges = true; } );
    GM_addValueChangeListener( 'tropesImportant', () => { unsavedChanges = true; } );
    window.addEventListener( 'beforeunload', ( event ) => {
        if ( !unsavedChanges ) return; // 🛑
        event.returnValue = '🤷🏻‍♂️';
        saveBackup();
    } );

    lazyLoad( async ( item ) => {
        const laconicHref = item.href.replace( '/Main/', '/laconic/' );
        const tempDoc = await GMXmlHttpRequest( laconicHref );
        const mainCont = tempDoc.querySelector( '#main-article' );
        // const tooltipText = mainCont.textContent.replace( 'Visit the unabridged version HERE.', '' )
        console.log( mainCont.textContent );
        const tooltipText = mainCont.textContent.replace( /\.(\w)/, '\.\n\n$1' );
        item.title = tooltipText;
    }, ...$( `[href*="/Main/"]` ) );

    markAndRefresh();

    const query = `:is(#main-article,.folder) > ul > li > [href*='/laconic/']:first-child`;
    waitFor( '.collapsible-content' ).then( ( el ) => {
        generateToolbarButton( '🕳️', el, null, () => {
            document.querySelectorAll( query ).forEach( link => {
                if ( !getComputedStyle( link ).outline.includes( 'solid' ) )
                    toggle( link.parentElement );
            } );
        } );
        generateToolbarButton( '📤', el, null, saveBackup );
        generateToolbarButton( 'Test', el, null, test );
    } );

    function test () {
        const tropesIm = GM_getValue( 'tropesImportant' );
        console.log( tropesIm.filter( ( currentVal, index, array ) => array.indexOf( currentVal ) !== index ) );
        const tropesSeen = GM_getValue( 'tropesSeen' );
        console.log( tropesSeen.filter( ( currentVal, index, array ) => array.indexOf( currentVal ) !== index ) );
    }

    async function saveBackup () {
        let tropesSeen = await GM.getValue( 'tropesSeen' );
        let tropesImportant = await GM.getValue( 'tropesImportant' );
        downloadText( 'browser - tvtropes.txt', JSON.stringify( { tropesSeen, tropesImportant } ) );
        unsavedChanges = false;
    }

    // const tropesSeen = await GM.getValue( 'tropesSeen' )

    $( `[href*="/Main/"]` ).each( function () {

        let $tropeLink = $( this );

        if ( !location.href.includes( '/laconic/' ) ) {
            $tropeLink.attr( 'href', $tropeLink.attr( 'href' ).replace( '/Main/', '/laconic/' ) );
            $tropeLink.attr( 'target', '_blank' );
        }

        let tropeName = $tropeLink.attr( 'href' ).match( /\.php\/\w+\/(\w+)$/ )[ 1 ];

        $( `<span class=ant>🐜</span>` ).insertAfter( $tropeLink ).on( 'click', function () {
            let allToCopy = `\n[href*=${ tropeName }],`;
            GM_setClipboard( allToCopy );
        } );
        $( `<span class=ant>✖️</span>` ).insertAfter( $tropeLink ).on( 'click', async () => {
            appendTrope( 'Seen' );
        } );
        $( `<span class=ant>✔️</span>` ).insertAfter( $tropeLink ).on( 'click', async () => {
            appendTrope( 'Important' );
        } );

        async function appendTrope ( which ) {

            let tropesImportant = await GM.getValue( 'tropesImportant' );
            let tropesSeen = await GM.getValue( 'tropesSeen' );
            let currentTropes = await GM.getValue( `tropes${ which }` );

            if ( !currentTropes ) currentTropes = [];

            if ( tropesSeen.includes( tropeName ) ) {
                GM_notification( {
                    text: 'Already exists in Seen',
                    silent: true,
                    timeout: 4000
                } );
                const index = tropesSeen.indexOf( tropeName );
                tropesSeen.splice( index, 1 );
                GM_setValue( 'tropesSeen', tropesSeen );
            }
            if ( tropesImportant.includes( tropeName ) ) {
                GM_notification( {
                    text: 'Already exists in Important',
                    silent: true,
                    timeout: 4000
                } );
                const index = tropesImportant.indexOf( tropeName );
                tropesImportant.splice( index, 1 );
                GM_setValue( 'tropesImportant', tropesImportant );
            }

            currentTropes.push( tropeName );
            currentTropes = [ ...new Set( currentTropes ) ];
            await GM.setValue( `tropes${ which }`, currentTropes );
            markAndRefresh();
        }

        $tropeLink.on( 'mouseenter', ( event ) => {
            if ( !event.target.title.match( /^\/pmwiki\/pmwiki.php\// ) ) return; // 🛑
            GM_xmlhttpRequest( {
                method: 'GET',
                url: event.target.href,
                responseType: 'document',
                onload: function ( response ) {
                    const resText = response.responseText;
                    const tempDoc = generateDoc( resText );
                    const mainCont = tempDoc.querySelector( '#main-article' );
                    event.target.title = mainCont.textContent;
                }
            } );
            // addTooltip( event.target, generateElements( '<button>test</button>' ) )
        } );

    } );

    async function markAndRefresh () {

        const tropesSeen = await GM.getValue( 'tropesSeen' );
        const tropesImportant = await GM.getValue( 'tropesImportant' );

        $( `[href*="/pmwiki/pmwiki.php/"]` ).each( function () {
            const match = this.href.match( /\.php\/\w+\/(\w+)$/ );
            if ( !match ) return; // 🛑
            const tropeName = match[ 1 ];
            if ( tropesSeen.includes( tropeName ) )
                mark( this, '#ffacac' );
            if ( tropesImportant.includes( tropeName ) )
                mark( this, 'rgb(182 255 162)' );
        } );

        function mark ( el, color ) {
            if ( el.matches( 'div>ul>li>a:first-child' ) ) {
                style( $( el ).parent( 'li' )[ 0 ], `
                    background-color: ${ color };
                    border-radius: 4px;
                `);
            }
            else {
                el.style.outline = `solid ${ color }`;
            }
        }

    }

} )();