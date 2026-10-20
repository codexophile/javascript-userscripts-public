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
      .then(response => JSON.parse(response))
      .catch(error => {
        youtubeApiResponseCache.delete(apiUrl);
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
  const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${API_KEY}`;
  return fetchYoutubeApi(apiUrl);
}

async function getChannelId(videoId, API_KEY) {
  const data = await fetchVideoDetails(videoId, API_KEY);
  const channelId = data.items[0].snippet.channelId;

  return channelId;
}

async function getVideoCategoryAndTags(videoId, categories, API_KEY) {
  const data = await fetchVideoDetails(videoId, API_KEY);
  const categoryId = data.items[0].snippet.categoryId;
  const category = categories[categoryId];
  const tags = data.items[0].snippet.tags;
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
