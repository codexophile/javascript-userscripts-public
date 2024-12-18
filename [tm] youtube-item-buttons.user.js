( function () {
  'use strict';
  if ( window.top != window.self ) return; //don't run on frames or iframes

  const API_KEY = 'AIzaSyB41uuRwzZyKBJcMPr-kyNwXBpeOcESOpU';
  const thumbElSelectorsArr = [
    'ytd-video-renderer',
    'ytd-compact-video-renderer',
    'ytd-rich-item-renderer',
    'ytd-playlist-video-renderer > #content' ];
  const queryForThumbEls = thumbElSelectorsArr.join( ', ' );

  waitForEach( queryForThumbEls, ( thumbEl ) => {
    const buttonsContainerEl = createButtonsContainer( thumbEl );
    if ( !location.href.match( /\/@|\/channel\// ) )
      addVideosButton( thumbEl, buttonsContainerEl );
    addHighResThumbButton( thumbEl, buttonsContainerEl );
  } );

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

  async function addVideosButton ( thumbEl, parentEl ) {
    const linkToChannel = await getLinkToChannel( thumbEl );
    const linkToVideos = `${ linkToChannel }/videos`;
    const newEl = generateElements( `<a>Vid</a>`, parentEl );
    newEl.href = linkToVideos;
    newEl.target = '_blank';
    style( newEl, `
      text-decoration: none;
    `);
    return newEl;
  }

  async function getLinkToChannel ( thumbEl ) {
    const linkToChannelEl = thumbEl.querySelector( '[href^="https://www.youtube.com/@"]' );
    if ( linkToChannelEl ) {
      const matches = linkToChannelEl.href.match( /@(.+?)(\/|$)/ );
      if ( !matches ) return null;
      return `https://www.youtube.com/@${ matches[ 1 ] }`;
    }
    const videoLinkEl = thumbEl.querySelector( 'a' );
    if ( !videoLinkEl ) return null;
    const videoId = getVideoIdFromLink( videoLinkEl );
    const channelId = await getChannelId( videoId, API_KEY );
    return `https://www.youtube.com/channel/${ channelId }`;
  }

  function createButtonsContainer ( parent ) {
    const buttonsContainer = generateElements( `<div id=buttonsContainer></div>` );
    parent.append( buttonsContainer );
    buttonsContainer.style = 'position: absolute; left: 5px; top: 5px;';
    return buttonsContainer;
  }

  function getVideoIdFromLink ( linkEl ) {
    const videoUrl = linkEl.href;
    const matches = videoUrl.match( /\/watch\?v=(.{11})/ );
    if ( !matches ) return;
    return matches[ 1 ];
  }

} )();