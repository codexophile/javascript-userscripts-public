( function () {
    'use strict'

    if ( location.href.includes( 'https://www.google.com/search?btnI=1' ) ) {
        waitFor( "#search" ).then( function ( el ) { location.replace( el.getElementsByTagName( 'a' )[ 0 ].href ) } )
    }

    if ( location.href.includes( '/url?q=' ) ) {
        window.stop()
        let targetUrl = window.location.href.slice( window.location.href.indexOf( "q=" ) + 2 )
        location.replace( targetUrl )
        return
    }

    if ( location.href.includes( '/sorry/' ) ) {

        const $parent = $( '[style="font-size:13px;"]' )
        const params = new URLSearchParams( location.search )
        const targetUrl = params.get( 'continue' )
        const paramsForYT = new URLSearchParams( targetUrl )
        const youtubeID = paramsForYT.get( 'https://www.youtube.com/watch?v' )

        $parent.append( '<hr>' )
        $parent.append( `
            <div>
                <span> Target: </span>
                <a href=${ targetUrl }> ${ targetUrl } </a>
            </div>
        ` )

        return
        //? Code beyond this point is only for youtube
        if ( !youtubeID ) return // 🛑
        location.replace( `https://www.youtube.com/results?search_query="${ youtubeID }"` )

        // $parent.append( `
        // <div>
        //     <span> ID: </span>
        //     <a href=https://www.youtube.com/results?search_query="${youtubeID}" > ${youtubeID}🔍 </a>
        // </div>` )
    }

    if ( location.href.includes( '#newTab' ) ) {
        let url = $( '[data-async-context^="query:"]' ).children().first().find( 'a[href]' ).attr( 'href' )
        window.open( url )
    }

    //* misspelled prompt
    const correctedUrlEl = $( `[href*='&spell=1']` )[ 0 ]
    if ( correctedUrlEl ) {
        const correctedUrl = correctedUrlEl.href
        const correctedSearchQuery = new URLSearchParams( correctedUrl ).get( 'q' )
        correctedUrlEl.href = `https://www.google.com/search?q=${ correctedSearchQuery }`
        correctedUrlEl.onlick = () => { console.log( 'test' ) }
    }

    //# Audio download button

    const dataurl = $( `audio > source` ).attr( 'src' )
    const fileName = dataurl?.split( "/" ).pop()

    const link = document.createElement( "a" )
    link.href = dataurl
    link.download = fileName

    $( link ).text( 'Download' )
    $( link ).attr( 'target', '_blank' )
    $( `audio` ).parent().parent().after( link )

    //# Copy definition button

    const definitionSpans = document.querySelectorAll( '[data-dobid="dfn"]' )
    const $copyDefBtns = $( `<button> Copy </button>` ).insertAfter( definitionSpans )
    $copyDefBtns.on( 'click', ( event ) => {
        const textToCopy = $( event.target ).prev().text()
        navigator.clipboard.writeText( textToCopy )
    } )

    //# Complicated stuff

    let searchResultItemWidth = '23%'

    function setResultItemWidth ( el, width ) {
        style( el, `
            margin: 10px;
            width: ${ width };
            overflow: hidden;
        `)
        // g-scrolling-carousel  -> video results that contains 'key moments' in a carousel form
        // g-section-with-header span:contains("Images") -> image results
        if ( $( el ).find( 'g-scrolling-carousel, g-section-with-header span:contains("Images")' ).length )
            el.style.width = 'auto'
        // translator blocks
        if ( $( el ).find( '.obcontainer' ).length )
            el.style.width = '100%'
        searchResultItemWidth = width
    }

    if ( location.href.includes( '/search?' ) ) {

        //* check box to enable the script; item width buttons
        const $locator = $( `#tools_1` )
        const $buttonContainer = $( `<div></div>` )
        $locator.after( $buttonContainer )

        const $checkBox = $( `<input type=checkbox>` ).appendTo( $buttonContainer ).on( 'click', async ( event ) => {
            if ( event.target.checked ) {
                await GM_setValue( 'enabled', true )
            }
            else {
                await GM_setValue( 'enabled', false )
            }
            location.reload()
        } )

        if ( GM_getValue( 'enabled' ) )
            $checkBox[ 0 ].checked = true
        else {
            $checkBox[ 0 ].checked = false
            return
        }

        // https://i.imgur.com/ICRhxoe.png
        $( `#kp-wp-tab-overview` ).css( `display`, `flex` )

        // bringing the rhs sidebar to the top of the page
        $( `#rhs` ).insertBefore( `[role=main]` )
        $( `#rhs` ).css( `width`, `unset` )
        $( `.kp-wholepage` ).css( `width`, `unset` )

        const $twoInARow = $( `<button>2</button>` ).on( 'click', () => {
            $( `.search-result-item` ).each( function () {
                setResultItemWidth( this, `48%` )
            } )
        } )
        const $threeInARow = $( `<button>3</button>` ).on( 'click', () => {
            $( `.search-result-item` ).each( function () {
                setResultItemWidth( this, `30%` )
            } )
        } )
        const $fourInARow = $( `<button>4</button>` ).on( 'click', () => {
            $( `.search-result-item` ).each( function () {
                setResultItemWidth( this, `23%` )
            } )
        } )

        $buttonContainer.append( $checkBox, $twoInARow, $threeInARow, $fourInARow )
        style( $buttonContainer[ 0 ], `
            display: flex;
            align-items: center;
        `)
    }


    GM_addStyle( `
        [data-async-context^="query:"] {
            max-width: 95vw;
        }
        #center_col {
            margin: auto;
            width: unset;
        }
        #rcnt {
            max-width: unset;
        }
    ` )

    let processedElements = []
    let processedSearchItems = []
    let observer = new MutationObserver( () => {

        if ( !location.href.includes( '/search?' ) ) return
        if ( location.href.search( '&udm=2' ) > -1 ) return

        // removing large margins of 'Continue the conversation' element
        const $contConvEl = $( '[aria-label="Ask a follow up"]' ).parent()
        if ( $contConvEl.length ) {
            markElAsProcessed( $contConvEl[ 0 ], processedElements, ( el ) => {
                style( el, `
                    margin-top: unset;
                    margin-bottom: unset;
                    margin: auto;
                `)
            } )
        }


        const linkHeaders = document.querySelectorAll( `span h3, a.fl` )
        // span h3 -> big link headers
        // a.fl    -> tiny link header that appear under big link headers
        linkHeaders.forEach( item => {
            markElAsProcessed( item, processedElements, () => {
                item.title = item.textContent
            } )
        } )

        document.querySelectorAll( `#tvcap` ).forEach( el => { // usually empty element
            markElAsProcessed( el, processedElements, () => {
                if ( el.childNodes.length === 0 ) el.style.display = 'none' // hides if empty
            } )
        } )

        // search result items
        const $locatorItems = $( 'h3' ).closest( '.g' ).parent()
        $locatorItems.each( function () {

            markElAsProcessed( this, processedElements, () => {

                let $item = $( this )
                if ( this.parentElement.children.length === 1 )
                    $item = $item.parent()


                const $parent = $item.parent()
                $parent.children().each( ( index, searchItem ) => {
                    markElAsProcessed( searchItem, processedSearchItems, ( el ) => {
                        el.classList.add( 'search-result-item' )
                        if ( !el.childNodes.length ) el.remove() // remove the search-result-item if it's empty
                        setResultItemWidth( el, searchResultItemWidth )
                    } )
                } )

                style( $parent[ 0 ], `

                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    align-items: center;

                    border: solid;
                    border-color: grey;
                    border-width: 1px;
                    border-radius: 5px;
                    padding: 10px;
                    margin: 10px;

                `)
                if ( $parent.children().length === 1 )
                    $parent.css( `border-color`, `red` )

            } )

        } )

        // featured snippets
        $( `block-component` ).each( function () {
            markElAsProcessed( this, processedElements, () => {
                console.log( this )
                this.parentElement.parentElement.style.width = '100%'
                $( this ).find( 'div' ).css( `width`, `100%` )
            } )
        } )

        // reddit links
        let $redditLinks = $( `[href^="https://www.reddit"]` )
        $redditLinks.each( function () {
            markElAsProcessed( this, processedElements, () => {
                let href = this.href
                this.href = href.replace( 'https://www.reddit', 'https://old.reddit' )
            } )
        } )

    } )
    observer.observe( document.body, { childList: true, subtree: true } )

} )()