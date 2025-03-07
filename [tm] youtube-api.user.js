( function () {
  'use strict';
  if ( window.top != window.self ) return; //don't run on frames or iframes

  const API_KEY = getYoutubeAPI();

  window.addEventListener( 'yt-navigate-finish', async () => {

    const titleEl = await waitFor( `#title.style-scope.ytd-watch-metadata` );
    if ( !titleEl ) return;
    const videoId = getVideoId();
    const channelId = await getChannelId( videoId, API_KEY );
    const countryOfOrigin = await getChannelCountryOfOrigin( channelId, API_KEY );
    const flagEmojiChar = countryCodeToFlag( countryOfOrigin );

    titleEl.querySelector( `#country-flag` )?.remove();
    const flagEl = generateElements( `<span id=country-flag></span>` );
    titleEl.prepend( flagEl );
    flagEl.textContent = flagEmojiChar;
    flagEl.style.marginRight = '0.5em';
    titleEl.style.justifyContent = 'unset';

  } );

  function countryCodeToFlag ( countryCode ) {
    // Validate input
    if ( typeof countryCode !== 'string' || countryCode.length !== 2 ) {
      throw new Error( 'Country code must be a 2-character string' );
    }

    // Convert country code to uppercase
    const code = countryCode.toUpperCase();

    // Convert each letter to the corresponding regional indicator symbol
    // Regional indicator symbols start at code point U+1F1E6 for 'A'
    // The offset from 'A' (ASCII 65) to U+1F1E6 is 127397
    const offset = 127397;
    const firstChar = code.charCodeAt( 0 ) + offset;
    const secondChar = code.charCodeAt( 1 ) + offset;

    // Convert code points to emoji flag
    return String.fromCodePoint( firstChar ) + String.fromCodePoint( secondChar );
  }


} )();