function getYoutubeAPI () {
  let API_KEY = GM_getValue( 'apiKey', '' );
  if ( API_KEY ) return API_KEY;

  API_KEY = prompt( 'Please enter your YouTube API key:' );
  if ( !API_KEY ) return;

  GM_setValue( 'apiKey', API_KEY );
  return API_KEY;
}

function getVideoId () {
  const urlParams = new URLSearchParams( window.location.search );
  return urlParams.get( 'v' );
}

async function fetchChannelDetails ( channelId, API_KEY ) {
  // Check cache first
  const cacheKey = `channelDetails_${ channelId }`;
  const cachedData = GM_getValue( cacheKey, null );

  if ( cachedData ) {
    try {
      const { data, timestamp } = JSON.parse( cachedData );
      // Cache valid for 24 hours (86400000 ms)
      if ( Date.now() - timestamp < 86400000 ) {
        return data;
      }
    } catch ( e ) {
      // Invalid cache data, continue to fetch
    }
  }

  const apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,brandingSettings&id=${ channelId }&key=${ API_KEY }`;
  const response = await GMXmlHttpRequestAsync( apiUrl );
  const data = JSON.parse( response );

  // Save to cache with timestamp
  GM_setValue( cacheKey, JSON.stringify( {
    data,
    timestamp: Date.now()
  } ) );

  return data;
}

async function fetchVideoDetails ( videoId, API_KEY ) {
  // Check cache first
  const cacheKey = `videoDetails_${ videoId }`;
  const cachedData = GM_getValue( cacheKey, null );

  if ( cachedData ) {
    try {
      const { data, timestamp } = JSON.parse( cachedData );
      // Cache valid for 6 hours (21600000 ms)
      if ( Date.now() - timestamp < 21600000 ) {
        return data;
      }
    } catch ( e ) {
      // Invalid cache data, continue to fetch
    }
  }

  const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${ videoId }&key=${ API_KEY }`;
  const response = await GMXmlHttpRequestAsync( apiUrl );
  const data = JSON.parse( response );

  // Save to cache with timestamp
  GM_setValue( cacheKey, JSON.stringify( {
    data,
    timestamp: Date.now()
  } ) );

  return data;
}

async function getChannelId ( videoId, API_KEY ) {
  // Check cache first
  const cacheKey = `channelId_${ videoId }`;
  const cachedChannelId = GM_getValue( cacheKey, null );

  if ( cachedChannelId ) {
    return cachedChannelId;
  }

  const data = await fetchVideoDetails( videoId, API_KEY );
  const channelId = data.items[ 0 ].snippet.channelId;

  // Cache the channel ID (this rarely changes, so longer expiration)
  GM_setValue( cacheKey, channelId );

  return channelId;
}

async function getVideoCategoryAndTags ( videoId, categories, API_KEY ) {
  // Check cache first
  const cacheKey = `categoryAndTags_${ videoId }`;
  const cachedData = GM_getValue( cacheKey, null );

  if ( cachedData ) {
    try {
      const { data, timestamp } = JSON.parse( cachedData );
      // Cache valid for 6 hours (21600000 ms)
      if ( Date.now() - timestamp < 21600000 ) {
        return data;
      }
    } catch ( e ) {
      // Invalid cache data, continue to fetch
    }
  }

  const data = await fetchVideoDetails( videoId, API_KEY );
  const categoryId = data.items[ 0 ].snippet.categoryId;
  const category = categories[ categoryId ];
  const tags = data.items[ 0 ].snippet.tags;
  const result = { category, tags };

  // Save to cache with timestamp
  GM_setValue( cacheKey, JSON.stringify( {
    data: result,
    timestamp: Date.now()
  } ) );

  return result;
}

async function fetchCategories ( regionCode, API_KEY ) {
  // Check cache first
  const cacheKey = `categories_${ regionCode }`;
  const cachedData = GM_getValue( cacheKey, null );

  if ( cachedData ) {
    try {
      const { data, timestamp } = JSON.parse( cachedData );
      // Cache valid for 7 days (604800000 ms) as categories rarely change
      if ( Date.now() - timestamp < 604800000 ) {
        return data;
      }
    } catch ( e ) {
      // Invalid cache data, continue to fetch
    }
  }

  const apiUrl = `https://www.googleapis.com/youtube/v3/videoCategories?part=snippet&regionCode=${ regionCode }&key=${ API_KEY }`;
  const response = await GMXmlHttpRequestAsync( apiUrl );
  const data = JSON.parse( response );

  const categories = {};
  if ( data.items && data.items.length > 0 ) {
    data.items.forEach( category => {
      categories[ category.id ] = category.snippet.title;
    } );
  }

  // Save to cache with timestamp
  GM_setValue( cacheKey, JSON.stringify( {
    data: categories,
    timestamp: Date.now()
  } ) );

  return categories;
}

async function getChannelCountryOfOrigin ( channelId, API_KEY ) {
  // Check cache first
  const cacheKey = `channelCountry_${ channelId }`;
  const cachedCountry = GM_getValue( cacheKey, null );

  if ( cachedCountry ) {
    try {
      const { data, timestamp } = JSON.parse( cachedCountry );
      // Cache valid for 30 days (2592000000 ms) as channel country rarely changes
      if ( Date.now() - timestamp < 2592000000 ) {
        return data;
      }
    } catch ( e ) {
      // Invalid cache data, continue to fetch
    }
  }

  const data = await fetchChannelDetails( channelId, API_KEY );
  let country = "Country not specified";

  if ( data.items && data.items.length > 0 ) {
    // Try to get country from brandingSettings first
    if ( data.items[ 0 ].brandingSettings &&
      data.items[ 0 ].brandingSettings.channel &&
      data.items[ 0 ].brandingSettings.channel.country ) {
      country = data.items[ 0 ].brandingSettings.channel.country;
    }
    // Fallback to snippet.country if available
    else if ( data.items[ 0 ].snippet && data.items[ 0 ].snippet.country ) {
      country = data.items[ 0 ].snippet.country;
    }
  } else {
    country = "Channel not found";
  }

  // Save to cache with timestamp
  GM_setValue( cacheKey, JSON.stringify( {
    data: country,
    timestamp: Date.now()
  } ) );

  return country;
}