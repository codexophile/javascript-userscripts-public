waitFor( '#collapsibleContent' ).then( ( el ) => {
    generateToolbarButton( '↔️', el, null, () => {

        const leftSide = document.querySelector( 'header[role=banner]' )
        const rightSide = document.querySelector( `[data-testid=sidebarColumn]` )
        const primary = document.querySelector( `[data-testid=primaryColumn]` )
        const locator = document.querySelector( `[aria-label="Profile timelines"]` )
        const shouldBeParent = document.querySelector( '[aria-label="Profile timelines"] ~ section > div' )
        const items = shouldBeParent.querySelectorAll( 'div > li' )
        console.log( items )

        primary.style.maxWidth = 'unset'
        grandParent( locator, 1 ).style.maxWidth = 'unset'
        grandParent( primary, 3 ).style.width = '-webkit-fill-available'
        toggle( leftSide )
        toggle( rightSide )

        locator.scrollIntoView()

    } )
} )

let observer = new MutationObserver( () => {

    // Automatically clicking "show" button on censored tweets
    $( '[role=article] [role=button]:contains("Show"), [role=button] > span:contains("Show")' ).click()

    // Automatically clicking 'New post notifications for ' item
    if ( !window.location.href.includes( "#notif" ) ) return
    $( '[data-testid="notification"]:contains("New post notifications for ")' ).click()

} )
observer.observe( document.body, { childList: true, subtree: true } )