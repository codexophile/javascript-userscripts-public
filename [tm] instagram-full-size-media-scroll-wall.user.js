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
    // IntersectionObserver for infinite scroll sentinel.
    scrollObserver: null,
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
   * Lightweight DOM builder utility.
   * @param {string} tag
   * @param {object} [props]
   * @param {Array<Node|string>} [children]
   * @returns {HTMLElement}
   */
  function el(tag, props = {}, children = []) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
      else if (k in node) node[k] = v;
      else node.setAttribute(k, v);
    }
    for (const child of [].concat(children)) {
      if (child == null) continue;
      node.appendChild(
        typeof child === 'string' ? document.createTextNode(child) : child
      );
    }
    return node;
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

    // Show loading indicator
    const loadingIndicator = document.getElementById(
      'media-wall-loading-indicator'
    );
    if (loadingIndicator) loadingIndicator.style.display = 'block';

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
      const mediaList = Array.isArray(data.items)
        ? data.items
        : (data.feed_items || [])
            .map(item => item && item.media_or_ad)
            .filter(Boolean);
      state.nextPageCursor = data.next_max_id;

      if (!mediaList || mediaList.length === 0) {
        console.log('No more media found or empty response.');
        state.nextPageCursor = null; // Stop further requests.
        updateLoadingIndicators();
        return;
      }

      renderMediaItems(mediaList);
      setupInfiniteScrollObserver();
    } catch (error) {
      console.error('Instagram full-size media script error:', error);
      alert('Failed to load Instagram media. Check the console for details.');
    } finally {
      state.isLoadingNextPage = false;
      updateLoadingIndicators();
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

    // Add loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'media-wall-loading-indicator';
    loadingIndicator.innerHTML = `
      <div class="loading-spinner"></div>
      <div>Loading media...</div>
    `;
    loadingIndicator.style.display = 'none';
    state.mediaWallContainer.appendChild(loadingIndicator);

    // Add end-of-content indicator
    const endIndicator = document.createElement('div');
    endIndicator.id = 'media-wall-end-indicator';
    endIndicator.textContent = 'All media loaded';
    endIndicator.style.display = 'none';
    state.mediaWallContainer.appendChild(endIndicator);

    // Add scroll sentinel for IntersectionObserver-based infinite scroll
    const sentinel = document.createElement('div');
    sentinel.id = 'media-wall-scroll-sentinel';
    sentinel.style.height = '1px';
    sentinel.style.margin = '1px 0';
    state.mediaWallContainer.appendChild(sentinel);

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

      /* --- Loading Indicator Styles --- */
      #media-wall-loading-indicator {
        text-align: center;
        padding: 40px 20px;
        color: #ccc;
        font-family: sans-serif;
        font-size: 14px;
      }
      .loading-spinner {
        display: inline-block;
        width: 40px;
        height: 40px;
        border: 4px solid rgba(255, 255, 255, 0.1);
        border-top-color: #fff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 15px;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      #media-wall-end-indicator {
        text-align: center;
        padding: 40px 20px;
        color: #888;
        font-family: sans-serif;
        font-size: 14px;
        border-top: 1px solid #404040;
        margin-top: 20px;
      }
      #media-wall-end-indicator::before {
        content: '✓';
        display: block;
        font-size: 30px;
        margin-bottom: 10px;
        color: #4a9eff;
      }
      #media-wall-scroll-sentinel { width: 100%; }
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
    const candidates = media?.image_versions2?.candidates || [];
    if (candidates.length === 0) return '';
    let best = candidates[0];
    for (let i = 1; i < candidates.length; i++) {
      const c = candidates[i];
      if (
        (c.width || 0) * (c.height || 0) >
        (best.width || 0) * (best.height || 0)
      )
        best = c;
    }
    return best.url || '';
  }

  /**
   * Finds the highest resolution video from a list of versions.
   * @param {object} media - The media item containing video versions.
   * @returns {string} The URL of the best quality video.
   */
  function getBestVideoUrl(media) {
    const versions = media?.video_versions || [];
    if (versions.length === 0) return '';
    let best = versions[0];
    for (let i = 1; i < versions.length; i++) {
      const v = versions[i];
      if (
        (v.width || 0) * (v.height || 0) >
        (best.width || 0) * (best.height || 0)
      )
        best = v;
    }
    return best.url || '';
  }

  /**
   * Sets up auto-pause logic for a video element based on viewport visibility.
   * Video pauses when it leaves the viewport.
   * @param {HTMLVideoElement} videoEl - The video element to manage.
   */
  function setupVideoAutoPauseOnViewport(videoEl) {
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          // Pause when not sufficiently visible within the wall container
          if (entry.intersectionRatio < 0.6) videoEl.pause();
        }
      },
      { root: state.mediaWallContainer, threshold: [0, 0.6, 1] }
    );
    observer.observe(videoEl);
    return () => observer.disconnect();
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

    const frag = document.createDocumentFragment();
    for (const item of mediaList) {
      if (!item?.code || item?.ad_id || item?.label === 'Sponsored') {
        console.log('Skipping ad or non-media item:', item);
        continue;
      }

      // Create a group container for this post
      const group = el('div', { className: 'media-group' });

      // Add post info header
      group.appendChild(
        el('div', {
          className: 'media-group-info',
          innerHTML: `<strong>@${item.user?.username}</strong> • ${
            item.taken_at
              ? new Date(item.taken_at * 1000).toLocaleDateString()
              : 'Unknown'
          }`,
        })
      );

      // A single post can contain a carousel of multiple images/videos.
      const carouselItems = item.carousel_media || [item];

      for (const [index, media] of carouselItems.entries()) {
        const link = el('a', {
          href: `https://www.instagram.com/p/${item.code}/`,
          target: '_blank',
          rel: 'noopener noreferrer',
          title: `${item.user?.full_name || ''} (@${item.user?.username})\n${
            item.caption?.text || ''
          }`,
        });
        if (carouselItems.length > 1) {
          link.title += ` [${index + 1}/${carouselItems.length}]`;
        }

        // Handle videos
        if (media.video_versions) {
          const container = el('div', { className: 'media-container' });
          const video = el('video', {
            src: getBestVideoUrl(media),
            controls: true,
            loop: true,
            volume: config.VIDEO_VOLUME,
            preload: 'metadata',
          });

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
          const image = el('img', { src: getBestImageUrl(media) });
          link.appendChild(image);
          group.appendChild(link);
        }
      }

      frag.appendChild(group);
    }
    contentContainer.appendChild(frag);
  }

  // --- LOGIC & INITIALIZATION ---

  /**
   * Updates the visibility of loading and end-of-content indicators.
   */
  function updateLoadingIndicators() {
    const loadingIndicator = document.getElementById(
      'media-wall-loading-indicator'
    );
    const endIndicator = document.getElementById('media-wall-end-indicator');

    if (!loadingIndicator || !endIndicator) return;

    if (state.isLoadingNextPage) {
      // Currently loading
      loadingIndicator.style.display = 'block';
      endIndicator.style.display = 'none';
    } else if (!state.nextPageCursor) {
      // No more content to load
      loadingIndicator.style.display = 'none';
      endIndicator.style.display = 'block';
    } else {
      // Ready to load more, but not currently loading
      loadingIndicator.style.display = 'none';
      endIndicator.style.display = 'none';
    }
  }

  /**
   * Sets up an on-scroll listener to load the next page of media
   * when the user scrolls near the bottom of the wall.
   */
  function setupInfiniteScrollObserver() {
    // Disconnect any prior observer
    if (state.scrollObserver) {
      state.scrollObserver.disconnect();
      state.scrollObserver = null;
    }

    if (!state.nextPageCursor) {
      console.log('End of feed. Disabling infinite scroll.');
      updateLoadingIndicators();
      return;
    }

    const sentinel = document.getElementById('media-wall-scroll-sentinel');
    if (!sentinel) return;

    state.scrollObserver = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (
            entry.isIntersecting &&
            !state.isLoadingNextPage &&
            state.nextPageCursor
          ) {
            fetchMedia();
          }
        }
      },
      { root: state.mediaWallContainer, rootMargin: '200px 0px', threshold: 0 }
    );
    state.scrollObserver.observe(sentinel);
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
