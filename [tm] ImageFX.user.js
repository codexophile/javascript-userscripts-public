( function () {
  'use strict';

  waitForEach( 'img[alt="A generated image based on your input prompt"]:not([width])', ( img ) => {

    if ( !location.href.includes( 'https://labs.google/fx/tools/image-fx' ) )
      return;

    const $imgWrapper = $( img ).parent();
    if ( $imgWrapper.has( '#dlBtn' ).length ) return; // 🛑

    GM_setClipboard( `global-document-ready-${ document.title }` );

    const $dlBtn = $( `<button id=dlBtn>D</button>` ).appendTo( $imgWrapper );
    style( $dlBtn[ 0 ], `
            position: absolute;
            top: 0;
            right: 0;
            z-index: 1;
            background-color: black;
            color: white;
            border-radius: 5px;
            border: 5px;
        `);

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
        const promptEl =
          document.querySelector( `div[role=textbox]` ) ||
          document.querySelector( `img[alt*='A genera'] + div h4` );
        const promptText = promptEl.textContent.replaceAll( 'arrow_drop_down', '' );
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