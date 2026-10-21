// ==UserScript==
// @name         Instagram Full-Size Gallery & Downloader (fork)
// @namespace    https://github.com/stupidgiraffe/instagram-full-size-gallery-downloader
// @author       William Harris; based on the original script by driver8
// @license      AGPL-3.0-or-later
// @description  Rebuilds Instagram into an uncropped full-size photo and video gallery with smooth zoom, continuous browsing, load-all, and direct downloads.
// @homepageURL  https://github.com/stupidgiraffe/instagram-full-size-gallery-downloader
// @supportURL   https://github.com/stupidgiraffe/instagram-full-size-gallery-downloader/issues
// @contributionURL https://buymeacoffee.com/stupidgiraffe
// @compatible   firefox
// @compatible   chrome
// @compatible   edge
// @compatible   brave

// @match        https://www.instagram.com/*
// @match        https://instagram.com/*

// @version      2.2.1

// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_setClipboard
// @grant        GM_download
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow

// @connect      instagram.com
// @connect      www.instagram.com
// @connect      i.instagram.com
// @connect      *.cdninstagram.com
// @connect      *.fbcdn.net

// @run-at       document-start

// @downloadURL https://update.greasyfork.org/scripts/592249/Instagram%20Full-Size%20Gallery%20%20Downloader.user.js
// @updateURL https://update.greasyfork.org/scripts/592249/Instagram%20Full-Size%20Gallery%20%20Downloader.meta.js

// @require      file://c:\mega\IDEs\javascript-userscripts-public\[fun] vanilla.js
// @require      file://c:\mega\IDEs\javascript-userscripts-public\[fun] vanilla - presets.js
// @require      file://C:\mega\IDEs\javascript-userscripts-public\Instagram-FullSize-Gallery-and-Downloader-fork.user.js

// ==/UserScript==

/*
 * Instagram Full-Size Gallery & Downloader
 *
 * Based on “Instagram full-size media scroll wall” by driver8.
 * Modern gallery rewrite and maintenance by William Harris, 2026.
 * Development assisted by AI tooling.
 *
 * This program is free software licensed under the GNU Affero General
 * Public License, version 3 or any later version. See LICENSE.
 */

