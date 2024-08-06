//* Capture context menu event
$( document.body ).on( 'contextmenu', '[href*="/t/"]:has(img)', function ( event ) { clickMore( this, event ) } )

//* Adding the filter button
waitFor( `[aria-label="New message"]` ).then( ( el ) => {

    let $this = $( el ).parent().parent()

    let $filterButton = $this.clone()
    $this.before( $filterButton )
    $filterButton.find( 'svg' ).remove()
    $filterButton.find( 'div' ).text( '👁️' )
    $filterButton.on( 'click', filter )

} )

//* Keyboard shortcuts

document.addEventListener( 'keydown', async ( event ) => {

    if ( !event.ctrlKey ) return // 🛑

    switch ( event.key ) {

        case "n":
            event.preventDefault()
            let $item = $( '[aria-label="Chats"] [href*="/t/"]' ).has( 'span[data-visualcompletion="ignore"]:visible' ).first()
            console.log( $item )
            $item[ 0 ].click()
            break
        case "p":
            event.preventDefault()
            let $item_ = $( '[aria-label="Chats"] [href*="/t/"]' ).has( 'span[data-visualcompletion="ignore"]:visible' ).first()
            clickMore( $item_, event )
            break
        case "a":
            event.preventDefault()
            let $item__ = $( '[aria-label="Chats"] [href*="/t/"]' ).has( 'span[data-visualcompletion="ignore"]:visible' ).first()
            $( $item__ ).parent().parent().parent().find( '[aria-label=Menu]' ).click()
            await waitFor( '[role=menuitem]' )
            $( `[role=menuitem]:contains('Archive chat')` ).click()
            break

        // case "k":
        //     event.preventDefault()
        //     filter()
        //     break

        default:
            break

    }

}, false )

function clickMore ( element, event ) {
    event.preventDefault()
    $( element ).parent().parent().parent().find( '[aria-label=Menu]' ).click()
    waitFor( '[role=menuitem][href]' ).then( ( el ) => { window.open( `${ el.href }photos_by` ) } )
}

let observer = new MutationObserver( observerHandler )

function observerHandler () {
    let $items = $( '[href*="/t/"]:has(img)' ).parent().parent().parent().parent().parent()
    $items.each( function () {
        let $this = $( this )
        // if ( !$this.has( 'span[data-visualcompletion="ignore"]' ).length ) { // based on the unread marker
        if ( $this.has( ':contains("You: ")' ).length ) {                      // based on text 'You" '
            $this.slideUp()
        }
    } )
}

function filter () {
    observerHandler()
    observer.observe( document.body, { childList: true, subtree: true } )
}