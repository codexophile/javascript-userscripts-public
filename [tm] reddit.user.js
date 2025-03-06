( function () {
  'use strict';

  markAndFilter( 'shreddit-feed > article', 'shreddit-post', 'id', /t3_(.+)$/, 'https://sh.reddit.com' );

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

    const uncollapseBtnEl = collapsible.addButton( '🌂', null, () => {
      document.querySelectorAll( `shreddit-comment` ).forEach( el => {
        el.style.display = 'block';
      } );
    } );

  } );

  waitForEach( 'shreddit-comment', commentEl => {

    const buttonsContEl = generateElements( '<div></div>', commentEl );
    buttonsContEl.classList.add( 'up-down-container' );
    style( buttonsContEl, `
      position: absolute;
      top: 0;
      left: -30px;
      margin: 5px;
    `);

    const upBtnEl = generateElements( '<button>⬆️</button>', buttonsContEl );
    const downBtnEl = generateElements( '<button>⬇️</button>', buttonsContEl );
    downBtnEl.addEventListener( 'click', () => {
      const nextCommentEl = next( commentEl, 'shreddit-comment' );
      const nextBtnContEls = nextCommentEl.querySelectorAll( '.up-down-container' );
      const nextBtnContEl = nextBtnContEls[ nextBtnContEls.length - 1 ];
      scrollElementToCursor( nextBtnContEl );
    } );
    upBtnEl.addEventListener( 'click', () => {
      const prevCommentEl = prev( commentEl, 'shreddit-comment' );
      const prevBtnContEls = prevCommentEl.querySelectorAll( '.up-down-container' );
      const prevBtnContEl = prevBtnContEls[ prevBtnContEls.length - 1 ];
      scrollElementToCursor( prevBtnContEl );
    } );

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

    // if( !document.querySelector( `#oldHome` ) ) {
    // console.log( 'test' )
    // }

  } );
  observer.observe( document.body, { childList: true, subtree: true } );

} )();