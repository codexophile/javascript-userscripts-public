( function () {
  'use strict';
  if ( window.top != window.self ) return; //don't run on frames or iframes

  const API_KEY = 'AIzaSyB41uuRwzZyKBJcMPr-kyNwXBpeOcESOpU';

  const queryForThumbEls = 'ytd-video-renderer, ytd-compact-video-renderer, ytd-rich-item-renderer, ytd-playlist-video-renderer > #content';
  waitForEach( queryForThumbEls, ( thumbEl ) => {
    const buttonsContainerEl = createButtonsContainer( thumbEl );
    addVideosButton( thumbEl, buttonsContainerEl );
    addHighResThumbButton( thumbEl, buttonsContainerEl );
  } );

  function createButtonsContainer ( parent ) {
    const buttonsContainer = generateElements( `<div id=buttonsContainer></div>` );
    parent.append( buttonsContainer );
    buttonsContainer.style = 'position: absolute; left: 5px; top: 5px;';
    return buttonsContainer;
  }

  function addHighResThumbButton ( thumbEl, parentEl ) {
    const videoLink = thumbEl.querySelector( 'a' );
    const videoId = getVideoIdFromLink( videoLink );
    const fullResSrc = `https://i.ytimg.com/vi_webp/${ videoId }/maxresdefault.webp`;
    const btnEl = generateElements( `<a >🖼️</a>` );
    btnEl.id = 'peekFullResThumb';
    btnEl.href = fullResSrc;
    btnEl.target = '_blank';
    parentEl.append( btnEl );
  }

  function getVideoIdFromLink ( linkEl ) {
    const videoUrl = linkEl.href;
    const matches = videoUrl.match( /\/watch\?v=(.{11})/ );
    if ( !matches ) return;
    return matches[ 1 ];
  }

  async function addVideosButton ( thumbEl, parentEl ) {

    const videoLinkEl = thumbEl.querySelector( 'a' );
    if ( !videoLinkEl ) return;

    const videoId = getVideoIdFromLink( videoLinkEl );
    const channelId = await getChannelId( videoId, API_KEY );
    const channelUrl = `https://www.youtube.com/channel/${ channelId }/videos`;

    const newEl = generateElements( `<a>Vid</a>`, parentEl );
    newEl.href = channelUrl;
    newEl.target = '_blank';
    style( newEl, `
      text-decoration: none;
    `);

  }

} )();