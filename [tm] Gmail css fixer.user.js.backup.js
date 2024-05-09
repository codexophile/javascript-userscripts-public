let observer = new MutationObserver( () => {
    if ( document.querySelectorAll( '.fixedCSS' ).length ) { console.log( '%c🏁', 'font-size: large' ); return } // 🛑 

    let senderElement = document.querySelectorAll( `span[name][email].gD` )[ 0 ]
    let senderName

    if ( !senderElement ) { console.log( '%c⌛', 'font-size: large' ); return } // 🛑
    else { senderName = senderElement.textContent.replace( ' [Masked]', '' ) }

    console.log( `%c🔥 ${ senderName }`, 'font-size: large; color: gold' )

    switch ( senderName ) {

        case 'Reddit':

            // removing reddit logo at the top
            $( `[src$='https://www.redditstatic.com/emaildigest/logo@2x.png']` )
                .first().parent().parent().parent().remove()

            // use entire width
            let $redditItemsGrandParent = $( `table[width='711']` )
            $redditItemsGrandParent.css( `width`, `100%` )

            // removing empty tr elements
            let $redditItemsParent = $redditItemsGrandParent.find( 'tbody>tr>td>table>tbody' ).first()
            $redditItemsParent.children().filter( ':odd' ).remove()

            // removing hide subreddit links
            // $( '[valign=top]>table:nth-child(2)' ).remove()

            // CSS fix
            $redditItemsParent.css( `display`, `flex` )
            $redditItemsParent.css( `flex-wrap`, `wrap` )
            $redditItemsParent.css( `justify-content`, `center` )
            $redditItemsParent.children().css( `width`, `40%` )

            // URL fix
            $( `[href^='https://click.redditmail.com/']` ).each( function () {
                let matches = this.href.match( /comments%2F((\w|\d)+)/ )
                if ( matches && matches[ 1 ] ) {
                    let post = matches[ 1 ]
                    let newURL = `https://old.reddit.com/comments/${ post }`
                    this.href = newURL
                    this.removeAttribute( 'data-saferedirecturl' )
                }
            } )

            $redditItemsGrandParent.addClass( 'fixedCSS' )

            break

        case 'Mailbrew':
            $( `[class$=src-content]` ).css( `display`, `flex` )
                .css( `flex-wrap`, `wrap` )
                .css( `max-width`, `unset` )
                .addClass( 'fixedCSS' )
            $( `[class*=src-item]` ).css( `width`, `33%` )
            break

        case 'MUO':
        case 'MUO Windows':
        case 'MUO Daily':
        case 'MUO Weekly':
        case 'MakeUseOf':
        case 'How-To Geek':
            const linksDiv = generateTrustedElements( `<div style='display: grid'></div>` )
            document.querySelector( 'center' ).prepend( linksDiv )
            const linksToArticles = document.querySelectorAll( `h2 > a` )
            linksToArticles.forEach( ( el ) => { el.style.fontSize = 'large' } )
            debugger
            return
            linksDiv.append( linksToArticles )
            linksDiv.classList.add( 'fixedCSS' )
            break

        case 'Medium Daily Digest':

            // fixing main container width
            let $mainContainer = $( '[style="margin-left:auto;margin-right:auto;width:100%;max-width:680px"]' )
                .css( `max-width`, `unset` )

            // removing big banner
            $( '[alt="Medium daily digest"]' ).remove()

            //todo: flex wrap css fix

            $mainContainer.addClass( 'fixedCSS' )

            break

        case 'Simkl': {

            let $titleElem = $( '[href*=episode-][style*=font]' ).first()
            let regexMatch = $titleElem.attr( 'href' ).match( /season-(\d+)\/episode-(\d+)/ )
            let season = regexMatch[ 1 ].padStart( 2, "0" )
            let episod = regexMatch[ 2 ].padStart( 2, "0" )
            let show = $titleElem.text()

            let $mainContent = $( '[style^="background:"]:not([class])' ).last()
            $mainContent.prependTo( $mainContent.parent() )

            let $buttonOne = $( `[style^="border-radius: 6px; background: rgb(71, 135, 243); text-align: center"]` )
            $buttonOne.addClass( 'buttons' )
            let $parent = $buttonOne.parent().attr( 'style', `
                display       : flex;
                flex-direction: column; `)
            $parent.css( `padding`, `5px` )
            $parent.children().css( `margin`, `5px` )

            $buttonOne.clone().insertAfter( $buttonOne )
                .find( 'span' ).text( '720p' ).end()
                .find( 'a' ).attr( 'href', `https://1337x.to/search/${ show }%20s${ season }e${ episod }%20720p/1/` )
            $buttonOne.clone().insertAfter( $buttonOne )
                .find( 'span' ).text( '1080p' ).end()
                .find( 'a' ).attr( 'href', `https://1337x.to/search/${ show }%20s${ season }e${ episod }%201080p/1/` )

            $( `.buttons` ).find( 'a' ).removeAttr( 'data-saferedirecturl' )

            $buttonOne.addClass( 'fixedCSS' )
            break
        }

        default:
            break

    }

} )

