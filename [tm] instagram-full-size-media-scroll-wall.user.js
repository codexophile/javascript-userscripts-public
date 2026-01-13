(function () {
  'use strict';

  // --- CONFIGURATION ---
  const config = {
    // Number of items to fetch in each API request.
    MEDIA_PER_QUERY: 12,
    // Load the next page when the Nth-to-last item is visible.
    INFINITE_SCROLL_TRIGGER_OFFSET: 3,
    // Media display dimensions as a percentage of viewport size.
    VIEWPORT_HEIGHT_PERCENTAGE: 0.8,
    VIEWPORT_WIDTH_PERCENTAGE: 0.49,
    // Default volume for videos (0.0 to 1.0).
    VIDEO_VOLUME: 0.02,
  };

  // --- STATE ---
  let state = {
    // The current page type ('profile', 'home', 'tagged', etc.).
    pageMode: 'profile',
    // The Instagram user ID for profile/tagged pages.
    targetUserId: null,
    // Tracks if the media wall has been activated.
    isWallActive: false,
    // Prevents multiple concurrent fetches for infinite scroll.
    isLoadingNextPage: false,
    // Stores the pagination cursor for the next API call.
    nextPageCursor: null,
    // A reference to the main container for the media wall.
    mediaWallContainer: null,
  };

  // --- UTILS ---

  /**
   * A temporary element used for parsing HTML strings into DOM nodes.
   */
  const domParserContainer = document.createElement('div');

  /**
   * Injects a Trusted Types policy to allow innerHTML usage safely.
   * This is necessary for some modern browser security features.
   */
  function setupTrustedTypes() {
    if (window.trustedTypes && window.trustedTypes.createPolicy) {
      window.trustedTypes.createPolicy('default', {
        createHTML: str => str,
      });
    }
  }

  /**
   * Retrieves the CSRF token required for API requests.
   * The most reliable source is the 'csrftoken' cookie.
   * @returns {string|null} The CSRF token or null if not found.
   */
  function getCsrfToken() {
    const cookieMatch = document.cookie.match(/csrftoken=([^;]+)/);
    if (cookieMatch && cookieMatch[1]) {
      return cookieMatch[1];
    }
    // Fallback for older Instagram versions, less reliable.
    return window._sharedData?.config?.csrf_token || null;
  }

  // --- API & DATA FETCHING ---

  /**
   * Asynchronously finds the target user's ID using various methods.
   * It checks in order: page HTML, IndexedDB, and finally a direct API call.
   * @returns {Promise<string|null>} A promise that resolves with the user ID or null.
   */
  async function findTargetUserId() {
    // 1. Try to find it directly in the page's HTML source.
    let userId = document.body.innerHTML.match(/profilePage_(\d+)/)?.[1];
    if (userId) {
      console.log('Found User ID in page HTML:', userId);
      return userId;
    }

    // 2. Try to get it from the browser's IndexedDB (fast and reliable if present).
    try {
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open('redux');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      const store = db.transaction('paths').objectStore('paths');
      const result = await new Promise((resolve, reject) => {
        const request = store.get('users.usernameToId');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      const username = window.location.pathname.split('/')[1];
      userId = result?.[username];
      if (userId) {
        console.log('Found User ID in IndexedDB:', userId);
        return userId;
      }
    } catch (error) {
      console.warn('Could not retrieve User ID from IndexedDB.', error);
    }

    // 3. As a last resort, fetch it using the ?__a=1 endpoint.
    try {
      const response = await fetch(
        `${window.location.href.replace(/\/$/, '')}?__a=1`
      );
      const data = await response.json();
      userId = data?.graphql?.user?.id;
      if (userId) {
        console.log('Found User ID via API request:', userId);
        return userId;
      }
    } catch (error) {
      console.error('Failed to fetch User ID from API.', error);
    }

    console.error('All methods to find User ID failed.');
    return null;
  }

  /**
   * Constructs the appropriate API URL and fetch options based on the page mode.
   * @returns {{url: string, options: object}|null} The request details or null for unsupported modes.
   */
  function buildApiRequest() {
    const csrfToken = getCsrfToken();
    if (!csrfToken) {
      console.error('Could not find CSRF token. Aborting API request.');
      return null;
    }

    const app_id = '936619743392459'; // Standard web app ID
    const asbd_id = '129477'; // Standard ASBD ID

    let url;
    const options = {
      credentials: 'include',
      referrerPolicy: 'no-referrer',
      headers: {
        'X-IG-App-ID': app_id,
        'X-ASBD-ID': asbd_id,
        'X-CSRFToken': csrfToken,
      },
    };

    switch (state.pageMode) {
      case 'profile':
        url = `https://i.instagram.com/api/v1/feed/user/${state.targetUserId}/?count=${config.MEDIA_PER_QUERY}`;
        if (state.nextPageCursor) url += `&max_id=${state.nextPageCursor}`;
        break;

      case 'tagged':
        url = `https://i.instagram.com/api/v1/usertags/${state.targetUserId}/feed/?count=${config.MEDIA_PER_QUERY}`;
        if (state.nextPageCursor) url += `&max_id=${state.nextPageCursor}`;
        break;

      case 'home':
        url = 'https://i.instagram.com/api/v1/feed/timeline/';
        const formData = new URLSearchParams();
        // These parameters seem to be required for the timeline endpoint.
        formData.set('is_async_ads_rti', '0');
        formData.set('is_async_ads_double_request', '0');
        formData.set('rti_delivery_backend', '0');
        formData.set('is_async_ads_in_headload_enabled', '0');
        formData.set('device_id', window._sharedData?.device_id);
        if (state.nextPageCursor) formData.set('max_id', state.nextPageCursor);
        options.method = 'POST';
        options.body = formData;
        break;

      default:
        console.warn(
          `Page mode "${state.pageMode}" is not supported for media loading.`
        );
        return null;
    }

    return { url, options };
  }

  /**
   * Fetches a page of media from the Instagram API.
   */
  async function fetchMedia() {
    if (state.isLoadingNextPage) return;
    state.isLoadingNextPage = true;

    const request = buildApiRequest();
    if (!request) {
      state.isLoadingNextPage = false;
      return;
    }

    console.log(
      `Fetching media for mode: ${state.pageMode}, cursor: ${
        state.nextPageCursor || 'initial'
      }`
    );

    try {
      const response = await fetch(request.url, request.options);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Request failed with status ${response.status}`
        );
      }
      const data = await response.json();
      console.log('API Response:', data);

      // Extract the media list and the next page cursor from the response.
      const mediaList =
        data.items ||
        data.feed_items?.map(item => item.media_or_ad).filter(Boolean);
      state.nextPageCursor = data.next_max_id;

      if (!mediaList || mediaList.length === 0) {
        console.log('No more media found or empty response.');
        state.nextPageCursor = null; // Stop further requests.
        return;
      }

      renderMediaItems(mediaList);
      setupInfiniteScroll();
    } catch (error) {
      console.error('Instagram full-size media script error:', error);
      alert('Failed to load Instagram media. Check the console for details.');
    } finally {
      state.isLoadingNextPage = false;
    }
  }

  // --- DOM & RENDERING ---

  /**
   * Creates the main media wall container and injects it into the page.
   * This is only called once when the wall is first activated.
   */
  function createMediaWallDom() {
    // Hide the original page content and prevent it from scrolling.
    document.body.style.overflow = 'hidden';

    domParserContainer.innerHTML = `
      <div id="media-wall-overlay">
        <div id="media-wall-content"></div>
      </div>`;
    state.mediaWallContainer = domParserContainer.firstElementChild;
    const contentContainer = state.mediaWallContainer.querySelector(
      '#media-wall-content'
    );

    // Add a close button
    const closeButton = document.createElement('button');
    closeButton.id = 'media-wall-close-button';
    closeButton.textContent = '×';
    closeButton.title = 'Close Media Wall (or press Esc)';
    closeButton.onclick = () => {
      state.mediaWallContainer.remove();
      document.body.style.overflow = 'auto';
      state.isWallActive = false;
    };
    state.mediaWallContainer.appendChild(closeButton);

    document.body.appendChild(state.mediaWallContainer);

    // Allow closing with the Escape key
    window.addEventListener('keydown', e => {
      if (e.key === 'Escape' && state.isWallActive) {
        closeButton.click();
      }
    });

    return contentContainer;
  }

  /**
   * Injects all necessary CSS for the media wall and trigger buttons.
   */
  function injectGlobalStyles() {
    const vh = config.VIEWPORT_HEIGHT_PERCENTAGE * 100;
    const vw = config.VIEWPORT_WIDTH_PERCENTAGE * 100;

    const styles = `
      /* --- Trigger Button Styles --- */
      #media-wall-trigger-button-profile {
        cursor: pointer;
      }
      #media-wall-trigger-button-home {
        cursor: pointer;
        border-bottom: 1px solid #363636;
        padding-bottom: 10px;
      }
      #media-wall-trigger-button-home > div {
        text-align: center;
        padding: 20px;
        font-size: 16px;
        font-weight: bold;
        color: #ccc;
      }

      /* --- Media Wall Overlay --- */
      #media-wall-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(10, 10, 15, 0.98);
        z-index: 9999;
        overflow-y: scroll;
        -webkit-backdrop-filter: blur(5px);
        backdrop-filter: blur(5px);
      }
      #media-wall-content {
        display: block;
        text-align: center;
        padding-top: 50px; /* Space for close button */
      }
      #media-wall-close-button {
        position: fixed;
        top: 10px;
        right: 15px;
        z-index: 10000;
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: none;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        font-size: 24px;
        line-height: 28px;
        text-align: center;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      #media-wall-close-button:hover {
        background: rgba(255, 255, 255, 0.4);
      }

      /* --- Media Item Styles --- */
      #media-wall-content img,
      #media-wall-content video {
        width: 300px;
        max-height: ${vh}vh;
        max-width: ${vw}vw;
        margin: 8px;
        border-radius: 4px;
        background-color: #111;
        object-fit: contain;
      }
      #media-wall-content video {
        border: 2px solid #008000;
      }
      #media-wall-content .media-container {
        display: inline-block;
        vertical-align: top;
        margin: 5px;
        text-align: left;
      }
      #media-wall-content .media-link {
        display: block;
        text-decoration: none;
        margin-top: -5px;
        padding: 2px 8px;
        color: #ccc;
        font-size: 12px;
        font-family: sans-serif;
      }
      #media-wall-content .media-link:hover {
        text-decoration: underline;
      }

      /* --- Media Group Styles --- */
      #media-wall-content .media-group {
        display: inline-block;
        padding: 15px;
        margin: 10px;
        border: 1px solid #404040;
        border-radius: 8px;
        background-color: rgba(20, 20, 25, 0.8);
        vertical-align: top;
      }
      #media-wall-content .media-group-info {
        color: #888;
        font-size: 11px;
        text-align: center;
        padding: 5px 0 10px 0;
        border-bottom: 1px solid #303030;
        margin-bottom: 10px;
        font-family: sans-serif;
      }
    `;
    const styleSheet = document.createElement('style');
    styleSheet.type = 'text/css';
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
  }

  /**
   * Finds the highest resolution image from a list of candidates.
   * @param {object} media - The media item containing image versions.
   * @returns {string} The URL of the best quality image.
   */
  function getBestImageUrl(media) {
    const candidates = media?.image_versions2?.candidates;
    if (!candidates || candidates.length === 0) return '';

    return candidates.reduce((best, current) => {
      return current.width * current.height > best.width * best.height
        ? current
        : best;
    }).url;
  }

  /**
   * Finds the highest resolution video from a list of versions.
   * @param {object} media - The media item containing video versions.
   * @returns {string} The URL of the best quality video.
   */
  function getBestVideoUrl(media) {
    const versions = media?.video_versions;
    if (!versions || versions.length === 0) return '';
    return versions.reduce((best, current) => {
      return current.width * current.height > best.width * best.height
        ? current
        : best;
    }).url;
  }

  /**
   * Sets up auto-pause logic for a video element based on viewport visibility.
   * Video pauses when it leaves the viewport.
   * @param {HTMLVideoElement} videoEl - The video element to manage.
   */
  function setupVideoAutoPauseOnViewport(videoEl) {
    const checkAndUpdatePlayState = () => {
      // Check if video is fully in viewport
      const rect = videoEl.getBoundingClientRect();
      const isFullyVisible =
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <=
          (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <=
          (window.innerWidth || document.documentElement.clientWidth);

      if (!isFullyVisible) {
        videoEl.pause();
      }
    };

    // Check on scroll with throttle to improve performance
    let scrollTimeout = null;
    const onScroll = () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(checkAndUpdatePlayState, 50);
    };

    // Check on resize
    const onResize = () => {
      checkAndUpdatePlayState();
    };

    // Add listeners
    state.mediaWallContainer.addEventListener('scroll', onScroll);
    window.addEventListener('resize', onResize);

    // Return cleanup function
    return () => {
      state.mediaWallContainer.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }

  /**
   * Processes a list of media items and appends them to the DOM.
   * Groups items by post and visually separates each group.
   * @param {Array<object>} mediaList - An array of media items from the API.
   */
  function renderMediaItems(mediaList) {
    let contentContainer = document.getElementById('media-wall-content');
    if (!contentContainer) {
      contentContainer = createMediaWallDom();
    }

    for (const item of mediaList) {
      if (!item?.code || item?.ad_id || item?.label === 'Sponsored') {
        console.log('Skipping ad or non-media item:', item);
        continue;
      }

      // Create a group container for this post
      const group = document.createElement('div');
      group.className = 'media-group';

      // Add post info header
      const infoDiv = document.createElement('div');
      infoDiv.className = 'media-group-info';
      infoDiv.innerHTML = `<strong>@${item.user?.username}</strong> • ${
        item.taken_at
          ? new Date(item.taken_at * 1000).toLocaleDateString()
          : 'Unknown'
      }`;
      group.appendChild(infoDiv);

      // A single post can contain a carousel of multiple images/videos.
      const carouselItems = item.carousel_media || [item];

      for (const [index, media] of carouselItems.entries()) {
        const link = document.createElement('a');
        link.href = `https://www.instagram.com/p/${item.code}/`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.title = `${item.user?.full_name || ''} (@${
          item.user?.username
        })\n${item.caption?.text || ''}`;
        if (carouselItems.length > 1) {
          link.title += ` [${index + 1}/${carouselItems.length}]`;
        }

        // Handle videos
        if (media.video_versions) {
          const container = document.createElement('div');
          container.className = 'media-container';

          const video = document.createElement('video');
          video.src = getBestVideoUrl(media);
          video.controls = true;
          video.loop = true;
          video.volume = config.VIDEO_VOLUME;
          video.preload = 'metadata';

          // Set up auto-pause when video leaves viewport
          setupVideoAutoPauseOnViewport(video);

          link.className = 'media-link';
          link.textContent = `Post by @${item.user.username}`;

          container.appendChild(video);
          container.appendChild(link);
          group.appendChild(container);
        }
        // Handle images
        else if (media.image_versions2) {
          const image = document.createElement('img');
          image.src = getBestImageUrl(media);
          link.appendChild(image);
          group.appendChild(link);
        }
      }

      contentContainer.appendChild(group);
    }
  }

  // --- LOGIC & INITIALIZATION ---

  /**
   * Sets up an on-scroll listener to load the next page of media
   * when the user scrolls near the bottom of the wall.
   */
  function setupInfiniteScroll() {
    if (!state.nextPageCursor) {
      console.log('End of feed. Disabling infinite scroll.');
      state.mediaWallContainer.onscroll = null;
      return;
    }

    const triggerElement =
      document.querySelector(
        `#media-wall-content > *:nth-last-of-type(${config.INFINITE_SCROLL_TRIGGER_OFFSET})`
      ) || document.querySelector('#media-wall-content > *:last-of-type');

    if (!triggerElement) return;

    state.mediaWallContainer.onscroll = () => {
      // Check if the trigger element is within the viewport
      const rect = triggerElement.getBoundingClientRect();
      if (rect.top < window.innerHeight + 200) {
        // +200px buffer
        state.mediaWallContainer.onscroll = null; // Prevent multiple triggers
        fetchMedia();
      }
    };
  }

  /**
   * The main function to activate the media wall.
   * It determines the page type, finds the user ID if needed, and fetches the first batch of media.
   */
  async function initializeMediaWall() {
    // Determine page type (mode)
    const href = window.location.href;
    if (href.match(/https:\/\/(www\.)?instagram\.com\/?(\?|$|#)/)) {
      state.pageMode = 'home';
    } else if (href.match(/\/tagged\//)) {
      state.pageMode = 'tagged';
    } else if (href.match(/\/explore\//)) {
      state.pageMode = 'explore';
    } else if (href.match(/https:\/\/(www\.)?instagram\.com\/p\//)) {
      state.pageMode = 'post';
    } else {
      state.pageMode = 'profile';
    }

    console.log(`Detected page mode: ${state.pageMode}`);

    if (['explore', 'post'].includes(state.pageMode)) {
      alert(
        `The media wall script does not support "${state.pageMode}" pages yet.`
      );
      return;
    }

    // For profile or tagged pages, we need to find the user's ID first.
    if (['profile', 'tagged'].includes(state.pageMode)) {
      state.targetUserId = await findTargetUserId();
      if (!state.targetUserId) {
        alert(
          'Could not determine the Instagram User ID for this page. The script cannot continue.'
        );
        return;
      }
    }

    // Mark the wall as active and fetch the first page.
    if (!state.isWallActive) {
      state.isWallActive = true;
      state.nextPageCursor = null; // Reset cursor for a new wall
      await fetchMedia();
    }
  }

  /**
   * Injects the trigger button(s) into the Instagram UI.
   * It periodically checks for a suitable insertion point until one is found.
   */
  function insertTriggerButton() {
    if (
      document.getElementById('media-wall-trigger-button-profile') ||
      document.getElementById('media-wall-trigger-button-home')
    ) {
      return; // Button already exists.
    }

    let insertionPoint = null;
    let buttonHtml = '';

    // --- Profile Page Button ---
    // Targets the tab list for "Posts", "Reels", "Tagged".
    const profileTabList = document.querySelector('div[role=tablist]');
    if (profileTabList) {
      insertionPoint = profileTabList;
      buttonHtml = `<a aria-selected="false" class="_aa_0" role="tab" tabindex="0" id="media-wall-trigger-button-profile"><span class="_aacl _aaco _aacp _aacu _aacx _aad6 _aade">Media Wall</span></a>`;
    }
    // --- Home Feed Button ---
    // Targets the container above the first post.
    else {
      insertionPoint = document.querySelector('.collapsible-content');
      buttonHtml = `<article class="_ab6k _ab6l _ab6m" role="presentation" id="media-wall-trigger-button-home">
                <div>Click to Load Full-Size Media Wall</div>
            </article>`;
    }

    if (insertionPoint && buttonHtml) {
      console.log('Injecting trigger button...');
      domParserContainer.innerHTML = buttonHtml;
      const triggerButton = domParserContainer.firstElementChild;
      triggerButton.onclick = e => {
        e.preventDefault();
        e.stopPropagation();
        initializeMediaWall();
      };

      if (state.pageMode === 'home') {
        insertionPoint.prepend(triggerButton);
      } else {
        insertionPoint.appendChild(triggerButton);
      }
    } else {
      // If no insertion point is found, try again shortly.
      setTimeout(insertTriggerButton, 250);
    }
  }

  /**
   * The main entry point for the script.
   */
  function initialize() {
    console.log('Instagram Full-Size Media Scroll Wall script loaded.');
    setupTrustedTypes();
    injectGlobalStyles();
    insertTriggerButton();
  }

  // Start the script once the page is sufficiently loaded.
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
