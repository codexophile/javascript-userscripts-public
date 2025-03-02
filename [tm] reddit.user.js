( function () {
  'use strict';

  waitFor( '.collapsible-content' ).then( async ( el ) => {

    // el.parentElement.style.left = '';
    // el.parentElement.style.right = '5px';

    const collapsible = await Collapsible();
    const redditPopup = collapsible.addPopup();
    redditPopup.id = 'redditPopup';
    collapsible.addButton( 'Reddit', redditPopup );
    const match = location.href.match( /\/\/.+?\.(.*)/ );
    const oldLink = `https://old.${ match[ 1 ] }`;
    const newLink = `https://new.${ match[ 1 ] }`;
    const shLink = `https://sh.${ match[ 1 ] }`;
    const wwwLink = `https://www.${ match[ 1 ] }`;

    function blockAnchor ( href, text ) {
      generateElements( `<a href=${ href }>${ text }</a>`, redditPopup )
        .style.display = 'block';
    };
    blockAnchor( newLink, 'New' );
    blockAnchor( shLink, 'SH' );
    blockAnchor( oldLink, 'Old' );
    blockAnchor( wwwLink, 'WWW' );

    //? regex -> (.+?/r/.+?)(/|$)
    const subredditMatch = location.href.match( /(.+?\/r\/.+?)(\/|$)/ );
    if ( subredditMatch ) {
      generateElements( '<hr>', redditPopup );
      const topAllLink = `${ subredditMatch[ 1 ] }/top/?t=all`;
      blockAnchor( topAllLink, 'TopAll' );
    }

  } );


  let observer = new MutationObserver( () => {

    //* gallery
    jQuery( 'gallery-carousel:not(.galleryDone)' ).each( function () {
      const $this = jQuery( this );
      $this.addClass( 'galleryDone' );
      $this.find( 'figure > img' ).prependTo( $this.parent() ).css( `width`, `200px` ).each( function () {

        const $imgEl = jQuery( this );

        let finalSrc;
        let lazySrcSet = $imgEl.attr( 'data-lazy-srcset' );
        let srcSet = $imgEl.attr( 'srcset' );
        let dataLazySrc = $imgEl.attr( 'data-lazy-src' );

        if ( lazySrcSet ) {
          finalSrc = getBestSrc( lazySrcSet );
        }
        else if ( srcSet ) {
          finalSrc = getBestSrc( srcSet );
        }
        else
          finalSrc = dataLazySrc;

        $imgEl.attr( 'src', finalSrc );

        function getBestSrc ( srcSet ) {
          srcSet = srcSet.split( ' ' ).filter( ( current, index ) => { return !( index % 2 ); } );
          return srcSet[ srcSet.length - 1 ];
        }

      } );
    } );

    //* Enabling controls for "gif" video elements
    //? Only applicable to the 'new' new reddit UI
    jQuery( `[gif]` ).removeAttr( 'gif' );

    //* Reddit old links
    let $links = jQuery( '[href^="/r/"]:not(.wwwToOldDone)' );
    $links.each( function () {
      let thisHref = this.href;
      if ( !thisHref.includes( '/comments/' ) ) return; // 🛑 // Checks if it's a post link as opposed to a subreddit link
      this.href = thisHref.replace( 'https://www.', 'https://old.' );
      this.classList.add( 'wwwToOldDone' );
    } );

    // if( !document.querySelector( `#oldHome` ) ) {
    // console.log( 'test' )
    // }

  } );
  observer.observe( document.body, { childList: true, subtree: true } );

} )();