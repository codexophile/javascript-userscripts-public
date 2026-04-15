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
    // Virtual scrolling tunables.
    VIRTUAL_OVERSCAN_PIXELS: 1400,
    VIRTUAL_DEFAULT_ITEM_HEIGHT: 520,
    VIRTUAL_FETCH_THRESHOLD_PIXELS: 1400,
    // Enable virtual scrolling (set to false to disable and revert to simple rendering).
    VIRTUAL_SCROLL_ENABLED: false,
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
    // A reference to the scrollable overlay viewport.
    mediaWallViewport: null,
    // IntersectionObserver for infinite scroll sentinel.
    scrollObserver: null,
    // Prevents re-attaching the Escape key handler on reopen.
    isEscapeHandlerAttached: false,
    // Prevents re-attaching the legacy scroll handler in non-virtual mode.
    isLegacyScrollHandlerAttached: false,
    // Enables automatic loading of all remaining pages without scroll triggers.
    infiniteWallMode: false,
    // Prevents parallel auto-load-all loops.
    isLoadingAllRemaining: false,
    // Restorable virtual wall session state.
    virtual: {
      sessionKey: null,
      items: [],
      itemKeySet: new Set(),
      estimatedHeights: {},
      measuredHeights: {},
      prefixHeights: [0],
      visibleRange: { start: 0, end: 0 },
      nextPageCursor: null,
      scrollTop: 0,
      renderFrameId: null,
      isScrollLocked: false,
      lastScrollTop: 0,
      lastTotalHeight: 0,
    },
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
        typeof child === 'string' ? document.createTextNode(child) : child,
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

  /**
   * Provides a rank token required by some Instagram endpoints (e.g., usertags).
   * Attempts to reuse device_id when available to keep requests consistent.
   */
  function getRankToken() {
    const stored = localStorage.getItem('mediaWallRankToken');
    if (stored) return stored;

    const deviceId = window._sharedData?.device_id;
    if (deviceId) {
      localStorage.setItem('mediaWallRankToken', deviceId);
      return deviceId;
    }

    const token =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem('mediaWallRankToken', token);
    return token;
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

    // 3. For tagged pages, try to get the profile URL without the /tagged suffix
    const currentPath = window.location.pathname;
    const isTaggedPage = currentPath.includes('/tagged');
    const fetchUrl = isTaggedPage
      ? window.location.origin +
        currentPath.replace(/\/tagged\/?$/, '') +
        '?__a=1'
      : `${window.location.href.replace(/\/$/, '')}?__a=1`;

    // 4. As a last resort, fetch it using the ?__a=1 endpoint.
    try {
      console.log('Fetching user ID from:', fetchUrl);
      const response = await fetch(fetchUrl);
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(
          'Non-JSON response (likely blocked): ' + text.slice(0, 120),
        );
      }

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
        'User-Agent': navigator.userAgent,
        Accept: '*/*',
      },
    };

    switch (state.pageMode) {
      case 'profile':
        url = `https://i.instagram.com/api/v1/feed/user/${state.targetUserId}/?count=${config.MEDIA_PER_QUERY}`;
        if (state.nextPageCursor) url += `&max_id=${state.nextPageCursor}`;
        break;

      case 'tagged': {
        // Web GraphQL endpoint for tagged media (more reliable from browser)
        const variables = {
          id: state.targetUserId,
          first: config.MEDIA_PER_QUERY,
          after: state.nextPageCursor || null,
        };
        const queryHash = '5b80a0b479b98c5a984bc4b0d6d09fa6'; // edge_user_to_photos_of_you
        url =
          'https://www.instagram.com/graphql/query/?query_hash=' +
          queryHash +
          '&variables=' +
          encodeURIComponent(JSON.stringify(variables));
        options.headers = {
          'X-Requested-With': 'XMLHttpRequest',
        };
        break;
      }

      case 'home': {
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
      }

      default:
        console.warn(
          `Page mode "${state.pageMode}" is not supported for media loading.`,
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
      'media-wall-loading-indicator',
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
      }`,
    );

    try {
      const response = await fetch(request.url, request.options);

      // Check content type first before trying to parse
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(
          `Non-JSON response (status ${response.status}): ${text.slice(0, 120)}`,
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `Request failed with status ${response.status}`,
        );
      }

      console.log('API Response:', data);

      // Extract the media list and the next page cursor from the response.
      let mediaList;
      if (
        state.pageMode === 'tagged' &&
        data?.data?.user?.edge_user_to_photos_of_you
      ) {
        const edgeObj = data.data.user.edge_user_to_photos_of_you;
        state.nextPageCursor = edgeObj.page_info?.has_next_page
          ? edgeObj.page_info.end_cursor
          : null;

        mediaList = (edgeObj.edges || []).map(edge =>
          normalizeGraphqlNode(edge.node),
        );
      } else {
        mediaList = Array.isArray(data.items)
          ? data.items
          : (data.feed_items || [])
              .map(item => item && item.media_or_ad)
              .filter(Boolean);
        state.nextPageCursor = data.next_max_id;
      }

      if (!mediaList || mediaList.length === 0) {
        console.log('No more media found or empty response.');
        state.nextPageCursor = null; // Stop further requests.
        state.virtual.nextPageCursor = null;
        updateLoadingIndicators();
        return;
      }

      renderMediaItems(mediaList);
      state.virtual.nextPageCursor = state.nextPageCursor || null;
      setupInfiniteScrollObserver();
    } catch (error) {
      console.error('Instagram full-size media script error:', error);
      alert('Failed to load Instagram media. Check the console for details.');
    } finally {
      state.isLoadingNextPage = false;
      updateLoadingIndicators();
    }
  }

  /**
   * In Infinite Wall mode, keeps loading pages until no cursor remains.
   */
  async function loadAllRemainingMedia() {
    if (
      !state.infiniteWallMode ||
      state.isLoadingAllRemaining ||
      !state.isWallActive ||
      !state.nextPageCursor
    ) {
      return;
    }

    state.isLoadingAllRemaining = true;
    try {
      while (
        state.infiniteWallMode &&
        state.isWallActive &&
        state.nextPageCursor
      ) {
        await fetchMedia();
      }
    } finally {
      state.isLoadingAllRemaining = false;
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

    domParserContainer.innerHTML = config.VIRTUAL_SCROLL_ENABLED
      ? `<div id="media-wall-overlay">
          <div id="media-wall-content">
            <div id="media-wall-top-spacer"></div>
            <div id="media-wall-virtual-items"></div>
            <div id="media-wall-bottom-spacer"></div>
          </div>
        </div>`
      : `<div id="media-wall-overlay">
          <div id="media-wall-content"></div>
        </div>`;
    state.mediaWallContainer = domParserContainer.firstElementChild;
    state.mediaWallViewport = state.mediaWallContainer;
    const contentContainer = state.mediaWallContainer.querySelector(
      '#media-wall-content',
    );

    // Add a close button
    const closeButton = document.createElement('button');
    closeButton.id = 'media-wall-close-button';
    closeButton.textContent = '×';
    closeButton.title = 'Close Media Wall (or press Esc)';
    closeButton.onclick = () => {
      if (state.virtual.renderFrameId) {
        cancelAnimationFrame(state.virtual.renderFrameId);
        state.virtual.renderFrameId = null;
      }
      if (state.mediaWallViewport) {
        state.virtual.scrollTop = state.mediaWallViewport.scrollTop;
      }
      cleanupVirtualNodes(document.getElementById('media-wall-virtual-items'));
      state.mediaWallContainer.remove();
      document.body.style.overflow = 'auto';
      state.mediaWallContainer = null;
      state.mediaWallViewport = null;
      state.isWallActive = false;
      state.infiniteWallMode = false;
      state.isLoadingAllRemaining = false;
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

    document.body.appendChild(state.mediaWallContainer);

    if (config.VIRTUAL_SCROLL_ENABLED) {
      state.mediaWallViewport.addEventListener('scroll', onMediaWallScroll, {
        passive: true,
      });
    } else if (!state.isLegacyScrollHandlerAttached) {
      state.mediaWallViewport.addEventListener(
        'scroll',
        onLegacyMediaWallScroll,
        {
          passive: true,
        },
      );
      state.isLegacyScrollHandlerAttached = true;
    }

    // Allow closing with the Escape key
    if (!state.isEscapeHandlerAttached) {
      window.addEventListener('keydown', e => {
        if (e.key === 'Escape' && state.isWallActive) {
          const activeCloseButton = document.getElementById(
            'media-wall-close-button',
          );
          if (activeCloseButton) activeCloseButton.click();
        }
      });
      state.isEscapeHandlerAttached = true;
    }

    if (state.virtual.scrollTop > 0) {
      state.mediaWallViewport.scrollTop = state.virtual.scrollTop;
    }

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
        overflow-y: auto;
        -webkit-backdrop-filter: blur(5px);
        backdrop-filter: blur(5px);
      }
      #media-wall-content {
        display: block;
        text-align: center;
        padding-top: 50px; /* Space for close button */
        min-height: 100%;
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
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        justify-content: center;
        align-items: flex-start;
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
      #media-wall-virtual-items { width: 100%; }
      #media-wall-top-spacer,
      #media-wall-bottom-spacer {
        width: 100%;
      }
    `;
    // Prefer shared helper if available to avoid duplicate styles
    if (typeof addStyle === 'function') {
      addStyle(styles);
    } else {
      const styleSheet = document.createElement('style');
      styleSheet.type = 'text/css';
      styleSheet.innerText = styles;
      document.head.appendChild(styleSheet);
    }
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
   * Normalizes a GraphQL node (edge_user_to_photos_of_you) to the shape expected by renderMediaItems.
   */
  function normalizeGraphqlNode(node) {
    if (!node) return null;
    const base = {
      code: node.shortcode,
      id: node.id,
      taken_at: node.taken_at_timestamp,
      user: {
        username: node.owner?.username,
        full_name: node.owner?.full_name,
      },
      caption: {
        text:
          node.edge_media_to_caption?.edges?.[0]?.node?.text ||
          node.title ||
          '',
      },
    };

    const toCandidates = resources =>
      (resources || []).map(res => ({
        url: res.src,
        width: res.config_width || res.width,
        height: res.config_height || res.height,
      }));

    // Sidecar (carousel)
    if (node.edge_sidecar_to_children?.edges?.length) {
      base.carousel_media = node.edge_sidecar_to_children.edges
        .map(child => normalizeGraphqlNode(child.node))
        .filter(Boolean);
      return base;
    }

    // Video
    if (node.is_video && node.video_url) {
      base.video_versions = [
        {
          url: node.video_url,
          width: node.dimensions?.width,
          height: node.dimensions?.height,
        },
      ];
    }

    // Image
    if (node.display_resources?.length) {
      base.image_versions2 = {
        candidates: toCandidates(node.display_resources),
      };
    }

    return base;
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
      { root: state.mediaWallContainer, threshold: [0, 0.6, 1] },
    );
    observer.observe(videoEl);
    return () => observer.disconnect();
  }

  /**
   * Builds a unique session key used to restore a previous media wall state.
   * @returns {string}
   */
  function getCurrentWallSessionKey() {
    const userPart = state.targetUserId || 'anon';
    return `${state.pageMode}:${userPart}:${window.location.pathname}`;
  }

  /**
   * Returns a stable key for deduping and indexing a media item.
   * @param {object} item
   * @returns {string|null}
   */
  function getItemKey(item) {
    return item?.code || item?.id || null;
  }

  /**
   * Resets virtual scroll data for a new session key.
   * @param {string} sessionKey
   */
  function resetVirtualState(sessionKey) {
    if (state.virtual.renderFrameId) {
      cancelAnimationFrame(state.virtual.renderFrameId);
    }
    state.virtual.sessionKey = sessionKey;
    state.virtual.items = [];
    state.virtual.itemKeySet = new Set();
    state.virtual.estimatedHeights = {};
    state.virtual.measuredHeights = {};
    state.virtual.prefixHeights = [0];
    state.virtual.visibleRange = { start: 0, end: 0 };
    state.virtual.nextPageCursor = null;
    state.virtual.scrollTop = 0;
    state.virtual.renderFrameId = null;
  }

  /**
   * Determines whether the existing virtual state can be restored for this page.
   * @param {string} sessionKey
   * @returns {boolean}
   */
  function canRestoreVirtualState(sessionKey) {
    return (
      state.virtual.sessionKey === sessionKey &&
      Array.isArray(state.virtual.items) &&
      state.virtual.items.length > 0
    );
  }

  /**
   * Creates an estimated post height to initialize virtual layout before measurements.
   * @param {object} item
   * @returns {number}
   */
  function estimateMediaGroupHeight(item) {
    const carouselCount = Math.max(1, (item?.carousel_media || [item]).length);
    const captionLength = item?.caption?.text?.length || 0;
    const mediaBlockHeight = 310;
    const headerAndChrome = 95;
    const captionHeight = Math.min(140, Math.ceil(captionLength / 80) * 18);
    return headerAndChrome + carouselCount * mediaBlockHeight + captionHeight;
  }

  /**
   * Recomputes virtual prefix heights used to convert pixels <-> index.
   */
  function recomputePrefixHeights() {
    const prefix = [0];
    for (const item of state.virtual.items) {
      const key = getItemKey(item);
      const measured = key ? state.virtual.measuredHeights[key] : null;
      const estimated = key ? state.virtual.estimatedHeights[key] : null;
      const h =
        measured ||
        estimated ||
        Math.max(320, config.VIRTUAL_DEFAULT_ITEM_HEIGHT);
      prefix.push(prefix[prefix.length - 1] + h);
    }
    state.virtual.prefixHeights = prefix;
  }

  /**
   * Lower-bound lookup in prefix heights.
   * @param {number[]} prefix
   * @param {number} value
   * @returns {number}
   */
  function lowerBoundPrefix(prefix, value) {
    let low = 0;
    let high = prefix.length;
    while (low < high) {
      const mid = (low + high) >> 1;
      if (prefix[mid] < value) low = mid + 1;
      else high = mid;
    }
    return low;
  }

  /**
   * Calculates the current visible range for virtual rendering.
   * @param {number} scrollTop
   * @param {number} viewportHeight
   * @returns {{start:number,end:number,top:number,bottom:number}}
   */
  function getVirtualRange(scrollTop, viewportHeight) {
    const prefix = state.virtual.prefixHeights;
    const totalItems = state.virtual.items.length;
    if (!totalItems) return { start: 0, end: 0, top: 0, bottom: 0 };

    // Conservative overscan to avoid jumps during measurement corrections
    const overscan = Math.min(
      config.VIRTUAL_OVERSCAN_PIXELS,
      viewportHeight * 0.75,
    );
    const rangeStartPx = Math.max(0, scrollTop - overscan);
    const rangeEndPx = scrollTop + viewportHeight + overscan;

    const start = Math.max(
      0,
      Math.min(totalItems, lowerBoundPrefix(prefix, rangeStartPx) - 1),
    );
    let end = Math.max(
      start + 1,
      Math.min(totalItems, lowerBoundPrefix(prefix, rangeEndPx) + 1),
    );

    // Limit batch size to avoid rendering too many at once
    const maxBatch =
      Math.ceil(
        (config.VIRTUAL_OVERSCAN_PIXELS * 2 + viewportHeight) /
          config.VIRTUAL_DEFAULT_ITEM_HEIGHT,
      ) + 4;
    if (end - start > maxBatch) {
      end = start + maxBatch;
    }

    const top = prefix[start] || 0;
    const totalHeight = prefix[prefix.length - 1] || 0;
    const bottom = Math.max(0, totalHeight - (prefix[end] || 0));

    return { start, end, top, bottom };
  }

  /**
   * Cleans up observers and media state for unmounted virtual nodes.
   * @param {HTMLElement} root
   */
  function cleanupVirtualNodes(root) {
    if (!root) return;
    const groups = root.querySelectorAll('.media-group');
    for (const group of groups) {
      const cleanupFns = group.__cleanupFns || [];
      for (const fn of cleanupFns) {
        try {
          fn();
        } catch (error) {
          console.warn('Failed virtual cleanup task', error);
        }
      }
      const videos = group.querySelectorAll('video');
      for (const video of videos) {
        try {
          video.pause();
        } catch (_) {
          // Ignore cleanup pause errors.
        }
      }
    }
  }

  /**
   * Builds a DOM node for a single post group.
   * @param {object} item
   * @param {number} itemIndex
   * @returns {HTMLElement|null}
   */
  function createMediaGroupElement(item, itemIndex) {
    if (!item?.code || item?.ad_id || item?.label === 'Sponsored') {
      return null;
    }

    const group = el('div', {
      className: 'media-group',
      'data-virtual-index': String(itemIndex),
    });
    group.__cleanupFns = [];

    group.appendChild(
      el('div', {
        className: 'media-group-info',
        innerHTML: `<strong>@${item.user?.username || 'unknown'}</strong> • ${
          item.taken_at
            ? new Date(item.taken_at * 1000).toLocaleDateString()
            : 'Unknown'
        }`,
      }),
    );

    const carouselItems = item.carousel_media || [item];

    for (const [index, media] of carouselItems.entries()) {
      const link = el('a', {
        href: `https://www.instagram.com/p/${item.code}/`,
        target: '_blank',
        rel: 'noopener noreferrer',
      });

      if (media.video_versions) {
        const container = el('div', { className: 'media-container' });
        const video = el('video', {
          src: getBestVideoUrl(media),
          controls: true,
          loop: true,
          volume: config.VIDEO_VOLUME,
          preload: 'metadata',
        });

        const disconnectVideoObserver = setupVideoAutoPauseOnViewport(video);
        group.__cleanupFns.push(disconnectVideoObserver);

        const posterUrl = getBestImageUrl(media);
        if (posterUrl) {
          const poster = el('img', { src: posterUrl });
          container.appendChild(poster);
        }

        container.appendChild(video);
        link.className = 'media-link';
        link.textContent = `Post by @${item.user?.username || 'unknown'}`;
        if (carouselItems.length > 1) {
          link.textContent += ` [${index + 1}/${carouselItems.length}]`;
        }

        group.appendChild(container);
        group.appendChild(link);
      } else if (media.image_versions2) {
        const image = el('img', { src: getBestImageUrl(media) });
        link.appendChild(image);
        group.appendChild(link);
      }
    }

    return group;
  }

  /**
   * Measures rendered virtual nodes and updates height cache when needed.
   */
  function measureVisibleVirtualItems() {
    if (state.virtual.isScrollLocked) return; // Don't measure during scroll-locked render
    const container = document.getElementById('media-wall-virtual-items');
    if (!container) return;

    let changed = false;
    const groups = container.querySelectorAll(
      '.media-group[data-virtual-index]',
    );
    for (const group of groups) {
      const index = Number(group.dataset.virtualIndex);
      const item = state.virtual.items[index];
      const key = getItemKey(item);
      if (!key) continue;

      const height = Math.ceil(group.offsetHeight);
      if (!height || height < 100) continue; // Skip suspiciously small heights (partial renders)

      const prev = state.virtual.measuredHeights[key] || 0;
      const diff = Math.abs(prev - height);
      // Only update on significant changes to avoid constant re-renders
      if (diff > 20) {
        state.virtual.measuredHeights[key] = height;
        changed = true;
      }
    }

    if (changed) {
      recomputePrefixHeights();
      // Don't force full re-render, just update range if needed
      const viewport = state.mediaWallViewport;
      if (viewport) {
        const range = getVirtualRange(
          viewport.scrollTop,
          viewport.clientHeight,
        );
        if (
          range.start !== state.virtual.visibleRange.start ||
          range.end !== state.virtual.visibleRange.end
        ) {
          renderVirtualWindow(false);
        }
      }
    }
  }

  /**
   * Renders only the visible slice of media into the virtual items container.
   * @param {boolean} force
   */
  function renderVirtualWindow(force = false) {
    const viewport = state.mediaWallViewport;
    const topSpacer = document.getElementById('media-wall-top-spacer');
    const itemsRoot = document.getElementById('media-wall-virtual-items');
    const bottomSpacer = document.getElementById('media-wall-bottom-spacer');
    if (!viewport || !topSpacer || !itemsRoot || !bottomSpacer) return;

    const scrollTop = viewport.scrollTop;
    const viewportHeight = viewport.clientHeight;
    const range = getVirtualRange(scrollTop, viewportHeight);
    const previous = state.virtual.visibleRange;
    const isSameRange =
      previous.start === range.start && previous.end === range.end;

    if (!force && isSameRange) {
      maybeFetchNextPage();
      return;
    }

    console.log(
      `[VIRTUAL] Render: scroll=${scrollTop} range=[${range.start}..${range.end}] total=${state.virtual.items.length} mounted=${itemsRoot.querySelectorAll('.media-group').length}`,
    );
    state.virtual.visibleRange = { start: range.start, end: range.end };
    const oldTotalHeight = state.virtual.lastTotalHeight;

    cleanupVirtualNodes(itemsRoot);
    itemsRoot.innerHTML = '';

    const frag = document.createDocumentFragment();
    for (let i = range.start; i < range.end; i++) {
      const item = state.virtual.items[i];
      const group = createMediaGroupElement(item, i);
      if (!group) continue;
      frag.appendChild(group);
    }
    itemsRoot.appendChild(frag);

    topSpacer.style.height = `${Math.max(0, Math.floor(range.top))}px`;
    bottomSpacer.style.height = `${Math.max(0, Math.floor(range.bottom))}px`;

    const newTotalHeight =
      state.virtual.prefixHeights[state.virtual.prefixHeights.length - 1] || 0;
    state.virtual.lastTotalHeight = newTotalHeight;

    requestAnimationFrame(() => {
      measureVisibleVirtualItems();
    });

    maybeFetchNextPage();
  }

  /**
   * Schedules a virtual render in the next animation frame.
   */
  function scheduleVirtualRender() {
    if (state.virtual.renderFrameId) return;
    state.virtual.renderFrameId = requestAnimationFrame(() => {
      state.virtual.renderFrameId = null;
      renderVirtualWindow();
    });
  }

  /**
   * Persists scroll state and rerenders virtual content while scrolling.
   */
  function onMediaWallScroll() {
    if (!state.mediaWallViewport || state.virtual.isScrollLocked) return;
    state.virtual.scrollTop = state.mediaWallViewport.scrollTop;
    scheduleVirtualRender();
  }

  /**
   * Legacy pagination for non-virtual mode based on distance from the bottom.
   */
  function onLegacyMediaWallScroll() {
    const viewport = state.mediaWallViewport;
    if (!viewport || state.isLoadingNextPage || !state.nextPageCursor) return;

    const remaining =
      viewport.scrollHeight - (viewport.scrollTop + viewport.clientHeight);
    if (remaining <= config.VIRTUAL_FETCH_THRESHOLD_PIXELS) {
      fetchMedia();
    }
  }

  /**
   * Fetches the next page when the viewport approaches the virtual end.
   */
  function maybeFetchNextPage() {
    const viewport = state.mediaWallViewport;
    if (!viewport || !state.nextPageCursor || state.isLoadingNextPage) return;

    const remaining =
      viewport.scrollHeight - (viewport.scrollTop + viewport.clientHeight);
    if (remaining <= config.VIRTUAL_FETCH_THRESHOLD_PIXELS) {
      fetchMedia();
    }
  }

  /**
   * Adds API media results into the virtual data store and rerenders.
   * @param {Array<object>} mediaList
   */
  function appendVirtualItems(mediaList) {
    let addedAny = false;
    for (const item of mediaList) {
      if (!item?.code || item?.ad_id || item?.label === 'Sponsored') {
        continue;
      }
      const key = getItemKey(item);
      if (!key || state.virtual.itemKeySet.has(key)) {
        continue;
      }
      state.virtual.itemKeySet.add(key);
      state.virtual.items.push(item);
      state.virtual.estimatedHeights[key] = estimateMediaGroupHeight(item);
      addedAny = true;
    }

    if (addedAny) {
      state.virtual.isScrollLocked = true;
      state.virtual.lastScrollTop = state.mediaWallViewport?.scrollTop || 0;
      recomputePrefixHeights();
      renderVirtualWindow(true);
      requestAnimationFrame(() => {
        state.virtual.isScrollLocked = false;
      });
    }
  }

  /**
   * Processes a list of media items and appends them to the DOM.
   * Groups items by post and visually separates each group.
   * @param {Array<object>} mediaList - An array of media items from the API.
   */
  function renderMediaItems(mediaList) {
    if (!config.VIRTUAL_SCROLL_ENABLED) {
      // Simple non-virtual rendering: just append all items
      let contentContainer = document.getElementById('media-wall-content');
      if (!contentContainer) {
        createMediaWallDom();
        contentContainer = document.getElementById('media-wall-content');
      }

      const frag = document.createDocumentFragment();
      for (const item of mediaList) {
        if (!item?.code || item?.ad_id || item?.label === 'Sponsored') {
          console.log('Skipping ad or non-media item:', item);
          continue;
        }

        const group = createMediaGroupElement(item, 0);
        if (group) frag.appendChild(group);
      }
      contentContainer.appendChild(frag);
      return;
    }

    // Virtual scrolling path
    if (!state.mediaWallContainer || !state.mediaWallViewport) {
      createMediaWallDom();
    }
    appendVirtualItems(mediaList);
  }

  // --- LOGIC & INITIALIZATION ---

  /**
   * Updates the visibility of loading and end-of-content indicators.
   */
  function updateLoadingIndicators() {
    const loadingIndicator = document.getElementById(
      'media-wall-loading-indicator',
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
    if (config.VIRTUAL_SCROLL_ENABLED) {
      maybeFetchNextPage();
      return;
    }

    // Non-virtual mode: add a sentinel element and use IntersectionObserver
    if (state.scrollObserver) {
      state.scrollObserver.disconnect();
      state.scrollObserver = null;
    }

    if (!state.nextPageCursor) {
      console.log('End of feed. Disabling infinite scroll.');
      updateLoadingIndicators();
      return;
    }

    let sentinel = document.getElementById('media-wall-scroll-sentinel');
    if (!sentinel) {
      sentinel = document.createElement('div');
      sentinel.id = 'media-wall-scroll-sentinel';
      sentinel.style.height = '1px';
      const contentContainer = document.getElementById('media-wall-content');
      if (contentContainer) contentContainer.appendChild(sentinel);
    }

    if (!sentinel.parentElement) return;

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
      {
        root: state.mediaWallContainer,
        rootMargin: '200px 0px',
        threshold: 0,
      },
    );
    state.scrollObserver.observe(sentinel);
  }

  /**
   * The main function to activate the media wall.
   * It determines the page type, finds the user ID if needed, and fetches the first batch of media.
   */
  async function initializeMediaWall(options = {}) {
    const { infinite = false } = options;
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
        `The media wall script does not support "${state.pageMode}" pages yet.`,
      );
      return;
    }

    // For profile or tagged pages, we need to find the user's ID first.
    if (['profile', 'tagged'].includes(state.pageMode)) {
      state.targetUserId = await findTargetUserId();
      if (!state.targetUserId) {
        alert(
          'Could not determine the Instagram User ID for this page. The script cannot continue.',
        );
        return;
      }
    }

    const sessionKey = getCurrentWallSessionKey();
    const restorePreviousState = canRestoreVirtualState(sessionKey);

    // Mark the wall as active and fetch the first page.
    if (!state.isWallActive) {
      state.isWallActive = true;
      state.infiniteWallMode = Boolean(infinite);
      if (restorePreviousState) {
        createMediaWallDom();
        state.nextPageCursor = state.virtual.nextPageCursor || null;
        renderVirtualWindow(true);
        if (state.mediaWallViewport) {
          state.mediaWallViewport.scrollTop = state.virtual.scrollTop || 0;
        }
        scheduleVirtualRender();
        updateLoadingIndicators();
        if (state.infiniteWallMode) {
          loadAllRemainingMedia();
        }
      } else {
        resetVirtualState(sessionKey);
        state.nextPageCursor = null; // Reset cursor for a new wall
        createMediaWallDom();
        await fetchMedia();
        if (state.infiniteWallMode) {
          loadAllRemainingMedia();
        }
      }
    }
  }

  /**
   * Injects the trigger button(s) into the Instagram UI.
   * It periodically checks for a suitable insertion point until one is found.
   */
  function insertTriggerButton() {
    if (
      document.getElementById('media-wall-trigger-button-profile') ||
      document.getElementById('media-wall-trigger-button-home') ||
      document.getElementById('media-wall-trigger-button-profile-infinite') ||
      document.getElementById('media-wall-trigger-button-home-infinite')
    ) {
      return; // Button already exists.
    }

    // Determine page mode early to choose correct insertion target
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

    const isHome = state.pageMode === 'home';
    const isTagged = state.pageMode === 'tagged';

    // For tagged pages, try both the main tablist and a fallback selector
    let targetSelector;
    if (isHome) {
      targetSelector = '.collapsible-content';
    } else if (isTagged) {
      targetSelector = 'div[role=tablist], main header section';
    } else {
      targetSelector = 'div[role=tablist]';
    }

    const normalButtonHtml = isHome
      ? `<article class="_ab6k _ab6l _ab6m" role="presentation" id="media-wall-trigger-button-home">
            <div>Click to Load Full-Size Media Wall (Virtual Scroll + Resume)</div>
         </article>`
      : `<a aria-selected="false" class="_aa_0" role="tab" tabindex="0" title="Open virtualized media wall (restores your previous scroll position)" id="media-wall-trigger-button-profile"><span class="_aacl _aaco _aacp _aacu _aacx _aad6 _aade">Media Wall</span></a>`;

    const infiniteButtonHtml = isHome
      ? `<article class="_ab6k _ab6l _ab6m" role="presentation" id="media-wall-trigger-button-home-infinite">
            <div>Click to Load Infinite Wall (Auto-load Entire Profile)</div>
         </article>`
      : `<a aria-selected="false" class="_aa_0" role="tab" tabindex="0" title="Open Infinite Wall and auto-load all posts without scrolling" id="media-wall-trigger-button-profile-infinite"><span class="_aacl _aaco _aacp _aacu _aacx _aad6 _aade">Infinite Wall</span></a>`;

    const createTrigger = html => {
      if (typeof generateElements === 'function') {
        return generateElements(html);
      }
      domParserContainer.innerHTML = html;
      return domParserContainer.firstElementChild;
    };

    const placeButton = insertionPoint => {
      if (!insertionPoint) {
        // For tagged pages, retry with different selector
        if (isTagged) {
          setTimeout(insertTriggerButton, 250);
        }
        return;
      }
      console.log('Injecting trigger button for', state.pageMode, 'page...');

      const triggerButton = createTrigger(normalButtonHtml);
      const infiniteTriggerButton = createTrigger(infiniteButtonHtml);

      triggerButton.onclick = e => {
        e.preventDefault();
        e.stopPropagation();
        initializeMediaWall({ infinite: false });
      };

      infiniteTriggerButton.onclick = e => {
        e.preventDefault();
        e.stopPropagation();
        initializeMediaWall({ infinite: true });
      };

      if (isHome) {
        insertionPoint.prepend(infiniteTriggerButton);
        insertionPoint.prepend(triggerButton);
      } else {
        insertionPoint.appendChild(triggerButton);
        insertionPoint.appendChild(infiniteTriggerButton);
      }
    };

    // Prefer `waitFor` from vanilla.js if available
    if (typeof waitFor === 'function') {
      waitFor(targetSelector).then(placeButton);
    } else {
      const insertionPoint = document.querySelector(targetSelector);
      if (insertionPoint) {
        placeButton(insertionPoint);
      } else {
        // Fallback: poll briefly until available
        setTimeout(insertTriggerButton, 250);
      }
    }
  }

  /**
   * The main entry point for the script.
   */
  function initialize() {
    console.log(
      'Instagram Full-Size Media Scroll Wall script loaded (virtual scrolling enabled).',
    );
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