observer.observe( document.body, { childList: true, subtree: true } )

return

panicSwitch = setInterval( () => {
    "use strict"
    if ( $( '.fixedCSS' ).length ) { console.log( '%c🏁', 'font-size: large' ); return } // 🛑 

    let sender
    if ( location.href.match( /ik=|view=|permmsgid=/ ) ) { //? must be for when the mail is opened in a new tab when the email is too long
        sender = $( '.message b' ).text().trim()
    }
    else {
        if ( !$( 'span[name][email].gD' ).length ) { console.log( '%c⌛', 'font-size: large' ); return } // 🛑 
        sender = $( 'span[name][email].gD' ).text().replace( ' [Masked]', '' )
    }

    let $messageClipped
    if ( $messageClipped = $( '[href*=permmsgid]' ).length && !$( '#linkToWholeMessage' ).length ) {
        let $parent = $( '[data-legacy-message-id]' )
        let $child = $parent.find( 'div > div > table > tbody > tr' ).first()
        let href = $( '[href*=permmsgid]' ).attr( 'href' )
        $child.append( `<a href=${ href } id=linkToWholeMessage>Show entire message</a>` )
    }

    console.log( `%c🔥 ${ sender }`, 'font-size: large; color: gold' )
    //! *************************

    switch ( sender ) {


        case 'How-To Geek': {

            let $spacerElements = $( '[class*=spacerclass]' ).parent()
            $spacerElements.each( function () {
                let $this = $( this )
                $this.prevUntil( '*:has([class*=spacerclass])' ).wrapAll( '<div class=grouped></div>' )
            } )
            let $parent = $( '.grouped' ).parent()
            $parent.children().filter( 'tr' ).remove()
            $parent.children().has( 'strong:contains(SPONSORED)' ).remove()

            $parent.parent().css( 'max-width', 'unset' )
            $parent.css( 'width', '100%' )
            $parent.css( 'flex-wrap', 'wrap' )
            $parent.css( 'display', 'flex' )
            $parent.children().css( 'width', '50%' )
            $parent.children().css( 'border', 'solid' )
            $parent.children().css( 'border-radius', '3px' )
            $parent.children().css( 'box-sizing', 'border-box' )
            $parent.children().css( 'padding', '3px' )
            $( 'strong' ).css( 'font-size', 'large' )
            $( '[style*=padding]' ).css( 'padding', '3px' )
            $parent.find( 'img' ).css( 'max-height', '100px' )
            $parent.find( 'img' ).css( 'width', 'auto' )

            $parent.addClass( 'fixedCSS' )
            break

        }

        case 'Medium Daily Digest': {


            let $parent = $( 'img[alt="Medium daily digest"]' ).parent().parent().parent().parent().children().eq( 2 )
            let $items = $parent.children()
            let $grandParent = $parent.parents( 'table[role=presentation]' ).first()
            let $images = $( '[style*=background-image]' )
            let $headings = $parent.find( 'p' )
            let $b = $( 'b[id]' )
            console.log( $b )
            let $gp = $b.parent().parent()
            $gp.siblings().remove()
            $gp.parent().parent().siblings().remove()

            $b.each( function () {
                let $this = $( this )
                $this.attr( 'title', $this.text() )
            } )

            $b.attr( 'style', `
                font-size         : small       !important;
                overflow          : hidden      !important;
                text-overflow     : ellipsis    !important;
                display           : -webkit-box !important;
                -webkit-line-clamp: 2           !important; /* number of lines to show */
                -webkit-box-orient: vertical    !important;` )
            $items.css( `width`, `25%` )
            $parent.css( `flex-wrap`, `wrap` )
            $parent.css( `display`, `flex` )
            $grandParent.css( `max-width`, `unset` )
            $images.css( `float`, `unset` ).css( `margin`, `3px` )
            $headings.parent().css( `width`, `100%` ).css( `text-align`, `center` )

            $( '[style*="border-bottom: 1px solid rgb("]' ).remove()
            $parent.addClass( 'fixedCSS' )
            break

        }



        case "Refind": {

            let $parent = $( 'img[alt="Refind"]' ).parents().eq( 6 )

            let $items = $parent.children()
            $items.first().remove()
            $items.has( '[href*=cross-promotion]' ).remove()

            $items = $parent.children()
            $items.wrapAll( '<div id=newDiv></div>' )
            let $newDiv = $( '#newDiv' )
            $newDiv.prependTo( $parent )

            $newDiv.css( 'display', 'flex' )
            $newDiv.css( 'flex-wrap', 'wrap' )
            $newDiv.css( 'width', '80vw' )
            $items.css( 'width', '33%' )
            $items.css( 'max-height', '200px' )
            $items.css( 'overflow', 'scroll' )
            GM_addStyle( '#newDiv *::-webkit-scrollbar { display: none }' )
            $( '[style*="max-width:600px;margin:auto"]' ).css( 'margin', 'unset' )
            $( '[style*="max-width:600px;margin:auto"]' ).css( 'max-width', 'unset' )

            $items.addClass( 'fixedCSS' )
            console.log( $items.first().find( 'a[href*=refind]' ) )

            break

        }

        case 'Recomendo':

            $headings = $( `[style*='font-family: lato, "Helvetica Neue", Helvetica, Arial, sans-serif']` ).parent().parent()
            console.log( $headings )
            $headings.each( function () {
                $this = $( this )
                $this.append( $this.next() )
            } )
            $headings.addClass( 'item' )
            GM_addStyle( `.item { display: block }` )
            $headings.wrapAll( '<div id=container></div>' )
            $container = $( '#container' )

            GM_addStyle( `#container                 { flex-wrap: wrap; display: flex }
                          [style*="max-width:600px"] { max-width: unset !important    }
                          [style*="max-width: 600"]  { max-width: unset !important    }
                          [style*="width:600"]       {     width: 100%  !important    }
                          [width="600"]              {     width: 100%  !important    }
                          .item                      {     width: 33%                 }` )

            // $container = $( '<div></div>' ).wrapInner( $headings )
            $headings.parent().addClass( 'fixedCSS' )

            break

        case 'Tor.com Publishing': {

            break
            let $items = $( '[href*="click.mail.macmillan"] > img' ).
                parent().parent().parent().parent().parent().parent().parent().slice( 2 )
            $items.addClass( 'fixedCSS' )
            $items.css( `width`, `50%` )

            let $parent = $items.parent()

            let $newDiv = $( `<div style="
                flex-wrap: wrap;
                display  : flex;"></div>` ).wrapInner( $items ).prependTo( $parent )

            $( `[width]` ).removeAttr( 'width' )

            $items.find( 'img' ).height( '200px' )
            console.log( "🚀 ~ file: [tm] Gmail css fixer.user.js ~ line 326 ~ panicSwitch=setInterval ~ $items.find( 'img' )", $items.find( 'img' ) )
            $( `font ~ a` ).remove()
            $( `font` ).remove()

            $parent.addClass( 'fixedCSS' )
            break
        }
        case 'Tor.com': {

            let $items = $( 'p > [href*="click.mail.macmillan"]' ).
                parent().parent().parent().parent().parent().parent().parent()
            $items.css( `width`, `50%` )

            let $parent = $items.parent()

            let $newDiv = $( `<div style="
                flex-wrap: wrap;
                display  : flex;"></div>` ).wrapInner( $items ).prependTo( $parent )
            console.log( $newDiv )

            $( `[width=600]` ).removeAttr( 'width' )
            $( `[width=580]` ).removeAttr( 'width' )

            $items.find( 'img' ).height( '200px' )
            $( `font ~ a` ).remove()
            $( `font` ).remove()

            $parent.addClass( 'fixedCSS' )
            console.log( $items )

            break

        }

        case 'Twitter': {

            let $parent = $( 'table [style="padding:0px;width:650px"] > tbody' )
            let $items = $parent.children().slice( 2, -7 )

            $items.css( 'width', '50%' )

            let $newDiv = $( '<div></div>' )
            $parent.prepend( $newDiv )

            $newDiv.css( 'display', 'flex' )
            $newDiv.css( 'flex-wrap', 'wrap' )
            $newDiv.css( 'width', '80vw' )

            $items.wrapAll( $newDiv )
            $parent.addClass( 'fixedCSS' )

        }

        default:
            break

    }

}, 100 )