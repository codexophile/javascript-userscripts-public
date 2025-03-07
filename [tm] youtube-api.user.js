( function () {
  'use strict';
  if ( window.top != window.self ) return; //don't run on frames or iframes

  const API_KEY = getYoutubeAPI();

  waitForEach( '#title.style-scope.ytd-watch-metadata', async titleEl => {

    const videoId = getVideoId();
    const channelId = await getChannelId( videoId, API_KEY );
    const countryOfOrigin = await getChannelCountryOfOrigin( channelId, API_KEY );

    const flagEl = generateElements( `<span></span>` );
    titleEl.prepend( flagEl );
    flagEl.textContent = countryOfOrigin;
    flagEl.style.marginRight = '0.5em';
    titleEl.style.justifyContent = 'unset';

  } );


} )();