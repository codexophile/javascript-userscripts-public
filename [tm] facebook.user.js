const $sidebarRight = $( '[role="complementary"]' )
const $toggleBtn = $( `<button>↔️</button>` ).prependTo( document.body ).on( 'click', () => {
    $sidebarRight.toggle()
} )
positionRelativeToElement( $toggleBtn[ 0 ], $sidebarRight[ 0 ] )

//* Stories wrap button
const $storiesDiv = $( '[aria-label="Stories"]' )
const $storiesWrapBtn = $( `<button>🌯</button>` )
    .prependTo( document.body )
    .on( 'click', () => {

        const $storiesParent = $storiesDiv.find( '[aria-label="stories tray"] > div > div' )
        if ( $storiesParent.css( `flex-wrap` ) === 'wrap' )
            $storiesParent.css( `flex-wrap`, `` )
        else
            $storiesParent.css( `flex-wrap`, `wrap` )

        $storiesParent.parentsUntil( '[role="main"]' ).css( `width`, `100%` )
        $( '[role="complementary"]' ).toggle() // sidebar right
        $( `[role="navigation"]` ).eq( 2 ).toggle() // sidebar left

    } )
$storiesWrapBtn.css( `z-index`, `1` )
positionRelativeToElement( $storiesWrapBtn[ 0 ], $storiesDiv[ 0 ] )

let observer = new MutationObserver( () => {
    console.log( 'mo' )

    console.log( document.querySelector( '[aria-label="Close Video and scroll"]' ) )
    document.querySelector( '[aria-label="Close Video and scroll"]' )?.click()

    $( '[data-ad-preview="message"] + div' ).find( ':contains("See Translation")' ).click()

} )
observer.observe( document.body, { childList: true, subtree: true } )