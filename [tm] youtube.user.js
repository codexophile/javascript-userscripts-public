( function () {
  'use strict';

  const API_KEY = getYoutubeAPI();

  waitFor( `#video-controlPanel` ).then( ( el ) => {
    el.style.top = '0px';
    el.style.left = '260px';
  } );

  fixUrl();
  window.addEventListener( 'urlchange', fixUrl );


  function fixUrl () {

    const locationHref = location.href;
    const liveOrShortMatch = locationHref.match( /\/(shorts|live)\// );

    if ( liveOrShortMatch ) {
      let href = location.href;
      href = href.replace( liveOrShortMatch[ 0 ], '/watch?v=' );
      stopAndChangeUrl( href );
    }

    //? regex -> https://www.youtube.com/watch
    if ( locationHref.match( /https:\/\/www\.youtube\.com\/watch/ ) ) {
      // if ( !locationHref.match( /https:\/\/www\.youtube\.com\/(watch\?v=...........)?$/ ) ) {

      const videoID = locationHref.match( /[\?&]v=(...........)/ )[ 1 ];

      let hashSlots = locationHref.match( /#slot=\d+?($|#)/ );
      hashSlots = hashSlots ? hashSlots[ 0 ] : '';
      const newUrl = `https://www.youtube.com/watch?v=${ videoID }${ hashSlots }`;

      if ( location.href !== newUrl ) {
        history.pushState( { state: 1 }, "new state", newUrl );
      }
      // stopAndChangeUrl( `https://www.youtube.com/watch?v=${ videoID }` )
    }

  }

  //* Auto pause on losing focus
  // Auto pause video on losing focus
  ( async function () {
    'use strict';

    // Helper function to check conditions
    const shouldIgnoreEvent = ( requirePaused = false ) => {
      const checkboxEl = document.querySelector( '#auto-pause-checkbox' );
      if ( document.visibilityState === 'hidden' ) return true;
      if ( !checkboxEl ) return true;
      if ( checkboxEl.checked ) return true;
      return requirePaused && video.paused;
    };

    const video = await waitFor( 'video' );
    const autoPauseCheckboxEl = await waitFor( '#auto-pause-checkbox' );
    let autoPaused = false;

    // Event handlers
    const handleBlur = () => {
      if ( shouldIgnoreEvent( true ) ) return;
      video.pause();
      autoPaused = true;
    };

    const handleFocus = () => {
      if ( shouldIgnoreEvent() || !autoPaused ) return;
      video.play();
    };

    const handleVideoClick = () => {
      if ( shouldIgnoreEvent() ) return;
      autoPaused = false;
    };

    // Event listeners
    window.addEventListener( 'blur', handleBlur );
    window.addEventListener( 'focus', handleFocus );
    video.addEventListener( 'click', handleVideoClick );

  } )();

  GM_addStyle( `

        #buttonsContainer { display: flex }

        #buttonsContainer > * {

            width: 30px;
            height: 25px;
            line-height: 25px;
            /* making height = line-height, makes text center vertically */
            text-align: center;
            color: white;
            text-shadow: white 0px 0px 10px;

            display: block;
            border-radius: 4px;
            margin: 1px;
            border: none;
            background-color: #000000;
        }
        #buttonsContainer > *:hover {
        background: #202020;
        }
        #buttonsContainer > *:active {
            transform: matrix( 0.9, 0, 0, 0.9, 0, 2 );
        }
        #peekFullResThumb {
            text-decoration: none;
        }

    ` );

  //* Toggle sidebar
  waitFor( '#guide[opened]' ).then( () => { $( `#guide-button.ytd-masthead` ).click(); } );

  //* reddit links
  waitForEach( `[href^="https://www.reddit"], [href^="https://reddit"]`, ( linkEl ) => {
    linkEl.href = linkEl.href.replace( 'https://reddit', 'https://old.reddit' );
    linkEl.href = linkEl.href.replace( 'https://www.reddit', 'https://old.reddit' );
  } );

  //* video flex fix in 'videos' pages
  //? adding this because stylus css fix doesn't work
  waitForEach( 'ytd-two-column-browse-results-renderer', ( element ) => {
    if ( !location.href.includes( '/videos' ) ) return;
    element.style.width = 'unset !important';
    element.style.maxWidth = 'unset !important';
  } );

  let observer = new MutationObserver( () => {

    //* @channelName links -> @channelName/videos/
    document.querySelectorAll( `[href*='/@']` ).forEach( link => {
      if ( link.href.match( /\/videos\/?$/ ) ) return;
      link.href += '/videos/';
    } );

    //* fixing hrefs

    const shortLinks = document.querySelectorAll( `[href*='/shorts/']` );
    shortLinks.forEach( item => {
      item.href = item.href.replace( '/shorts/', '/watch?v=' );
    } );

    const videoLinks = document.querySelectorAll( `:not(#storyboard) :is([href*="&list="],[href*="&index="],[href*="&pp="],[href*="&t="])` );
    videoLinks.forEach( function ( link ) {
      if ( !link.href ) return; // 🛑
      const matches = link.href.match( /\?v=(.{11})/ );
      if ( !matches ) return; // 🛑
      const videoID = matches[ 1 ];
      link.href = `https://www.youtube.com/watch?v=${ videoID }`;
    } );

  } );
  // const peekParentQuery = `ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, ytd-reel-item-renderer, #thumbnail`
  observer.observe( document.body, { childList: true, subtree: true } );

  function stopAndChangeUrl ( url ) {
    window.stop();
    location.replace( url );
  }

} )();