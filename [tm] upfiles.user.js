( function () {
    'use strict'

    let observer = new MutationObserver( () => {
        $( `#link-button` )[ 0 ].click()
    } )
    observer.observe( document.body, { childList: true, subtree: true } )

    if ( location.href.includes( '/file/go' ) ) {

        const textNode = getTextNodes( document.body )[ 0 ]
        const downloadUrl = JSON.parse( textNode.textContent ).url

        const downloadLink = generateElements( `<a href=${ downloadUrl }>Download</a>` )

        const copyBtn = generateElements( `<button>Copy</button>` )
        copyBtn.addEventListener( 'click', () => {
            GM_setClipboard( downloadUrl )
        } )

        document.body.prepend( copyBtn, downloadLink )

    }

} )()