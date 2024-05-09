const $moreFromSectionEl = $( `[data-testid="more-from-section"]` )
$moreFromSectionEl.insertBefore( '[data-testid="contribution"]' )

//*____________________
if ( location.href.includes( 'https://m.' ) ) {
    location.replace( location.href.replace( 'https://m.', 'https://www.' ) )
}

let observer = new MutationObserver( () => {
    $( 'a[href*="?ref"]' ).each( function () {
        this.href = this.href.replace( /\?ref.*$/, '' )
    } )
} )
observer.observe( document.body, { childList: true, subtree: true } )
