let container    = GM_addElement( document.body, 'div', {
    style: 'position: fixed; top: 30px; right: 30px; width: fit-content; background-color: grey; z-index: 100' } )
makeDraggable( container )

let inputFilter  = GM_addElement( container, 'input', { type: "text" } )

let buttonFilter = GM_addElement(container, "button", { textContent: '⚗️' } )
$( buttonFilter ).click( function() {
    // let filterText = prompt()
    // inputFilter.value = filterText
    console.log( $( '.notion-to_do-block' ).filter( function( ) { return $( '.notion-page-mention-token', this ).length } ).css( {  } ) ) } )

$(document).keydown(function (e) {
    if ( e.ctrlKey && e.shiftKey && e.code == 'KeyF' ) { buttonFilter.click() } } )