function getYoutubeAPI() {
  let API_KEY = GM_getValue('apiKey', '');
  if (API_KEY) return API_KEY;

  API_KEY = prompt('Please enter your YouTube API key:');
  if (!API_KEY) return;

  GM_setValue('apiKey', API_KEY);
  return API_KEY;
}

function getVideoId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('v');
}

const youtubeApiResponseCache = new Map();
const youtubeVideoResponseCache = new Map();

/**
 * Logs a failed YouTube data source without interrupting the next fallback.
 *
 * @param {string} source The data source that failed.
 * @param {Error|string} error The failure that was reported.
 * @returns {void}
 * @example
 * logYoutubeDataSourceError('watch page', new Error('Request failed'));
 */
function logYoutubeDataSourceError(source, error) {
  return;
  console.error(`[YouTube] Failed to fetch data from ${source}:`, error);
}

/**
 * Requests text through the userscript manager and validates the response.
 *
 * @param {string} url The URL to request.
 * @returns {Promise<string>} The response body.
 * @throws {Error} If the request is unavailable, fails, or has an invalid response.
 * @example
 * const html = await fetchYoutubeText('https://www.youtube.com/watch?v=videoId');
 */
async function fetchYoutubeText(url) {
  if (typeof GMXmlHttpRequestAsync !== 'function') {
    throw new Error('GMXmlHttpRequestAsync is unavailable');
  }

  const response = await GMXmlHttpRequestAsync(url);
  if (
    response &&
    typeof response.status === 'number' &&
    response.status >= 400
  ) {
    throw new Error(`Request failed with HTTP ${response.status}`);
  }
  const text =
    typeof response === 'string'
      ? response
      : response?.responseText || response?.response;

  if (typeof text !== 'string' || !text.trim()) {
    throw new Error(`Empty response received from ${url}`);
  }

  return text;
}

/**
 * Extracts a JSON object assigned to a YouTube page bootstrap variable.
 *
 * @param {string} html The YouTube page HTML.
 * @param {string} variableName The bootstrap variable name.
 * @returns {Object|null} The parsed object, or null when it is absent or invalid.
 * @example
 * const player = parseYoutubeBootstrapData(html, 'ytInitialPlayerResponse');
 */
function parseYoutubeBootstrapData(html, variableName) {
  const marker = `var ${variableName} = `;
  const markerIndex = html.indexOf(marker);
  if (markerIndex < 0) return null;

  const jsonStart = markerIndex + marker.length;
  const jsonEnd = html.indexOf(';</script>', jsonStart);
  if (jsonEnd < 0) return null;

  try {
    return JSON.parse(html.slice(jsonStart, jsonEnd));
  } catch (error) {
    logYoutubeDataSourceError(`${variableName} parser`, error);
    return null;
  }
}

/**
 * Converts watch-page bootstrap data into the API response shape used here.
 *
 * @param {string} videoId The YouTube video ID.
 * @returns {Promise<Object>} A video response containing the available metadata.
 * @throws {Error} If the watch page does not contain usable video metadata.
 * @example
 * const video = await fetchVideoDetailsFromWatchPage('dQw4w9WgXcQ');
 */
async function fetchVideoDetailsFromWatchPage(videoId) {
  const html = await fetchYoutubeText(
    `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`,
  );
  const playerResponse = parseYoutubeBootstrapData(
    html,
    'ytInitialPlayerResponse',
  );
  const videoDetails = playerResponse?.videoDetails;

  if (!videoDetails?.videoId || videoDetails.videoId !== videoId) {
    throw new Error('Watch page did not contain usable video details');
  }

  const microformat =
    playerResponse.microformat?.playerMicroformatRenderer || {};
  const snippet = {
    channelId: videoDetails.channelId,
    title: videoDetails.title,
    tags: videoDetails.keywords,
    categoryId: videoDetails.categoryId || microformat.categoryId,
  };

  return { items: [{ snippet }] };
}