(() => {
  'use strict';

  const win = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
  const doc = document;
  const APP_ID = '936619743392459';
  const ASBD_ID = '198387';
  const STORAGE_KEY = 'igFullSizeGallery.v2.settings';

  const DEFAULTS = Object.freeze({
    layout: 'fit', // fit | masonry | classic | contact
    imageSize: 'large', // medium | large | huge
    sort: 'profile', // profile | newest | oldest | largest | smallest
    filter: 'all', // all | image | video
    captions: false,
    autoLoad: true,
    thumbnailMode: 'contain', // contain | crop
    theme: 'dark',
    maxPages: 0, // 0 = unlimited
    videoVolume: 0.02,
    launcherPosition: 'bottom-right',
    viewerSize: 'compact', // compact | comfortable | large
    hideViewerControls: false,
  });

  const state = {
    settings: loadSettings(),
    routeKey: '',
    generation: 0,
    mode: 'profile',
    username: '',
    hasMore: false,
    exhausted: false,
    loading: false,
    loadAll: false,
    opened: false,
    pagesLoaded: 0,
    media: [],
    controller: null,
    observer: null,
    lightboxIndex: -1,
    starting: false,
    autoPaused: false,
    userPaused: false,
    nativeConsumed: new Map(),
    autoTimer: null,
    mediaById: new Map(),
    postGroups: new Map(),
    detailJobs: new Map(),
    detailPaused: false,
    detailRequests: 0,
    stats: {
      images: 0,
      videos: 0,
      carousels: 0,
      failures: 0,
    },
  };

  let ui = null;

  function loadSettings() {
    const candidates = [];
    function accept(raw) {
      try {
        const value = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (
          value &&
          typeof value === 'object' &&
          !Array.isArray(value) &&
          !value.then
        )
          candidates.push(value);
      } catch (_) {}
    }
    try {
      if (typeof GM_getValue === 'function')
        accept(GM_getValue(STORAGE_KEY, ''));
    } catch (_) {}
    try {
      accept(localStorage.getItem(STORAGE_KEY));
    } catch (_) {}
    candidates.sort(
      (a, b) => (Number(b._savedAt) || 0) - (Number(a._savedAt) || 0),
    );
    const stored = candidates[0] || {};
    if (typeof stored.hideViewerControls !== 'boolean') {
      if (typeof stored.hideGalleryControls === 'boolean')
        stored.hideViewerControls = stored.hideGalleryControls;
      else if (typeof stored.hideControls === 'boolean')
        stored.hideViewerControls = stored.hideControls;
      else if (typeof stored.controlsHidden === 'boolean')
        stored.hideViewerControls = stored.controlsHidden;
    }
    return { ...DEFAULTS, ...stored };
  }

  function saveSettings() {
    state.settings._savedAt = Math.max(
      Date.now(),
      (Number(state.settings._savedAt) || 0) + 1,
    );
    const raw = JSON.stringify(state.settings);
    try {
      localStorage.setItem(STORAGE_KEY, raw);
    } catch (_) {}
    try {
      if (typeof GM_setValue === 'function') {
        const result = GM_setValue(STORAGE_KEY, raw);
        if (result?.catch) result.catch(() => {});
      }
    } catch (_) {}
  }

  function ready(fn) {
    if (doc.body) fn();
    else doc.addEventListener('DOMContentLoaded', fn, { once: true });
  }

  function getCookie(name) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return (
      doc.cookie.match(new RegExp(`(?:^|;\\s*)${escaped}=([^;]+)`))?.[1] || ''
    );
  }

  function headers() {
    const result = {
      Accept: 'application/json, text/plain, */*',
      'X-IG-App-ID': String(
        win._sharedData?.config?.instagramWebDesktopFBAppId || APP_ID,
      ),
      'X-ASBD-ID': String(win._sharedData?.config?.ASBD_ID || ASBD_ID),
      'X-Requested-With': 'XMLHttpRequest',
    };
    const csrf = win._sharedData?.config?.csrf_token || getCookie('csrftoken');
    if (csrf) result['X-CSRFToken'] = csrf;
    const claim =
      win._sharedData?.config?.www_claim || win.__initialData?.wwwClaim;
    if (claim) result['X-IG-WWW-Claim'] = claim;
    return result;
  }

  function gmJson(url, options = {}) {
    return new Promise((resolve, reject) => {
      if (typeof GM_xmlhttpRequest !== 'function') {
        reject(new Error('GM_xmlhttpRequest unavailable'));
        return;
      }
      if (options.signal?.aborted) {
        reject(new DOMException('Aborted', 'AbortError'));
        return;
      }
      const request = GM_xmlhttpRequest({
        method: options.method || 'GET',
        url,
        headers: options.headers || {},
        data:
          options.body instanceof URLSearchParams
            ? options.body.toString()
            : options.body,
        responseType: 'text',
        timeout: 30000,
        onload: response => {
          if (response.status < 200 || response.status >= 300) {
            const error = new Error(`HTTP ${response.status}`);
            error.status = response.status;
            reject(error);
            return;
          }
          try {
            const value = decodeResponse(
              response.responseText ?? response.response,
            );
            resolve(value);
          } catch (error) {
            reject(new Error(`Invalid JSON: ${error.message}`));
          }
        },
        onerror: () =>
          reject(new Error('NetworkError while requesting Instagram data')),
        ontimeout: () => reject(new Error('Instagram request timed out')),
        onabort: () => reject(new DOMException('Aborted', 'AbortError')),
      });
      options.signal?.addEventListener('abort', () => request.abort?.(), {
        once: true,
      });
    });
  }

  async function requestJson(url, options = {}) {
    try {
      const response = await (originalFetch || win.fetch.bind(win))(url, {
        method: options.method || 'GET',
        headers: options.headers || {},
        body: options.body,
        credentials: 'include',
        signal: options.signal,
      });
      if (!response.ok) {
        const error = new Error(
          `HTTP ${response.status} ${response.statusText}`,
        );
        error.status = response.status;
        throw error;
      }
      return decodeResponse(await response.text());
    } catch (error) {
      if (error?.name === 'AbortError') throw error;
      if (error?.status || error?.responseFormat) throw error;
      return gmJson(url, options);
    }
  }

  function detectRoute() {
    const path = location.pathname;
    if (/^\/?$/.test(path))
      return { mode: 'home', username: '', key: `home:${location.href}` };
    if (/^\/(p|reel|tv)\//.test(path))
      return { mode: 'post', username: '', key: `post:${path}` };
    if (/^\/explore\//.test(path))
      return { mode: 'explore', username: '', key: `explore:${path}` };

    const username = decodeURIComponent(path.match(/^\/([^/?#]+)/)?.[1] || '');
    const reserved = new Set([
      'accounts',
      'direct',
      'stories',
      'about',
      'developer',
    ]);
    const clean = reserved.has(username) ? '' : username;
    const tagged = /\/tagged\/?$/.test(path);
    return {
      mode: tagged ? 'tagged' : 'profile',
      username: clean,
      key: `${tagged ? 'tagged' : 'profile'}:${clean}:${path}`,
    };
  }

  const VERSION = '2.2.1';
  const POST_QUERY_ID = '27128499623469141';
  const native = {
    key: '',
    items: new Map(),
    profileCodes: new Set(),
    profileOrder: new Map(),
    pendingUpdates: null,
    scripts: new WeakSet(),
    pageInfo: null,
    feedPages: new Map(),
    request: null,
    userId: '',
    expectedPosts: null,
    replayRequests: 0,
    replayPages: 0,
    requests: 0,
    responses: 0,
    errors: [],
    hooks: [],
  };
  const originalFetch =
    typeof win.fetch === 'function' ? win.fetch.bind(win) : null;
  const refreshRequests = new Map();
  const mediaBindings = new WeakMap();

  function routeCache(route = detectRoute()) {
    if (native.key !== route.key) {
      native.key = route.key;
      native.items.clear();
      native.profileCodes.clear();
      native.profileOrder.clear();
      native.scripts = new WeakSet();
      native.pageInfo = null;
      native.feedPages.clear();
      native.request = null;
      native.userId = '';
      native.expectedPosts = null;
      native.replayRequests = 0;
      native.replayPages = 0;
    }
    return native;
  }

  function mediaMatchesRoute(media, route) {
    if (!media || typeof media !== 'object') return false;
    const code = media.code || media.shortcode;
    const owner = media.user || media.owner;
    if (route.mode === 'profile')
      return (
        String(owner?.username || '').toLowerCase() ===
          route.username.toLowerCase() ||
        native.profileCodes.has(String(code || ''))
      );
    if (route.mode === 'post')
      return (
        code === location.pathname.match(/^\/(?:p|reel|tv)\/([^/?#]+)/)?.[1]
      );
    return route.mode === 'home' || route.mode === 'tagged';
  }

  function isMediaNode(value) {
    return Boolean(
      value &&
      (value.code || value.shortcode || value.pk || value.id) &&
      (value.image_versions2 ||
        value.display_url ||
        value.video_versions ||
        value.video_url ||
        value.carousel_media ||
        value.edge_sidecar_to_children ||
        value.carousel_media_items ||
        value.display_uri ||
        value.media_type),
    );
  }

  function mediaSignature(media) {
    return JSON.stringify(media);
  }

  function postKey(media) {
    return String(
      media?.code || media?.shortcode || media?.pk || media?.id || '',
    );
  }

  function postShape(media) {
    const arrays = [
      media?.carousel_media,
      media?.carousel_media_items,
      media?.edge_sidecar_to_children?.edges
        ?.map(edge => edge.node)
        .filter(Boolean),
    ].filter(items => Array.isArray(items) && items.length);
    const unique = items => {
      const seen = new Set();
      return items.filter(child => {
        const id = child?.pk || child?.id;
        if (!id) return true;
        const key = String(id);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };
    const children =
      arrays.map(unique).sort((a, b) => b.length - a.length)[0] || [];
    const declared = [
      media?.carousel_media_count,
      media?.carousel_count,
      media?.edge_sidecar_to_children?.count,
    ]
      .map(Number)
      .filter(value => Number.isSafeInteger(value) && value > 0);
    const expected = Math.max(
      0,
      Number(media?.__expectedSlides) || 0,
      ...declared,
      ...arrays.map(items => items.length),
    );
    const carousel =
      Number(media?.media_type) === 8 ||
      /Sidecar/.test(media?.__typename || '') ||
      expected > 1 ||
      children.length > 1;
    const hasSource = child =>
      (isVideo(child) ? videoCandidates(child) : imageCandidates(child))
        .length > 0;
    const complete =
      !media?.__preview &&
      (carousel
        ? (declared.length > 0 || media.__fullDetails === true) &&
          children.length >= (expected || 2) &&
          children.every(hasSource)
        : hasSource(media));
    return { children, expected, carousel, complete };
  }

  function mergePostMedia(previous, incoming) {
    if (!previous) return incoming;
    if (incoming.__preview && !previous.__preview) return previous;
    const before = postShape(previous),
      after = postShape(incoming);
    if (
      previous.__preview &&
      !before.carousel &&
      after.complete &&
      !after.carousel
    )
      return incoming;
    const merged = {
      ...previous,
      ...incoming,
      __preview: Boolean(incoming.__preview),
      user: incoming.user || incoming.owner || previous.user || previous.owner,
    };
    const useIncoming =
      after.children.length > before.children.length ||
      (after.children.length === before.children.length &&
        (!before.complete || after.complete));
    let children = useIncoming ? after.children : before.children;
    // Partial responses can contain different slides, not just a shorter prefix.
    // Keep stable identities in their known order; update sources in place.
    if (
      before.children.length &&
      after.children.length &&
      !after.complete &&
      before.children.every(child => child.pk || child.id) &&
      after.children.every(child => child.pk || child.id)
    ) {
      const incomingById = new Map(
        after.children.map(child => [
          String(child.pk || child.id).split('_')[0],
          child,
        ]),
      );
      const seen = new Set();
      children = before.children.map(child => {
        const id = String(child.pk || child.id).split('_')[0];
        seen.add(id);
        return incomingById.has(id)
          ? { ...child, ...incomingById.get(id) }
          : child;
      });
      children.push(
        ...after.children.filter(
          child => !seen.has(String(child.pk || child.id).split('_')[0]),
        ),
      );
    }
    delete merged.carousel_media;
    delete merged.carousel_media_items;
    delete merged.edge_sidecar_to_children;
    if (children.length) merged.carousel_media = children;
    if (before.carousel || after.carousel) {
      merged.media_type = 8;
      merged.__expectedSlides = Math.max(
        before.expected,
        after.expected,
        children.length,
      );
    }
    return merged;
  }

  function cacheMedia(media, route) {
    if (detectRoute().key !== route.key) return;
    const cache = routeCache(route);
    const key = postKey(media);
    if (!key) return;
    const previous = cache.items.get(key);
    media = mergePostMedia(previous?.media, media);
    const signature = mediaSignature(media);
    if (previous?.signature === signature) return;
    cache.items.set(key, { media, signature });
    if (state.opened && state.routeKey === route.key && state.postGroups.size) {
      if (native.pendingUpdates) {
        native.pendingUpdates.set(key, media);
        return;
      }
      appendRawMedia([media]);
      state.nativeConsumed.set(key, signature);
      ui?.refresh();
      Promise.resolve().then(resumeUnfinishedDetails);
    }
  }

  function mediaIdForPost(media) {
    const id = String(media.pk || media.id || '');
    if (/^\d+(?:_\d+)?$/.test(id)) return id;
    const code = media.code || media.shortcode || '';
    if (!/^[A-Za-z0-9_-]{1,11}$/.test(code)) return '';
    const alphabet =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let value = 0n;
    for (const character of code)
      value = value * 64n + BigInt(alphabet.indexOf(character));
    return value > 0n ? String(value) : '';
  }

  function detailMedia(json, original) {
    const code = original.code || original.shortcode;
    const id = mediaIdForPost(original).split('_')[0];
    const candidates = [];
    const seen = new WeakSet();
    let remaining = 24000;
    function walk(media, depth = 0) {
      if (!media || depth > 45 || --remaining < 0) return;
      if (typeof media === 'string') {
        if (/^[\[{]/.test(media.trim()))
          for (const value of parsePayload(media)) walk(value, depth + 1);
        return;
      }
      if (typeof media !== 'object' || seen.has(media)) return;
      seen.add(media);
      const returnedCode = media.code || media.shortcode;
      const matches =
        code && returnedCode
          ? returnedCode === code
          : id && String(media.pk || media.id || '').split('_')[0] === id;
      if (matches && isMediaNode(media)) candidates.push(media);
      for (const child of Object.values(media)) walk(child, depth + 1);
    }
    walk(json);
    return candidates.sort(
      (a, b) =>
        postShape(b).children.length - postShape(a).children.length ||
        Number(postShape(b).complete) - Number(postShape(a).complete),
    )[0];
  }

  async function requestPostJson(url, options, signal) {
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (signal.aborted) abort();
    else signal.addEventListener('abort', abort, { once: true });
    const timer = setTimeout(abort, 15000);
    try {
      return await requestJson(url, { ...options, signal: controller.signal });
    } catch (error) {
      if (error?.status) recordNativeFailure(new URL(url), error.status);
      if (error?.name === 'AbortError' && !signal.aborted)
        throw new Error('Post details timed out');
      throw error;
    } finally {
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
    }
  }

  async function resolvePostDetailsAttempt(
    original,
    generation,
    route,
    signal,
  ) {
    const key = postKey(original);
    const code = original.code || original.shortcode;
    const requests = [];
    if (code) {
      const body = new URLSearchParams({
        doc_id: POST_QUERY_ID,
        server_timestamps: 'true',
        variables: JSON.stringify({
          shortcode: code,
          __relay_internal__pv__PolarisAIGMMediaWebLabelEnabledrelayprovider: false,
        }),
      });
      requests.push({
        url: new URL('/graphql/query', location.origin).href,
        options: {
          method: 'POST',
          body,
          headers: {
            ...headers(),
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-FB-Friendly-Name': 'PolarisPostRootQuery',
          },
        },
      });
    }
    const id = mediaIdForPost(original);
    if (id)
      requests.push({
        url: new URL(
          `/api/v1/media/${encodeURIComponent(id)}/info/`,
          location.origin,
        ).href,
        options: { headers: headers() },
      });
    let failure = new Error(
      'Instagram did not return every slide in this post',
    );
    const attempts = [];
    let retryable = false;
    for (const request of requests) {
      checkSession(generation, route, signal);
      const cached = native.items.get(key)?.media;
      if (cached && postShape(cached).complete) return cached;
      if (state.detailPaused)
        throw new Error('Post loading paused by Instagram');
      try {
        state.detailRequests += 1;
        const json = await requestPostJson(
          request.url,
          request.options,
          signal,
        );
        checkSession(generation, route, signal);
        if (json?.status === 'fail') {
          const error = new Error(
            json.message || 'Instagram rejected the post request',
          );
          if (
            /login_required|challenge_required|checkpoint_required/i.test(
              error.message,
            )
          )
            error.status = 401;
          if (/rate.limit|please wait|few minutes|throttl/i.test(error.message))
            error.status = 429;
          throw error;
        }
        const media = detailMedia(json, original);
        if (!media) {
          const envelopes = Array.isArray(json) ? json : [json];
          const errors = envelopes.flatMap(value =>
            Array.isArray(value?.errors) ? value.errors : [],
          );
          const codes = errors
            .map(error => error.code || error.extensions?.code)
            .filter(Boolean)
            .map(String)
            .filter(value => /^[\w-]{1,60}$/.test(value));
          throw new Error(
            errors.length
              ? `GraphQL returned ${errors.length} error(s)${codes.length ? ` (${codes.join(', ')})` : ''}`
              : 'Response contained no matching post',
          );
        }
        // detailMedia has already verified the requested post identity. A profile can contain another author's collaborative post.
        cacheMedia(
          {
            ...media,
            code: code || media.code,
            __preview: false,
            __fullDetails: true,
          },
          route,
        );
        const result = native.items.get(key)?.media;
        if (result && postShape(result).complete) return result;
        const incomplete = new Error(
          'Matching post is missing full slide sources',
        );
        incomplete.retryable = true;
        throw incomplete;
      } catch (error) {
        if (error?.name === 'AbortError') throw error;
        failure = error;
        retryable ||= Boolean(
          error.retryable ||
          error.responseFormat ||
          error.status >= 500 ||
          /network|fetch|timed out/i.test(error.message || ''),
        );
        const endpoint =
          request.options.method === 'POST' ? 'graphql' : 'media-info';
        attempts.push(`${endpoint}: ${error.message || String(error)}`);
        if ([401, 403, 429].includes(error?.status)) {
          state.detailPaused = true;
          throw error;
        }
      }
    }
    failure.message = attempts.join('; ') || failure.message;
    failure.retryable = retryable;
    throw failure;
  }

  function waitForRecovery(delay, signal) {
    return new Promise((resolve, reject) => {
      const abort = () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      };
      const timer = setTimeout(() => {
        signal.removeEventListener('abort', abort);
        resolve();
      }, delay);
      if (signal.aborted) abort();
      else signal.addEventListener('abort', abort, { once: true });
    });
  }

  async function resolvePostDetails(original, generation, route, signal) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      checkSession(generation, route, signal);
      try {
        return await resolvePostDetailsAttempt(
          original,
          generation,
          route,
          signal,
        );
      } catch (error) {
        if (
          signal.aborted ||
          state.detailPaused ||
          !error.retryable ||
          attempt === 2
        )
          throw error;
        await waitForRecovery(attempt === 0 ? 1000 : 4000, signal);
      }
    }
  }

  async function expandPosts(items, generation, route, signal) {
    const jobs = state.detailJobs;
    const pending = items.filter(
      media => !postShape(media).complete && !isAd(media),
    );
    let next = 0;
    async function worker() {
      while (next < pending.length && !state.detailPaused) {
        checkSession(generation, route, signal);
        const original = pending[next++],
          key = postKey(original);
        if (state.postGroups.get(key)?.complete) continue;
        let job = jobs.get(key);
        if (job?.status === 'done') {
          jobs.delete(key);
          job = null;
        }
        if (!job) {
          job = { status: 'loading', promise: null };
          jobs.set(key, job);
          job.promise = resolvePostDetails(original, generation, route, signal)
            .then(() => {
              job.status = 'done';
            })
            .catch(error => {
              if (signal.aborted || error?.name === 'AbortError') {
                jobs.delete(key);
                throw error;
              }
              job.status = 'failed';
              job.error = error.message || String(error);
            });
        }
        ui?.refresh();
        await job.promise;
        checkSession(generation, route, signal);
        ui?.refresh();
      }
    }
    await Promise.all([worker(), worker()]);
  }

  function incompletePosts() {
    return [...state.postGroups.values()].filter(group => !group.complete);
  }

  function resumeUnfinishedDetails() {
    if (!state.opened || state.loading || state.detailPaused) return;
    if (!state.postGroups.size && native.items.size && state.autoPaused) {
      loadNextPage();
      return;
    }
    if (
      incompletePosts().some(group => {
        const job = state.detailJobs.get(postKey(group.media));
        return !job || job.status === 'done';
      })
    )
      loadNextPage(true);
  }

  async function retryIncompletePosts() {
    if (state.loading || !state.opened) return;
    state.detailJobs.clear();
    state.detailPaused = false;
    await loadNextPage(true);
  }

  function parsePayload(text) {
    if (typeof text !== 'string' || text.length > 12_000_000) return [];
    const clean = text
      .trim()
      .replace(/^for\s*\(;;\)\s*;\s*/, '')
      .replace(/^\)\]\}',?\s*/, '');
    try {
      return [JSON.parse(clean)];
    } catch (_) {}
    const values = [];
    for (const line of clean.split('\n')) {
      try {
        values.push(JSON.parse(line));
      } catch (_) {}
    }
    return values;
  }

  function decodeResponse(value) {
    if (value && typeof value === 'object') return value;
    const values = parsePayload(value);
    if (values.length) return values.length === 1 ? values[0] : values;
    const error = new Error(
      /^\s*</.test(value || '')
        ? 'Instagram returned HTML instead of post data'
        : 'Instagram returned an unreadable data response',
    );
    error.responseFormat = true;
    throw error;
  }

  function profileRequestMatch(context, route) {
    if (!context) return null;
    const username =
      context.variables?.username || context.variables?.data?.username;
    if (username)
      return String(username).toLowerCase() === route.username.toLowerCase();
    const url = new URL(context.url);
    const target = url.pathname.match(
      /\/feed\/user\/(?:username\/)?([^/]+)/,
    )?.[1];
    if (target && !/^\d+$/.test(target))
      return target.toLowerCase() === route.username.toLowerCase();
    const id = target || context.variables?.id || context.variables?.user_id;
    return id && native.userId ? String(id) === native.userId : null;
  }

  function rebuildFeedOrder() {
    const order = new Map(),
      visited = new Set();
    let cursor = '',
      page = native.feedPages.get(cursor),
      info = null;
    while (page && !visited.has(cursor)) {
      visited.add(cursor);
      for (const key of page.codes)
        if (!order.has(key)) order.set(key, order.size);
      info = { more: page.more, cursor: page.cursor, rooted: true };
      if (!page.more) break;
      if (!page.cursor || visited.has(page.cursor)) {
        info.stalled = true;
        break;
      }
      cursor = page.cursor;
      page = native.feedPages.get(cursor);
    }
    native.profileOrder = order;
    native.pageInfo = info || { more: true, cursor: null, rooted: false };
  }

  function recordFeedPage(items, info, route, source, context) {
    for (const media of items) {
      const key = postKey(media);
      if (!key || isAd(media)) continue;
      if (media.code || media.shortcode)
        native.profileCodes.add(String(media.code || media.shortcode));
      cacheMedia(
        media.display_uri &&
          !media.display_url &&
          !media.image_versions2 &&
          !media.carousel_media
          ? { ...media, __preview: true, display_url: media.display_uri }
          : media,
        route,
      );
    }
    if (typeof info.more !== 'boolean') return false;
    // An observed request identifies which page this response belongs to. A
    // response from a later cursor cannot prove that earlier pages were read.
    const cursor = context?.cursorKnown
      ? context.cursor || ''
      : source === 'page data'
        ? ''
        : native.pageInfo?.more
          ? native.pageInfo.cursor || ''
          : '';
    const previous = native.feedPages.get(cursor);
    const currentCodes = items
      .filter(media => !isAd(media))
      .map(postKey)
      .filter(Boolean);
    const staleBoot = source === 'page data' && previous?.source === 'network';
    const codes = [
      ...new Set(
        staleBoot
          ? [...previous.codes, ...currentCodes]
          : [...currentCodes, ...(previous?.codes || [])],
      ),
    ];
    native.feedPages.set(
      cursor,
      staleBoot
        ? { ...previous, codes }
        : { codes, more: info.more, cursor: info.cursor || null, source },
    );
    if (context?.replayable && profileRequestMatch(context, route) !== false)
      native.request = context;
    rebuildFeedOrder();
    return true;
  }

  function ingestPayload(value, route, source = 'network', context = null) {
    if (detectRoute().key !== route.key) return;
    routeCache(route);
    const visited = new WeakSet();
    let remaining = 24000;
    let feedAccepted = false;
    function walk(
      node,
      path = '',
      depth = 0,
      inFeed = false,
      profileOwner = false,
    ) {
      if (!node || depth > 45 || --remaining < 0) return;
      if (typeof node === 'string') {
        if (
          node.length < 4_000_000 &&
          /^[\[{]/.test(node.trim()) &&
          /image_versions2|display_url|carousel_media/.test(node)
        ) {
          for (const parsed of parsePayload(node))
            walk(parsed, path, depth + 1, inFeed, profileOwner);
        }
        return;
      }
      if (typeof node !== 'object' || visited.has(node)) return;
      visited.add(node);
      const owner =
        String(node.username || '').toLowerCase() ===
          route.username.toLowerCase() && Boolean(route.username);
      if (owner) {
        native.userId = String(node.pk || node.id || native.userId);
        const count = Number(
          node.media_count ?? node.edge_owner_to_timeline_media?.count,
        );
        if (Number.isSafeInteger(count) && count >= 0)
          native.expectedPosts = count;
      }
      const feed =
        inFeed ||
        /timeline|usertags|tagged|polaris_ordered_timeline|edge_owner_to_timeline_media/.test(
          path,
        );
      const items = Array.isArray(node.edges)
        ? node.edges.map(edge => edge.node?.media || edge.node).filter(Boolean)
        : (node.items || node.feed_items || []).map?.(
            item => item.media || item.media_or_ad || item,
          ) || [];
      const profileConnection =
        /(?:user_timeline_graphql_connection|polaris_ordered_timeline_connection|edge_owner_to_timeline_media)$/.test(
          path,
        );
      const restFeed = /\/api\/v1\/feed\/user\//.test(context?.url || '');
      const connection = node.page_info && Array.isArray(node.edges) && feed;
      const rest =
        typeof node.more_available === 'boolean' &&
        (Array.isArray(node.items) || Array.isArray(node.feed_items));
      if (route.mode === 'profile' && (connection || rest)) {
        const match = profileRequestMatch(context, route);
        const eligible =
          match !== false &&
          (match === true ||
            profileOwner ||
            owner ||
            items.some(media => mediaMatchesRoute(media, route)));
        // Tagged/reels/suggestions/detail connections must not mutate the
        // profile's membership, order, cursor, or terminal state.
        if (!eligible || !(profileConnection || restFeed)) return;
        const count = Number(node.count);
        if (
          /edge_owner_to_timeline_media$/.test(path) &&
          node.count != null &&
          Number.isSafeInteger(count) &&
          count >= 0
        )
          native.expectedPosts = count;
        feedAccepted =
          recordFeedPage(
            items,
            node.page_info
              ? {
                  more: node.page_info.has_next_page,
                  cursor: node.page_info.end_cursor,
                }
              : { more: node.more_available, cursor: node.next_max_id },
            route,
            source,
            context,
          ) || feedAccepted;
        return;
      }
      if (
        route.mode !== 'profile' &&
        (connection || rest) &&
        (source === 'network' ||
          items.some(media => mediaMatchesRoute(media, route)))
      ) {
        for (const media of items)
          if (mediaMatchesRoute(media, route)) cacheMedia(media, route);
        const info = node.page_info;
        native.pageInfo = info
          ? { more: info.has_next_page, cursor: info.end_cursor || null }
          : { more: node.more_available, cursor: node.next_max_id || null };
      }
      if (isMediaNode(node)) {
        if (
          mediaMatchesRoute(node, route) &&
          (route.mode !== 'tagged' || feed || source === 'network')
        )
          cacheMedia(node, route);
        return;
      }
      for (const [key, child] of Object.entries(node)) {
        if (/suggested|recommend|chaining|reels_tray/.test(key)) continue;
        walk(child, `${path}.${key}`, depth + 1, feed, profileOwner || owner);
      }
    }
    const updates = new Map();
    native.pendingUpdates = updates;
    try {
      walk(value);
    } finally {
      native.pendingUpdates = null;
    }
    if (state.opened && state.routeKey === route.key && state.postGroups.size) {
      if (updates.size) {
        appendRawMedia([...updates.values()]);
        for (const key of updates.keys())
          state.nativeConsumed.set(key, native.items.get(key)?.signature);
        Promise.resolve().then(resumeUnfinishedDetails);
      } else if (feedAccepted) orderGallery();
    }
    if (
      state.opened &&
      !state.postGroups.size &&
      state.autoPaused &&
      native.items.size
    )
      Promise.resolve().then(resumeUnfinishedDetails);
    if (
      state.opened &&
      !state.loading &&
      state.profilePrepared &&
      feedAccepted
    ) {
      if (native.request) state.profileSweep = false;
      state.hasMore =
        state.profileSweep ||
        native.pageInfo?.more !== false ||
        coverageGap() > 0 ||
        pendingNativeItems().length > 0;
      state.exhausted = !state.hasMore;
      if (state.autoPaused && !state.userPaused && state.settings.autoLoad) {
        state.autoPaused = false;
        scheduleAutoLoad();
      }
      if (state.exhausted && !incompletePosts().length)
        ui?.setStatus(
          `Loaded ${state.media.length} media items — end reached.`,
        );
      ui?.refresh();
    }
    return feedAccepted;
  }

  function scanPageData(route = detectRoute()) {
    routeCache(route);
    for (const script of doc.querySelectorAll(
      'script[type="application/json"], script[data-sjs]',
    )) {
      if (native.scripts.has(script) || !script.textContent) continue;
      native.scripts.add(script);
      for (const value of parsePayload(script.textContent))
        ingestPayload(value, route, 'page data');
    }
  }

  function scanAvailableMedia(route = detectRoute()) {
    scanVisibleMedia(route);
    scanPageData(route);
  }

  async function waitForProfileReady(generation, route, signal) {
    const deadline = Date.now() + 20000;
    while (Date.now() < deadline) {
      checkSession(generation, route, signal);
      scanAvailableMedia(route);
      if (native.items.size || native.pageInfo?.more === false) return;
      ui.setStatus('Waiting for Instagram’s first profile posts…');
      await waitForRecovery(200, signal);
    }
    throw new Error(
      'Instagram has not loaded the profile posts yet. Press Load more to retry.',
    );
  }

  function normalizeMediaUrl(value) {
    if (typeof value !== 'string') return '';
    const decoded = value
      .replace(/&amp;/g, '&')
      .replace(/\\u0026/gi, '&')
      .replace(/\\\//g, '/');
    try {
      const url = new URL(decoded, location.href);
      return ['http:', 'https:', 'blob:'].includes(url.protocol)
        ? url.href
        : '';
    } catch (_) {
      return '';
    }
  }

  function scanVisibleMedia(route = detectRoute()) {
    if (route.key !== detectRoute().key) return;
    routeCache(route);
    const groups = new Map();
    const selectors =
      route.mode === 'post'
        ? 'article img, article video, main img, main video'
        : 'main a[href] img, main a[href] video, article img, article video';
    for (const element of doc.querySelectorAll(selectors)) {
      if (element.closest('#ig-full-size-gallery-host')) continue;
      const article = element.closest('article');
      let anchor = element.closest(
        'a[href*="/p/"], a[href*="/reel/"], a[href*="/tv/"]',
      );
      if (!anchor && article)
        anchor = article.querySelector(
          'a[href*="/p/"], a[href*="/reel/"], a[href*="/tv/"]',
        );
      const code = (
        anchor?.href || (route.mode === 'post' ? location.href : '')
      ).match(/\/(?:p|reel|tv)\/([^/?#]+)/)?.[1];
      if (!code || /profile (picture|photo)|avatar/i.test(element.alt || ''))
        continue;
      const width =
        element.naturalWidth || element.videoWidth || element.width || 0;
      const height =
        element.naturalHeight || element.videoHeight || element.height || 0;
      if (element.tagName === 'IMG' && width > 0 && width < 100 && height < 100)
        continue;
      const current = normalizeMediaUrl(element.currentSrc || element.src);
      if (!current) continue;
      if (route.mode === 'profile' && !native.profileCodes.has(code)) {
        native.profileCodes.add(code);
        native.scripts = new WeakSet();
      }
      const candidates = [];
      if (element.tagName === 'IMG') {
        for (const piece of (element.srcset || '').split(/,\s*(?=https?:)/)) {
          const match = piece.trim().match(/^(\S+)\s+(\d+)w$/);
          if (match)
            candidates.push({
              url: normalizeMediaUrl(match[1]),
              width: Number(match[2]),
              height:
                width && height
                  ? Math.round((Number(match[2]) * height) / width)
                  : 0,
            });
        }
        candidates.push({ url: current, width, height });
      }
      let parent = groups.get(code);
      if (!parent) {
        parent = {
          code,
          __preview: true,
          user: { username: route.username },
          carousel_media: [],
        };
        groups.set(code, parent);
      }
      if (
        parent.carousel_media.some(
          child =>
            (child.video_url ||
              child.image_versions2?.candidates?.at(-1)?.url) === current,
        )
      )
        continue;
      parent.carousel_media.push(
        element.tagName === 'VIDEO'
          ? {
              is_video: true,
              video_url: current,
              image_versions2: {
                candidates: element.poster
                  ? [{ url: normalizeMediaUrl(element.poster) }]
                  : [],
              },
            }
          : { image_versions2: { candidates } },
      );
    }
    if (groups.size) ingestPayload([...groups.values()], route, 'visible page');
  }

  function observedEndpoint(input) {
    try {
      const url = new URL(
        typeof input === 'string' ? input : input.url,
        location.href,
      );
      if (
        !['www.instagram.com', 'instagram.com', 'i.instagram.com'].includes(
          url.hostname,
        )
      )
        return null;
      if (
        !/^\/(?:graphql\/query\/?|api\/graphql\/?|api\/v1\/(?:feed\/(?:user\/|timeline\/)|usertags\/|users\/(?:web_profile_info\/|[^/]+\/info\/)|media\/[^/]+\/info\/))/.test(
          url.pathname,
        )
      )
        return null;
      return url;
    } catch (_) {
      return null;
    }
  }

  function recordNativeFailure(url, status) {
    native.errors.push({
      path: url.pathname.replace(/\/\d+(?:_\d+)?\//g, '/:id/'),
      status: Number(status) || 0,
    });
    if (native.errors.length > 8) native.errors.shift();
  }

  function describeRequest(
    url,
    method = 'GET',
    body = null,
    suppliedHeaders = {},
  ) {
    const result = {
      url: url.href,
      method: String(method).toUpperCase(),
      headers: {},
      variables: null,
      form: null,
      cursor: null,
      cursorKnown: false,
      replayable: false,
    };
    try {
      const entries =
        typeof suppliedHeaders.forEach === 'function'
          ? (() => {
              const values = [];
              suppliedHeaders.forEach((value, key) =>
                values.push([key, value]),
              );
              return values;
            })()
          : Array.isArray(suppliedHeaders)
            ? suppliedHeaders
            : Object.entries(suppliedHeaders || {});
      for (const [key, value] of entries)
        if (
          /^(?:content-type|x-ig-app-id|x-asbd-id|x-requested-with|x-csrftoken|x-ig-www-claim|x-fb-lsd|x-fb-friendly-name)$/i.test(
            key,
          )
        )
          result.headers[key.toLowerCase()] = String(value);
      if (
        Object.prototype.toString.call(body) === '[object URLSearchParams]' &&
        !result.headers['content-type']
      ) {
        result.headers['content-type'] =
          'application/x-www-form-urlencoded;charset=UTF-8';
      }
      if (
        /\/api\/v1\/feed\/user\//.test(url.pathname) &&
        result.method === 'GET'
      ) {
        result.cursor = url.searchParams.get('max_id');
        result.cursorKnown = result.replayable = true;
        result.cursorField = 'max_id';
      } else {
        const params =
          result.method === 'GET'
            ? url.searchParams
            : new URLSearchParams(
                typeof body === 'string' ? body : body?.toString() || '',
              );
        result.variables = JSON.parse(params.get('variables') || 'null');
        if (
          result.variables &&
          typeof result.variables === 'object' &&
          !Array.isArray(result.variables)
        ) {
          result.form = params.toString();
          result.cursorField = Object.hasOwn(result.variables, 'max_id')
            ? 'max_id'
            : Object.hasOwn(result.variables.data || {}, 'max_id')
              ? 'data.max_id'
              : 'after';
          result.cursor =
            result.cursorField === 'data.max_id'
              ? result.variables.data.max_id
              : result.variables[result.cursorField];
          result.cursorKnown =
            Object.hasOwn(result.variables, result.cursorField) ||
            result.cursorField === 'data.max_id' ||
            Object.hasOwn(result.variables, 'first') ||
            Boolean(result.variables.data?.count);
          result.replayable =
            result.cursorKnown &&
            Boolean(params.get('doc_id') || params.get('query_hash'));
        }
      }
    } catch (_) {}
    return result;
  }

  async function fetchRequestContext(input, options, url) {
    try {
      const method = options?.method || input?.method || 'GET';
      const body =
        options?.body ??
        (typeof input?.clone === 'function' && method.toUpperCase() !== 'GET'
          ? await input.clone().text()
          : null);
      return describeRequest(
        url,
        method,
        body,
        options?.headers || input?.headers,
      );
    } catch (_) {
      return describeRequest(url);
    }
  }

  function installResponseCapture() {
    const expose = fn =>
      typeof exportFunction === 'function'
        ? exportFunction(fn, win, { allowCrossOriginArguments: true })
        : fn;
    if (originalFetch) {
      try {
        win.fetch = expose(function (...args) {
          const url = observedEndpoint(args[0]);
          const route = detectRoute();
          const context = url
            ? fetchRequestContext(args[0], args[1], url)
            : null;
          if (url) native.requests += 1;
          return originalFetch(...args).then(response => {
            if (url && detectRoute().key === route.key) {
              if (response.ok) {
                try {
                  Promise.all([response.clone().text(), context])
                    .then(([text, request]) => {
                      if (detectRoute().key !== route.key) return;
                      native.responses += 1;
                      for (const value of parsePayload(text))
                        ingestPayload(value, route, 'network', request);
                    })
                    .catch(() => {});
                } catch (_) {}
              } else recordNativeFailure(url, response.status);
            }
            return response;
          });
        });
        native.hooks.push('fetch');
      } catch (_) {}
    }
    try {
      const proto = win.XMLHttpRequest?.prototype;
      if (!proto) return;
      const open = proto.open;
      const send = proto.send;
      const setRequestHeader = proto.setRequestHeader;
      const contexts = new WeakMap();
      proto.open = expose(function (method, url, ...rest) {
        contexts.set(this, {
          url: observedEndpoint(String(url)),
          route: detectRoute(),
          method,
          headers: {},
        });
        return open.call(this, method, url, ...rest);
      });
      if (setRequestHeader)
        proto.setRequestHeader = expose(function (key, value) {
          const context = contexts.get(this);
          if (context?.url) context.headers[key] = value;
          return setRequestHeader.call(this, key, value);
        });
      proto.send = expose(function (...args) {
        const context = contexts.get(this);
        if (context?.url) {
          const request = describeRequest(
            context.url,
            context.method,
            args[0],
            context.headers,
          );
          native.requests += 1;
          this.addEventListener(
            'load',
            () => {
              if (detectRoute().key !== context.route.key) return;
              if (this.status < 200 || this.status >= 300) {
                recordNativeFailure(context.url, this.status);
                return;
              }
              try {
                native.responses += 1;
                const values =
                  this.responseType === 'json'
                    ? [this.response]
                    : parsePayload(this.responseText);
                for (const value of values)
                  ingestPayload(value, context.route, 'network', request);
              } catch (_) {}
            },
            { once: true },
          );
        }
        return send.apply(this, args);
      });
      native.hooks.push('XHR');
    } catch (_) {}
  }

  function checkSession(generation, route, signal) {
    if (
      signal?.aborted ||
      generation !== state.generation ||
      route.key !== detectRoute().key ||
      !state.opened
    ) {
      throw new DOMException('Gallery session changed or closed', 'AbortError');
    }
  }

  function pendingNativeItems() {
    return [...native.items.entries()].filter(
      ([key, value]) => state.nativeConsumed.get(key) !== value.signature,
    );
  }

  function takeNativePage(waiting = false) {
    const pending = pendingNativeItems();
    for (const [key, value] of pending)
      state.nativeConsumed.set(key, value.signature);
    return {
      items: pending.map(([, value]) => value.media),
      more_available:
        state.profileSweep ||
        native.pageInfo?.more !== false ||
        coverageGap() > 0,
      __waiting: waiting && !pending.length,
    };
  }

  function coverageGap() {
    return state.mode === 'profile' && native.expectedPosts != null
      ? Math.max(0, native.expectedPosts - native.profileCodes.size)
      : 0;
  }

  async function fetchCapturedPage(cursor, generation, route, signal) {
    const template = native.request;
    const url = new URL(template.url);
    let body;
    if (template.variables) {
      const variables = { ...template.variables };
      if (template.cursorField === 'data.max_id')
        variables.data = { ...variables.data, max_id: cursor };
      else variables[template.cursorField] = cursor;
      const params = new URLSearchParams(template.form);
      params.set('variables', JSON.stringify(variables));
      if (template.method === 'GET') url.search = params.toString();
      else body = params.toString();
    } else if (cursor) url.searchParams.set('max_id', cursor);
    else url.searchParams.delete('max_id');
    const context = describeRequest(
      url,
      template.method,
      body,
      template.headers,
    );
    const replayHeaders = Object.fromEntries(
      [...Object.entries(headers()), ...Object.entries(template.headers)].map(
        ([key, value]) => [key.toLowerCase(), value],
      ),
    );
    for (let attempt = 0; attempt < 3; attempt += 1) {
      checkSession(generation, route, signal);
      try {
        native.replayRequests += 1;
        const json = await requestPostJson(
          url.href,
          { method: template.method, body, headers: replayHeaders },
          signal,
        );
        checkSession(generation, route, signal);
        if (json?.status === 'fail') {
          const error = new Error(
            json.message || 'Instagram rejected the profile request',
          );
          if (/login|challenge|checkpoint/i.test(error.message))
            error.status = 401;
          if (/rate.limit|please wait|few minutes|throttl/i.test(error.message))
            error.status = 429;
          throw error;
        }
        if (!ingestPayload(json, route, 'network', context))
          throw new Error(
            'Instagram returned no matching profile page. Coverage is incomplete.',
          );
        native.replayPages += 1;
        return;
      } catch (error) {
        if (
          signal.aborted ||
          error?.name === 'AbortError' ||
          [401, 403, 429].includes(error.status)
        )
          throw error;
        if (
          attempt === 2 ||
          !(
            error.responseFormat ||
            error.status >= 500 ||
            /network|fetch|timed out/i.test(error.message || '')
          )
        )
          throw error;
        await waitForRecovery(attempt === 0 ? 1000 : 4000, signal);
      }
    }
  }

  function scrollInstagram(position = 'bottom') {
    const main = doc.querySelector('main');
    let target = main;
    while (target && target !== doc.body && target !== doc.documentElement) {
      const style = win.getComputedStyle(target);
      if (
        /(auto|scroll)/.test(style.overflowY) &&
        target.scrollHeight > target.clientHeight + 80
      )
        break;
      target = target.parentElement;
    }
    target =
      target && target !== doc.body && target !== doc.documentElement
        ? target
        : doc.scrollingElement || doc.documentElement;
    const top =
      position === 'top'
        ? 0
        : Math.min(
            Math.max(0, target.scrollHeight - target.clientHeight),
            target.scrollTop +
              Math.max(600, target.clientHeight || win.innerHeight || 800),
          );
    if (target === doc.scrollingElement || target === doc.documentElement)
      win.scrollTo({ top, behavior: 'instant' });
    else target.scrollTo({ top, behavior: 'instant' });
    target.dispatchEvent(new win.Event('scroll', { bubbles: true }));
    return top >= Math.max(0, target.scrollHeight - target.clientHeight);
  }

  async function fetchPage(signal, retryProfile = false) {
    const generation = state.generation;
    const route = detectRoute();
    checkSession(generation, route, signal);
    if (route.mode === 'profile' && !state.profilePrepared) {
      await waitForProfileReady(generation, route, signal);
      state.profileSweep = native.request ? false : !scrollInstagram('top');
      await new Promise(resolve =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      );
      checkSession(generation, route, signal);
      state.profilePrepared = true;
    }
    scanAvailableMedia(route);
    if (native.request) state.profileSweep = false;
    if (pendingNativeItems().length) return takeNativePage();
    if (!state.profileSweep && native.pageInfo?.more === false) {
      if (!retryProfile || !coverageGap())
        return takeNativePage(coverageGap() > 0);
      // A terminal count gap needs a fresh traversal, not the cached end page.
      // Keep known media, but require a newly connected chain to prove coverage.
      native.feedPages.clear();
      rebuildFeedOrder();
      if (!native.request) {
        state.profileSweep = true;
        scrollInstagram('top');
      }
    }
    if (route.mode === 'post') return takeNativePage(true);
    if (route.mode === 'profile' && native.request) {
      state.profileSweep = false;
      ui.setStatus(
        native.pageInfo?.rooted
          ? 'Loading the next profile page…'
          : 'Recovering the profile from its first page…',
      );
      await fetchCapturedPage(
        native.pageInfo?.cursor || null,
        generation,
        route,
        signal,
      );
      return {
        ...takeNativePage(Boolean(native.pageInfo?.stalled)),
        __pageFetched: true,
      };
    }
    ui.setStatus('Waiting for Instagram to load the next posts…');
    if (scrollInstagram()) state.profileSweep = false;
    const until = Date.now() + 6500;
    while (Date.now() < until) {
      await waitForRecovery(200, signal);
      checkSession(generation, route, signal);
      scanAvailableMedia(route);
      if (
        pendingNativeItems().length ||
        (!state.profileSweep && native.pageInfo?.more === false)
      )
        return takeNativePage();
      if (scrollInstagram()) state.profileSweep = false;
    }
    return takeNativePage(true);
  }

  function scheduleAutoLoad() {
    if (
      state.autoTimer != null ||
      !state.opened ||
      state.loading ||
      state.autoPaused ||
      state.userPaused ||
      state.loadAll ||
      state.exhausted ||
      !state.settings.autoLoad ||
      (state.mode !== 'profile' && !state.hasMore)
    )
      return;
    const generation = state.generation;
    state.autoTimer = win.setTimeout(() => {
      state.autoTimer = null;
      if (
        generation === state.generation &&
        state.opened &&
        !state.autoPaused &&
        state.settings.autoLoad &&
        !state.loadAll
      )
        loadNextPage();
    }, 450);
  }

  function diagnosticReport() {
    return JSON.stringify(
      {
        version: VERSION,
        mode: state.mode,
        loader: native.request
          ? 'Captured profile cursor pagination'
          : 'Instagram page responses',
        hooks: native.hooks,
        observedRequests: native.requests,
        capturedResponses: native.responses,
        discoveredPosts: state.postGroups.size,
        detailVerifiedPosts: [...state.postGroups.values()].filter(
          group => group.media.__fullDetails && group.complete,
        ).length,
        profileScanPending: state.mode === 'profile' && !state.exhausted,
        feedEndObserved: native.pageInfo?.more === false,
        firstPageObserved: Boolean(native.pageInfo?.rooted),
        feedPages: native.feedPages.size,
        profilePostsKnown: native.profileCodes.size,
        expectedPosts: native.expectedPosts,
        coverageGap: coverageGap(),
        cursorStalled: Boolean(native.pageInfo?.stalled),
        profileComplete:
          state.mode === 'profile' &&
          state.exhausted &&
          !coverageGap() &&
          !incompletePosts().length,
        replayRequests: native.replayRequests,
        replayPages: native.replayPages,
        cachedPosts: native.items.size,
        renderedMedia: state.media.length,
        paused: state.autoPaused,
        pagesLoaded: state.pagesLoaded,
        moreKnown: native.pageInfo?.more ?? null,
        recentHttpErrors: native.errors,
        failedMedia: state.stats.failures,
        previewMedia: state.media.filter(item => item.preview).length,
        incompletePosts: incompletePosts().length,
        postDetailRequests: state.detailRequests,
        postDetailFailures: [...state.detailJobs.values()].filter(
          job => job.status === 'failed',
        ).length,
        postDetailsPaused: state.detailPaused,
        postDetailErrors: [
          ...new Set(
            [...state.detailJobs.values()]
              .filter(job => job.status === 'failed')
              .map(job => job.error),
          ),
        ].slice(-8),
      },
      null,
      2,
    );
  }

  function resetSession(route = detectRoute()) {
    state.controller?.abort();
    win.clearTimeout(state.autoTimer);
    state.autoTimer = null;
    state.generation += 1;
    state.routeKey = route.key;
    state.mode = route.mode;
    state.profilePrepared = false;
    state.profileSweep = route.mode === 'profile';
    state.username = route.username;
    state.nativeConsumed = new Map();
    state.autoPaused = false;
    state.userPaused = false;
    state.starting = false;
    state.mediaById = new Map();
    state.postGroups = new Map();
    state.detailJobs = new Map();
    state.detailPaused = false;
    state.detailRequests = 0;
    refreshRequests.clear();
    routeCache(route);
    state.hasMore = false;
    state.exhausted = false;
    state.loading = false;
    state.loadAll = false;
    state.pagesLoaded = 0;
    state.media = [];
    state.lightboxIndex = -1;
    state.stats = { images: 0, videos: 0, carousels: 0, failures: 0 };
    ui?.clearGallery();
    ui?.refresh();
  }

  async function startSession() {
    if (state.starting || !state.opened) return;
    const generation = state.generation;
    state.starting = true;
    try {
      if (state.mode === 'explore')
        throw new Error(
          'Open a profile, tagged feed, home feed, post, or reel.',
        );
      if (state.mode === 'profile' && !state.username)
        throw new Error('Open an Instagram profile first.');
      await loadNextPage();
    } catch (error) {
      if (generation === state.generation && error?.name !== 'AbortError') {
        state.autoPaused = true;
        ui.setStatus(`Gallery: ${error.message || error}`);
        ui.toast(error.message || String(error), 'error', 5000);
      }
    } finally {
      if (generation === state.generation) state.starting = false;
    }
  }

  async function loadNextPage(detailsOnly = false, retryProfile = false) {
    if (state.loading || (!detailsOnly && state.exhausted) || !state.opened)
      return { added: 0, busy: state.loading };
    if (
      !detailsOnly &&
      state.settings.maxPages > 0 &&
      state.pagesLoaded >= state.settings.maxPages
    ) {
      state.autoPaused = true;
      ui.setStatus(`Stopped at the ${state.settings.maxPages}-page limit.`);
      ui.refresh();
      return { added: 0, waiting: true };
    }
    const generation = state.generation;
    const route = detectRoute();
    state.loading = true;
    state.controller?.abort();
    state.controller = new AbortController();
    state.autoPaused = false;
    ui.setStatus(
      state.pagesLoaded ? 'Loading more media…' : 'Reading Instagram media…',
    );
    ui.refresh();
    try {
      const json = detailsOnly
        ? {
            items: incompletePosts().map(group => group.media),
            more_available: state.hasMore,
          }
        : await fetchPage(state.controller.signal, retryProfile);
      checkSession(generation, route, state.controller.signal);
      const before = state.media.length;
      appendRawMedia(json.items);
      await expandPosts(
        incompletePosts().map(group => group.media),
        generation,
        route,
        state.controller.signal,
      );
      checkSession(generation, route, state.controller.signal);
      const added = state.media.length - before;
      if ((json.items.length || json.__pageFetched) && !detailsOnly)
        state.pagesLoaded += 1;
      // Responses may have advanced the feed while post details were loading.
      state.hasMore = detailsOnly
        ? state.hasMore
        : state.profileSweep ||
          native.pageInfo?.more !== false ||
          coverageGap() > 0 ||
          pendingNativeItems().length > 0;
      state.exhausted = !state.hasMore;
      state.autoPaused = Boolean(json.__waiting);
      if (json.__waiting) {
        ui.setStatus(
          coverageGap()
            ? `Profile incomplete: ${native.profileCodes.size} of ${native.expectedPosts} advertised posts found.`
            : native.pageInfo?.stalled
              ? 'Profile incomplete: Instagram repeated its pagination cursor. Press Load more to retry.'
              : 'Profile incomplete: waiting for Instagram to return more posts. Press Load more to retry.',
        );
      } else {
        const missing = incompletePosts().length;
        ui.setStatus(
          `${added ? `Loaded ${added} new media items` : 'Updated loaded media'}${state.exhausted && !missing ? ' — end reached.' : '.'}${missing ? ` ${missing} posts incomplete; use Retry incomplete posts.` : ''}`,
        );
      }
      ui.refresh();
      return { added, waiting: json.__waiting };
    } catch (error) {
      if (generation !== state.generation || route.key !== detectRoute().key)
        return { added: 0, stale: true };
      if (error?.name === 'AbortError') return { added: 0, aborted: true };
      state.autoPaused = true;
      ui.setStatus(`Gallery failed: ${error.message || error}`);
      ui.toast(`Gallery failed: ${error.message || error}`, 'error', 5000);
      return { added: 0, error };
    } finally {
      if (generation === state.generation) {
        state.loading = false;
        ui.refresh();
        Promise.resolve().then(resumeUnfinishedDetails);
        scheduleAutoLoad();
      }
    }
  }

  function isAd(media) {
    return Boolean(
      media?.ad_id ||
      media?.ad_tracking_token ||
      media?.label === 'Sponsored' ||
      media?.sponsor_tags,
    );
  }

  function isVideo(media) {
    return Boolean(
      media?.is_video ||
      media?.is_unified_video ||
      media?.video_duration ||
      media?.media_type === 2 ||
      media?.video_url ||
      media?.video_versions?.length,
    );
  }

  function captionOf(media) {
    return (
      media?.caption?.text ||
      media?.edge_media_to_caption?.edges?.[0]?.node?.text ||
      media?.accessibility_caption ||
      ''
    );
  }

  function uniqueCandidates(groups, fallbackType) {
    const seen = new Set();
    const result = [];
    for (const group of groups) {
      for (const candidate of Array.isArray(group) ? group : []) {
        const url = normalizeMediaUrl(candidate?.url || candidate?.src);
        if (!url || seen.has(url)) continue;
        seen.add(url);
        result.push({
          url,
          width: Number(
            candidate?.width ||
              candidate?.config_width ||
              candidate?.original_width ||
              0,
          ),
          height: Number(
            candidate?.height ||
              candidate?.config_height ||
              candidate?.original_height ||
              0,
          ),
          bitrate: Number(candidate?.bitrate || 0),
          priority: Number(candidate?.priority || 0),
          type: fallbackType,
        });
      }
    }
    return result;
  }

  function imageCandidates(media) {
    const primary = uniqueCandidates(
      [
        media?.display_resources,
        media?.image_versions2?.candidates,
        media?.image_versions?.items,
      ],
      'image',
    );

    const direct = [
      media?.display_url && {
        url: media.display_url,
        width: media?.dimensions?.width,
        height: media?.dimensions?.height,
      },
      media?.image_url && { url: media.image_url },
      media?.thumbnail_url && { url: media.thumbnail_url },
    ].filter(Boolean);

    const fallback = uniqueCandidates(
      [direct, media?.thumbnail_resources],
      'image',
    );
    return rankCandidates([...primary, ...fallback], media);
  }

  function videoCandidates(media) {
    const direct = media?.video_url
      ? [
          {
            url: media.video_url,
            width: media?.original_width,
            height: media?.original_height,
          },
        ]
      : [];
    return rankCandidates(
      uniqueCandidates(
        [media?.video_versions, media?.video_resources, direct],
        'video',
      ),
      media,
      true,
    );
  }

  function rankCandidates(candidates, media, video = false) {
    const targetW = Number(
      media?.original_width || media?.width || media?.dimensions?.width || 0,
    );
    const targetH = Number(
      media?.original_height || media?.height || media?.dimensions?.height || 0,
    );
    const targetRatio = targetW && targetH ? targetW / targetH : 0;

    return candidates.sort((a, b) => {
      const areaA = a.width * a.height;
      const areaB = b.width * b.height;
      const ratioPenaltyA =
        targetRatio && a.width && a.height
          ? Math.abs(a.width / a.height - targetRatio)
          : 0;
      const ratioPenaltyB =
        targetRatio && b.width && b.height
          ? Math.abs(b.width / b.height - targetRatio)
          : 0;
      const scoreA =
        areaA - ratioPenaltyA * 1e9 + (video ? a.bitrate * 100 : 0);
      const scoreB =
        areaB - ratioPenaltyB * 1e9 + (video ? b.bitrate * 100 : 0);
      return scoreB - scoreA;
    });
  }

  function appendRawMedia(rawItems) {
    const selectedId = state.media[state.lightboxIndex]?.id;
    const oldEntries = state.media.slice();
    for (const raw of rawItems || []) {
      if (!raw || isAd(raw)) continue;
      const key = postKey(raw);
      if (!key) continue;
      const previousGroup = state.postGroups.get(key);
      const parent = mergePostMedia(previousGroup?.media, raw);
      const shape = postShape(parent);
      const children = shape.children.length ? shape.children : [parent];
      const shortcode = parent.shortcode || parent.code || '';
      const username =
        parent.user?.username || parent.owner?.username || state.username;
      const caption = captionOf(parent);
      const entries = [];
      children.forEach((child, index) => {
        if (!child || isAd(child)) return;
        const type = isVideo(child) ? 'video' : 'image';
        const sources =
          type === 'video' ? videoCandidates(child) : imageCandidates(child);
        if (!sources.length) return;
        const stableId = `${key}:${index}`;
        let entry = state.mediaById.get(stableId);
        const previousType = entry?.type;
        const changed =
          entry && JSON.stringify(entry.sources) !== JSON.stringify(sources);
        if (!entry)
          entry = { id: stableId, downloadState: 'idle', sourceIndex: 0 };
        const posterSources =
          type === 'video'
            ? imageCandidates(child).concat(imageCandidates(parent))
            : [];
        Object.assign(entry, {
          postKey: key,
          postComplete: shape.complete,
          preview: Boolean(parent.__preview),
          mediaId: String(child.pk || child.id || ''),
          postId: String(parent.pk || parent.id || ''),
          type,
          sources,
          mediaUrl:
            !changed && entry.mediaUrl ? entry.mediaUrl : sources[0].url,
          posterUrl: posterSources[0]?.url || '',
          shortcode,
          username,
          caption,
          postUrl: shortcode
            ? `https://www.instagram.com/p/${shortcode}/`
            : location.href,
          carouselIndex: index,
          carouselTotal:
            shape.expected || (shape.complete ? children.length : 0),
          previewUrl: (() => {
            const thumbnail =
              imageCandidates(child).at(-1) || imageCandidates(parent).at(-1);
            return thumbnail &&
              (type === 'video' || thumbnail.url !== sources[0].url)
              ? thumbnail.url
              : '';
          })(),
          width:
            sources[0].width ||
            Number(
              child.original_width ||
                child.width ||
                child.dimensions?.width ||
                0,
            ),
          height:
            sources[0].height ||
            Number(
              child.original_height ||
                child.height ||
                child.dimensions?.height ||
                0,
            ),
        });
        if (!entry.card || previousType !== type) {
          const oldCard = entry.card;
          if (oldCard) {
            ui.releaseCard(oldCard);
            mediaBindings.get(oldCard.querySelector('img, video'))?.();
            oldCard.remove();
          }
          entry.card = ui.createCard(entry, state.mediaById.size);
        } else {
          ui.updateCardPreview(entry.card, entry);
          if (changed)
            setSourceWithFallback(
              entry.card.querySelector('img, video'),
              entry,
            );
          const image = entry.card.querySelector('img');
          if (image) image.alt = caption.slice(0, 160) || 'Instagram image';
          entry.card.querySelector('.caption').textContent = caption;
        }
        state.mediaById.set(stableId, entry);
        entries.push(entry);
      });
      state.postGroups.set(key, {
        media: parent,
        entries,
        complete: shape.complete,
        carousel: shape.carousel,
        order: previousGroup?.order ?? state.postGroups.size,
      });
    }
    orderGallery(selectedId);
    const keep = new Set(state.media);
    for (const entry of oldEntries)
      if (!keep.has(entry)) {
        ui.releaseCard(entry.card);
        mediaBindings.get(entry.card?.querySelector('img, video'))?.();
        entry.card?.remove();
      }
    state.mediaById = new Map(state.media.map(entry => [entry.id, entry]));
    ui.refresh();
  }

  function orderGallery(selectedId = state.media[state.lightboxIndex]?.id) {
    const groups = [...state.postGroups.values()];
    const timestamp = group => {
      const value = Number(
        group.media.taken_at ||
          group.media.taken_at_timestamp ||
          group.media.timestamp ||
          0,
      );
      return value > 1e12 ? value / 1000 : value;
    };
    const compareAge = (a, b) => {
      const aDate = timestamp(a),
        bDate = timestamp(b);
      if (aDate && bDate && aDate !== bDate) return bDate - aDate;
      const aId = mediaIdForPost(a.media).split('_')[0],
        bId = mediaIdForPost(b.media).split('_')[0];
      if (aId && bId)
        return BigInt(aId) < BigInt(bId)
          ? 1
          : BigInt(aId) > BigInt(bId)
            ? -1
            : 0;
      return a.order - b.order;
    };
    const area = group =>
      Math.max(0, ...group.entries.map(entry => entry.width * entry.height));
    const sort = state.settings.sort;
    groups.sort((a, b) => {
      if (sort === 'newest' || sort === 'oldest')
        return (
          (sort === 'oldest' ? -1 : 1) * compareAge(a, b) || a.order - b.order
        );
      if (sort === 'largest' || sort === 'smallest') {
        const aa = area(a),
          bb = area(b);
        if (!aa || !bb) return aa ? -1 : bb ? 1 : a.order - b.order;
        return (sort === 'smallest' ? aa - bb : bb - aa) || a.order - b.order;
      }
      const ar = native.profileOrder.get(postKey(a.media)),
        br = native.profileOrder.get(postKey(b.media));
      return (
        (ar ?? Number.MAX_SAFE_INTEGER) - (br ?? Number.MAX_SAFE_INTEGER) ||
        a.order - b.order
      );
    });
    state.media = groups.flatMap(group => group.entries);
    let cursor = ui.gallery.firstChild;
    state.media.forEach((entry, index) => {
      entry.card.dataset.index = String(index);
      if (entry.card !== cursor) ui.gallery.insertBefore(entry.card, cursor);
      cursor = entry.card.nextSibling;
    });
    state.stats.images = state.media.filter(
      entry => entry.type === 'image',
    ).length;
    state.stats.videos = state.media.length - state.stats.images;
    state.stats.carousels = groups.filter(group => group.carousel).length;
    ui.syncViewer(selectedId);
  }

  async function refreshedSources(entry, signal) {
    const route = detectRoute();
    const cached = routeCache(route).items.get(entry.shortcode)?.media;
    function sourcesOf(parent) {
      if (!parent) return [];
      const children = postShape(parent).children.length
        ? postShape(parent).children
        : [parent];
      const child =
        children.find(
          item => entry.mediaId && String(item.pk || item.id) === entry.mediaId,
        ) || children[entry.carouselIndex];
      return entry.type === 'video'
        ? videoCandidates(child)
        : imageCandidates(child);
    }
    const fromPage = sourcesOf(cached);
    if (
      fromPage.some(
        source => !entry.sources.some(old => old.url === source.url),
      )
    )
      return fromPage;
    const id = entry.postId || entry.mediaId;
    if (!/^\d+(?:_\d+)?$/.test(id)) return [];
    if (!refreshRequests.has(id)) {
      const url = new URL(
        `/api/v1/media/${encodeURIComponent(id)}/info/`,
        location.origin,
      ).href;
      const request = requestJson(url, { headers: headers(), signal })
        .then(json => {
          if (json?.status === 'fail' || !Array.isArray(json?.items))
            throw new Error('Instagram did not return refreshed media.');
          return json.items[0];
        })
        .catch(error => {
          if (error?.status) recordNativeFailure(new URL(url), error.status);
          throw error;
        });
      refreshRequests.set(id, request);
    }
    return sourcesOf(await refreshRequests.get(id));
  }

  function setSourceWithFallback(element, entry, poster = false) {
    mediaBindings.get(element)?.();
    let candidates = poster
      ? [{ url: entry.posterUrl }].filter(item => item.url)
      : entry.sources;
    candidates = [
      ...new Map(candidates.map(source => [source.url, source])).values(),
    ];
    const preferred = candidates.findIndex(
      source => source.url === entry.mediaUrl,
    );
    if (preferred > 0)
      candidates = [
        candidates[preferred],
        ...candidates.filter((_, index) => index !== preferred),
      ];
    const tried = new Set();
    const generation = state.generation;
    const controller = new AbortController();
    let active = true;
    let recovering = false;
    let refreshed = false;
    let failed = false;
    let candidate;
    const dispose = () => {
      active = false;
      controller.abort();
      element.removeEventListener('error', onError);
      element.removeEventListener('load', onReady);
      element.removeEventListener('loadedmetadata', onReady);
    };
    const onReady = () => {
      if (!active) return;
      entry.card?.classList.remove('broken');
      if (failed) {
        state.stats.failures = Math.max(0, state.stats.failures - 1);
        failed = false;
      }
      if (!poster && candidate) {
        entry.mediaUrl = candidate.url;
        entry.width = candidate.width || entry.width;
        entry.height = candidate.height || entry.height;
      }
    };
    const finalError = () => {
      if (!active || generation !== state.generation || failed) return;
      failed = true;
      state.stats.failures += 1;
      entry.card?.classList.add('broken');
      element.title =
        'Instagram could not load this media. Open the original post to check it.';
      ui.refresh();
    };
    const apply = () => {
      if (!active || generation !== state.generation) return;
      candidate = candidates.find(source => !tried.has(source.url));
      if (!candidate) return false;
      tried.add(candidate.url);
      element.src = candidate.url;
      return true;
    };
    const onError = async () => {
      if (!active || recovering || generation !== state.generation) return;
      if (apply()) return;
      if (!poster && !refreshed) {
        refreshed = true;
        recovering = true;
        try {
          const fresh = await refreshedSources(entry, controller.signal);
          if (!active || generation !== state.generation) return;
          candidates = [...candidates, ...fresh];
          if (fresh.length) entry.sources = fresh;
          if (apply()) return;
        } catch (_) {
        } finally {
          recovering = false;
        }
      }
      finalError();
    };
    mediaBindings.set(element, dispose);
    element.referrerPolicy = 'no-referrer';
    element.addEventListener('error', onError);
    element.addEventListener('load', onReady);
    element.addEventListener('loadedmetadata', onReady);
    if (!apply()) finalError();
  }

  function sanitizeFilename(value) {
    return (
      String(value || '')
        .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '_')
        .replace(/\s+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 80) || 'instagram'
    );
  }

  function extensionFor(entry) {
    if (entry.type === 'video') return 'mp4';
    try {
      const extension = new URL(entry.mediaUrl).pathname
        .match(/\.([a-zA-Z0-9]{2,5})$/)?.[1]
        ?.toLowerCase();
      return ['jpg', 'jpeg', 'png', 'webp', 'avif'].includes(extension)
        ? extension
        : 'jpg';
    } catch (_) {
      return 'jpg';
    }
  }

  function filenameFor(entry) {
    const user = sanitizeFilename(entry.username || 'instagram');
    const code = sanitizeFilename(entry.shortcode || entry.id);
    const slide =
      entry.carouselTotal > 1
        ? `_${String(entry.carouselIndex + 1).padStart(2, '0')}`
        : '';
    return `${user}_${code}${slide}.${extensionFor(entry)}`;
  }

  function managerDownload(url, name) {
    return new Promise((resolve, reject) => {
      if (typeof GM_download !== 'function')
        return reject(new Error('Manager download unavailable'));
      try {
        GM_download({
          url,
          name,
          saveAs: false,
          timeout: 120000,
          onload: resolve,
          onerror: () => reject(new Error('Manager download failed')),
          ontimeout: () => reject(new Error('Download timed out')),
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async function downloadBlob(url) {
    let blob;
    if (typeof GM_xmlhttpRequest === 'function') {
      blob = await new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: 'GET',
          url,
          responseType: 'blob',
          timeout: 120000,
          onload: response =>
            response.status >= 200 && response.status < 300
              ? resolve(response.response)
              : reject(new Error(`HTTP ${response.status}`)),
          onerror: () => reject(new Error('Media download failed')),
          ontimeout: () => reject(new Error('Download timed out')),
        });
      });
    } else {
      const response = await (originalFetch || win.fetch.bind(win))(url, {
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      blob = await response.blob();
    }
    if (
      !blob ||
      !blob.size ||
      (blob.type &&
        !/^(image\/|video\/|application\/octet-stream)/i.test(blob.type))
    ) {
      throw new Error('Instagram returned no downloadable media');
    }
    return blob;
  }

  function saveBlob(blob, name) {
    const url = URL.createObjectURL(blob);
    const anchor = doc.createElement('a');
    anchor.href = url;
    anchor.download = name;
    doc.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  async function downloadEntry(entry) {
    if (!entry || entry.downloadState === 'running') {
      if (entry) ui.toast('That download is already running.', 'warning');
      return;
    }

    entry.downloadState = 'running';
    ui.toast(
      `${entry.type === 'video' ? 'Video' : 'Image'} download started.`,
      'info',
    );
    const tried = new Set();
    let failure;
    try {
      if (!entry.postComplete) {
        const job = state.detailJobs.get(entry.postKey);
        if (job?.status === 'loading') await job.promise;
        if (!entry.postComplete)
          throw new Error(
            'The full post is still unavailable; retry incomplete posts first',
          );
      }
      let candidates = [{ url: entry.mediaUrl }, ...entry.sources];
      for (let pass = 0; pass < 2; pass += 1) {
        for (const candidate of candidates) {
          if (!candidate.url || tried.has(candidate.url)) continue;
          tried.add(candidate.url);
          const name = filenameFor({ ...entry, mediaUrl: candidate.url });
          try {
            try {
              await managerDownload(candidate.url, name);
            } catch (_) {
              saveBlob(await downloadBlob(candidate.url), name);
            }
            entry.mediaUrl = candidate.url;
            entry.downloadState = 'done';
            ui.toast(`Download sent to browser: ${name}`, 'success', 3500);
            return;
          } catch (error) {
            failure = error;
          }
        }
        if (pass === 0) candidates = await refreshedSources(entry);
      }
      throw failure || new Error('No downloadable media URL is available');
    } catch (error) {
      entry.downloadState = 'idle';
      ui.toast(
        `Download failed: ${error.message || error}. Open the original post and try again.`,
        'error',
        5000,
      );
    }
  }

  async function toggleLoadAll() {
    if (state.loadAll) {
      state.loadAll = false;
      state.autoPaused = true;
      state.userPaused = true;
      state.controller?.abort();
      win.clearTimeout(state.autoTimer);
      state.autoTimer = null;
      ui.toast('Load all stopped.', 'warning');
      ui.refresh();
      return;
    }

    state.loadAll = true;
    state.autoPaused = false;
    state.userPaused = false;
    ui.toast(
      'Loading every available page. Press Stop to cancel.',
      'info',
      4000,
    );
    ui.refresh();

    let retryProfile = true;
    while (state.loadAll && state.opened && !state.exhausted) {
      if (state.loading) {
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }
      const result = await loadNextPage(false, retryProfile);
      retryProfile = false;
      if (
        result?.error ||
        result?.aborted ||
        result?.stale ||
        result?.waiting ||
        result?.busy
      )
        break;
      if (!state.hasMore) break;
      await new Promise(resolve => setTimeout(resolve, 450));
    }

    const missing = incompletePosts().length;
    const completed = state.loadAll && state.exhausted && !missing;
    state.loadAll = false;
    if (!completed) state.autoPaused = true;
    ui.toast(
      completed
        ? `Load all complete: ${state.media.length} media items.`
        : missing
          ? `Loaded ${state.media.length} media; ${missing} posts are incomplete.`
          : 'Load all stopped.',
      completed ? 'success' : 'warning',
      4000,
    );
    ui.refresh();
  }

  function copyText(text, label = 'Copied') {
    try {
      if (typeof GM_setClipboard === 'function') GM_setClipboard(text, 'text');
      else
        return navigator.clipboard
          .writeText(text)
          .then(() => ui.toast(label, 'success'))
          .catch(() => ui.toast('Copy failed.', 'error'));
      ui.toast(label, 'success');
    } catch (_) {
      ui.toast('Copy failed.', 'error');
    }
  }

  function exportUrls() {
    const lines = state.media.map((entry, index) =>
      [
        index + 1,
        entry.type,
        entry.username ? `@${entry.username}` : '',
        entry.postUrl,
        entry.mediaUrl,
        entry.caption.replace(/\s+/g, ' ').trim(),
      ].join('\t'),
    );
    copyText(
      ['#\ttype\tuser\tpostUrl\tmediaUrl\tcaption', ...lines].join('\n'),
      `Copied ${state.media.length} media rows.`,
    );
  }

  function createUI() {
    const root = doc.createElement('div');
    root.id = 'ig-full-size-gallery-host';
    root.style.cssText =
      'position:fixed;inset:0;z-index:2147483647;pointer-events:none';
    doc.documentElement.appendChild(root);
    // const root = host.attachShadow({ mode: 'open' });

    root.innerHTML = `
      <style>${styles()}</style>
      <button class="launcher" type="button"><b>IG</b><span>Gallery</span></button>
      <section class="app hidden" data-theme="dark" data-layout="fit" data-filter="all" data-captions="off" data-size="large" data-thumbnails="contain">
        <header class="toolbar">
          <div class="brand"><strong>IG Gallery ${VERSION}</strong><span class="pill mode">idle</span><span class="pill count">0 media</span></div>
          <div class="controls">
            <button data-action="layout">Layout: Fit</button>
            <select data-setting="sort" aria-label="Sort posts" title="All sorts show the same media. Instagram grid order includes pinned posts; newest first sorts by date."><option value="profile">Instagram grid (pins first)</option><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="largest">Largest resolution</option><option value="smallest">Smallest resolution</option></select>
            <button data-action="filter">Filter: All</button>
            <button data-action="captions">Captions: Off</button>
            <button data-action="autoload">Auto: On</button>
            <button data-action="load">Load more</button>
            <button data-action="load-all">Load all</button>
            <button data-action="retry-posts" class="hidden">Retry incomplete posts</button>
            <button data-action="export">Export URLs</button>
            <button data-action="diagnostics">Copy diagnostics</button>
            <button data-action="settings">Settings</button>
            <button class="danger" data-action="close">Close</button>
          </div>
        </header>
        <div class="statusbar"><span class="status">Ready.</span><span class="stats"></span></div>
        <main class="scroller"><div class="gallery"></div><div class="sentinel"></div></main>
        <aside class="settings panel hidden">
          <div class="panel-head"><strong>Settings</strong><button data-action="settings">×</button></div>
          <label>Layout<select data-setting="layout"><option value="fit">Fit grid</option><option value="masonry">Masonry</option><option value="classic">Classic wall</option><option value="contact">Contact sheet</option></select></label>
          <label>Image size<select data-setting="imageSize"><option value="medium">Medium</option><option value="large">Large</option><option value="huge">Huge</option></select></label>
          <label>Contact thumbnails<select data-setting="thumbnailMode"><option value="contain">Full image</option><option value="crop">Crop square</option></select></label>
          <label>Viewer opening size<select data-setting="viewerSize"><option value="compact">Compact</option><option value="comfortable">Comfortable</option><option value="large">Large</option></select></label>
          <label>Theme<select data-setting="theme"><option value="dark">Dark</option><option value="light">Light</option></select></label>
          <label>Max pages <small>0 = unlimited</small><input data-setting="maxPages" type="number" min="0" max="999"></label>
          <label>Video volume<input data-setting="videoVolume" type="number" min="0" max="1" step="0.01"></label>
          <label class="check"><input data-setting="captions" type="checkbox"> Show captions</label>
          <label class="check"><input data-setting="autoLoad" type="checkbox"> Auto-load near the bottom</label>
          <button data-action="reset">Reset settings</button>
        </aside>
        <section class="lightbox hidden">
          <button class="viewer-controls-toggle" data-action="toggle-controls" aria-pressed="false">Hide controls</button>
          <button class="viewer-close" data-action="viewer-close">×</button>
          <button class="viewer-nav prev" data-action="prev">‹</button>
          <div class="viewer-viewport">
            <div class="viewer-media"></div>
          </div>
          <button class="viewer-nav next" data-action="next">›</button>
          <footer class="viewer-footer">
            <div class="viewer-meta"><div class="viewer-kicker"></div><div class="viewer-title"></div><div class="viewer-status"></div></div>
            <div class="viewer-actions">
              <button data-action="download">Download</button>
              <button data-action="open-media">Open media</button>
              <button data-action="open-post">Open post</button>
              <button data-action="copy-post">Copy post URL</button>
              <button data-action="copy-media">Copy media URL</button>
              <button data-action="fit">Reset view</button>
              <button data-action="zoom-out">−</button>
              <button data-action="zoom-in">+</button>
            </div>
          </footer>
        </section>
        <div class="toasts" aria-live="polite"></div>
      </section>`;

    const $ = selector => root.querySelector(selector);
    const $$ = selector => [...root.querySelectorAll(selector)];
    const app = $('.app');
    const launcher = $('.launcher');
    const gallery = $('.gallery');
    const scroller = $('.scroller');
    const sentinel = $('.sentinel');
    const lightbox = $('.lightbox');
    const viewerViewport = $('.viewer-viewport');
    const viewerMedia = $('.viewer-media');
    const viewerKicker = $('.viewer-kicker');
    const viewerTitle = $('.viewer-title');
    const viewerStatus = $('.viewer-status');
    const toasts = $('.toasts');
    const previewObserver = new IntersectionObserver(
      entries => {
        for (const item of entries)
          if (item.isIntersecting) {
            item.target.loading = 'eager';
            previewObserver.unobserve(item.target);
          }
      },
      { root: scroller, rootMargin: '1600px 0px' },
    );

    let appliedSort = state.settings.sort;
    const gesture = {
      scale: 1,
      panX: 0,
      panY: 0,
      dragging: false,
      pointerId: null,
      lastX: 0,
      lastY: 0,
      didDrag: false,
      clickTimer: null,
      suppressNextClick: false,
    };

    function toast(message, type = 'info', duration = 2800) {
      const element = doc.createElement('div');
      element.className = `toast ${type}`;
      element.textContent = message;
      toasts.appendChild(element);
      requestAnimationFrame(() => element.classList.add('show'));
      setTimeout(() => {
        element.classList.remove('show');
        setTimeout(() => element.remove(), 180);
      }, duration);
    }

    function setStatus(message) {
      $('.status').textContent = message;
    }

    function clearGallery() {
      previewObserver.disconnect();
      gallery.textContent = '';
      closeViewer();
    }

    function open() {
      state.opened = true;
      state.userPaused = false;
      app.classList.remove('hidden');
      launcher.classList.add('hidden');
      root.style.pointerEvents = 'auto';
      applySettings();
      ensureObserver();
      for (const image of gallery.querySelectorAll('img[loading="lazy"]'))
        previewObserver.observe(image);
      const route = detectRoute();
      if (
        route.key !== state.routeKey ||
        (!state.media.length && !state.starting)
      ) {
        resetSession(route);
        startSession();
      } else if (incompletePosts().length) {
        retryIncompletePosts();
      } else if (state.autoPaused || pendingNativeItems().length) {
        loadNextPage();
      }
    }

    function close() {
      state.opened = false;
      app.classList.add('hidden');
      launcher.classList.remove('hidden');
      closeViewer();
      root.style.pointerEvents = 'none';
      launcher.style.pointerEvents = 'auto';
      state.loadAll = false;
      state.controller?.abort();
      win.clearTimeout(state.autoTimer);
      state.autoTimer = null;
      state.observer?.disconnect();
      previewObserver.disconnect();
    }

    function applySettings() {
      const settings = state.settings;
      app.dataset.theme = settings.theme;
      app.dataset.layout = settings.layout;
      app.dataset.filter = settings.filter;
      app.dataset.captions = settings.captions ? 'on' : 'off';
      app.dataset.size = settings.imageSize;
      app.dataset.thumbnails = settings.thumbnailMode;
      app.dataset.viewerSize = settings.viewerSize;
      launcher.dataset.position = settings.launcherPosition;
      lightbox.classList.toggle('controls-hidden', settings.hideViewerControls);
      const controlsToggle = $('.viewer-controls-toggle');
      controlsToggle.textContent = settings.hideViewerControls
        ? 'Show controls'
        : 'Hide controls';
      controlsToggle.setAttribute(
        'aria-pressed',
        String(settings.hideViewerControls),
      );

      $('[data-action="layout"]').textContent =
        `Layout: ${{ fit: 'Fit', masonry: 'Masonry', classic: 'Classic', contact: 'Contact' }[settings.layout]}`;
      $('[data-action="filter"]').textContent =
        `Filter: ${{ all: 'All', image: 'Images', video: 'Videos' }[settings.filter]}`;
      $('[data-action="captions"]').textContent =
        `Captions: ${settings.captions ? 'On' : 'Off'}`;
      $('[data-action="autoload"]').textContent =
        `Auto: ${settings.autoLoad ? 'On' : 'Off'}`;

      for (const input of $$('[data-setting]')) {
        const value = settings[input.dataset.setting];
        if (input.type === 'checkbox') input.checked = Boolean(value);
        else input.value = value;
      }
      for (const video of $$('video'))
        video.volume = Number(settings.videoVolume) || 0;
      if (ui && appliedSort !== settings.sort) {
        appliedSort = settings.sort;
        orderGallery();
      }
      refresh();
      scheduleAutoLoad();
    }

    function refresh() {
      const missing = incompletePosts().length;
      $('.mode').textContent = state.mode;
      $('.count').textContent = `${state.media.length} media`;
      const posts =
        native.expectedPosts == null
          ? `${state.postGroups.size}`
          : `${state.postGroups.size}/${native.expectedPosts}`;
      $('.stats').textContent =
        `Posts ${posts} • Images ${state.stats.images} • Videos ${state.stats.videos} • Carousels ${state.stats.carousels}${missing ? ` • ${missing} posts ${state.loading && !state.detailPaused ? 'loading' : 'incomplete'}` : ''}`;
      const retry = $('[data-action="retry-posts"]');
      retry.classList.toggle('hidden', !missing);
      retry.disabled = state.loading;
      for (const entry of state.media) {
        const slide =
          entry.carouselTotal > 1
            ? `  ${entry.carouselIndex + 1}/${entry.carouselTotal}`
            : '';
        const status = entry.postComplete
          ? ''
          : state.loading && !state.detailPaused
            ? ' — loading full post…'
            : ' — post incomplete';
        entry.card.querySelector('.card-line').textContent =
          `${entry.type.toUpperCase()}${entry.username ? `  @${entry.username}` : ''}${slide}${status}`;
      }
      const load = $('[data-action="load"]');
      load.disabled = state.loading || state.exhausted;
      load.textContent = state.loading
        ? 'Loading…'
        : state.exhausted
          ? 'No more'
          : 'Load more';
      $('[data-action="load-all"]').textContent = state.loadAll
        ? 'Stop'
        : 'Load all';
      if (state.lightboxIndex >= 0) updateViewerMeta();
    }

    function createCard(entry, index) {
      const card = doc.createElement('article');
      card.className = 'media-card';
      card.dataset.type = entry.type;
      card.dataset.index = String(index);
      card.tabIndex = 0;

      const frame = doc.createElement('div');
      frame.className = 'media-frame';

      if (entry.type === 'video') {
        const video = doc.createElement('video');
        video.controls = true;
        video.preload = 'metadata';
        video.playsInline = true;
        video.volume = Number(state.settings.videoVolume) || 0;
        if (entry.posterUrl) video.poster = entry.posterUrl;
        setSourceWithFallback(video, entry);
        frame.appendChild(video);
      } else {
        const image = doc.createElement('img');
        image.alt = entry.caption?.slice(0, 160) || 'Instagram image';
        image.loading = 'lazy';
        image.decoding = 'async';
        setSourceWithFallback(image, entry);
        if (index < 8) image.loading = 'eager';
        previewObserver.observe(image);
        frame.appendChild(image);
      }

      const meta = doc.createElement('div');
      meta.className = 'card-meta';
      const line = doc.createElement('div');
      line.className = 'card-line';
      line.textContent = `${entry.type.toUpperCase()}${entry.username ? `  @${entry.username}` : ''}${entry.carouselTotal > 1 ? `  ${entry.carouselIndex + 1}/${entry.carouselTotal}` : ''}`;
      const caption = doc.createElement('p');
      caption.className = 'caption';
      caption.textContent = entry.caption || '';
      const actions = doc.createElement('div');
      actions.className = 'card-actions';
      actions.append(
        button(entry.type === 'video' ? 'Download video' : 'Download', () =>
          downloadEntry(entry),
        ),
        button('Open media', () =>
          win.open(entry.mediaUrl, '_blank', 'noopener'),
        ),
        button('Open post', () =>
          win.open(entry.postUrl, '_blank', 'noopener'),
        ),
      );
      meta.append(line, caption, actions);
      card.append(frame, meta);
      updateCardPreview(card, entry);

      card.addEventListener('click', event => {
        if (event.target.closest('button, video')) return;
        openViewer(Number(card.dataset.index));
      });
      card.addEventListener('keydown', event => {
        if (event.key === 'Enter') openViewer(Number(card.dataset.index));
      });
      return card;
    }

    function releaseCard(card) {
      const image = card?.querySelector('img');
      if (image) previewObserver.unobserve(image);
    }

    function updateCardPreview(card, entry) {
      const frame = card.querySelector('.media-frame');
      frame.style.aspectRatio =
        entry.width && entry.height ? `${entry.width} / ${entry.height}` : '';
      frame.style.backgroundImage = entry.previewUrl
        ? `url(${JSON.stringify(entry.previewUrl)})`
        : '';
    }

    function button(label, handler) {
      const element = doc.createElement('button');
      element.type = 'button';
      element.textContent = label;
      element.addEventListener('click', event => {
        event.stopPropagation();
        handler();
      });
      return element;
    }

    function currentEntry() {
      return state.media[state.lightboxIndex] || null;
    }

    function resetGesture(scale = 1) {
      gesture.scale = scale;
      gesture.panX = 0;
      gesture.panY = 0;
      gesture.dragging = false;
      gesture.pointerId = null;
      gesture.didDrag = false;
      if (gesture.clickTimer) {
        clearTimeout(gesture.clickTimer);
        gesture.clickTimer = null;
      }
      applyTransform();
    }

    function applyTransform() {
      const media = viewerMedia.querySelector('img, video');
      if (!media) return;
      clampPan(media);
      media.style.transform = `translate3d(${gesture.panX}px, ${gesture.panY}px, 0) scale(${gesture.scale})`;
      const pannable = canPan(media);
      viewerViewport.classList.toggle('zoomed', pannable);
      viewerViewport.classList.toggle('zoom-out-ready', gesture.scale > 1.001);
      viewerViewport.classList.toggle('dragging', gesture.dragging);
      viewerStatus.textContent = `Zoom ${Math.round(gesture.scale * 100)}% • ${state.settings.viewerSize[0].toUpperCase() + state.settings.viewerSize.slice(1)} fit`;
    }

    function canPan(media) {
      return (
        media.clientWidth * gesture.scale > viewerViewport.clientWidth + 1 ||
        media.clientHeight * gesture.scale > viewerViewport.clientHeight + 1
      );
    }

    function clampPan(media) {
      const width = media.clientWidth * gesture.scale;
      const height = media.clientHeight * gesture.scale;
      const maxX = Math.max(0, (width - viewerViewport.clientWidth) / 2);
      const maxY = Math.max(0, (height - viewerViewport.clientHeight) / 2);
      gesture.panX = Math.max(-maxX, Math.min(maxX, gesture.panX));
      gesture.panY = Math.max(-maxY, Math.min(maxY, gesture.panY));
    }

    function zoomTo(nextScale, clientX, clientY) {
      const media = viewerMedia.querySelector('img');
      if (!media) return;
      const oldScale = gesture.scale;
      const scale = Math.max(0.25, Math.min(6, nextScale));
      const rect = viewerViewport.getBoundingClientRect();
      const pointX = Number.isFinite(clientX)
        ? clientX - (rect.left + rect.width / 2)
        : 0;
      const pointY = Number.isFinite(clientY)
        ? clientY - (rect.top + rect.height / 2)
        : 0;
      const ratio = scale / oldScale;
      gesture.panX = pointX - (pointX - gesture.panX) * ratio;
      gesture.panY = pointY - (pointY - gesture.panY) * ratio;
      gesture.scale = scale;
      applyTransform();
    }

    function openViewer(index, retainZoom = false) {
      const scale = retainZoom ? gesture.scale : 1;
      const entry = state.media[index];
      if (!entry) return;
      state.lightboxIndex = index;
      viewerMedia.textContent = '';

      if (entry.type === 'video') {
        const video = doc.createElement('video');
        video.controls = true;
        video.autoplay = true;
        video.playsInline = true;
        video.volume = Number(state.settings.videoVolume) || 0;
        if (entry.posterUrl) video.poster = entry.posterUrl;
        setSourceWithFallback(video, entry);
        viewerMedia.appendChild(video);
      } else {
        const image = doc.createElement('img');
        image.alt = entry.caption || 'Instagram image';
        setSourceWithFallback(image, entry);
        viewerMedia.appendChild(image);
      }

      lightbox.classList.remove('hidden');
      resetGesture(scale);
      viewerMedia
        .querySelector('img, video')
        ?.addEventListener('load', applyTransform, { once: true });
      updateViewerMeta();
    }

    function closeViewer() {
      state.lightboxIndex = -1;
      lightbox.classList.add('hidden');
      viewerMedia.textContent = '';
      resetGesture();
    }

    function syncViewer(selectedId) {
      if (!selectedId || state.lightboxIndex < 0) return;
      const index = state.media.findIndex(entry => entry.id === selectedId);
      if (index < 0) {
        closeViewer();
        return;
      }
      state.lightboxIndex = index;
      const entry = state.media[index];
      const element = viewerMedia.querySelector('img, video');
      if (
        !element ||
        (element.tagName === 'VIDEO') !== (entry.type === 'video')
      )
        openViewer(index);
      else if (element.src !== entry.mediaUrl)
        setSourceWithFallback(element, entry);
      updateViewerMeta();
    }

    function updateViewerMeta(extra = '') {
      const entry = currentEntry();
      if (!entry) return;
      const more = !entry.postComplete
        ? 'Post still incomplete'
        : incompletePosts().length
          ? 'Some posts incomplete'
          : state.hasMore
            ? 'More available'
            : state.exhausted
              ? 'End reached'
              : 'Loaded';
      const carousel =
        entry.carouselTotal > 1
          ? ` • Post carousel ${entry.carouselIndex + 1}/${entry.carouselTotal}`
          : '';
      const resolution =
        entry.width && entry.height ? ` • ${entry.width}×${entry.height}` : '';
      viewerKicker.textContent = `Gallery ${state.lightboxIndex + 1}/${state.media.length} loaded • ${more}${carousel}${resolution}`;
      viewerTitle.textContent = `${entry.type.toUpperCase()}${entry.username ? ` @${entry.username}` : ''}${entry.caption ? ` — ${entry.caption.slice(0, 220)}` : ''}`;
      if (extra) viewerStatus.textContent = extra;
      $('[data-action="download"]').textContent =
        entry.type === 'video' ? 'Download video' : 'Download image';
    }

    async function moveViewer(delta) {
      if (state.lightboxIndex < 0 || !state.media.length) return;
      const selectedId = currentEntry().id;
      const generation = state.generation;
      const group = state.postGroups.get(currentEntry().postKey);
      if (delta > 0 && !group?.complete) {
        const job = state.detailJobs.get(currentEntry().postKey);
        if (job?.status === 'loading') {
          updateViewerMeta('Loading the remaining slides…');
          try {
            await job.promise;
          } catch (_) {
            return;
          }
          if (
            generation !== state.generation ||
            currentEntry()?.id !== selectedId ||
            !state.opened
          )
            return;
        }
        const currentGroup = state.postGroups.get(currentEntry().postKey);
        if (
          !currentGroup.complete &&
          currentGroup.entries.at(-1)?.id === selectedId
        ) {
          updateViewerMeta(
            state.loading
              ? 'Loading the remaining slides…'
              : 'This post is incomplete. Use Retry incomplete posts in the gallery.',
          );
          return;
        }
      }
      if (delta > 0 && state.lightboxIndex === state.media.length - 1) {
        if (state.hasMore && !state.exhausted) {
          updateViewerMeta('Loading more media…');
          const result = await loadNextPage();
          if (
            generation !== state.generation ||
            currentEntry()?.id !== selectedId ||
            !state.opened
          )
            return;
          if (state.lightboxIndex + 1 < state.media.length) {
            openViewer(state.lightboxIndex + 1, true);
            return;
          }
          if (
            result?.error ||
            result?.waiting ||
            result?.busy ||
            result?.aborted ||
            result?.stale
          )
            return;
        }
        if (incompletePosts().length) {
          updateViewerMeta(
            'Some posts are incomplete. Use Retry incomplete posts in the gallery.',
          );
          return;
        }
        openViewer(0, true);
        toast('Reached the end and returned to the first item.', 'info');
        return;
      }
      const next =
        (state.lightboxIndex + delta + state.media.length) % state.media.length;
      openViewer(next, true);
    }

    function ensureObserver() {
      state.observer?.disconnect();
      if (!('IntersectionObserver' in win)) return;
      state.observer = new IntersectionObserver(
        entries => {
          if (!entries.some(entry => entry.isIntersecting)) return;
          if (
            state.opened &&
            !state.autoPaused &&
            state.settings.autoLoad &&
            state.hasMore &&
            !state.loading &&
            !state.exhausted &&
            !state.loadAll
          )
            loadNextPage();
        },
        { root: scroller, rootMargin: '800px 0px' },
      );
      state.observer.observe(sentinel);
    }

    launcher.addEventListener('click', open);

    root.addEventListener('click', event => {
      const action = event.target?.dataset?.action;
      if (!action) return;
      const entry = currentEntry();

      if (action === 'close') close();
      if (action === 'layout') {
        const order = ['fit', 'masonry', 'classic', 'contact'];
        state.settings.layout =
          order[(order.indexOf(state.settings.layout) + 1) % order.length];
        saveSettings();
        applySettings();
      }
      if (action === 'filter') {
        const order = ['all', 'image', 'video'];
        state.settings.filter =
          order[(order.indexOf(state.settings.filter) + 1) % order.length];
        saveSettings();
        applySettings();
      }
      if (action === 'captions') {
        state.settings.captions = !state.settings.captions;
        saveSettings();
        applySettings();
      }
      if (action === 'autoload') {
        toggleAutoLoad();
        toast(
          `Auto-load ${state.settings.autoLoad ? 'enabled' : 'disabled'}.`,
          'success',
        );
      }
      if (action === 'load') {
        state.userPaused = false;
        loadNextPage(false, true);
      }
      if (action === 'load-all') toggleLoadAll();
      if (action === 'retry-posts') retryIncompletePosts();
      if (action === 'export') exportUrls();
      if (action === 'diagnostics')
        copyText(diagnosticReport(), 'Diagnostics copied.');
      if (action === 'settings') $('.settings').classList.toggle('hidden');
      if (action === 'reset') {
        state.settings = { ...DEFAULTS };
        saveSettings();
        applySettings();
        toast('Settings reset.', 'success');
      }
      if (action === 'viewer-close') closeViewer();
      if (action === 'toggle-controls') {
        state.settings.hideViewerControls = !state.settings.hideViewerControls;
        saveSettings();
        applySettings();
      }
      if (action === 'prev') moveViewer(-1);
      if (action === 'next') moveViewer(1);
      if (action === 'download' && entry) downloadEntry(entry);
      if (action === 'open-media' && entry)
        win.open(entry.mediaUrl, '_blank', 'noopener');
      if (action === 'open-post' && entry)
        win.open(entry.postUrl, '_blank', 'noopener');
      if (action === 'copy-post' && entry)
        copyText(entry.postUrl, 'Post URL copied.');
      if (action === 'copy-media' && entry)
        copyText(entry.mediaUrl, 'Media URL copied.');
      if (action === 'fit') resetGesture();
      if (action === 'zoom-in') zoomTo(gesture.scale * 1.25);
      if (action === 'zoom-out') zoomTo(gesture.scale / 1.25);
    });

    root.addEventListener('change', event => {
      const key = event.target?.dataset?.setting;
      if (!key) return;
      state.settings[key] =
        event.target.type === 'checkbox'
          ? event.target.checked
          : event.target.type === 'number'
            ? Number(event.target.value)
            : event.target.value;
      saveSettings();
      applySettings();
      toast('Setting saved.', 'success', 1800);
    });

    lightbox.addEventListener('click', event => {
      if (event.target === lightbox) closeViewer();
    });

    viewerViewport.addEventListener(
      'wheel',
      event => {
        if (!event.target.closest('img')) return;
        event.preventDefault();
        const factor = Math.exp(-event.deltaY * 0.0015);
        zoomTo(gesture.scale * factor, event.clientX, event.clientY);
      },
      { passive: false },
    );

    viewerViewport.addEventListener('pointerdown', event => {
      const image = event.target.closest('img');
      if (!image || event.button !== 0 || !canPan(image)) return;
      event.preventDefault();
      gesture.dragging = true;
      gesture.pointerId = event.pointerId;
      gesture.lastX = event.clientX;
      gesture.lastY = event.clientY;
      gesture.didDrag = false;
      viewerViewport.setPointerCapture?.(event.pointerId);
      applyTransform();
    });

    viewerViewport.addEventListener('pointermove', event => {
      if (!gesture.dragging || event.pointerId !== gesture.pointerId) return;
      event.preventDefault();
      const deltaX = event.clientX - gesture.lastX;
      const deltaY = event.clientY - gesture.lastY;
      if (Math.abs(deltaX) + Math.abs(deltaY) > 3) gesture.didDrag = true;
      gesture.panX += deltaX;
      gesture.panY += deltaY;
      gesture.lastX = event.clientX;
      gesture.lastY = event.clientY;
      applyTransform();
    });

    const finishDrag = event => {
      if (
        !gesture.dragging ||
        (event.pointerId != null && event.pointerId !== gesture.pointerId)
      )
        return;
      const zoomOutOnRelease =
        event.type === 'pointerup' && !gesture.didDrag && gesture.scale > 1.001;
      gesture.dragging = false;
      try {
        viewerViewport.releasePointerCapture?.(gesture.pointerId);
      } catch (_) {}
      gesture.pointerId = null;
      if (zoomOutOnRelease) {
        gesture.suppressNextClick = true;
        resetGesture();
        setTimeout(() => {
          gesture.suppressNextClick = false;
        }, 0);
        return;
      }
      applyTransform();
    };
    viewerViewport.addEventListener('pointerup', finishDrag);
    viewerViewport.addEventListener('pointercancel', finishDrag);

    viewerViewport.addEventListener('click', event => {
      const image = event.target.closest('img');
      if (!image) return;
      if (gesture.suppressNextClick) {
        gesture.suppressNextClick = false;
        return;
      }
      if (gesture.didDrag) {
        gesture.didDrag = false;
        return;
      }
      if (gesture.scale > 1.001) {
        resetGesture();
        return;
      }

      const clientX = event.clientX;
      const clientY = event.clientY;
      if (gesture.clickTimer) clearTimeout(gesture.clickTimer);
      gesture.clickTimer = setTimeout(() => {
        gesture.clickTimer = null;
        const currentImage = viewerMedia.querySelector('img');
        if (!currentImage || canPan(currentImage)) return;
        const targetScale =
          gesture.scale < 2 ? 2 : Math.min(6, gesture.scale * 1.5);
        zoomTo(targetScale, clientX, clientY);
      }, 180);
    });

    viewerViewport.addEventListener('dblclick', event => {
      if (!event.target.closest('img')) return;
      event.preventDefault();
      if (gesture.clickTimer) {
        clearTimeout(gesture.clickTimer);
        gesture.clickTimer = null;
      }
      resetGesture();
    });

    win.addEventListener('keydown', event => {
      if (!state.opened) return;
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(
          (event.composedPath?.()[0] || doc.activeElement)?.tagName,
        )
      )
        return;
      if (event.key === 'Escape')
        state.lightboxIndex >= 0 ? closeViewer() : close();
      if (event.key === 'ArrowLeft') moveViewer(-1);
      if (event.key === 'ArrowRight') moveViewer(1);
      if (event.key.toLowerCase() === 'd' && currentEntry())
        downloadEntry(currentEntry());
      if (event.key.toLowerCase() === 'o' && currentEntry())
        win.open(currentEntry().postUrl, '_blank', 'noopener');
      if (event.key === '+' || event.key === '=') zoomTo(gesture.scale * 1.25);
      if (event.key === '-') zoomTo(gesture.scale / 1.25);
      if (event.key.toLowerCase() === 'f') resetGesture();
    });

    applySettings();

    return {
      root,
      gallery,
      open,
      close,
      setStatus,
      toast,
      clearGallery,
      refresh,
      createCard,
      updateCardPreview,
      releaseCard,
      applySettings,
      syncViewer,
    };
  }

  function styles() {
    return `
      :host{all:initial;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}*{box-sizing:border-box}button,select,input{font:inherit}.hidden{display:none!important}
      .launcher{pointer-events:auto;position:fixed;right:18px;bottom:18px;z-index:2147483647;display:flex;align-items:center;gap:8px;padding:10px 15px;border:0;border-radius:999px;color:#fff;background:linear-gradient(135deg,#f58529,#dd2a7b,#8134af,#515bd4);box-shadow:0 12px 32px #0006;font-weight:800;cursor:pointer}.launcher b{display:grid;place-items:center;width:29px;height:29px;border-radius:50%;background:#ffffff28}.launcher:hover{filter:brightness(1.08);transform:translateY(-1px)}
      .app{pointer-events:auto;position:fixed;inset:0;display:grid;grid-template-rows:auto auto minmax(0,1fr);z-index:2147483647;color:var(--fg);background:var(--bg)}
      .app[data-theme=dark]{--bg:#080a12fa;--panel:#161926fa;--soft:#ffffff12;--line:#ffffff22;--fg:#f6f7fb;--muted:#abb3c8;--card:#ffffff0e;--hover:#ffffff19}.app[data-theme=light]{--bg:#f5f7fcfa;--panel:#fffefa;--soft:#0000000e;--line:#00000020;--fg:#10131d;--muted:#5c6577;--card:#00000009;--hover:#00000012}
      .toolbar{display:flex;align-items:center;justify-content:space-between;gap:14px;min-height:64px;padding:10px 14px;background:var(--panel);border-bottom:1px solid var(--line);backdrop-filter:blur(18px)}.brand,.controls{display:flex;align-items:center;gap:8px}.controls{justify-content:flex-end;flex-wrap:wrap}.brand strong{font-size:18px}.pill{padding:5px 9px;border:1px solid var(--line);border-radius:999px;color:var(--muted);background:var(--soft);font-size:12px}
      button,select,input{padding:8px 10px;color:var(--fg);background:var(--soft);border:1px solid var(--line);border-radius:11px}select option{color:#10131d;background:#fff}.app[data-theme=dark] select option{color:#f6f7fb;background:#161926}button{cursor:pointer}button:hover:not(:disabled){background:var(--hover)}button:disabled{opacity:.5;cursor:not-allowed}.danger{background:#ff4a681f;border-color:#ff4a6858}
      .statusbar{display:flex;justify-content:space-between;gap:14px;padding:8px 14px;color:var(--muted);font-size:13px;border-bottom:1px solid var(--line)}.scroller{min-height:0;overflow:auto;padding:18px;overscroll-behavior:contain}.sentinel{height:1px}.gallery{min-height:50vh}
      .media-card{position:relative;overflow:hidden;background:var(--card);border:1px solid var(--line);border-radius:17px;box-shadow:0 10px 30px #0003}.media-card:hover{background:var(--hover)}.media-frame{display:grid;place-items:center;width:100%;min-height:80px;background:#05060b center / contain no-repeat}.media-frame img,.media-frame video{display:block;max-width:100%;width:auto;height:auto;object-fit:contain}.media-frame video{width:100%}.card-meta{display:grid;gap:7px;padding:9px 10px}.card-line{font-size:12px;color:var(--muted)}.caption{display:none;margin:0;max-height:5.4em;overflow:hidden;font-size:12px;line-height:1.35}.app[data-captions=on] .caption{display:block}.card-actions{display:flex;flex-wrap:wrap;gap:6px;opacity:0;transition:opacity .15s}.media-card:hover .card-actions,.media-card:focus-within .card-actions{opacity:1}.card-actions button{padding:5px 7px;font-size:11px}.broken{outline:2px solid #ff4a68}
      .app[data-filter=image] .media-card[data-type=video],.app[data-filter=video] .media-card[data-type=image]{display:none!important}
      .app[data-layout=fit] .gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(var(--card-width,320px),1fr));gap:14px}.app[data-layout=fit][data-size=medium] .gallery{--card-width:240px}.app[data-layout=fit][data-size=huge] .gallery{--card-width:460px}.app[data-layout=fit] .media-frame img,.app[data-layout=fit] .media-frame video{max-height:72vh}
      .app[data-layout=masonry] .gallery{display:block;column-width:var(--column-width,340px);column-gap:14px}.app[data-layout=masonry][data-size=medium] .gallery{--column-width:250px}.app[data-layout=masonry][data-size=huge] .gallery{--column-width:470px}.app[data-layout=masonry] .media-card{display:inline-block;width:100%;margin:0 0 14px;break-inside:avoid}
      .app[data-layout=classic] .gallery{text-align:center}.app[data-layout=classic] .media-card{display:inline-block;vertical-align:top;max-width:49vw;margin:9px}.app[data-layout=classic] .media-frame img,.app[data-layout=classic] .media-frame video{max-width:49vw;max-height:80vh}
      .app[data-layout=contact] .gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}.app[data-layout=contact] .media-frame{aspect-ratio:unset!important;overflow:hidden}.app[data-layout=contact] .media-frame img,.app[data-layout=contact] .media-frame video{width:100%;height:100%;object-fit:contain}.app[data-layout=contact][data-thumbnails=crop] .media-frame img,.app[data-layout=contact][data-thumbnails=crop] .media-frame video{object-fit:cover}.app[data-layout=contact] .card-meta{display:none}
      .panel{position:fixed;top:82px;right:18px;z-index:10;display:grid;gap:12px;width:min(390px,calc(100vw - 36px));max-height:calc(100vh - 110px);overflow:auto;padding:14px;color:var(--fg);background:var(--panel);border:1px solid var(--line);border-radius:20px;box-shadow:0 18px 60px #0006}.panel-head{display:flex;justify-content:space-between;align-items:center}.panel label{display:grid;gap:6px;color:var(--muted);font-size:13px}.panel .check{display:flex;align-items:center}.panel small{opacity:.8}
      .lightbox{position:fixed;inset:0;z-index:20;display:grid;grid-template-rows:minmax(0,1fr) auto;background:#000e}.lightbox.controls-hidden{grid-template-rows:minmax(0,1fr)}.lightbox.controls-hidden .viewer-footer{display:none}.viewer-viewport{position:relative;display:grid;place-items:center;min-width:0;min-height:0;overflow:hidden;padding:24px 74px;touch-action:none}.viewer-media{display:flex;align-items:center;justify-content:center;width:min(72vw,1100px);height:min(68vh,680px);max-width:100%;max-height:100%;min-width:0;min-height:0}.app[data-viewer-size=compact] .viewer-media{width:min(58vw,840px);height:min(60vh,560px)}.app[data-viewer-size=large] .viewer-media{width:min(86vw,1400px);height:min(78vh,820px)}.viewer-media img,.viewer-media video{display:block;width:auto;height:auto;max-width:100%;max-height:100%;object-fit:contain;transform-origin:center center;will-change:transform;user-select:none;-webkit-user-drag:none}.viewer-media img{cursor:zoom-in}.viewer-viewport.zoom-out-ready img{cursor:zoom-out}.viewer-viewport.dragging img{cursor:grabbing}
      .viewer-footer{display:flex;align-items:center;justify-content:space-between;gap:14px;min-height:86px;padding:11px 18px;color:#fff;background:#090b12;border-top:1px solid #ffffff25}.viewer-meta{display:grid;gap:3px;min-width:0}.viewer-kicker,.viewer-status{color:#ffffff9e;font-size:12px}.viewer-title{overflow:hidden;color:#ffffffdb;text-overflow:ellipsis;white-space:nowrap}.viewer-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px}.viewer-actions button{color:#fff;background:#ffffff18;border-color:#ffffff30}.viewer-controls-toggle,.viewer-close,.viewer-nav{position:fixed;z-index:22;color:#fff;background:#ffffff20;border-color:#ffffff38}.viewer-controls-toggle{top:18px;right:74px;padding:9px 12px;border-radius:999px;font-size:12px;font-weight:700}.viewer-close{top:18px;right:18px;width:44px;height:44px;padding:0;border-radius:50%;font-size:26px}.viewer-nav{top:45%;width:54px;height:78px;padding:0;font-size:52px;line-height:1;transform:translateY(-50%)}.viewer-nav.prev{left:14px}.viewer-nav.next{right:14px}
      .toasts{position:fixed;right:20px;bottom:105px;z-index:30;display:grid;gap:8px;width:min(380px,calc(100vw - 40px));pointer-events:none}.toast{padding:11px 13px;color:#fff;background:#202536;border:1px solid #ffffff2c;border-radius:12px;box-shadow:0 12px 34px #0008;opacity:0;transform:translateY(7px);transition:.18s}.toast.show{opacity:1;transform:none}.toast.success{background:#135c3d}.toast.error{background:#7a2532}.toast.warning{background:#755315}
      @media(max-width:760px){.toolbar{align-items:flex-start;flex-direction:column}.controls{justify-content:flex-start}.statusbar{display:grid}.app[data-layout=classic] .media-card,.app[data-layout=classic] .media-frame img,.app[data-layout=classic] .media-frame video{max-width:96vw}.viewer-viewport{padding:12px}.viewer-media,.app[data-viewer-size=compact] .viewer-media,.app[data-viewer-size=large] .viewer-media{width:min(92vw,900px);height:min(68vh,680px)}.viewer-nav{display:none}.viewer-footer{align-items:flex-start;flex-direction:column}.viewer-actions{justify-content:flex-start}}
    `;
  }

  function toggleAutoLoad() {
    state.settings.autoLoad = !state.settings.autoLoad;
    if (state.settings.autoLoad) {
      state.autoPaused = false;
      state.userPaused = false;
    } else {
      win.clearTimeout(state.autoTimer);
      state.autoTimer = null;
    }
    saveSettings();
    ui?.applySettings();
  }

  function registerMenus() {
    if (typeof GM_registerMenuCommand !== 'function') return;
    GM_registerMenuCommand(`Open Instagram Gallery ${VERSION}`, () =>
      ui.open(),
    );
    GM_registerMenuCommand('Copy gallery diagnostics', () =>
      copyText(diagnosticReport()),
    );
    GM_registerMenuCommand('Toggle automatic loading', toggleAutoLoad);
    GM_registerMenuCommand('Reset gallery settings', () => {
      state.settings = { ...DEFAULTS };
      saveSettings();
      ui?.toast('Settings reset.', 'success');
      ui?.applySettings();
    });
  }

  function watchNavigation() {
    let last = location.href;
    const changed = () => {
      if (location.href === last) return;
      last = location.href;
      const route = detectRoute();
      resetSession(route);
      if (state.opened) startSession();
    };

    for (const method of ['pushState', 'replaceState']) {
      const original = history[method];
      history[method] = function patchedHistory(...args) {
        const result = original.apply(this, args);
        queueMicrotask(changed);
        return result;
      };
    }
    win.addEventListener('popstate', changed);
    win.setInterval(changed, 1000);
  }

  installResponseCapture();

  ready(() => {
    ui = createUI();
    registerMenus();
    watchNavigation();
  });
})();
