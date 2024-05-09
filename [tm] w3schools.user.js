$codeBlocks = $( '.w3-code' )
const $copyBtns = $( `<button class=copyRole>😊</button>` ).insertAfter( $codeBlocks )
// $copyBtns.attr( 'style', 'position: absolute; left: 5px; top: 5px;' )
$copyBtns.on( 'click', function () {
    $this = $( this )
    text = $this.siblings( '.w3-code' )[ 0 ].innerText
    GM_setClipboard( text )
} )