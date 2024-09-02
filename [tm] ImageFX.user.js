( function () {
    'use strict'

    let observer_ = new MutationObserver( ( mutations ) => {
        mutations.forEach( mutation => {
            mutation.addedNodes.forEach( item => {
                if ( item.nodeType === 1 && item.matches( 'img' ) ) {
                    console.log( item )
                }
            } )
        } )
    } )
    observer_.observe( document.body, { childList: true, subtree: true } )

    let observer = new MutationObserver( () => {

        $( 'img[alt="A generated image based on your input prompt"]' ).each( function () {

            if ( !location.href.includes( '/tools/image-fx' ) ) return // 🛑

            const $imgWrapper = $( this ).parent()
            if ( $imgWrapper.has( '#dlBtn' ).length ) return // 🛑

            const $dlBtn = $( `<button id=dlBtn>D</button>` ).appendTo( $imgWrapper )
            $dlBtn[ 0 ].style = 'z-index: 1; background-color: black;'

            $dlBtn.on( 'click', () => {

                const image = this
                const tempImg = GM_addElement( 'img', { src: image.src, crossorigin: "anonymous" } )
                tempImg.addEventListener( 'load', async () => {

                    let blob = await fetch( this.src ).then( r => r.blob() )
                    let uri = await new Promise( resolve => {
                        let reader = new FileReader()
                        reader.onload = () => resolve( reader.result )
                        reader.readAsDataURL( blob )
                    } )


                    await waitFor( '#imagefx-seed-input' )

                    const uniqueFileName = generateUniqueString( 20 )
                    const promptText = $( 'div[role=textbox]' ).text().replaceAll( 'arrow_drop_down', '' )
                    const model = $( 'button[role=combobox] span:contains("Model")' ).next().text()
                    const seed = $( '#imagefx-seed-input' )[ 0 ].value
                    const finalFileName = `GoogleImageFX - ${ model } - ${ seed } - ${ uniqueFileName }`

                    if ( !promptText ) {
                        alert( 'error' )
                        return
                    }

                    downloadText( finalFileName, promptText )

                    const link = $( `<a></a>` )[ 0 ]
                    link.setAttribute( 'download', `${ finalFileName }.png` )
                    link.setAttribute( 'href', uri )
                    link.click()

                } )
            } )

        } )

        return



    } )
    observer.observe( document.body, { childList: true, subtree: true } )


} )()