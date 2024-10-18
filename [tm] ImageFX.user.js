( function () {
    'use strict';

    waitForEach( 'img[alt="A generated image based on your input prompt"]:not([width])', ( img ) => {

        if ( !location.href.includes( 'https://aitestkitchen.withgoogle.com/tools/image-fx' ) )
            return;

        const $imgWrapper = $( img ).parent();
        if ( $imgWrapper.has( '#dlBtn' ).length ) return; // 🛑

        GM_notification( {
            title: 'ImageFX',
            // highlight: true,
            img: img.src,
            text: ' ',
            timeout: 15000
        } );

        const $dlBtn = $( `<button id=dlBtn>D</button>` ).appendTo( $imgWrapper );
        $dlBtn[ 0 ].style = 'z-index: 1; background-color: black;';

        $dlBtn.on( 'click', () => {

            const tempImg = GM_addElement( 'img', { src: img.src, crossorigin: "anonymous" } );
            tempImg.addEventListener( 'load', async () => {

                let blob = await fetch( img.src ).then( r => r.blob() );
                let uri = await new Promise( resolve => {
                    let reader = new FileReader();
                    reader.onload = () => resolve( reader.result );
                    reader.readAsDataURL( blob );
                } );


                // await waitFor( '#imagefx-seed-input' );

                const uniqueFileName = generateUniqueString( 20 );
                const promptText = $( 'div[role=textbox]' ).text().replaceAll( 'arrow_drop_down', '' );
                // const model = $( 'button[role=combobox] span:contains("Model")' ).next().text();
                // const seed = $( '#imagefx-seed-input' )[ 0 ].value;
                // const finalFileName = `GoogleImageFX - ${ model } - ${ seed } - ${ uniqueFileName }`;
                const finalFileName = `GoogleImageFX - ${ uniqueFileName }`;

                if ( !promptText ) {
                    alert( 'error' );
                    return;
                }

                downloadText( finalFileName, promptText );

                const link = $( `<a></a>` )[ 0 ];
                link.setAttribute( 'download', `${ finalFileName }.png` );
                link.setAttribute( 'href', uri );
                link.click();

            } );
        } );
    } );

} )();