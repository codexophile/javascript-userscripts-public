( function () {
  'use strict';
  if ( window.top != window.self ) return; //don't run on frames or iframes

  const API_KEY = getYoutubeAPI();
  const regionCode = 'US';  // Adjust this according to your preferred region

  initializeFetchingAndDisplayingCountryFlags();
  initializeTitleSetter();

  function initializeTitleSetter () {

    main();

    async function main () {

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

  }

  function initializeFetchingAndDisplayingCountryFlags () {
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
      // flagEl.textContent = flagEmojiChar;
      const flagImgUrl = getCountryFlagImage( countryOfOrigin, 'flat', '32' );
      const flagImgEl = generateElements( `<img src="${ flagImgUrl }" alt="${ flagEmojiChar }">` );
      flagEl.append( flagImgEl );

      flagEl.style.marginRight = '0.5em';
      titleEl.style.justifyContent = 'unset';

    } );
  }

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

  function getCountryFlagImage ( countryCode, style = 'flat', size = '64' ) {
    // Validate input
    if ( typeof countryCode !== 'string' || countryCode.length !== 2 ) {
      throw new Error( 'Country code must be a 2-character string' );
    }

    // Convert to lowercase for API
    const code = countryCode.toLowerCase();

    // Validate style
    const validStyles = [ 'flat', 'shiny' ];
    if ( !validStyles.includes( style ) ) {
      throw new Error( 'Style must be either "flat" or "shiny"' );
    }

    // Validate size
    const validSizes = [ '16', '24', '32', '48', '64', '128' ];
    if ( !validSizes.includes( size ) ) {
      throw new Error( 'Size must be one of 16, 24, 32, 48, 64, or 128' );
    }

    // Use the free flagsapi.com service
    return `https://flagsapi.com/${ code.toUpperCase() }/${ style }/${ size }.png`;
  }


} )();