( function () {
  'use strict';

  const API_KEY = 'AIzaSyB41uuRwzZyKBJcMPr-kyNwXBpeOcESOpU';  // Replace this with your YouTube API Key

  waitFor( `#video-controlPanel` ).then( ( el ) => {
    el.style.top = '0px';
    el.style.left = '160px';
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

        :is(
            ytd-rich-item-renderer,
            ytd-compact-video-renderer,
            ytd-video-renderer,
            ytd-playlist-video-renderer > #content
        ):hover > #buttonsContainer { display: flex }
        #buttonsContainer { display: none }

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

  const queryForThumbEls = 'ytd-video-renderer, ytd-compact-video-renderer, ytd-rich-item-renderer, ytd-playlist-video-renderer > #content';
  waitForEach( queryForThumbEls, ( thumbEl ) => {
    const buttonsContainer = generateElements( `<div id=buttonsContainer></div>` );
    thumbEl.append( buttonsContainer );
    buttonsContainer.style = 'position: absolute; left: 5px; top: 5px;';
  } );

  //* Toggle sidebar
  waitFor( '#guide[opened]' ).then( () => { $( `#guide-button.ytd-masthead` ).click(); } );

  //* channel names to a els
  waitForEach( '#buttonsContainer', async ( buttonsContainerEl ) => {

    const videoLinkEl = buttonsContainerEl.parentElement.querySelector( 'a' );
    if ( !videoLinkEl ) return;
    const videoUrl = videoLinkEl.href;
    const videoId = videoUrl.match( /\/watch\?v=(.{11})/ )[ 1 ];
    if ( !videoId ) return;

    const channelId = await getChannelId( videoId, API_KEY );
    const channelUrl = `https://www.youtube.com/channel/${ channelId }/videos`;

    const newEl = generateElements( `<a>📂</a>`, buttonsContainerEl );
    console.log( newEl );
    newEl.href = channelUrl;
    newEl.target = '_blank';
    style( newEl, `
            color: inherit;
            text-decoration: none;
        `);

  } );

  //* reddit links
  waitForEach( `[href^="https://www.reddit"], [href^="https://reddit"]`, ( linkEl ) => {
    linkEl.href = linkEl.href.replace( 'https://reddit', 'https://old.reddit' );
    linkEl.href = linkEl.href.replace( 'https://www.reddit', 'https://old.reddit' );
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