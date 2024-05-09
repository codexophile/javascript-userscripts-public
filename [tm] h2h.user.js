const $items = $( `.content-inner > div` )

if ( $items.length ) {
    lazyLoad( ( item ) => {
        const $item = $( item )
        const $containerInner = $item.find( '.no-avatar' )
        const $targetLink = $item.find( 'a' ).first()
        GM_xmlhttpRequest( {
            method: 'GET',
            url: $targetLink[ 0 ].href,
            responseType: 'document',
            onload: function ( response ) {

                const resText = response.responseText
                const $tempDoc = $( generateDoc( resText ) )
                const $linkToDownloads = $tempDoc.find( '[ title = "Download"]' ).parent()
                $linkToDownloads.empty().text( 'Download page' )
                $containerInner.append( $linkToDownloads )

                const $iframes = $tempDoc.find( 'iframe' )
                if ( !$iframes[ 0 ] ) return
                console.log( $iframes[ 0 ] )
                const $linkToVideo = $iframes[ 0 ].src
                const linkText = $linkToVideo.match( /https:\/\/(.*?)\// )[ 1 ]
                $containerInner.append( `<a href=${ $linkToVideo } target=_blank>${ linkText }</a>` )

            }
        } )
    }, ...$items )
}

//* Select images wrap them and prepend to the body
let $chosen = $( 'p[style="text-align: center;"]' )
if ( !$chosen.length ) return // 🛑
$chosen.prependTo( $( document.body ) )
let $images = $chosen.find( 'img' )
$images.removeClass()
let $newDiv = $( '<div id=newDiv></div>' )

$newDiv.css( 'display', 'flex' )
$newDiv.css( 'flex-wrap', 'wrap' )
$newDiv.css( 'justify-content', 'space-around' )

$images.wrapAll( $newDiv )
$newDiv = $( '#newDiv' )

let $otherImages = $( `h2 img` )
$newDiv.append( $otherImages )

$fullWidthDiv = $( `< div style = "
    flex - basis: 100 %
                display: flex
                position: sticky
                bottom: 0
                "></div>` ).appendTo( $newDiv )

//* "DownloadLInk" link
$originalLink = $( '[href*="paste.happy2hub"]' ).appendTo( $fullWidthDiv )

//* New link
query = document.title.replaceAll( /(web series|episode)(.+added)?/gi, '' )
query = query.replaceAll( /(\||480p|720p|1080p|in hindi|download & watch online)/gi, '' )
$fullWidthDiv.append( `<a href="https://paste.happy2hub.org/?s=${ query }" target=_blank>Link</a>` )

//* 'load()' download links
$loadedContent = $( `<div style="border-style: outset"></div>` ).appendTo( $newDiv )
console.log( $originalLink.attr( 'href' ) )
$loadedContent.load( `${ $originalLink.attr( 'href' ) } #main` )
console.log( $loadedContent )