/**
 * Adds title and channel metadata from YouTube's public oEmbed endpoint.
 *
 * @param {string} videoId The YouTube video ID.
 * @param {Object} videoResponse The partially populated video response.
 * @returns {Promise<Object>} The enriched video response.
 * @throws {Error} If the oEmbed response cannot be parsed.
 * @example
 * const video = await enrichVideoDetailsWithOembed('dQw4w9WgXcQ', response);
 */
async function enrichVideoDetailsWithOembed(videoId, videoResponse) {
  const responseText = await fetchYoutubeText(
    `https://www.youtube.com/oembed?url=${encodeURIComponent(
      `https://www.youtube.com/watch?v=${videoId}`,
    )}&format=json`,
  );
  const oembed = JSON.parse(responseText);
  const snippet = videoResponse.items[0].snippet;

  snippet.title ||= oembed.title;
  snippet.channelTitle ||= oembed.author_name;
  return videoResponse;
}

/**
 * Fetches the public oEmbed metadata for a video.
 *
 * @param {string} videoId The YouTube video ID.
 * @returns {Promise<Object>} A video response containing oEmbed metadata.
 * @throws {Error} If the oEmbed response cannot be fetched or parsed.
 * @example
 * const video = await fetchVideoDetailsFromOembed('dQw4w9WgXcQ');
 */
async function fetchVideoDetailsFromOembed(videoId) {
  const responseText = await fetchYoutubeText(
    `https://www.youtube.com/oembed?url=${encodeURIComponent(
      `https://www.youtube.com/watch?v=${videoId}`,
    )}&format=json`,
  );
  const oembed = JSON.parse(responseText);
  if (!oembed.title) throw new Error('oEmbed response did not contain a title');

  return {
    items: [
      {
        snippet: {
          title: oembed.title,
          channelTitle: oembed.author_name,
          tags: [],
        },
      },
    ],
  };
}

/**
 * Fetches and caches a YouTube API response for the current page session.
 *
 * @param {string} apiUrl The complete YouTube API URL.
 * @returns {Promise<Object>} The parsed API response.
 * @throws {Error} If the response is not valid JSON or the request fails.
 * @example
 * const videoData = await fetchYoutubeApi(
 *   'https://www.googleapis.com/youtube/v3/videos?...',
 * );
 */
async function fetchYoutubeApi(apiUrl) {
  if (!youtubeApiResponseCache.has(apiUrl)) {
    const request = GMXmlHttpRequestAsync(apiUrl)
      .then(response => {
        const responseText =
          typeof response === 'string'
            ? response
            : response?.responseText || response?.response;
        if (response?.status >= 400) {
          throw new Error(
            `YouTube API request failed with HTTP ${response.status}`,
          );
        }
        if (!responseText)
          throw new Error('YouTube API returned an empty response');
        return JSON.parse(responseText);
      })
      .catch(error => {
        youtubeApiResponseCache.delete(apiUrl);
        logYoutubeDataSourceError('YouTube API', error);
        throw error;
      });

    youtubeApiResponseCache.set(apiUrl, request);
  }

  return youtubeApiResponseCache.get(apiUrl);
}

/**
 * Fetches channel details, reusing the current session's cached response.
 *
 * @param {string} channelId The YouTube channel ID.
 * @param {string} API_KEY The YouTube API key.
 * @returns {Promise<Object>} The channel API response.
 * @example
 * const channel = await fetchChannelDetails(channelId, API_KEY);
 */
async function fetchChannelDetails(channelId, API_KEY) {
  const apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,brandingSettings&id=${channelId}&key=${API_KEY}`;
  return fetchYoutubeApi(apiUrl);
}

/**
 * Fetches video details, reusing the current session's cached response.
 *
 * @param {string} videoId The YouTube video ID.
 * @param {string} API_KEY The YouTube API key.
 * @returns {Promise<Object>} The video API response.
 * @example
 * const video = await fetchVideoDetails(videoId, API_KEY);
 */
