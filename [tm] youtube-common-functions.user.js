function isAYoutubeUrl(url) {
  return !!url.match(/(www|m)\.youtube\.com\//);
}

function isAYoutubeChannelUrl(url) {
  const result = isAYoutubeUrl(url) && new URL(url).pathname.startsWith('/@');
  return result;
}

function isAYoutubeVideoUrl(url) {
  const isYoutube = isAYoutubeUrl(url);
  const urlObj = new URL(url);
  const searchObj = new URLSearchParams(urlObj.search);
  return isYoutube && searchObj.has('v');
}

function generateAllYouTubeSbUrls(fullYTHtml) {
  //# Based on:
  // https://github.com/hjk789/Userscripts/tree/master/YouTube-Clickbait-Buster
  // Enhanced with dynamic quality selection from iG8R/YouTube-Mouseover-Preview

  try {
    const resText = fullYTHtml;
    const fullStoryboardURL = resText.match(
      /"playerStoryboardSpecRenderer":.+?"spec":"(.+?)"/,
    );

    if (!fullStoryboardURL) {
      console.warn('[YT-Storyboard] No storyboard spec found');
      return { allUrls: [], trueNoOfSlots: 0, samplingFq: 0 };
    }

    const rawSpecStr = fullStoryboardURL[1];

    // Check for ad storyboards
    if (rawSpecStr.includes('googleadservices')) {
      console.warn(
        '[YT-Storyboard] Ad storyboard detected, not video storyboard',
      );
      return { allUrls: [], trueNoOfSlots: 0, samplingFq: 0 };
    }

    // Parse storyboard spec format: URL|Level0Data|Level1Data|Level2Data|...
    const parts = rawSpecStr.split('|');
    const urlBase = parts[0]; // The URL template

    if (parts.length < 2) {
      console.warn('[YT-Storyboard] Invalid storyboard format');
      return { allUrls: [], trueNoOfSlots: 0, samplingFq: 0 };
    }

    // --- DYNAMIC QUALITY SELECTION: Find the highest resolution level ---
    let bestData = null;
    let bestRes = 0;
    let bestIndex = 0;

    // Iterate through all quality levels (parts[1] = Level 0, parts[2] = Level 1, etc.)
    for (let i = 1; i < parts.length; i++) {
      const levelStr = parts[i];
      // Format: Width#Height#Count#Cols#Rows#IntervalMs#Name#Signature#...
      const chunks = levelStr.split('#');

      // Need at least: width, height, count, cols, rows, and signature
      if (chunks.length < 5) continue;

      const w = parseInt(chunks[0], 10);
      const h = parseInt(chunks[1], 10);
      const count = parseInt(chunks[2], 10);
      const cols = parseInt(chunks[3], 10);
      const rows = parseInt(chunks[4], 10);
      const sig = chunks[chunks.length - 1]; // Signature is always last

      if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) continue;

      const res = w * h; // Calculate resolution

      // Select the highest resolution available
      if (res > bestRes) {
        bestRes = res;
        bestIndex = i - 1; // Level index for URL (parts[0] is URL, so subtract 1)
        bestData = {
          width: w,
          height: h,
          frameCount: count,
          cols: cols,
          rows: rows,
          signature: sig,
        };
      }
    }

    if (!bestData) {
      console.warn('[YT-Storyboard] No valid quality level found');
      return { allUrls: [], trueNoOfSlots: 0, samplingFq: 0 };
    }

    console.log(
      `[YT-Storyboard] Selected Level ${bestIndex}: ${bestData.width}x${bestData.height}px`,
    );

    // Construct the URL with the best quality level
    let baseUrl = urlBase.replace(/\\/g, '').replace('$L', bestIndex);

    // Append signature parameter
    if (baseUrl.indexOf('?') === -1) {
      baseUrl += `?sigh=${bestData.signature}`;
    } else {
      baseUrl += `&sigh=${bestData.signature}`;
    }

    // Extract video length for sampling frequency calculation
    const lengthMatch = resText.match(/"lengthSeconds":"(\d+)"/);
    if (!lengthMatch) {
      console.warn('[YT-Storyboard] Could not determine video length');
      return { allUrls: [], trueNoOfSlots: 0, samplingFq: 0 };
    }

    const videoLength = parseInt(lengthMatch[1], 10);

    // Calculate sampling frequency based on video length
    const samplingFq =
      videoLength <= 120
        ? 1
        : videoLength <= 300
          ? 2
          : videoLength < 900
            ? 5
            : 10;

    const trueNoOfSlots = Math.round(videoLength / samplingFq);

    // Calculate number of storyboard sheets needed
    const framesPerSheet = bestData.cols * bestData.rows;
    const numSheets = Math.ceil(bestData.frameCount / framesPerSheet);

    // Generate all storyboard URLs
    let allUrls = [];
    for (let i = 0; i < numSheets; i++) {
      const url = baseUrl.replace('$N', `M${i}`);
      allUrls.push(url);
    }

    console.log(
      `[YT-Storyboard] Generated ${allUrls.length} URLs for ${trueNoOfSlots} slots (${bestData.cols}x${bestData.rows} grid)`,
    );

    return {
      allUrls,
      trueNoOfSlots,
      samplingFq,
      quality: { width: bestData.width, height: bestData.height },
      framesPerSheet,
      horizontal: bestData.cols,
      vertical: bestData.rows,
    };
  } catch (error) {
    console.error('[YT-Storyboard] Error parsing storyboard:', error);
    return { allUrls: [], trueNoOfSlots: 0, samplingFq: 0 };
  }
}

