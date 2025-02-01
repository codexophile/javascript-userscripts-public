( function () {
  'use strict';
  if ( window.top != window.self ) return; // Don't run on frames or iframes

  const regionCode = 'US';  // Adjust this according to your preferred region

  main();

  async function main () {
    let API_KEY = GM_getValue( 'apiKey', '' );

    if ( !API_KEY ) {
      API_KEY = prompt( 'Please enter your YouTube API key:' );
      if ( API_KEY ) {
        GM_setValue( 'apiKey', API_KEY );
      } else {
        alert( 'API key is required to run this script.' );
        return;
      }
    }

    const videoId = getVideoId();
    if ( !videoId ) return;
    if ( document.title.includes( '{category:' ) ) return;

    try {
      const categories = await fetchCategories( regionCode, API_KEY );
      const categoryAndTags = await getVideoCategoryAndTags( videoId, categories, API_KEY );
      const newContent = JSON.stringify( categoryAndTags ).replaceAll( '"', '' );
      const videoTitleEl = await waitFor( '#title.ytd-watch-metadata yt-formatted-string' );
      const videoTitle = videoTitleEl.innerText;
      const newTitle = `${ videoTitle } | ${ newContent }`;
      document.title = newTitle;
    } catch ( error ) {
      alert( error );
    }
  }

  let titleObserver = new MutationObserver( main );
  titleObserver.observe( document.querySelector( 'title' ), { childList: true, subtree: true } );

  function getVideoId () {
    const urlParams = new URLSearchParams( window.location.search );
    return urlParams.get( 'v' );
  }

  async function fetchCategories ( regionCode, apiKey ) {
    const url = `https://www.googleapis.com/youtube/v3/videoCategories?part=snippet&regionCode=${ regionCode }&key=${ apiKey }`;
    const response = await fetch( url );
    const data = await response.json();
    return data.items;
  }

  async function getVideoCategoryAndTags ( videoId, categories, apiKey ) {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${ videoId }&key=${ apiKey }`;
    const response = await fetch( url );
    const data = await response.json();
    const categoryId = data.items[ 0 ].snippet.categoryId;
    const category = categories.find( cat => cat.id === categoryId ).snippet.title;
    const tags = data.items[ 0 ].snippet.tags || [];
    return { category, tags };
  }

} )();