( function () {
    'use strict'

    let observer = new MutationObserver( ( mutations ) => {
        mutations.forEach( mutation => {
            mutation.addedNodes.forEach( item => {
                if ( item.nodeType === 1 ) {
                    if ( item.matches( 'a[download]' ) ) {
                        const dlBtn = generateElements( '<button>D</button>' )
                        item.before( dlBtn )
                        dlBtn.addEventListener( 'click', ( event ) => { clickHandler( event.target ) } )
                    }
                }
            } )
        } )
    } )
    observer.observe( document.body, { childList: true, subtree: true } )

    function clickHandler ( el ) {

        const image = el.parentElement.parentElement.querySelector( 'img' )
        const tempImg = GM_addElement( 'img', { src: image.src, crossorigin: "anonymous" } )
        tempImg.addEventListener( 'load', () => {

            var c = GM_addElement( document.body, 'canvas' )
            c.width = tempImg.naturalWidth
            c.height = tempImg.naturalHeight
            var ctx = c.getContext( "2d" )
            ctx.drawImage( tempImg, 0, 0 )
            const uri = c.toDataURL()

            $( 'canvas' ).remove()

            const promptText = document.querySelector( 'textarea' ).value
            const seed = document.querySelectorAll( `h6` )[ 4 ].textContent.replace( 'Seed: ', '' )
            const model = document.querySelector( `input` ).value

            const uniqueFileName = generateUniqueString( 20 )
            const baseFileName = `${ model } - ${ uniqueFileName } - ${ seed }`
            downloadText( baseFileName, promptText )

            const link = $( `<a></a>` )[ 0 ]
            link.setAttribute( 'download', `${ baseFileName }.png` )
            link.setAttribute( 'href', uri )
            link.click()

        } )
    }

} )()