async function fetchVideoDetails(videoId, API_KEY) {
  if (!youtubeVideoResponseCache.has(videoId)) {
    const request = (async () => {
      let watchPageResponse;
      try {
        watchPageResponse = await fetchVideoDetailsFromWatchPage(videoId);
      } catch (error) {
        logYoutubeDataSourceError('watch page', error);
      }

      if (watchPageResponse) {
        try {
          return await enrichVideoDetailsWithOembed(videoId, watchPageResponse);
        } catch (error) {
          logYoutubeDataSourceError('oEmbed endpoint', error);
          return watchPageResponse;
        }
      }

      try {
        return await fetchVideoDetailsFromOembed(videoId);
      } catch (error) {
        logYoutubeDataSourceError('oEmbed endpoint', error);
      }

      if (!API_KEY) {
        throw new Error(
          'YouTube API key is required after public sources failed',
        );
      }

      const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${encodeURIComponent(videoId)}&key=${encodeURIComponent(API_KEY)}`;
      return fetchYoutubeApi(apiUrl);
    })().catch(error => {
      youtubeVideoResponseCache.delete(videoId);
      console.error(`[YouTube] Could not resolve video ${videoId}:`, error);
      throw error;
    });

    youtubeVideoResponseCache.set(videoId, request);
  }

  return youtubeVideoResponseCache.get(videoId);
}

async function getChannelId(videoId, API_KEY) {
  const data = await fetchVideoDetails(videoId, API_KEY);
  let channelId = data.items?.[0]?.snippet?.channelId;
  if (!channelId && API_KEY) {
    try {
      const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${encodeURIComponent(videoId)}&key=${encodeURIComponent(API_KEY)}`;
      const apiData = await fetchYoutubeApi(apiUrl);
      channelId = apiData.items?.[0]?.snippet?.channelId;
    } catch (error) {
      logYoutubeDataSourceError('channel ID API fallback', error);
    }
  }
  if (!channelId) throw new Error(`No channel ID found for video ${videoId}`);

  return channelId;
}

async function getVideoCategoryAndTags(videoId, categories, API_KEY) {
  let data = await fetchVideoDetails(videoId, API_KEY);
  let snippet = data.items?.[0]?.snippet;
  if (!snippet) throw new Error(`No metadata found for video ${videoId}`);

  if (!snippet.categoryId && API_KEY) {
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${encodeURIComponent(videoId)}&key=${encodeURIComponent(API_KEY)}`;
    try {
      data = await fetchYoutubeApi(apiUrl);
      snippet = data.items?.[0]?.snippet;
    } catch (error) {
      logYoutubeDataSourceError('video category API fallback', error);
    }
  }

  const categoryId = snippet?.categoryId;
  const category = categoryId ? categories[categoryId] : undefined;
  const tags = snippet?.tags || [];
  const result = { category, tags };

  return result;
}

async function fetchCategories(regionCode, API_KEY) {
  const apiUrl = `https://www.googleapis.com/youtube/v3/videoCategories?part=snippet&regionCode=${regionCode}&key=${API_KEY}`;
  const data = await fetchYoutubeApi(apiUrl);

  const categories = {};
  if (data.items && data.items.length > 0) {
    data.items.forEach(category => {
      categories[category.id] = category.snippet.title;
    });
  }

  return categories;
}

async function getChannelCountryOfOrigin(channelId, API_KEY) {
  const data = await fetchChannelDetails(channelId, API_KEY);
  let country = 'Country not specified';

  if (data.items && data.items.length > 0) {
    // Try to get country from brandingSettings first
    if (
      data.items[0].brandingSettings &&
      data.items[0].brandingSettings.channel &&
      data.items[0].brandingSettings.channel.country
    ) {
      country = data.items[0].brandingSettings.channel.country;
    }
    // Fallback to snippet.country if available
    else if (data.items[0].snippet && data.items[0].snippet.country) {
      country = data.items[0].snippet.country;
    }
  } else {
    country = 'Channel not found';
  }

  return country;
}
