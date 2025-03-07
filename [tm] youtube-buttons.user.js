( async function () {
  'use strict';

  window.addEventListener( 'urlchange', () => { main(); } );

  const collapsibleContent = await waitFor( '.collapsible-content' );

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


    }
  }

} )();