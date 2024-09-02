( async function () {
    'use strict'

    const match = location.href.match( /\/create\?prompt=(.+)(#|&|$)/ )
    if ( match ) {
        let queryString = decodeURIComponent( match[ 1 ] )
        const promptTextarea = document.querySelector( `textarea` )
        promptTextarea.value = queryString
    }

    if ( location.href.includes( 'https://r2.' ) ) {
        alert()
    }

    let observer = new MutationObserver( () => {


        $( 'img.rounded.max-w-full' ).each( function () {

            const $imgWrapper = $( this ).parent()
            if ( $imgWrapper.has( '#dlBtn' ).length ) return // 🛑

            GM_notification( '', 'Alert' )
            $imgWrapper[ 0 ].removeAttribute( 'href' )
            const $dlBtn = $( `<button id=dlBtn>D</button>` ).appendTo( $imgWrapper )
            $dlBtn[ 0 ].style = 'z-index: 1; background-color: black;'

            $dlBtn.on( 'click', () => {

                const $image = $( this )
                const uniqueFileName = generateUniqueString( 20 )
                const promptText = $image.parent().parent().find( 'p' ).text()
                // const model = $( 'button[role=combobox] span:contains("Model")' ).next().text()
                // const seed = $( '#imagefx-seed-input' )[ 0 ].value
                const finalFileName = `FluxPro.art - ${ uniqueFileName }`

                downloadText( `${ finalFileName }.txt`, promptText )
                GM_setClipboard( finalFileName )

            } )

        } )

        return



    } )
    observer.observe( document.body, { childList: true, subtree: true } )

} )()