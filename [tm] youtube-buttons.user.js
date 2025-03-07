( async function () {
  'use strict';

  function hideWatchedItems () {
    // console.log( $( "ytd-thumbnail-overlay-resume-playback-renderer" ).parent().parent().parent().parent().parent() )
    $( "ytd-thumbnail-overlay-resume-playback-renderer" ).parent().parent().parent().parent().parent().hide();
  }

  let watchedItemsObserver = new MutationObserver( () => { hideWatchedItems(); } );

  window.addEventListener( 'urlchange', () => { main(); } );

  const collapsibleContent = await waitFor( '.collapsible-content' );
  //* Controls that should be available in any kind of page
  const btHideSeen = generateElements( '<button title="Hide Seen">W</button>', collapsibleContent );
  btHideSeen.onclick = function () {
    hideWatchedItems();
    watchedItemsObserver.observe( document.body, { childList: true, subtree: true } );
  };
  const showSbHorizontalBtn = generateElements( '<button>🎞️</button>', collapsibleContent );
  showSbHorizontalBtn.addEventListener( 'click', () => {

    document.querySelectorAll( `ytd-rich-grid-row > #contents` ).forEach( item => { item.replaceWith( ...item.childNodes ); } );
    document.querySelectorAll( `ytd-rich-grid-row            ` ).forEach( item => { item.replaceWith( ...item.childNodes ); } );
    const thumbItems = document.querySelectorAll( `ytd-rich-item-renderer, ytd-compact-video-renderer` );
    lazyLoad( async ( item ) => {
      const horSbParent = generateElements( '<div class=horSbParent style="width: -webkit-fill-available"></div>' );
      item.after( horSbParent );
      const linkToVid = item.querySelector( 'a' ).href;
      const ytHtml = await GMXmlHttpReqResponse( linkToVid );
      const { allUrls, trueNoOfSlots, samplingFq } = generateAllYouTubeSbUrls( ytHtml );
      storyboardToggleable( horSbParent, 5, 5, linkToVid, null, null, trueNoOfSlots, ...allUrls );
    }, ...thumbItems );

  } );

  main();

  async function main () {

    watchedItemsObserver.disconnect();
    const collapsibleContent = await waitFor( '.collapsible-content' );

    document.querySelectorAll(
      `.videoPageControl,.storyboardControl`
    ).forEach( item => { item.remove(); } );
    // calculateWidthAndExpand( collapsibleContent );

    if ( location.href.includes( '/watch?v=' ) ) {

      const btStop = generateElements( '<button>⏹</button>', collapsibleContent );
      btStop.classList.add( 'videoPageControl' );
      btStop.onclick = function () {
        document.getElementById( "movie_player" ).pauseVideo();
        document.getElementById( "movie_player" ).stopVideo();
      };

      const autoPauseCheckbox = GM_addElement( collapsibleContent, 'input', { type: 'checkbox' } );
      autoPauseCheckbox.classList.add( 'videoPageControl' );
      autoPauseCheckbox.id = 'auto-pause-checkbox';

      const btCopyURL = generateElements( '<button>📋</button>', collapsibleContent );
      btCopyURL.classList.add( 'videoPageControl' );
      btCopyURL.onclick = function () {
        const videoId = location.href.match( /\/(watch\?v=.{11})/ )[ 1 ];
        GM_setClipboard( `https://www.youtube.com/${ videoId }` );
      };

      const btExpandRelated = generateElements( '<button>↖️</button>', collapsibleContent );
      btExpandRelated.classList.add( 'videoPageControl' );
      btExpandRelated.addEventListener( 'click', function () {
        const relatedSection = document.querySelector( `#columns > #secondary > #secondary-inner > #related` );
        console.log( relatedSection[ 0 ] );
        document.querySelector( 'ytd-app' ).prepend( relatedSection );
        GM_addStyle( `
                        #masthead-container { position : unset }
                        #related #contents  {
                            flex-wrap: wrap;
                            display  : flex;
                        }
                        #related #contents > * { width: 25% }
                ` );
        relatedSection[ 0 ].scrollIntoView();
      } );

    }
  }

} )();