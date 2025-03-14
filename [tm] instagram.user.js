( async function () {
  'use strict';

  // markAndFilter( 'main div:has(>[href^="/p/"])', 'a', 'href', /\/p\/(.+?)\// )

  //* moving video control panel
  ( async function () {
    'use strict';
    const videoControlPanel = await waitFor( '#video-controlPanel' );
    style( videoControlPanel, `
                left: unset;
                right: 100px;
                top: 50vh;
            `);
  } )();

  let observer = new MutationObserver( () => {

    //* Suggested accounts on profile pages
    const $profilesLocators = $( `[style="width: 170px;"]` );
    if ( $profilesLocators.length ) {

      const $grandParent = $( grandParent( $profilesLocators[ 0 ], 6 ) );
      if ( $grandParent.parent().find( '#profilesWrapper' ).length ) return; // 🛑

      const $profilesWrapper = $( `<div id=profilesWrapper></div>` ).insertAfter( $grandParent.prev() );

      $profilesLocators.each( function () {
        const linkToProfile = this.querySelector( 'a' ).href;
        const profilePicSrc = this.querySelector( 'img' ).src;
        $profilesWrapper.append( `
                    <a href=${ linkToProfile } style='display: inline-block; width: 33%'>
                        <img src=${ profilePicSrc }>
                        <div>Link</div>
                    </a>
                `);
      } );

    }

    //* click all 'see translation' button
    $( `[role=button]:contains('See translation')` ).click();

    // const $imagesOpened = $( '[style*="padding-bottom:"] > img[src]:not(.imgProcessed)' )
    const queryForIGPosts = 'img[crossorigin="anonymous"][style="object-fit: cover;"]:not(.imgProcessed)';
    const queryForIGAllImagesItems = '#igAllImages > * > img';
    const $imagesOpened = $( `${ queryForIGAllImagesItems }, ${ queryForIGPosts }` );
    $imagesOpened.each( function () {

      this.classList.add( 'imgProcessed' );
      const $this = $( this );
      const imgSrc = this.src;

      const $linksContainer = $( `<div></div>` ).insertAfter( $this );
      style( $linksContainer[ 0 ], `
                position: absolute;
                top:      5px;
                left:     5px;
                z-index:  1000;
            `);
      $linksContainer.append( `<a href='${ imgSrc }' target=_blank> 🔗 </a>` );
      $( `<button>⬇️</button>` ).appendTo( $linksContainer ).on( 'click', () => clickHandler( this ) );

    } );

    const $videos = $( `video` );
    $videos.each( function ( index, element ) {
      // element.pause()
    } );

  } );
  observer.observe( document.body, { childList: true, subtree: true } );

  const clickHandler = ( image ) => {

    const tempImg = GM_addElement( 'img', { src: image.src, crossorigin: "anonymous" } );
    tempImg.addEventListener( 'load', () => {

      var c = $( `canvas` )[ 0 ];
      c.width = tempImg.naturalWidth;
      c.height = tempImg.naturalHeight;
      var ctx = c.getContext( "2d" );
      ctx.drawImage( tempImg, 0, 0 );
      const uri = c.toDataURL();

      const link = $( `<a></a>` )[ 0 ];
      let fileName = `${ getUserId( image ) } - ${ getPostId( image ) } - instagram`;
      link.setAttribute( 'download', `${ fileName }.png` );
      link.setAttribute( 'href', uri );
      link.click();

    } );
  };

  function getUserId ( image ) {
    let $parent;
    if ( location.href === 'https://www.instagram.com/' )
      $parent = $( image ).closest( 'article' );
    if ( location.href.includes( '/p/' ) )
      $parent = $( `main` ).first();
    const userId = $parent.find( '[href^="/"]' ).first().attr( 'href' ).match( /\/(.+?)\// )[ 1 ];
    console.log( userId );
    return userId;
  }

  function getPostId ( image ) {
    let href;
    if ( location.href === 'https://www.instagram.com/' )
      href = $( image ).closest( 'article' ).find( '[href*="/p/"]' ).attr( 'href' );
    if ( location.href.includes( '/p/' ) )
      href = location.href;
    return href.match( /\/p\/(.+?)(\/|$)/ )[ 1 ];
  }

} )();