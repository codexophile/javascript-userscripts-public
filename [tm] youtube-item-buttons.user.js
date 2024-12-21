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

    thumbEl.addEventListener( 'mouseover', () => {

    } );

  } );

  function addHighResThumbButton ( thumbEl, parentEl ) {

    const btnEl = generateElements( `<a>🖼️</a>` );
    btnEl.id = 'peekFullResThumb';
    btnEl.target = '_blank';
    parentEl.append( btnEl );
    setHref();

    btnEl.addEventListener( 'mouseover', setHref );

    function setHref () {
      btnEl.textContent = '⏳';
      const videoLink = thumbEl.querySelector( 'a' );
      const videoId = getVideoIdFromLink( videoLink );
      const fullResSrc = `https://i.ytimg.com/vi_webp/${ videoId }/maxresdefault.webp`;
      btnEl.href = fullResSrc;
      btnEl.textContent = '🖼️';
    }

  }

  async function addVideosButton ( thumbEl, parentEl ) {

    const newEl = generateElements( `<a>Vid</a>`, parentEl );
    newEl.target = '_blank';
    style( newEl, `
      text-decoration: none;
    `);
    setHref();

    newEl.addEventListener( 'mouseover', setHref );

    async function setHref () {
      newEl.textContent = '⏳';
      const linkToChannel = await getLinkToChannel( thumbEl );
      const linkToVideos = `${ linkToChannel }/videos`;
      newEl.href = linkToVideos;
      newEl.textContent = 'Vid';
    }

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
    GM_addStyle( `
      #buttonsContainer { display: none; }
      :is(${ queryForThumbEls }):hover #buttonsContainer { display: flex; }
    ` );
    return buttonsContainer;
  }

  function getVideoIdFromLink ( linkEl ) {
    const videoUrl = linkEl.href;
    const matches = videoUrl.match( /\/watch\?v=(.{11})/ );
    if ( !matches ) return;
    return matches[ 1 ];
  }

} )();