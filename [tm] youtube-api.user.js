(function () {
  'use strict';
  if (window.top != window.self) return; //don't run on frames or iframes

  const API_KEY = getYoutubeAPI();
  const regionCode = 'US'; // Adjust this according to your preferred region

  initializeFetchingAndDisplayingCountryFlags();
  initializeTitleSetter();

  async function initializeTitleSetter() {
    let cachedContent = null;
    let cachedVideoId = null;
    let settingTitleInternally = false; // guards against our own title mutations re-triggering main()

    const video = await waitFor('video');
    const titleEl = await waitFor('title');

    video.addEventListener('play', updateTitle);
    video.addEventListener('pause', updateTitle);
    video.addEventListener('ended', updateTitle);

    const titleObserver = new MutationObserver(() => {
      if (settingTitleInternally) return;
      main();
    });
    titleObserver.observe(titleEl, { childList: true, subtree: true });

    main();

    async function main() {
      const videoId = getVideoId();
      if (!videoId) return;

      if (videoId !== cachedVideoId) {
        cachedContent = null; // new video, invalidate cache
      }

      await updateTitle();
    }

    function isVideoPlaying() {
      return video && !video.paused && !video.ended && video.readyState > 2;
    }

    async function updateTitle() {
      const videoId = getVideoId();
      if (!videoId) return;

      try {
        const videoTitleEl = await waitFor(
          '#title.ytd-watch-metadata yt-formatted-string',
        );
        const videoTitle = videoTitleEl.innerText;

        let newContent;
        if (!isVideoPlaying()) {
          newContent = '[afk]';
        } else {
          if (!cachedContent || videoId !== cachedVideoId) {
            const categories = await fetchCategories(regionCode, API_KEY);
            const categoryAndTags = await getVideoCategoryAndTags(
              videoId,
              categories,
              API_KEY,
            );
            cachedContent = JSON.stringify(categoryAndTags).replaceAll('"', '');
            cachedVideoId = videoId;
          }
          newContent = cachedContent;
        }

        const newTitle = `${videoTitle} | ${newContent}`;
        if (document.title === newTitle) return;

        settingTitleInternally = true;
        document.title = newTitle;
        setTimeout(() => {
          settingTitleInternally = false;
        }, 0);
      } catch (error) {
        alert(error);
      }
    }
  }

  function initializeFetchingAndDisplayingCountryFlags() {
    // yt-navigate-finish can fire more than once for a single navigation.
    // Use a generation counter so any stale/duplicate invocation bails out
    // instead of appending a second flag.
    let currentRequestId = 0;

    window.addEventListener('yt-navigate-finish', async () => {
      const requestId = ++currentRequestId;

      const titleEl = await waitFor(`#title.style-scope.ytd-watch-metadata`);
      if (!titleEl) return;
      if (requestId !== currentRequestId) return; // a newer nav superseded this one

      const videoId = getVideoId();

      const channelId = await getChannelId(videoId, API_KEY);
      if (requestId !== currentRequestId) return;

      const countryOfOrigin = await getChannelCountryOfOrigin(
        channelId,
        API_KEY,
      );
      if (requestId !== currentRequestId) return;

      const countryFullName = getCountryName(countryOfOrigin);
      const flagEmojiChar = countryCodeToFlag(countryOfOrigin);

      // Remove any existing flag(s) right before inserting, not just at the
      // top of the handler — this cleans up leftovers from a stale run too.
      titleEl.querySelectorAll(`#country-flag`).forEach(el => el.remove());

      const flagEl = generateElements(`<span id=country-flag></span>`);
      titleEl.prepend(flagEl);
      flagEl.title = countryFullName;
      // flagEl.textContent = flagEmojiChar;
      const flagImgUrl = getCountryFlagImage(countryOfOrigin, 'flat', '32');
      const flagImgEl = generateElements(
        `<img src="${flagImgUrl}" alt="${flagEmojiChar}">`,
      );
      flagEl.append(flagImgEl);

      style(
        flagEl,
        `
        margin-right: 1em;
        border-radius: 5px;
      `,
      );
      titleEl.style.justifyContent = 'unset';
    });
  }

  function countryCodeToFlag(countryCode) {
    // Validate input
    if (typeof countryCode !== 'string' || countryCode.length !== 2) {
      throw new Error('Country code must be a 2-character string');
    }

    // Convert country code to uppercase
    const code = countryCode.toUpperCase();

    // Convert each letter to the corresponding regional indicator symbol
    // Regional indicator symbols start at code point U+1F1E6 for 'A'
    // The offset from 'A' (ASCII 65) to U+1F1E6 is 127397
    const offset = 127397;
    const firstChar = code.charCodeAt(0) + offset;
    const secondChar = code.charCodeAt(1) + offset;

    // Convert code points to emoji flag
    return String.fromCodePoint(firstChar) + String.fromCodePoint(secondChar);
  }

  function getCountryFlagImage(countryCode, style = 'flat', size = '64') {
    // Validate input
    if (typeof countryCode !== 'string' || countryCode.length !== 2) {
      throw new Error('Country code must be a 2-character string');
    }

    // Convert to lowercase for API
    const code = countryCode.toLowerCase();

    // Validate style
    const validStyles = ['flat', 'shiny'];
    if (!validStyles.includes(style)) {
      throw new Error('Style must be either "flat" or "shiny"');
    }

    // Validate size
    const validSizes = ['16', '24', '32', '48', '64', '128'];
    if (!validSizes.includes(size)) {
      throw new Error('Size must be one of 16, 24, 32, 48, 64, or 128');
    }

    // Use the free flagsapi.com service
    return `https://flagsapi.com/${code.toUpperCase()}/${style}/${size}.png`;
  }

  function getCountryName(code) {
    try {
      const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
      return regionNames.of(code.toUpperCase()) || 'Unknown Country';
    } catch (error) {
      return 'Invalid Country Code';
    }
  }
})();
