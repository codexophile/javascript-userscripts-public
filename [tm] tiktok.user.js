if ( location.href.includes( '#saved' ) ) {
    waitFor( `[class*=PFavorite]` ).then( ( el ) => { el.click() } )
}


if ( location.href.match( /@\w+$/ ) ) { // Profile page, not a video page
    let $sideNavToggler = $( `<button> Toggle </button>` )
    $sideNavToggler.attr( 'style', `
        position: fixed;
        left    : 200px;
        top     : 200px;
        z-index : 99;
    `)
    $sideNavToggler.appendTo( document.body )
    $sideNavToggler.on( 'click', () => {
        $( '[class*=DivSideNavContainer]' ).toggle()
    } )
}

let observer = new MutationObserver( () => {

    const $userIds = $( '[class*=SpanUniqueId]:not([data-e2e])' ).each( function () {
        const $this = $( this )
        if ( $this.parent().prop( 'tagName' ) === 'A' ) return // 🛑
        $this.wrap( `<a href="https://www.tiktok.com/@${ $this.text() }/" target=_blank></a>` )
    } )
} )

observer.observe( document.body, { childList: true, subtree: true } )