async function getCurrentVideoDetails() {
  const player = await waitFor('#movie_player');
  const resp = player?.getPlayerResponse?.();
  if (!resp) {
    console.trace('No player response found');
    return null;
  }
  const ownerChannelName =
    resp?.microformat?.playerMicroformatRenderer?.ownerChannelName;
  const description =
    resp.playabilityStatus.errorScreen?.playerInterstitialRenderer.content
      .interstitialViewModel.description.content;
  const videoId = resp.videoDetails?.videoId;
  const channelUid = resp?.videoDetails?.channelId ?? null;
  const channelVanityId =
    resp?.microformat?.playerMicroformatRenderer?.ownerProfileUrl?.match(
      /@([^/]+)$/,
    )?.[1] ?? null;
  const status = resp?.playabilityStatus?.status ?? null;
  return {
    videoId,
    ownerChannelName,
    channelUid,
    channelVanityId,
    description,
    status,
  };
}

/**
 * @typedef {Object} ChannelDetails
 * @property {string|null} ownerChannelName - Display name of the channel (equivalent of `ownerChannelName` on video pages).
 * @property {string|null} channelUid - Canonical channel ID, e.g. `UCxxxxxxxxxxxxxxxxxxxxxx`.
 * @property {string|null} vanityUrl - Handle/vanity URL if present, e.g. `https://www.youtube.com/@handle`.
 * @property {string|null} description - Channel "About" description.
 */

/**
 * Checks whether the current location looks like a channel page
 * (`/@handle`, `/channel/UC…`, `/c/name`, `/user/name`), including sub-tabs.
 *
 * @returns {boolean} `true` if the URL path matches a channel page pattern.
 */
function isChannelPage() {
  return /^\/(@[^/]+|channel\/[^/]+|c\/[^/]+|user\/[^/]+)/.test(
    location.pathname,
  );
}

/**
 * Polls `read` until it returns a non-nullish value or the timeout elapses.
 *
 * @template T
 * @param {() => T | null | undefined} read - Reader called on every tick. May throw; errors are treated as "not ready".
 * @param {Object} [options] - Polling options.
 * @param {number} [options.timeout=10000] - Max time to wait, in milliseconds.
 * @param {number} [options.interval=100] - Delay between attempts, in milliseconds.
 * @returns {Promise<T | null>} The first non-nullish value, or `null` on timeout.
 */
function pollUntil(read, { timeout = 10000, interval = 100 } = {}) {
  return new Promise(resolve => {
    const deadline = Date.now() + timeout;
    const tick = () => {
      console.log('tick');
      let value = null;
      try {
        value = read();
      } catch {
        // Treat exceptions as "not ready yet".
      }
      if (value != null) return resolve(value);
      if (Date.now() >= deadline) return resolve(null);
      setTimeout(tick, interval);
    };
    tick();
  });
}

/**
 * Checks that channel metadata belongs to the channel in the current URL,
 * guarding against stale data left over from the previous SPA page.
 *
 * Handles `/@handle` and `/channel/UC…` URLs. Legacy `/c/…` and `/user/…`
 * URLs can't be verified from the path alone, so they are accepted as-is.
 *
 * @param {{ externalId?: string, vanityChannelUrl?: string }} meta - A `channelMetadataRenderer` object.
 * @returns {boolean} `true` if the metadata matches the current location.
 */
function metaMatchesLocation(meta) {
  const path = decodeURIComponent(location.pathname);
  const channelId = path.match(/^\/channel\/([^/]+)/)?.[1];
  if (channelId) return meta.externalId === channelId;

  const handle = path.match(/^\/(@[^/]+)/)?.[1];
  if (handle) {
    return decodeURIComponent(meta.vanityChannelUrl ?? '')
      .toLowerCase()
      .endsWith(handle.toLowerCase());
  }
  return true;
}

/**
 * Reads channel details from the active `ytd-browse` page, waiting until the
 * page data is actually populated (it is not available right at page load).
 *
 * @param {Object} [options] - Options.
 * @param {number} [options.timeout=10000] - Max time to wait for data, in milliseconds.
 * @returns {Promise<ChannelDetails | null>} The channel details, or `null` if this is not a
 *   channel page or the data did not become available in time.
 */
async function getCurrentChannelDetails({ timeout = 10000 } = {}) {
  if (!isChannelPage()) {
    console.log('Not a channel page, skipping getCurrentChannelDetails()');
    return null;
  }

  const meta = await pollUntil(
    () => {
      const candidate = document
        .querySelector('ytd-page-manager')
        ?.getCurrentPage?.()?.data?.metadata?.channelMetadataRenderer;
      return candidate && metaMatchesLocation(candidate) ? candidate : null;
    },
    { timeout },
  );

  if (!meta) {
    console.warn('Channel metadata did not become available in time');
    return null;
  }

  return {
    ownerChannelName: meta.title ?? null,
    channelUid: meta.externalId ?? null,
    vanityUrl: meta.vanityChannelUrl ?? null,
    vanityId: meta.vanityChannelUrl?.match(/@([^/]+)$/)?.[1] ?? null,
    description: meta.description ?? null,
  };
}
