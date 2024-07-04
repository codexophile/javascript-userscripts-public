( function () {
    'use strict'

    function main ( selectorForSenderElement ) {

        if ( document.querySelector( '.fixedCSS' ) ) { console.log( '%c🏁', 'font-size: large' ); return } // 🛑

        let senderElement = document.querySelectorAll( selectorForSenderElement )[ 0 ]
        let senderName

        if ( !senderElement ) { console.log( '%c⌛', 'font-size: large' ); return } // 🛑

        senderName = senderElement.textContent.replace( / \[Masked\] ?/, '' )
        console.log( `%c🔥 ${ senderName }`, 'font-size: large; color: gold' )

        switch ( senderName ) {

            //SECTION Blogtrottr
            case 'BlogtrottrBlogtrottr':
            case 'Blogtrottr':
            case 'Blogtrottr ':

                document.querySelectorAll( '[href*="li.blogtrottr.com"]' ).forEach( element => { element.remove() } )
                // this gets rid of the ads by blogtrottr
                // Alternatively an adblocker can remove these automatically too

                let titleElement = document.querySelector( 'span[style="font-family:Helvetica,sans-serif;font-size:20px;font-weight:bold;line-height:16px"]' )
                titleElement.classList.add( 'fixedCSS' )
                let feedTitle = titleElement.textContent
                console.log( `%c📶 ${ feedTitle }`, 'font-size: large; color: gold' )

                // Open all button
                const titleGrandParent = titleElement.parentNode.parentNode.parentNode.parentNode.parentNode
                const openAllButton = generateElements( '<button>Open All</button>', titleGrandParent, true )
                openAllButton.addEventListener( 'click', () => {
                    // items variable is defined below
                    items.forEach( item => {
                        itemHref = item.querySelector( 'a' )?.href
                        GM_openInTab( itemHref, true )
                    } )
                } )
                titleGrandParent.style.display = `flex`

                let items = Array.from( document.querySelectorAll( '[cellpadding="3"][class]' ) )
                const parent = items[ 0 ].parentNode


                //? removing empty items not working currently
                // Array.from( document.querySelectorAll( '[cellpadding="3"]:not([class])' ) ).slice( 1, -1 )
                //     .forEach( emptyItem => { emptyItem.remove() } )

                //? fix this too
                // let mediaLinks = parent.querySelectorAll( 'a:nth-child(2)' )
                // mediaLinks.forEach( mediaLink => {
                //     mediaLink.after( generateElements( `<img src=${ mediaLink.href }>`, null, true ) )
                // } )

                parent.style.flexWrap = `wrap`
                parent.style.display = `flex`

                items.forEach( async item => {

                    item.removeAttribute( 'width' )

                    //? what is this? 👇
                    if ( !item.querySelectorAll( '[style="font-family:Helvetica,sans-serif;letter-spacing:-1px;margin:0;padding:0 0 2px;font-weight:bold;font-size:19px;line-height:20px;color:#222"]' ).length ) {
                        //item.remove()
                    }
                    const innerDiv = item.querySelectorAll( 'tbody > tr > td > div' )[ 1 ]

                    if ( !innerDiv ) {
                        return
                    }

                    const innerDivPs = innerDiv.querySelectorAll( 'p' )
                    innerDivPs.forEach( paragraph => {
                        paragraph.style = `
                        overflow          : hidden      !important;
                        text-overflow     : ellipsis    !important;
                        display           : -webkit-box !important;
                        -webkit-line-clamp: 5           !important; /* number of lines to show */
                        -webkit-box-orient: vertical    !important;`
                    } )

                    if ( innerDiv.querySelectorAll( 'img' ).length > 5 ) {
                        //! sometimes there arejj false positives here
                        innerDiv.style = `display: flex; flex-wrap: wrap;`
                        item.style.maxWidth = 'unset'
                        item.style.width = '100%'
                        innerDiv.querySelectorAll( 'img' ).forEach( image => { image.style.maxWidth = '300px' } )
                    }

                    const itemUrl = item.querySelector( 'a' ).href
                    let tempDoc

                    async function addIframeHrefs ( tempDoc ) {
                        if ( !tempDoc )
                            tempDoc = await GMXmlHttpRequest( itemUrl )
                        const iframes = tempDoc.querySelectorAll( 'iframe' )
                        iframes.forEach( ( iframe ) => {
                            GM_addElement( innerDiv, 'a', {
                                textContent: iframe.src,
                                href: iframe.src,
                                style: 'display: block'
                            } )
                        } )
                        addPeekButtons( innerDiv, item )
                    }

                    function addPeekButtons ( itemInnerDiv, item ) {

                        const links = itemInnerDiv.querySelectorAll( 'a' )
                        links.forEach( async ( link ) => {
                            if ( link.href.match( /bembed/ ) ) {
                                const button = GM_addElement( 'button', { textContent: 'Bembed' } )
                                button.addEventListener( 'click', async () => {
                                    if ( itemInnerDiv.querySelector( '#bembedImg' ) ) return
                                    tempDoc = await GMXmlHttpRequest( itemUrl )
                                    const resText = tempDoc.innerHTML
                                    const videoId = resText.match( /:\\u0022(.+?)\.poster/ )[ 1 ]
                                    const sbImgHost = resText.match( /og:image" content="https:\/\/(.+?)\// )[ 1 ]
                                    const peekImg = GM_addElement( itemInnerDiv, 'img', {
                                        id: 'bembedImg',
                                        src: `https://${ sbImgHost }/previews/${ videoId }.preview.jpg`
                                    } )
                                    peekImg.style.maxHeight = '300px'
                                    fauxHistoryPushState( link.href )
                                } )
                                link.after( button )
                            }
                            if ( link.href.match( /(voe)/ ) ) {
                                const doodButton = GM_addElement( 'button', { textContent: 'Voe' } )
                                doodButton.addEventListener( 'click', () => {
                                    if ( itemInnerDiv.querySelector( '#voeImg' ) ) return
                                    const videoId = link.href.match( /\..+\/(.+?)$/ )[ 1 ]
                                    const imageUrl = `https://i.voe.sx/cache/${ videoId }_storyboard_L0.jpg`
                                    storyboardFlex( itemInnerDiv, 10, 10, imageUrl, link.href, true )
                                    item.style.width = '100%'
                                    item.style.maxWidth = 'unset'
                                    fauxHistoryPushState( link.href )
                                } )
                                link.after( doodButton )
                            }
                            if ( link.href.match( /d000d|ds2play|d0000d|dood/ ) ) {
                                // const doodButton = GM_addElement( 'button', { textContent: 'Dood' } )
                                // doodButton.addEventListener( 'click', async () => {
                                // if ( itemInnerDiv.querySelector( '#doodImg' ) ) return
                                const resText = await GMXmlHttpRequest( link.href, null, true )
                                const slidesId = resText.match( /\/(splash|snaps)\/(.+?)\.jpg/ )[ 2 ]
                                const imgSrc = `https://img.doodcdn.co/slides/${ slidesId }.jpg`
                                generateElements( `<a href=${ link }><img id=doodImg src=${ imgSrc }></a>`, itemInnerDiv, true )
                            }
                            if ( link.href.match( /(cdnstream|jodwish)/ ) ) {
                                const doodButton = GM_addElement( 'button', { textContent: 'Stream' } )
                                doodButton.addEventListener( 'click', async () => {
                                    if ( itemInnerDiv.querySelector( '#streamImg' ) ) return
                                    tempDoc = await GMXmlHttpRequest( itemUrl )
                                    const resText = tempDoc.innerHTML
                                    const imageUrl = resText.match( /file:.*?&url=(.*?)"/ )[ 1 ]
                                    // storyboardFlex( itemInnerDiv, 10, 10, imageUrl, link.href, true )
                                    storyboardHorizontal( itemInnerDiv, 10, 10, link.href, null, samplingFq, trueNoOfSlots, ...imgUrls )
                                    item.style.width = '100%'
                                    item.style.maxWidth = 'unset'
                                    // const streamPeekImg = GM_addElement( itemInnerDiv, 'img', {
                                    //     id: 'streamImg',
                                    //     src: imageUrl
                                    // } )
                                    fauxHistoryPushState( link.href )

                                } )
                                link.after( doodButton )
                            }
                        } )

                    }

                    switch ( feedTitle ) {

                        //ANCHOR - iGay69
                        case 'iGay69':
                            addIframeHrefs()
                            break

                        //ANCHOR - 4horlover
                        case '4horlover':
                            tempDoc = await GMXmlHttpRequest( itemUrl )
                            const centerEl = tempDoc.querySelector( 'main center' )
                            innerDiv.append( centerEl )
                            centerEl.querySelectorAll( 'b, img' ).forEach( el => {
                                unwrap( el.parentElement )
                            } )
                            const outerWrapper = generateElements( '<div id=outerWrapper></div>', null, true )
                            outerWrapper.style.display = 'flex'
                            innerDiv.prepend( outerWrapper )
                            innerDiv.querySelectorAll( 'b + p + p' ).forEach( locator => {
                                const wrapper = wrap( '<div class=wrapper></div>', prev( prev( locator ) ), prev( locator ), locator )
                                outerWrapper.append( wrapper )
                            } )
                            break

                        //ANCHOR -  'TURBOGVIDEOS.COM':
                        case 'TURBOGVIDEOS.COM':
                            addIframeHrefs()
                            break
                        //ANCHOR -  'Meu Mundo Gay | Porno Gay | Incesto Gay | Vídeo Gay | Desenho Gay':
                        case 'Meu Mundo Gay | Porno Gay | Incesto Gay | Vídeo Gay | Desenho Gay':
                            item.querySelector( '[href="https://meumundogay.net"]' ).remove()
                            addIframeHrefs()
                            break

                        //ANCHOR - 'GayCock4U':
                        case 'GayCock4U':
                            // const tempDoc = await GMXmlHttpRequest( itemUrl )
                            // console.log( tempDoc )
                            // const temp = tempDoc.querySelector( '[name="og:image"]' )
                            // alert( temp.innerHTML )
                            addIframeHrefs()
                            break

                        //ANCHOR -  'porno gay latinos':
                        case 'porno gay latinos':

                        //ANCHOR -  'GayVids.tube | GayVids, gaybb, porn gay hd, gay porn online, czech hunter, gayvids, freeonlinegayporn, gay porn, gay por...':
                        case 'GayVids.tube | GayVids, gaybb, porn gay hd, gay porn online, czech hunter, gayvids, freeonlinegayporn, gay porn, gay por...':

                        //ANCHOR -  'GayGuy.Top':
                        case 'GayGuy.Top':
                            removeEmptytextEls( innerDiv )
                            addIframeHrefs()
                            break

                        //ANCHOR -  'Gaystream':
                        case 'Gaystream':
                            const tempDocGstrm = await GMXmlHttpRequest( itemUrl )
                            const btnEls = tempDocGstrm.querySelectorAll( '.tab.boner' )
                            btnEls.forEach( item => {
                                const iframeLink = item.getAttribute( 'onclick' ).match( /\.src="(.+?)"/ )[ 1 ]
                                const iframeLinkEl = generateElements( `<a href=${ iframeLink }>${ iframeLink }</a>`, null, true )
                                iframeLinkEl.style.display = 'block'
                                innerDiv.prepend( iframeLinkEl )
                            } )
                            // alert( btnEls )

                            const imgUrl = tempDocGstrm.querySelector( '#overlay' ).style.backgroundImage.match( /"(.+?)"/ )[ 1 ]
                            const imgEl = generateElements( `<img src=${ imgUrl }>`, null, true )
                            innerDiv.prepend( imgEl )
                            break

                        //ANCHOR -  'FreePornVideosHDGay.com – Videos online free gay porn':
                        case 'FreePornVideosHDGay.com – Videos online free gay porn':
                            tempDoc = await GMXmlHttpRequest( itemUrl )
                            tempDoc.querySelectorAll( '.button_choice_server' ).forEach( item => {
                                const linkHref = item.getAttribute( 'onclick' ).match( /'(.+?)'/ )[ 1 ]
                                generateElements( `<a href=${ linkHref }>${ linkHref }</a>`, innerDiv, true )
                            } )
                            addPeekButtons( innerDiv, item )
                            break

                        //ANCHOR -  'New Videos':
                        case 'New Videos':

                            const toggleButton = GM_addElement( item, 'button', { textContent: 'Toggle' } )
                            toggleButton.addEventListener( 'click', async () => {
                                if ( item.querySelectorAll( '.thumbContainer' ).length )
                                    toggle( item.querySelector( '.thumbContainer' ) )
                                else {
                                    tempDoc = await GMXmlHttpRequest( itemUrl )
                                    script = tempDoc.querySelectorAll( 'script[type="text/javascript"]' )
                                    const screensCount = script[ 1 ].innerHTML.match( /timeline_screens_count: '(\d+)'/ )[ 1 ]
                                    const imgUrlTemplate = script[ 1 ].innerHTML.match( /timeline_screens_url: '(.+?)'/ )[ 1 ]
                                    const thumbnContainer = GM_addElement( item, 'div', { class: 'thumbContainer' } )
                                    thumbnContainer.addEventListener( 'click', ( event ) => {
                                        toggle( event.target.parentNode )
                                        event.target.parentNode.parentNode.scrollIntoView()
                                    } )
                                    thumbnContainer.scrollIntoView()

                                    repeat( screensCount + 1, j => {
                                        const imgURL = imgUrlTemplate.replace( '{time}', j )
                                        const imageElement = generateElements( `<img id=${ j } class='storyBoardItem' src='${ imgURL }'></img>`, null, true )
                                        thumbnContainer.append( imageElement )
                                    } )
                                    innerDiv.style = `display: flex; flex-wrap: wrap;`
                                    item.style.maxWidth = 'unset'
                                    item.style.width = '100%'
                                }

                            } )
                            break

                        //ANCHOR -  'NurGAY.to':
                        case 'NurGAY.to':

                            const newDiv = document.createElement( 'div' )
                            newDiv.append( ...innerDiv.querySelectorAll( 'a:has(img)' ) )
                            innerDiv.replaceChildren()
                            innerDiv.append( newDiv )

                            tempDoc = await GMXmlHttpRequest( itemUrl )
                            const actorsList = tempDoc.querySelector( '#video-actors' ).textContent.replaceAll( '\t', '' ).replace( 'Actors: ', '' ).replaceAll( ' /', ',' )
                            GM_addElement( innerDiv, 'div', { textContent: actorsList } )
                            const links = tempDoc.querySelectorAll( 'p > [data-wpel-link="external"]' )
                            innerDiv.append( ...links )
                            addPeekButtons( innerDiv )

                            break

                        //ANCHOR -  'Hacker News: Front Page':
                        case 'Hacker News: Front Page':
                            GM_xmlhttpRequest( {
                                method: 'GET',
                                url: `https://api.linkpreview.net/?q=${ itemUrl }`,
                                headers: { 'X-Linkpreview-Api-Key': '81dd9d9372dcef7c430a92b177e09dfa' },
                                responseType: 'document',
                                onload: function ( response ) {
                                    const resText = response.responseText
                                    const imgSrc = resText.match( /"image":"(.+?)"/ )[ 1 ]
                                    const prevImg = generateElements( `<img src=${ imgSrc }>`, null, true )
                                    innerDiv.prepend( prevImg )
                                }
                            } )
                            innerDiv.prepend( item.querySelector( '[href*="news.ycombinator.com"]' ) )
                        // no break here because reddit has some stuff in common

                        //ANCHOR -  'reddit.com: search results - sri lanka':
                        case 'reddit.com: search results - sri lanka':

                            // console.log( innerDiv )
                            if ( item.querySelector( '[href*=Cricket],[href*=cricket]' ) )
                                item.remove()

                            const innerDivAll = item.querySelectorAll( 'tbody > tr > td > div' )
                            innerDivAll.forEach( div => {
                                div.style.overflow = 'auto'
                                div.style.maxHeight = '300px'
                            } )
                            break

                        default:
                            break

                    }
                } )


                break
            //!SECTION

            case 'daily.dev':
                markAsCSSFixed()
                const locators = document.querySelectorAll( '[class*=main-container]' )
                locators.forEach( item => {
                    if ( !item.querySelector( 'font > strong' ) ) {
                        item.remove()
                        return
                    }
                    const widthParent = grandParent( item, 4 )
                    item.style.width = 'unset'
                    widthParent.style.width = '48%'
                    const flexParent = widthParent.parentElement
                    flexParent.style = `
                        display:   flex;
                        flex-wrap: wrap;
                    `
                    // item.parentElement.style.width = 'auto'
                } )
                break
            case 'IMDb.com':

                document.querySelector( '[class*=top-wrapper]' ).classList.add( 'fixedCSS' )
                sanitizeTrackingLinks( `[href*='/gp/r.html?C=']`, /.+&U=/, /\?ref_=.*/ )
                document.querySelectorAll( `br` ).forEach( br => { br.remove() } )

                //* title genres
                document.querySelectorAll( `[href*='/title/']:has(>img)` ).forEach( async thumbnail => {

                    let tempDoc = await GMXmlHttpRequest( thumbnail.href )
                    const scriptText = tempDoc.querySelector( 'script[type="application/ld+json"]' ).innerText
                    const json = JSON.parse( scriptText )

                    thumbnail.after( generateElements( `<div id=datePublishedEl>${ json.datePublished }</div>`, null, true ) )
                    const tagsContainer = generateElements( '<div id=tagsContainer></div>', null, true )
                    tagsContainer.style = 'display: flex; flex-wrap: wrap'
                    thumbnail.after( tagsContainer )
                    imdbAddTag( json[ '@type' ], 'red' )
                    json.genre.forEach( genre => { imdbAddTag( genre, 'goldenrod' ) } )

                    function imdbAddTag ( text, color ) {
                        const tag = generateElements( `<div>${ text }</div>`, tagsContainer, true )
                        // thumbnail.after( tag )
                        tag.style = `
                                    background-color: ${ color };
                                    border-radius:    4px;
                                    padding:          1px 6px;
                                    margin:    1px;
                                    width:     fit-content;
                                    font-size: small;
                                `
                    }

                } )

                //* wrapping and moving
                const wrapperMain = generateElements( '<div id=wrapper style="display: flex"></div>', null, true )
                document.querySelector( `[class*=top-wrapper]` ).prepend( wrapperMain )

                wrapAndMove( 'Top Trailers' )
                wrapAndMove( 'Most Popular TV Shows This Week' )
                wrapAndMove( 'Popular Trailers This Week' )
                wrapAndMove( 'Most Popular Movies This Week' )
                const thingsToWatchWrapper = wrapAndMove( '5 Things to Watch This Week' )
                if ( thingsToWatchWrapper ) {
                    const thingsToWatchItems = []
                    document.querySelectorAll( 'h2 :is([href^="https://www.imdb.com/title/"],[href*="what-to-watch"]' ).forEach( item => {
                        thingsToWatchItems.push( grandParent( item, 2 ) )
                    } )
                    thingsToWatchWrapper.append( ...thingsToWatchItems )
                    thingsToWatchWrapper.style = `display: flex; flex-wrap: wrap`
                    thingsToWatchWrapper.children[ 1 ].remove()
                    thingsToWatchWrapper.children[ 1 ].remove()
                    for ( const item of thingsToWatchWrapper.children ) {
                        item.style.width = '25%'
                    }
                    thingsToWatchWrapper.children[ 0 ].style.width = '100%'
                }


                function wrapAndMove ( headerText ) {
                    const locator = contains( 'h1', headerText )[ 0 ]
                    if ( !locator ) return '' //🛑
                    const locator_ = grandParent( locator, 8 )
                    const allEls = []
                    allEls.push( locator_ )
                    allEls.push( next( locator_ ) )
                    allEls.push( next( next( locator_ ) ) )
                    document.querySelectorAll( '[height="60"]' ).forEach( item => { item.remove() } ) // removing little elements that take vertical space
                    const wrapper = wrap( '<div id=subWrapper></div>', ...allEls )
                    wrapperMain.append( wrapper )
                    return wrapper
                }

                break
            case 'Simkl':
                const simklParent = document.querySelector( '[class*="stack-column"]' ).parentElement
                simklParent.classList.add( 'fixedCSS' )
                simklParent.style.display = 'flex'

                const query = document.querySelector( 'h2.hP' ).textContent.replace( ' is out', '' ) + ' 720p'

                const newDiv = generateElements( `<div></div>`, simklParent, true )
                generateElements( `<a href='https://1337x.to/search/${ query }/1/'>720p</a>`, newDiv, true )
                newDiv.style.fontSize = 'large'
                break

            case 'Medium Daily Digest':

                //* sanitizing links
                const dirtyLinks = document.querySelectorAll( `[href*='?source=']` )
                dirtyLinks.forEach( link => {
                    link.href = link.href.replace( /\?source=.+/, '' )
                } )

                //*
                const mediumParent = generateElements( '<div id=mediumParent></div>', null, true )
                mediumParent.style = 'display: flex; flex-wrap: wrap'
                document.querySelector( 'table[role=presentation]:not([class])' ).parentElement.prepend( mediumParent )
                console.log( mediumParent )
                mediumParent.classList.add( 'fixedCSS' )
                document.querySelectorAll( `b[id]` ).forEach( item => {
                    const mainItem = grandParent( item, 7 )
                    if ( !mainItem.querySelector( '[alt="Member-only content"]' ) ) {
                        mainItem.style.width = '48%'
                        mediumParent.prepend( mainItem )
                    }
                } )
                break
            case 'MUO':
            case 'MUO Windows':
            case 'MUO Daily':
            case 'MUO Weekly':
            case 'MakeUseOf':
            case 'How-To Geek':

                document.querySelector( `center` ).classList.add( 'fixedCSS' )

                const linksDiv = generateElements( `<div></div>`, null, true )
                linksDiv.style.display = 'grid'
                document.querySelector( 'center' ).prepend( linksDiv )
                const linksToArticles = document.querySelectorAll( `h2 > a` )
                linksToArticles.forEach( link => {
                    if ( link.href.includes( '.tradepub.com' ) ) return
                    // to avoid commercial links 👆🏻
                    link.style.fontSize = 'large'
                    linksDiv.prepend( link )
                } )

                sanitizeTrackingLinks( `[href*=".awstrack.me/"]`, /^.+?\.awstrack\.me\/.+?\//, /\?.*/ )

                const ICYMILocator = contains( 'h3 > strong', 'ICYMI' )[ 0 ]
                if ( !ICYMILocator ) return // 🛑
                const ICYMIHeader = grandParent( ICYMILocator, 5 )
                const ICYMIContent = next( ICYMIHeader )
                linksDiv.append( ICYMIHeader, ICYMIContent )

                break

            case 'Reddit':
                // all links
                sanitizeTrackingLinks(
                    `[href^="https://click.redditmail.com/"]`,
                    'https://click.redditmail.com/CL0/',
                    /\?%24deep_link=.*/ )
                document.querySelectorAll( `[href^="https://www.reddit.com/"]` ).forEach( item => {
                    item.href = item.href.replace( 'https://www.', 'https://old.' )
                    item.classList.add( 'fixedCSS' )
                } )

                //
                grandParent( document.querySelector( 'img[width="126"]' ), 3 ).remove() // header
                grandParent( document.querySelector( '[height="35"]' ), 9 ).remove()    // footer
                document.querySelectorAll( '[style*="padding-top"]' ).forEach(
                    item => { item.style.padding = 'unset' } )

                // author links
                const authorEls = document.querySelectorAll( '[class*=author]' )
                authorEls.forEach( item => {
                    const authorLink = item.children[ 0 ]
                    const author = authorLink.textContent.match( /Posted by u\/(.+)/ )[ 1 ]
                    authorLink.href = `https://old.reddit.com/user/${ author }/submitted`
                } )
                // This style element messes with link colors. So removing it.
                document.querySelectorAll( `style` ).forEach( item => {
                    if ( item.innerText.includes( '#999999!important' ) ) item.remove()
                } )
                // seperator items
                document.querySelectorAll( 'table[width="50%"]' ).forEach( item => {
                    item.parentElement.parentElement.remove()
                } )
                // flexing
                document.querySelectorAll( '[align=center] > table' )[ 0 ].style.width = '100%'
                const flexItemsParent = document.querySelectorAll( '[align=center] > tbody' )[ 2 ]
                style( flexItemsParent, `
                    display: flex;
                    flex-wrap: wrap;
                `)
                const itemMainContentEls = document.querySelectorAll( `[width="515"]` )
                itemMainContentEls.forEach( mainContEl => {
                    mainContEl.style.width = 'unset'
                    mainContEl.parentElement.style.display = 'flex'
                } )
                for ( const item of flexItemsParent.children ) {
                    style( item, `
                        width:  48%;
                        margin: 15px 5px;
                    `)
                }
                break
            case 'Smashing Magazine':
                const tocParent = document.querySelector( `center > table > tbody > tr > td` )
                tocParent.classList.add( 'fixedCSS' )

                const toc = generateElements( '<div id=toc></div>', null, true )
                positionRelativeToElement( toc, tocParent, 5, 5, 'fixed' )
                style( toc, `
                    width:            auto;
                    background-color: #e63d318a;
                    border-radius:    10px;
                `)

                setTimeout( () => { newsletterContent.style.width = tocParent.offsetWidth - toc.offsetWidth + 'px' }, 500 )

                const newsletterContent = tocParent.children[ 0 ]
                style( newsletterContent, `
                    margin-left: auto;
                    margin-right: 0px;
                `)
                newsletterContent.querySelectorAll( '[width]' ).forEach( item => { item.removeAttribute( 'width' ) } )

                tocParent.prepend( toc )

                document.querySelectorAll( 'h2[style]' ).forEach( header => {
                    header.style.color = ''
                    const headerCopy = header.cloneNode( true )
                    headerCopy.addEventListener( 'click', () => { header.scrollIntoView() } )
                    style( headerCopy, `
                        font-size:  ;
                        margin:     ;
                        lineHeight: ;
                    `)
                    toc.append( headerCopy )
                } )
                console.log( toc )
                break

            case 'Mailbrew':

                const containers = document.querySelectorAll( `[class$=src-content]` )
                containers.forEach( element => {
                    element.style = `
                        display: flex;
                        flex-wrap: wrap;
                        max-width: unset;
                `} )
                containers[ 0 ].classList.add( 'fixedCSS' )
                document.querySelectorAll( `[class*=src-item]` ).forEach( element => { element.style.width = `33%` } )

                let mbTitleElement = document.querySelector( '[class*=brew-title]' )
                let mbFeedTitle = mbTitleElement.textContent.trim()
                console.log( `%c📶 ${ mbFeedTitle }`, 'font-size: large; color: gold' )

                const mbItems = document.querySelectorAll( '[class*=src-item]' )
                mbItems.forEach( async item => {

                    const itemHref = item.querySelector( `a` ).href

                    switch ( mbFeedTitle ) {
                        case 'PSA':
                            const tempDoc = await GMXmlHttpRequest( itemHref )
                            const tagEls = tempDoc.querySelectorAll( '[rel=tag]' )
                            if ( !tagEls.length ) {
                                const errorEl = generateElements( '<div style="color: red">Error</div>', null, true )
                                item.append( errorEl )
                                return
                            }
                            tagEls.forEach( tag => {
                                if ( [ 'HEVC', 'HEVC PSA', 'x265', 'x265 HEVC', '2160p', 'hdr', 'HDR10Plus' ].includes( tag.textContent ) )
                                    return // 🛑
                                style( tag, `
                                            background-color: #2196F3;
                                            color: white;
                                            margin: 3px;
                                            padding: 2px;
                                        `)
                                if ( [ 'TV-Show', 'Movie' ].includes( tag.textContent ) )
                                    style( tag, `
                                                background-color: #f44336;
                                            `)

                                item.append( tag )
                            } )
                            break
                        case 'happy2hub':
                            item.style.width = '100%'
                            item.style.maxWidth = 'unset'
                            const tempDocH2h = await GMXmlHttpRequest( itemHref )
                            item.append( tempDocH2h.querySelector( '[href*="paste.happy2hub"]' ) )
                            tempDocH2h.querySelectorAll( 'p > a > img[decoding]' ).forEach( img => {
                                img.style.width = '250px'
                                item.append( img )
                            } )
                            break

                        default:
                            break
                    }
                } )

                break

            default:
                break

            //* check if it is needed. If not then delete this part
            // case 'MasalaDesi - All Forums':
            //     let $images = $( 'a img, p img' )
            //     $images.css( 'max-width', '25vw' )
            //     $images.css( 'max-height', '50vh' )
            //     $images.parent().parent().css( 'display', 'flex' )
            //     $images.parent().parent().css( 'flex-wrap', 'wrap' )
            //     break

        }

        document.querySelectorAll( `a` ).forEach( item => {
            item.removeAttribute( 'data-saferedirecturl' )
        } )

        const moreBtn = document.querySelector( `[aria-label="More message options"]` )
        const lgLink = document.querySelector( `[href*='&view=lg']:not(.moved)` )
        if ( moreBtn && lgLink ) {
            moreBtn.classList.add( '.marked' )
            console.log( 'xxx', moreBtn, lgLink )
            lgLink.classList.add( 'moved' )
            lgLink.style.fontSize = 'x-large'
            lgLink.style.margin = '10px'
            moreBtn.parentElement.append( lgLink )
        }

        document.querySelector( '[style="height: 657px;"]' )?.scrollTo( 0, 150 )

        return

    }

    if ( location.href.includes( 'view=lg' ) ) {
        main( '.maincontent hr + table b' )
        return
    }

    let observer = new MutationObserver( () => { main( `span[name][email].gD` ) } )
    observer.observe( document.body, { childList: true, subtree: true } )

    GM_addStyle( `
        [cellpadding="3"][class]{ max-width: 33% }
        [cellpadding="3"][class] td > a' {
            position: sticky;
            top: 5px;
    }` )

    function markAsCSSFixed () {
        if ( location.href.includes( 'view=lg' ) ) return // 🛑
        document.querySelector( '[class=""] [jslog] table' ).classList.add( 'fixedCSS' )
    }

} )()