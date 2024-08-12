( function () {
    'use strict'

    // Click ...more in the tags list
    // Only for https://www.goodreads.com/book/show/*
    jQuery( `[aria-label="Show all items in the list"]` ).each( function () {
        this.click()
    } )

    // Estimating the number of words in the book
    const $elementNumberOfPages = jQuery( '[data-testid="pagesFormat"]' )
    console.log( $elementNumberOfPages )
    const numberOfPages = $elementNumberOfPages.text().match( /\d+/ )
    const lowerApproximation = ( numberOfPages * 250 )
    const upperApproximation = ( numberOfPages * 350 )
    const averageApproximation = ( lowerApproximation + upperApproximation ) / 2
    $elementNumberOfPages.after( `<div> Estimated number of words: ${ lowerApproximation.toLocaleString() } - ${ upperApproximation.toLocaleString() } (Avg. ${ averageApproximation.toLocaleString() }) </div>` )

    // Adding external links
    waitFor( '#collapsibleContent' ).then( ( el ) => {
        if ( location.href.includes( '/book/show/' ) ) {

            const GRPopup = createToolbarPopup()
            generateToolbarButton( 'GR', el, GRPopup )

            const bookTitle = encodeURI( jQuery( `.Text__title1` )[ 0 ].innerText )
            const author = encodeURI( jQuery( `.ContributorLink__name` )[ 0 ].innerText )
            const hrefZLib = `https://1lib.sk/s/?q=${ bookTitle }+${ author }&languages[]=english&extensions[]=EPUB`
            const hrefAnnas = `https://annas-archive.org/search?index=&q=${ bookTitle }+${ author }&ext=epub`
            const hrefReddit = `https://www.google.com/search?q=${ bookTitle }+${ author }+site:reddit.com`
            const hrefBlog = `https://www.google.com/search?q=${ bookTitle }+${ author }+blog`
            const hrefWiki = `https://www.google.com/search?q=${ bookTitle }+${ author }+wiki`
            const hrefStorygraph = `https://app.thestorygraph.com/browse?search_term=${ bookTitle }+${ author }`
            const hrefTVTropes = `https://tvtropes.org/pmwiki/search_result.php?q=${ bookTitle }+${ author }`
            const hrefChatGPT = `https://chatgpt.com/?query=${ bookTitle } by ${ author }`

            const $parent = jQuery( GRPopup )
            addExtLink( 'ChatGPT', hrefChatGPT )
            addExtLink( 'The StoryGraph', hrefStorygraph )
            addExtLink( 'Wiki', hrefWiki )
            addExtLink( 'Blog', hrefBlog )
            addExtLink( 'Reddit', hrefReddit )
            addExtLink( 'TV Tropes', hrefTVTropes )
            addExtLink( 'ZLib', hrefZLib )
            addExtLink( "Anna's", hrefAnnas )

            function addExtLink ( text, href ) {
                const $linkEl = jQuery( `<a href="${ href }" target=_blank> ${ text } </a>` )
                $linkEl.css( `display`, `block` )
                $parent.append( $linkEl )
            }

        }
    } )


} )()