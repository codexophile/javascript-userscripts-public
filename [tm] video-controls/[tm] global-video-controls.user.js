(async function () {
  'use strict';

  let activeVideo;
  let fastSpeed = 3;
  let timeIncrTiny = 6 / 160;
  let timeIncrSmall = 5;
  let timeIncrLarge = 60;

  let controlPanel,
    vidProgressEl,
    speedDispEl,
    volDispEl,
    slidVolFinEl,
    slidVolExtEl,
    divHeightEl,
    dimensionsAsPercentageEl,
    videoPlayerStateEl,
    videoReadyStateEl,
    videoNetworkStateEl,
    videoErrorStateEl,
    cbSubtitleAutoSpeedEl,
    subtitleSpeedTransitionToggleEl,
    trackIndicatorTextEl,
    trackIndicatorAudioEl,
    trackIndicatorVideoEl,
    inputSubtitleSelectorEl,
    numAutoFastSpeedEl;
  let timeTrackingPopupEl,
    timeTrackingPlayingEl,
    timeTrackingWaitingEl,
    timeTrackingTotalEl,
    timeTrackingDurationEl,
    timeTrackingComparisonEl,
    timeTrackingCurrentPositionEl,
    timeTrackingHeaderRowEl,
    spanTimeSavedSoFarEl;
  let panelUiState = 0;
  let panelUiLastNonHeadState = 0;
  let panelAutoHideEnabled = false;
  let panelPosition = null;
  let autoPauseOnBlurEnabled = false;
  let autoPausedByFocusLoss = false;
  let panelMouseInside = false;
  const defaultFastSpeed = 3;
  const panelDefaultPosition = { top: 100, left: 10 };
  const settingsConfigStorageKey = 'globalVideoControls';
  const syncSettingsStorageKey = 'globalVideoControlsSync';
  const syncGistIdStorageKey = 'globalVideoControlsSyncGistId';
  const syncTokenStorageKey = 'globalVideoControlsSyncToken';
  const syncAutoLockStorageKey = 'globalVideoControlsSyncAutoLock';
  const syncAutoLockTtlMs = 15000;
  const hardcodedSyncGistId = 'fa95900daa3e342803a3014e4a1285e9';
  const hardcodedSyncFileName = 'video-controls.json';
  const defaultProfileId = 'default';
  const musicalSubtitlePattern = /[♪♫♬♩🎵🎶]/;
  const hasModernGMStorage =
    typeof GM !== 'undefined' &&
    typeof GM.getValue === 'function' &&
    typeof GM.setValue === 'function';
  const hasModernGMDelete =
    typeof GM !== 'undefined' && typeof GM.deleteValue === 'function';
  const trackedShadowRootsByHost = new WeakMap();
  let shadowRootTrackingInstalled = false;

  let settingsConfig = null;
  let activeRulePattern = null;
  let activeProfileId = null;
  let activeHostname = '';
  let duplicateSelectorScanCompleted = false;
  let syncSettings = {
    fileName: hardcodedSyncFileName,
    visibility: 'secret',
    lastSyncAt: '',
  };
  let syncGistId = hardcodedSyncGistId;
  let syncToken = '';
  let autoSyncPushInFlight = false;
  let autoSyncPushQueued = false;
  let autoSyncPushSuppressed = false;
  const syncInstanceId = `sync-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  let syncStorageListenerRegistered = false;

  let subtitleAutoSpeedEnabled = false;
  let subtitleSelector = '';
  let subtitleSelectorInvalid = false;
  let subtitleObserver = null;
  let subtitleObserverUnsubscribe = null;
  let subtitleSelectorUserSelectStyleEl = null;
  let subtitleSelectorIframeCenterStyleEl = null;
  let lastSubtitlePresentState = null;
  let timeTrackingStorageLoaded = false;
  let timeTrackingCurrentPageKey = '';
  let timeTrackingCurrentMode = 'idle';
  let timeTrackingCurrentModeStartedAt = 0;
  let timeTrackingLastPersistAt = 0;
  let timeTrackingHeartbeatId = null;
  let timeTrackingPopupOpen = false;
  let timeTrackingStatsByPage = {};
  const trackedTimeMediaElements = new Set();
  const trackedTimeMediaAttached = new WeakSet();
  const trackedTimeMediaState = new WeakMap();

  const canUseSharedSubtitleObserver =
    typeof waitForEach === 'function' &&
    typeof CentralObserverManager !== 'undefined' &&
    typeof CentralObserverManager.observe === 'function';

  const syncSubtitleAutoSpeedSoon = debounce(() => {
    syncSubtitleAutoSpeed();
  }, 75);
  const autoSyncPushSoon = debounce(() => {
    runAutoSyncPush();
  }, 2500);
  const debouncedMain = debounce(main, 150);
  const subtitleTransitionEnabledSvgFallback = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" stroke-width="3" stroke="#000000" fill="none"><path d="M28.79,44l-9.4-9.4S31.76,5.41,56.77,7C56.77,7,60.25,30.12,28.79,44Z" fill="#FFD166" /><path d="M56,16.82a10.87,10.87,0,0,1-6-3.08,11,11,0,0,1-3.11-6.15" /><circle cx="42.32" cy="21.44" r="5.48" fill="#118AB2" /><circle cx="40.5" cy="19.5" r="1.5" fill="#FFFFFF" stroke="none" /><path d="M30.61,43.16,30,47.84a.24.24,0,0,0,.33.25l8-3.47A2.32,2.32,0,0,0,39.63,43l1.22-5.83" fill="#EF476F" /><path d="M20,33.29l-4.69.6a.23.23,0,0,1-.24-.32l3.46-7.95a2.33,2.33,0,0,1,1.67-1.35l5.82-1.22" fill="#EF476F" /><path d="M21.49,36.68c-6.55,2.1-6.88,12.47-6.88,12.47s10.08.11,12.59-6.76" fill="#FF9F1C" /><line x1="10.88" y1="52.82" x2="7.12" y2="56.59" stroke-linecap="round" /><line x1="10.6" y1="45.63" x2="7.41" y2="48.81" stroke-linecap="round" /><line x1="17.94" y1="53.11" x2="14.76" y2="56.3" stroke-linecap="round" /></svg>`;
  const subtitleTransitionDisabledSvgFallback = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" stroke-width="3" stroke="#000000" fill="none"><path d="M28.79,44l-9.4-9.4S31.76,5.41,56.77,7C56.77,7,60.25,30.12,28.79,44Z" /><path d="M56,16.82a10.87,10.87,0,0,1-6-3.08,11,11,0,0,1-3.11-6.15" /><circle cx="42.32" cy="21.44" r="5.48" /><path d="M30.61,43.16,30,47.84a.24.24,0,0,0,.33.25l8-3.47A2.32,2.32,0,0,0,39.63,43l1.22-5.83" /><path d="M20,33.29l-4.69.6a.23.23,0,0,1-.24-.32l3.46-7.95a2.33,2.33,0,0,1,1.67-1.35l5.82-1.22" /><path d="M21.49,36.68c-6.55,2.1-6.88,12.47-6.88,12.47s10.08.11,12.59-6.76" /><line x1="10.88" y1="52.82" x2="7.12" y2="56.59" stroke-linecap="round" /><line x1="10.6" y1="45.63" x2="7.41" y2="48.81" stroke-linecap="round" /><line x1="17.94" y1="53.11" x2="14.76" y2="56.3" stroke-linecap="round" /></svg>`;
  const contentChangePulseClass = 'content-change-pulse';
  const timeTrackingStorageKey = 'globalVideoControlsTimeTracking';
  const timeTrackingHeartbeatMs = 1000;
  const timeTrackingPersistEveryMs = 10000;
  const timeTrackingNoDifferenceThresholdMs = 500;
  const timeTrackingPersistSoon = debounce(() => {
    persistTimeTrackingStore();
  }, 750);

  async function initializeTimeTracking() {
    if (!hasModernGMStorage) {
      timeTrackingStorageLoaded = true;
      return;
    }

    if (!timeTrackingStorageLoaded) {
      const storedValue = await GM.getValue(timeTrackingStorageKey);
      timeTrackingStatsByPage = normalizeTimeTrackingStore(storedValue);
      timeTrackingStorageLoaded = true;
    }

    syncKnownTimeTrackingMediaElements();
    reconcileTimeTrackingState();
  }

  function normalizeTimeTrackingStore(rawValue) {
    const normalizedStore = {};
    const sourceStore =
      rawValue && typeof rawValue === 'object' && !Array.isArray(rawValue)
        ? rawValue.pages && typeof rawValue.pages === 'object'
          ? rawValue.pages
          : rawValue
        : {};

    for (const [pageKey, rawEntry] of Object.entries(sourceStore)) {
      normalizedStore[pageKey] = normalizeTimeTrackingEntry(rawEntry);
    }

    return normalizedStore;
  }

  function normalizeTimeTrackingEntry(rawEntry) {
    return {
      playedMs: normalizeTrackedDuration(rawEntry?.playedMs),
      waitingMs: normalizeTrackedDuration(rawEntry?.waitingMs),
      lastDurationMs: normalizeTrackedDuration(rawEntry?.lastDurationMs),
      lastUpdatedAt: normalizeTrackedDuration(rawEntry?.lastUpdatedAt),
    };
  }

  function normalizeTrackedDuration(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    return Math.round(parsed);
  }

  function getSafeTopLevelUrl() {
    try {
      return window.top?.location?.href || location.href;
    } catch (error) {
      return location.href;
    }
  }

  function normalizeTimeTrackingPageUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return location.href;

    try {
      const parsedUrl = new URL(rawUrl, location.href);
      parsedUrl.hash = '';

      // Playback/state query params often change frequently and should not split stats.
      [
        't',
        'time',
        'start',
        'end',
        'currentTime',
        'current_time',
        'seek',
        'position',
        'playhead',
      ].forEach(paramName => {
        parsedUrl.searchParams.delete(paramName);
      });

      return parsedUrl.toString();
    } catch (error) {
      return rawUrl.split('#')[0];
    }
  }

  function getTimeTrackingPageKey() {
    return normalizeTimeTrackingPageUrl(getSafeTopLevelUrl());
  }

  function getTimeTrackingEntry(pageKey = getTimeTrackingPageKey()) {
    if (!timeTrackingStatsByPage[pageKey]) {
      timeTrackingStatsByPage[pageKey] = normalizeTimeTrackingEntry();
    }

    return timeTrackingStatsByPage[pageKey];
  }

  function getCurrentTimeTrackingDurationMs(
    pageKey = getTimeTrackingPageKey(),
  ) {
    const activeDuration = Number(activeVideo?.duration);
    if (Number.isFinite(activeDuration) && activeDuration > 0) {
      return Math.round(activeDuration * 1000);
    }

    const entry = getTimeTrackingEntry(pageKey);
    return normalizeTrackedDuration(entry.lastDurationMs);
  }

  function formatTimeTrackingDuration(ms) {
    const safeMs = Math.max(0, Math.round(Number(ms) || 0));
    const totalSeconds = Math.floor(safeMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(
        seconds,
      ).padStart(2, '0')}`;
    }

    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  function getTimeTrackingSnapshot(now = Date.now()) {
    const pageKey = getTimeTrackingPageKey();
    const entry = getTimeTrackingEntry(pageKey);
    let playedMs = normalizeTrackedDuration(entry.playedMs);
    let waitingMs = normalizeTrackedDuration(entry.waitingMs);

    if (
      pageKey === timeTrackingCurrentPageKey &&
      timeTrackingCurrentMode !== 'idle' &&
      timeTrackingCurrentModeStartedAt > 0
    ) {
      const elapsedMs = Math.max(0, now - timeTrackingCurrentModeStartedAt);
      if (timeTrackingCurrentMode === 'playing') {
        playedMs += elapsedMs;
      } else if (timeTrackingCurrentMode === 'waiting') {
        waitingMs += elapsedMs;
      }
    }

    const totalMs = playedMs + waitingMs;
    const durationMs = getCurrentTimeTrackingDurationMs(pageKey);
    return { pageKey, playedMs, waitingMs, totalMs, durationMs };
  }

  function flushTimeTrackingSegment(now = Date.now()) {
    if (!timeTrackingCurrentPageKey || timeTrackingCurrentMode === 'idle') {
      return;
    }

    if (!timeTrackingCurrentModeStartedAt) {
      timeTrackingCurrentModeStartedAt = now;
      return;
    }

    const elapsedMs = Math.max(0, now - timeTrackingCurrentModeStartedAt);
    if (elapsedMs <= 0) return;

    const entry = getTimeTrackingEntry(timeTrackingCurrentPageKey);
    if (timeTrackingCurrentMode === 'playing') {
      entry.playedMs += elapsedMs;
    } else if (timeTrackingCurrentMode === 'waiting') {
      entry.waitingMs += elapsedMs;
    }
    entry.lastUpdatedAt = now;
    timeTrackingCurrentModeStartedAt = now;
  }

  function recordObservedDuration(mediaEl) {
    const durationSeconds = Number(mediaEl?.duration);
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
      return false;
    }

    const durationMs = Math.round(durationSeconds * 1000);
    const entry = getTimeTrackingEntry();
    if (entry.lastDurationMs === durationMs) return false;

    entry.lastDurationMs = durationMs;
    entry.lastUpdatedAt = Date.now();
    return true;
  }

  function applyTimeTrackingMediaEvent(mediaEl, eventName) {
    if (!mediaEl) return false;

    const currentState = trackedTimeMediaState.get(mediaEl) || {
      playing: false,
      waiting: false,
    };
    let stateChanged = false;

    if (eventName === 'loadedmetadata' || eventName === 'durationchange') {
      stateChanged = recordObservedDuration(mediaEl) || stateChanged;
    }

    if (
      eventName === 'pause' ||
      eventName === 'ended' ||
      eventName === 'emptied' ||
      eventName === 'abort' ||
      eventName === 'error'
    ) {
      if (currentState.playing || currentState.waiting) stateChanged = true;
      currentState.playing = false;
      currentState.waiting = false;
    } else if (
      eventName === 'waiting' ||
      eventName === 'stalled' ||
      eventName === 'seeking' ||
      eventName === 'loadstart'
    ) {
      if (!mediaEl.paused && !currentState.waiting) stateChanged = true;
      if (!mediaEl.paused) {
        currentState.playing = false;
        currentState.waiting = true;
      }
    } else if (
      eventName === 'play' ||
      eventName === 'playing' ||
      eventName === 'canplay' ||
      eventName === 'canplaythrough'
    ) {
      if (!mediaEl.paused && (!currentState.playing || currentState.waiting)) {
        stateChanged = true;
      }
      if (!mediaEl.paused) {
        currentState.playing = true;
        currentState.waiting = false;
      }
    } else if (eventName === 'seeked' && !mediaEl.paused) {
      if (!currentState.playing && !currentState.waiting) {
        stateChanged = true;
      }
      if (mediaEl.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
        currentState.playing = true;
        currentState.waiting = false;
      }
    }

    trackedTimeMediaState.set(mediaEl, currentState);
    return stateChanged;
  }

  function syncKnownTimeTrackingMediaElements() {
    const mediaElements = querySelectorAllDeep('video, audio');
    mediaElements.forEach(mediaEl => registerTimeTrackingMediaElement(mediaEl));
  }

  function registerTimeTrackingMediaElement(mediaEl) {
    if (!mediaEl || trackedTimeMediaAttached.has(mediaEl)) return;

    trackedTimeMediaAttached.add(mediaEl);
    trackedTimeMediaElements.add(mediaEl);

    const initialState = {
      playing: !mediaEl.paused && !mediaEl.ended,
      waiting:
        !mediaEl.paused &&
        !mediaEl.ended &&
        mediaEl.readyState < HTMLMediaElement.HAVE_FUTURE_DATA,
    };
    trackedTimeMediaState.set(mediaEl, initialState);

    const handleMediaEvent = event => {
      const changed = applyTimeTrackingMediaEvent(mediaEl, event.type);
      if (changed) {
        reconcileTimeTrackingState();
      } else if (
        event.type === 'loadedmetadata' ||
        event.type === 'durationchange'
      ) {
        refreshTimeTrackingPopup();
        scheduleTimeTrackingPersist();
      }
    };

    [
      'loadstart',
      'loadedmetadata',
      'canplay',
      'canplaythrough',
      'play',
      'playing',
      'pause',
      'waiting',
      'stalled',
      'seeking',
      'seeked',
      'ended',
      'emptied',
      'abort',
      'error',
      'durationchange',
    ].forEach(eventName => {
      mediaEl.addEventListener(eventName, handleMediaEvent);
    });
  }

  function getTrackedMediaPlaybackMode() {
    let hasWaitingMedia = false;

    for (const mediaEl of trackedTimeMediaElements) {
      if (!mediaEl || !mediaEl.isConnected) {
        trackedTimeMediaElements.delete(mediaEl);
        continue;
      }

      const mediaState = trackedTimeMediaState.get(mediaEl);
      if (!mediaState) continue;
      if (mediaEl.paused || mediaEl.ended) continue;

      if (mediaState.playing) {
        return 'playing';
      }

      if (mediaState.waiting) {
        hasWaitingMedia = true;
      }
    }

    return hasWaitingMedia ? 'waiting' : 'idle';
  }

  function scheduleTimeTrackingPersist() {
    if (!timeTrackingStorageLoaded || !hasModernGMStorage) return;

    timeTrackingPersistSoon();
  }

  async function persistTimeTrackingStore() {
    if (!timeTrackingStorageLoaded || !hasModernGMStorage) return;

    flushTimeTrackingSegment();
    const payload = normalizeTimeTrackingStore(timeTrackingStatsByPage);
    timeTrackingLastPersistAt = Date.now();

    await Promise.resolve(GM.setValue(timeTrackingStorageKey, payload)).catch(
      () => {},
    );
  }

  function reconcileTimeTrackingState() {
    if (!timeTrackingStorageLoaded) return;

    const now = Date.now();
    const nextPageKey = getTimeTrackingPageKey();
    let stateChanged = false;

    if (!timeTrackingCurrentPageKey) {
      timeTrackingCurrentPageKey = nextPageKey;
      stateChanged = true;
    } else if (timeTrackingCurrentPageKey !== nextPageKey) {
      flushTimeTrackingSegment(now);
      timeTrackingCurrentPageKey = nextPageKey;
      timeTrackingCurrentModeStartedAt = 0;
      stateChanged = true;
    }

    const nextMode = getTrackedMediaPlaybackMode();
    if (nextMode !== timeTrackingCurrentMode) {
      flushTimeTrackingSegment(now);
      timeTrackingCurrentMode = nextMode;
      timeTrackingCurrentModeStartedAt = nextMode === 'idle' ? 0 : now;
      stateChanged = true;
    } else if (
      timeTrackingCurrentMode !== 'idle' &&
      !timeTrackingCurrentModeStartedAt
    ) {
      timeTrackingCurrentModeStartedAt = now;
    }

    if (timeTrackingCurrentMode === 'idle') {
      stopTimeTrackingHeartbeat();
    } else {
      startTimeTrackingHeartbeat();
    }

    if (stateChanged) {
      scheduleTimeTrackingPersist();
    }

    refreshTimeTrackingPopup(now);
  }

  function startTimeTrackingHeartbeat() {
    if (timeTrackingHeartbeatId) return;

    timeTrackingHeartbeatId = window.setInterval(() => {
      if (!timeTrackingStorageLoaded) return;

      syncKnownTimeTrackingMediaElements();
      reconcileTimeTrackingState();

      const now = Date.now();
      if (now - timeTrackingLastPersistAt >= timeTrackingPersistEveryMs) {
        persistTimeTrackingStore();
      }
    }, timeTrackingHeartbeatMs);
  }

  function stopTimeTrackingHeartbeat() {
    if (!timeTrackingHeartbeatId) return;

    window.clearInterval(timeTrackingHeartbeatId);
    timeTrackingHeartbeatId = null;
  }

  function getTimeTrackingComparisonLabel(totalMs, durationMs) {
    if (!durationMs) return 'No video duration yet';

    const diffMs = Math.round(totalMs - durationMs);
    if (Math.abs(diffMs) <= timeTrackingNoDifferenceThresholdMs) {
      return 'No difference';
    }

    if (diffMs > 0) {
      return `Time wasted: ${formatTimeTrackingDuration(diffMs)}`;
    }

    return `Time saved: ${formatTimeTrackingDuration(Math.abs(diffMs))}`;
  }

  function getTimeTrackingCurrentPositionLabel(totalMs) {
    if (!activeVideo) return '—';

    const currentTimeMs = Math.round(activeVideo.currentTime * 1000);
    if (currentTimeMs <= 0) return '—';

    const diffMs = Math.round(totalMs - currentTimeMs);
    if (Math.abs(diffMs) <= timeTrackingNoDifferenceThresholdMs) {
      return '—';
    }

    return formatTimeTrackingDuration(Math.abs(diffMs));
  }

  function getTimeTrackingCurrentPositionType(totalMs) {
    if (!activeVideo) return 'neutral';

    const currentTimeMs = Math.round(activeVideo.currentTime * 1000);
    if (currentTimeMs <= 0) return 'neutral';

    const diffMs = Math.round(totalMs - currentTimeMs);
    if (Math.abs(diffMs) <= timeTrackingNoDifferenceThresholdMs) {
      return 'neutral';
    }

    if (diffMs > 0) {
      return 'wasted';
    }

    return 'saved';
  }

  function refreshTimeTrackingPopup(now = Date.now()) {
    if (!timeTrackingPlayingEl) return;

    const snapshot = getTimeTrackingSnapshot(now);
    const comparisonLabel = getTimeTrackingComparisonLabel(
      snapshot.totalMs,
      snapshot.durationMs,
    );

    if (timeTrackingPlayingEl) {
      timeTrackingPlayingEl.textContent = formatTimeTrackingDuration(
        snapshot.playedMs,
      );
    }
    if (timeTrackingWaitingEl) {
      timeTrackingWaitingEl.textContent = formatTimeTrackingDuration(
        snapshot.waitingMs,
      );
    }
    if (timeTrackingTotalEl) {
      timeTrackingTotalEl.textContent = formatTimeTrackingDuration(
        snapshot.totalMs,
      );
    }
    if (timeTrackingDurationEl) {
      timeTrackingDurationEl.textContent = snapshot.durationMs
        ? formatTimeTrackingDuration(snapshot.durationMs)
        : '0:00';
    }
    if (timeTrackingComparisonEl) {
      timeTrackingComparisonEl.textContent = comparisonLabel;
      timeTrackingComparisonEl.title = comparisonLabel;
    }
    if (timeTrackingCurrentPositionEl) {
      const currentPositionLabel = getTimeTrackingCurrentPositionLabel(
        snapshot.totalMs,
      );
      timeTrackingCurrentPositionEl.textContent = currentPositionLabel;
      timeTrackingCurrentPositionEl.title = currentPositionLabel;
    }
    if (spanTimeSavedSoFarEl) {
      const currentPositionLabel = getTimeTrackingCurrentPositionLabel(
        snapshot.totalMs,
      );
      const currentPositionType = getTimeTrackingCurrentPositionType(
        snapshot.totalMs,
      );
      spanTimeSavedSoFarEl.textContent = currentPositionLabel;
      spanTimeSavedSoFarEl.title = currentPositionLabel;
      spanTimeSavedSoFarEl.className = `text time-saved-badge ${currentPositionType}`;
    }
    if (timeTrackingPopupEl) {
      timeTrackingPopupEl.hidden = !timeTrackingPopupOpen;
    }
  }

  function toggleTimeTrackingPopup(forceOpen) {
    timeTrackingPopupOpen =
      typeof forceOpen === 'boolean' ? forceOpen : !timeTrackingPopupOpen;
    refreshTimeTrackingPopup();
  }

  function handleTimeTrackingBeforeUnload() {
    if (!timeTrackingStorageLoaded) return;

    flushTimeTrackingSegment();
    if (timeTrackingCurrentMode !== 'idle') {
      persistTimeTrackingStore();
    }
  }

  const SUBTITLE_STYLES = {
    selectable: selector => `${selector}, ${selector} * {
      user-select: text !important;
      -webkit-user-select: text !important;
      -moz-user-select: text !important;
      -ms-user-select: text !important;
      -webkit-touch-callout: default !important;
      pointer-events: auto !important;
      cursor: text !important;
      background: none !important;
      background-color: transparent !important;
      text-shadow: 
        0px 2px 4px rgba(0, 0, 0, 0.9),
        0px 4px 10px rgba(0, 0, 0, 0.7),
        0px 0px 6px rgba(0, 0, 0, 0.8);
      backdrop-filter: unset !important;
    }`,
    centered: selector => `${selector} {
      position: fixed !important;
      top: 50% !important;
      left: 50% !important;
      right: auto !important;
      bottom: auto !important;
      margin: 0 !important;
      transform: translate(-50%, -50%) !important;
      text-align: center !important;
      width: max-content !important;
      max-width: min(95vw, 95%) !important;
      z-index: 2147483647 !important;
      background: none !important;
      background-color: transparent !important;
    }`,
  };

  const animatedContentSelector =
    '#frame-rate-display, #bitrate-display, .divHeight, #video-player-state, #video-ready-state, #video-network-state, #video-error-state';

  installShadowRootTracking();

  await hydrateStoredSettings();
  await initConfigSync();
  await initializeTimeTracking();

  document.addEventListener('visibilitychange', handleAutoPauseTrigger);
  document.addEventListener('visibilitychange', handleAutoResumeTrigger);
  window.addEventListener('focus', handleAutoResumeTrigger);
  window.addEventListener('blur', handleAutoPauseTrigger);
  window.addEventListener('pagehide', handleAutoPauseTrigger);

  new MutationObserver(mutations => {
    const hasExternalMutation = mutations.some(
      mutation => !isNodeInsideControlPanel(mutation?.target),
    );
    if (!hasExternalMutation) return;
    debouncedMain();
  }).observe(document.body, {
    childList: true,
    subtree: true,
  });
  document.addEventListener('scroll', debouncedMain);
  document.addEventListener('keyup', keyboardEvent, false);
  document.addEventListener('mousedown', addMouseEvents);
  window.addEventListener('beforeunload', stopSubtitlePresenceMonitoring);
  window.addEventListener('beforeunload', handleTimeTrackingBeforeUnload);

  function installShadowRootTracking() {
    if (shadowRootTrackingInstalled) return;
    shadowRootTrackingInstalled = true;

    const elementPrototype = window.Element?.prototype;
    const originalAttachShadow = elementPrototype?.attachShadow;
    if (typeof originalAttachShadow !== 'function') return;

    try {
      elementPrototype.attachShadow = function patchedAttachShadow(init) {
        const createdShadowRoot = originalAttachShadow.call(this, init);

        // Closed roots are only discoverable if captured when created.
        if (createdShadowRoot) {
          trackedShadowRootsByHost.set(this, createdShadowRoot);
        }

        return createdShadowRoot;
      };
    } catch (error) {}
  }

  function getKnownShadowRoot(hostElement) {
    if (!hostElement) return null;

    try {
      if (hostElement.shadowRoot) {
        return hostElement.shadowRoot;
      }
    } catch (error) {}

    return trackedShadowRootsByHost.get(hostElement) || null;
  }

  function querySelectorAllDeep(selector, root = document) {
    const matchedElements = [];
    const seenElements = new Set();
    const seenRoots = new Set();

    const visitRoot = currentRoot => {
      if (!currentRoot || seenRoots.has(currentRoot)) return;
      seenRoots.add(currentRoot);

      const directMatches = currentRoot.querySelectorAll(selector);
      directMatches.forEach(item => {
        if (seenElements.has(item)) return;
        seenElements.add(item);
        matchedElements.push(item);
      });

      const descendants = currentRoot.querySelectorAll('*');
      descendants.forEach(element => {
        const nestedShadowRoot = getKnownShadowRoot(element);
        if (!nestedShadowRoot) return;
        visitRoot(nestedShadowRoot);
      });
    };

    visitRoot(root);
    return matchedElements;
  }

  function isNodeInsideControlPanel(node) {
    const panelEl =
      controlPanel || document.getElementById('video-controlPanel');
    if (!panelEl || !node) return false;

    if (node.nodeType === Node.ELEMENT_NODE) {
      return panelEl.contains(node);
    }

    const parentNode = node.parentNode;
    return !!parentNode && panelEl.contains(parentNode);
  }

  async function main() {
    activeVideo = getActiveVideo();
    const vidContPanel = document.querySelector(`#video-controlPanel`);
    if (!activeVideo) {
      // vidContPanel.style.display = 'none';
    }

    if (activeVideo && !vidContPanel) {
      await addToolbar();
      const collapsibleCont = await waitFor('#collapsibleContent');
      generateToolbarButton('📹', collapsibleCont, null, () => {
        fadeToggle(document.querySelectorAll(`#video-controlPanel`), 2500);
      });
    }
    if (!activeVideo && vidContPanel) vidContPanel.style.display = 'none';
    else if (vidContPanel) vidContPanel.style.display = '';

    if (activeVideo) {
      videoEventListeners(activeVideo);
      initializeToolbar();
      refreshSubtitleSelectorAvailabilityIndicator();
      syncSubtitleAutoSpeed(activeVideo);
    }

    syncKnownTimeTrackingMediaElements();
    reconcileTimeTrackingState();
  }

  async function hydrateStoredSettings() {
    await ensureSettingsConfigLoaded();
    autoPauseOnBlurEnabled = await loadAutoPauseOnBlurSetting();
    subtitleSelector = await loadSubtitleSelectorSetting();
    fastSpeed = await loadFastSpeedSetting(fastSpeed);
    panelAutoHideEnabled = await loadPanelAutoHideSetting();
    panelPosition = await loadPanelPositionSetting();
    applySubtitleSelectorTextSelectableStyle();
  }

  async function reloadRuntimeSettingsFromProfile() {
    autoPauseOnBlurEnabled = await loadAutoPauseOnBlurSetting();
    subtitleSelector = await loadSubtitleSelectorSetting();
    fastSpeed = await loadFastSpeedSetting(fastSpeed);
    panelAutoHideEnabled = await loadPanelAutoHideSetting();
    panelPosition = await loadPanelPositionSetting();

    applySubtitleSelectorTextSelectableStyle();

    if (cbSubtitleAutoSpeedEl) {
      cbSubtitleAutoSpeedEl.checked = subtitleAutoSpeedEnabled;
    }
    const cbAutoPauseOnBlurEl =
      controlPanel?.querySelector('#cbAutoPauseOnBlur');
    if (cbAutoPauseOnBlurEl) {
      cbAutoPauseOnBlurEl.checked = autoPauseOnBlurEnabled;
    }
    const cbAutoHideEl = controlPanel?.querySelector('#cbAutoHide');
    if (cbAutoHideEl) {
      cbAutoHideEl.checked = panelAutoHideEnabled;
    }
    if (inputSubtitleSelectorEl) {
      inputSubtitleSelectorEl.value = subtitleSelector;
    }
    if (numAutoFastSpeedEl) {
      numAutoFastSpeedEl.value = String(fastSpeed);
    }
    if (controlPanel) {
      applyStoredPanelPosition(controlPanel);
      applyEffectivePanelUiState(controlPanel);
    }

    refreshSubtitleSelectorAvailabilityIndicator();
    renderSubtitleTransitionToggle();

    if (subtitleAutoSpeedEnabled) {
      startSubtitlePresenceMonitoring();
    } else {
      stopSubtitlePresenceMonitoring();
      setPlaybackRateIfNeeded(activeVideo, 1);
    }

    syncSubtitleAutoSpeed(activeVideo);
  }

  function getDefaultProfileShape() {
    return {
      autoHide: false,
      autoPauseOnBlur: false,
      autoSpeedSelector: '',
      autoSpeedFast: defaultFastSpeed,
    };
  }

  function createDefaultSettingsConfig() {
    return {
      profiles: {
        [defaultProfileId]: getDefaultProfileShape(),
      },
      rules: {},
    };
  }

  function normalizeHostname(hostname) {
    const normalized = String(hostname || '')
      .trim()
      .toLowerCase();
    return normalized.replace(/\.+$/, '');
  }

  function normalizePanelPositionValue(value) {
    if (!value || typeof value !== 'object') return null;

    const top = Number(value.top);
    const left = Number(value.left);
    if (!Number.isFinite(top) || !Number.isFinite(left)) return null;

    return { top, left };
  }

  function sanitizeSelectorValue(value) {
    return String(value || '').trim();
  }

  function normalizeSelectorForComparison(value) {
    let normalized = sanitizeSelectorValue(value);
    if (!normalized) return '';

    normalized = normalized
      .replace(/\\(["'])/g, '$1')
      .replace(/\s*=\s*/g, '=')
      .replace(
        /\[\s*([^\]\s~|^$*!=]+)=['"]([A-Za-z0-9_-]+)['"]\s*\]/g,
        '[$1=$2]',
      );

    return normalized;
  }

  function normalizeFastSpeedValue(value, fallback = defaultFastSpeed) {
    const parsed = Number.parseFloat(String(value));
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return parsed;
  }

  function normalizeProfile(
    profileValue,
    fallbackFastSpeed = defaultFastSpeed,
  ) {
    const source =
      profileValue && typeof profileValue === 'object' ? profileValue : {};
    const normalized = {};

    if (typeof source.autoHide === 'boolean') {
      normalized.autoHide = source.autoHide;
    }
    if (typeof source.autoPauseOnBlur === 'boolean') {
      normalized.autoPauseOnBlur = source.autoPauseOnBlur;
    }
    if (source.autoSpeedSelector !== undefined) {
      normalized.autoSpeedSelector = sanitizeSelectorValue(
        source.autoSpeedSelector,
      );
    }
    if (source.autoSpeedFast !== undefined) {
      normalized.autoSpeedFast = normalizeFastSpeedValue(
        source.autoSpeedFast,
        fallbackFastSpeed,
      );
    }

    const position = normalizePanelPositionValue(source.panelPosition);
    if (position) {
      normalized.panelPosition = position;
    }

    const iframePosition = normalizePanelPositionValue(
      source.panelPositionIframe,
    );
    if (iframePosition) {
      normalized.panelPositionIframe = iframePosition;
    }

    return normalized;
  }

  function getSettingsRoot(config = settingsConfig) {
    if (!config || typeof config !== 'object') {
      return null;
    }

    const root = config;

    if (!root.profiles || typeof root.profiles !== 'object') {
      root.profiles = {};
    }
    if (!root.rules || typeof root.rules !== 'object') {
      root.rules = {};
    }

    return root;
  }

  function normalizeSettingsConfig(rawConfig) {
    const seededConfig = createDefaultSettingsConfig();
    const root = getSettingsRoot(seededConfig);

    const parsedConfig = parseConfigPayload(rawConfig);
    if (!parsedConfig || typeof parsedConfig !== 'object') {
      return seededConfig;
    }

    const rawRoot =
      parsedConfig.profiles || parsedConfig.rules ? parsedConfig : null;

    if (!rawRoot || typeof rawRoot !== 'object') {
      return seededConfig;
    }

    const rawProfiles =
      rawRoot.profiles && typeof rawRoot.profiles === 'object'
        ? rawRoot.profiles
        : {};
    const rawRules =
      rawRoot.rules && typeof rawRoot.rules === 'object' ? rawRoot.rules : {};

    root.profiles = {};
    for (const [profileId, profileValue] of Object.entries(rawProfiles)) {
      const normalizedProfileId = String(profileId || '').trim();
      if (!normalizedProfileId) continue;
      root.profiles[normalizedProfileId] = normalizeProfile(profileValue);
    }

    if (!root.profiles[defaultProfileId]) {
      root.profiles[defaultProfileId] = getDefaultProfileShape();
    }

    root.rules = {};
    for (const [pattern, profileId] of Object.entries(rawRules)) {
      const normalizedPattern = normalizeHostname(pattern);
      const normalizedProfileId = String(profileId || '').trim();
      if (!normalizedPattern || !normalizedProfileId) continue;
      root.rules[normalizedPattern] = normalizedProfileId;
    }

    return seededConfig;
  }

  function parseConfigPayload(rawValue) {
    if (!rawValue) return null;

    if (typeof rawValue === 'string') {
      try {
        return JSON.parse(rawValue);
      } catch (error) {
        return null;
      }
    }

    if (typeof rawValue === 'object') {
      return rawValue;
    }

    return null;
  }

  function getMenuCommandRegisterFunction() {
    if (typeof GM_registerMenuCommand === 'function') {
      return GM_registerMenuCommand;
    }

    if (typeof GM !== 'undefined') {
      if (typeof GM.registerMenuCommand === 'function') {
        return GM.registerMenuCommand.bind(GM);
      }
    }

    return null;
  }

  function getValueChangeListenerRegisterFunction() {
    if (typeof GM_addValueChangeListener === 'function') {
      return GM_addValueChangeListener;
    }

    if (
      typeof GM !== 'undefined' &&
      typeof GM.addValueChangeListener === 'function'
    ) {
      return GM.addValueChangeListener.bind(GM);
    }

    return null;
  }

  async function tryAcquireAutoSyncLock() {
    if (!hasModernGMStorage) return true;

    const now = Date.now();
    const token = `${syncInstanceId}:${now}`;

    let currentLock = null;
    try {
      currentLock = await GM.getValue(syncAutoLockStorageKey);
    } catch (error) {}

    if (
      currentLock &&
      typeof currentLock === 'object' &&
      Number(currentLock.expiresAt) > now &&
      currentLock.owner &&
      currentLock.owner !== syncInstanceId
    ) {
      return false;
    }

    const nextLock = {
      owner: syncInstanceId,
      token,
      expiresAt: now + syncAutoLockTtlMs,
    };

    await Promise.resolve(GM.setValue(syncAutoLockStorageKey, nextLock)).catch(
      () => {},
    );

    try {
      const verifyLock = await GM.getValue(syncAutoLockStorageKey);
      return !!(
        verifyLock &&
        typeof verifyLock === 'object' &&
        verifyLock.owner === syncInstanceId &&
        verifyLock.token === token
      );
    } catch (error) {
      return false;
    }
  }

  async function releaseAutoSyncLock() {
    if (!hasModernGMStorage) return;

    let currentLock = null;
    try {
      currentLock = await GM.getValue(syncAutoLockStorageKey);
    } catch (error) {
      return;
    }

    if (!currentLock || typeof currentLock !== 'object') return;
    if (currentLock.owner !== syncInstanceId) return;

    if (hasModernGMDelete) {
      await Promise.resolve(GM.deleteValue(syncAutoLockStorageKey)).catch(
        () => {},
      );
      return;
    }

    await Promise.resolve(GM.setValue(syncAutoLockStorageKey, null)).catch(
      () => {},
    );
  }

  async function registerConfigStorageSyncListener() {
    if (syncStorageListenerRegistered) return;

    const registerListener = getValueChangeListenerRegisterFunction();
    if (!registerListener) return;

    const onConfigChanged = (name, oldValue, newValue, remote) => {
      if (name !== settingsConfigStorageKey) return;
      if (autoSyncPushSuppressed) return;

      if (typeof remote === 'boolean' && !remote) {
        return;
      }

      const before = parseConfigPayload(oldValue);
      const after = parseConfigPayload(newValue);
      if (before && after) {
        try {
          const beforeJson = JSON.stringify(before);
          const afterJson = JSON.stringify(after);
          if (beforeJson === afterJson) return;
        } catch (error) {}
      }

      triggerAutoSyncPush();
    };

    await Promise.resolve(
      registerListener(settingsConfigStorageKey, onConfigChanged),
    ).catch(() => {});

    syncStorageListenerRegistered = true;
  }

  function sanitizeSyncSettings(rawValue) {
    const source =
      rawValue && typeof rawValue === 'object' ? rawValue : Object.create(null);

    const gistId = String(source.gistId || '').trim();
    const fallbackFileName = 'global-video-controls.config.json';
    const fileNameCandidate = String(
      source.fileName || fallbackFileName,
    ).trim();
    const fileName = fileNameCandidate || fallbackFileName;

    const visibility =
      String(source.visibility || 'secret').toLowerCase() === 'public'
        ? 'public'
        : 'secret';

    const lastSyncAt = String(source.lastSyncAt || '').trim();

    return {
      gistId,
      fileName,
      visibility,
      lastSyncAt,
    };
  }

  async function loadSyncSettingsFromStorage() {
    if (!hasModernGMStorage) return;

    let rawSyncSettings = null;
    try {
      rawSyncSettings = await GM.getValue(syncSettingsStorageKey);
      syncSettings = sanitizeSyncSettings(rawSyncSettings);
    } catch (error) {
      syncSettings = sanitizeSyncSettings(null);
    }

    syncSettings.fileName = hardcodedSyncFileName;

    try {
      const rawGistId = await GM.getValue(syncGistIdStorageKey);
      syncGistId = String(rawGistId || '').trim();
      if (!syncGistId) {
        const legacyGistId = String(rawSyncSettings?.gistId || '').trim();
        syncGistId = legacyGistId;
      }
    } catch (error) {
      syncGistId = '';
    }

    syncGistId = hardcodedSyncGistId;

    try {
      const rawToken = await GM.getValue(syncTokenStorageKey);
      syncToken = String(rawToken || '').trim();
    } catch (error) {
      syncToken = '';
    }
  }

  async function saveSyncSettingsToStorage() {
    if (!hasModernGMStorage) return;

    syncGistId = hardcodedSyncGistId;
    syncSettings.fileName = hardcodedSyncFileName;

    await Promise.resolve(
      GM.setValue(syncSettingsStorageKey, sanitizeSyncSettings(syncSettings)),
    ).catch(() => {});

    await Promise.resolve(GM.setValue(syncGistIdStorageKey, syncGistId)).catch(
      () => {},
    );

    if (syncToken) {
      await Promise.resolve(GM.setValue(syncTokenStorageKey, syncToken)).catch(
        () => {},
      );
      return;
    }

    if (hasModernGMDelete) {
      await Promise.resolve(GM.deleteValue(syncTokenStorageKey)).catch(
        () => {},
      );
      return;
    }

    await Promise.resolve(GM.setValue(syncTokenStorageKey, '')).catch(() => {});
  }

  async function getSecret(valueKey = 'apiKey', promptText = '') {
    if (!hasModernGMStorage) return '';

    try {
      const storedValue = await GM.getValue(valueKey);
      const normalizedStoredValue = String(storedValue || '').trim();
      if (normalizedStoredValue) return normalizedStoredValue;
    } catch (error) {}

    const enteredValue = window.prompt(
      promptText || `Please enter your ${valueKey} value:`,
    );
    if (enteredValue === null) return '';

    const normalizedEnteredValue = String(enteredValue || '').trim();
    if (!normalizedEnteredValue) return '';

    await Promise.resolve(GM.setValue(valueKey, normalizedEnteredValue)).catch(
      () => {},
    );
    return normalizedEnteredValue;
  }

  function getSyncStatusText() {
    const maskedToken = syncToken
      ? `${syncToken.slice(0, 4)}...${syncToken.slice(-4)}`
      : '(not set)';
    const gistText = syncGistId || '(not set)';
    const fileText = syncSettings.fileName || '(not set)';
    const visibilityText = syncSettings.visibility || 'secret';
    const lastSyncText = syncSettings.lastSyncAt || '(never)';

    return [
      'GitHub Gist sync status',
      `- Gist ID: ${gistText}`,
      `- File: ${fileText}`,
      `- Visibility (new gist): ${visibilityText}`,
      `- Token: ${maskedToken}`,
      `- Last sync: ${lastSyncText}`,
    ].join('\n');
  }

  function alertSyncStatus() {
    window.alert(getSyncStatusText());
  }

  function triggerAutoSyncPush() {
    if (autoSyncPushSuppressed) return;

    autoSyncPushQueued = true;
    autoSyncPushSoon();
  }

  async function runAutoSyncPush() {
    if (autoSyncPushSuppressed) return;
    if (autoSyncPushInFlight) return;
    if (!autoSyncPushQueued) return;

    autoSyncPushInFlight = true;
    autoSyncPushQueued = false;

    let lockAcquired = false;
    try {
      await loadSyncSettingsFromStorage();
      if (!syncToken) return;

      lockAcquired = await tryAcquireAutoSyncLock();
      if (!lockAcquired) return;

      const storedConfig = await readConfigFromStorage();
      settingsConfig = normalizeSettingsConfig(storedConfig);
      resolveActiveProfileForHostname(location.hostname);

      await pushConfigToGist({
        silent: true,
        skipEnsureLoaded: true,
      });
    } catch (error) {
      console.error('Global Video Controls auto-sync error:', error);
    } finally {
      if (lockAcquired) {
        await releaseAutoSyncLock();
      }

      autoSyncPushInFlight = false;

      if (autoSyncPushQueued && !autoSyncPushSuppressed) {
        autoSyncPushSoon();
      }
    }
  }

  async function githubApiRequest(path, options = {}) {
    const { method = 'GET', payload = null, allowAnonymous = false } = options;

    if (!allowAnonymous && !syncToken) {
      throw new Error('Missing GitHub token. Run sync setup first.');
    }

    const headers = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    if (payload) {
      headers['Content-Type'] = 'application/json';
    }
    if (syncToken) {
      headers.Authorization = `Bearer ${syncToken}`;
    }

    const response = await fetch(`https://api.github.com${path}`, {
      method,
      headers,
      body: payload ? JSON.stringify(payload) : undefined,
    });

    const responseText = await response.text();
    let parsedBody = null;
    if (responseText) {
      try {
        parsedBody = JSON.parse(responseText);
      } catch (error) {
        parsedBody = null;
      }
    }

    if (!response.ok) {
      const apiMessage =
        parsedBody && typeof parsedBody.message === 'string'
          ? parsedBody.message
          : response.statusText;
      throw new Error(
        `GitHub API ${response.status} ${response.statusText}: ${apiMessage}`,
      );
    }

    return parsedBody || Object.create(null);
  }

  async function fetchGistFileContent(fileInfo) {
    if (!fileInfo || typeof fileInfo !== 'object') {
      throw new Error('Selected gist file metadata is invalid.');
    }

    if (typeof fileInfo.content === 'string' && !fileInfo.truncated) {
      return fileInfo.content;
    }

    const rawUrl = String(fileInfo.raw_url || '').trim();
    if (!rawUrl) {
      throw new Error('Unable to read gist file content (raw URL missing).');
    }

    const response = await fetch(rawUrl, {
      headers: syncToken ? { Authorization: `Bearer ${syncToken}` } : undefined,
    });
    if (!response.ok) {
      throw new Error(
        `Failed to download gist file: ${response.status} ${response.statusText}`,
      );
    }

    return response.text();
  }

  async function configureGistSync() {
    await loadSyncSettingsFromStorage();

    syncToken = await getSecret(
      syncTokenStorageKey,
      'GitHub personal access token for Gist sync (needs gist scope)',
    );
    syncGistId = hardcodedSyncGistId;
    syncSettings.fileName = hardcodedSyncFileName;

    const visibilityPrompt = window.prompt(
      'Visibility for newly created gist (secret/public):',
      syncSettings.visibility || 'secret',
    );
    if (visibilityPrompt !== null) {
      syncSettings.visibility =
        visibilityPrompt.trim().toLowerCase() === 'public'
          ? 'public'
          : 'secret';
    }

    await saveSyncSettingsToStorage();
    alertSyncStatus();
  }

  function buildConfigSyncPayload() {
    const syncFileName = hardcodedSyncFileName;
    const configJson = JSON.stringify(settingsConfig, null, 2);
    return {
      syncFileName,
      configJson,
    };
  }

  async function pushConfigToGist(options = {}) {
    const { silent = false, skipEnsureLoaded = false } = options;

    if (!skipEnsureLoaded) {
      await ensureSettingsConfigLoaded();
    }
    await loadSyncSettingsFromStorage();

    if (!syncToken) {
      if (!silent) {
        window.alert(
          'No GitHub token found. Run "Video Controls: Sync Setup (GitHub Gist)" first.',
        );
      }
      return false;
    }

    const { syncFileName, configJson } = buildConfigSyncPayload();

    let gistResponse;
    if (syncGistId) {
      gistResponse = await githubApiRequest(`/gists/${syncGistId}`, {
        method: 'PATCH',
        payload: {
          description: 'Global Video Controls userscript config',
          files: {
            [syncFileName]: {
              content: configJson,
            },
          },
        },
      });
    } else {
      gistResponse = await githubApiRequest('/gists', {
        method: 'POST',
        payload: {
          description: 'Global Video Controls userscript config',
          public: syncSettings.visibility === 'public',
          files: {
            [syncFileName]: {
              content: configJson,
            },
          },
        },
      });
    }

    syncGistId = String(gistResponse.id || syncGistId || '').trim();
    syncGistId = hardcodedSyncGistId;
    syncSettings.fileName = hardcodedSyncFileName;
    syncSettings.lastSyncAt = new Date().toISOString();
    await saveSyncSettingsToStorage();

    const htmlUrl = String(gistResponse.html_url || '').trim();
    if (!silent) {
      window.alert(
        [
          'Config pushed to GitHub Gist.',
          `Gist ID: ${syncGistId || '(unknown)'}`,
          htmlUrl ? `URL: ${htmlUrl}` : 'URL: (unavailable)',
        ].join('\n'),
      );
    }

    return true;
  }

  async function pullConfigFromGist() {
    await loadSyncSettingsFromStorage();

    if (!syncGistId) {
      window.alert(
        'No gist ID configured. Run "Video Controls: Sync Setup (GitHub Gist)" first.',
      );
      return;
    }

    const gistResponse = await githubApiRequest(`/gists/${syncGistId}`, {
      method: 'GET',
      allowAnonymous: true,
    });

    const gistFiles = gistResponse.files || Object.create(null);
    const preferredFileName = String(syncSettings.fileName || '').trim();
    const preferredFile = preferredFileName
      ? gistFiles[preferredFileName]
      : null;

    const fallbackFile = Object.values(gistFiles).find(file => {
      const candidateName = String(file?.filename || '').toLowerCase();
      return candidateName.endsWith('.json');
    });

    const selectedFile =
      preferredFile || fallbackFile || Object.values(gistFiles)[0];
    if (!selectedFile) {
      throw new Error('Configured gist has no files to import.');
    }

    const rawContent = await fetchGistFileContent(selectedFile);
    const parsedPayload = parseConfigPayload(rawContent);
    if (!parsedPayload || typeof parsedPayload !== 'object') {
      throw new Error('Gist file content is not valid JSON config.');
    }

    autoSyncPushSuppressed = true;
    try {
      settingsConfig = normalizeSettingsConfig(parsedPayload);
      writeConfigToStorage(settingsConfig, { skipAutoSync: true });
      resolveActiveProfileForHostname(location.hostname);
      await reloadRuntimeSettingsFromProfile();
    } finally {
      autoSyncPushSuppressed = false;
      autoSyncPushQueued = false;
    }

    syncSettings.fileName = hardcodedSyncFileName;
    syncSettings.lastSyncAt = new Date().toISOString();
    await saveSyncSettingsToStorage();

    window.alert(
      [
        'Config pulled from GitHub Gist and applied.',
        `Source file: ${syncSettings.fileName || '(unknown)'}`,
      ].join('\n'),
    );
  }

  async function runSyncAction(action) {
    try {
      await action();
    } catch (error) {
      const message = error?.message || String(error || 'Unknown sync error');
      console.error('Global Video Controls sync error:', error);
      window.alert(`Sync failed: ${message}`);
    }
  }

  function registerSyncMenuCommands() {
    const registerMenuCommand = getMenuCommandRegisterFunction();
    if (!registerMenuCommand) return;

    registerMenuCommand('Video Controls: Sync Setup (GitHub Gist)', () => {
      runSyncAction(configureGistSync);
    });
    registerMenuCommand('Video Controls: Sync Push -> Gist', () => {
      runSyncAction(pushConfigToGist);
    });
    registerMenuCommand('Video Controls: Sync Pull <- Gist', () => {
      runSyncAction(pullConfigFromGist);
    });
    registerMenuCommand('Video Controls: Sync Status', () => {
      alertSyncStatus();
    });
  }

  async function initConfigSync() {
    await loadSyncSettingsFromStorage();
    registerSyncMenuCommands();
    await registerConfigStorageSyncListener();

    window.globalVideoControlsSync = {
      setup: () => runSyncAction(configureGistSync),
      push: () => runSyncAction(pushConfigToGist),
      pull: () => runSyncAction(pullConfigFromGist),
      status: () => alertSyncStatus(),
    };
  }

  async function readConfigFromStorage() {
    if (!hasModernGMStorage) return undefined;

    try {
      const storedValue = await GM.getValue(settingsConfigStorageKey);
      const parsed = parseConfigPayload(storedValue);
      if (!parsed || typeof parsed !== 'object') return undefined;
      if (!parsed.profiles || typeof parsed.profiles !== 'object') {
        return undefined;
      }
      if (!parsed.rules || typeof parsed.rules !== 'object') return undefined;

      return parsed;
    } catch (error) {
      return undefined;
    }
  }

  function writeConfigToStorage(config, options = {}) {
    if (!hasModernGMStorage) return;

    const { skipAutoSync = false } = options;

    Promise.resolve(GM.setValue(settingsConfigStorageKey, config)).catch(
      () => {},
    );

    if (!skipAutoSync) {
      triggerAutoSyncPush();
    }
  }

  async function ensureSettingsConfigLoaded() {
    if (settingsConfig) {
      resolveActiveProfileForHostname(location.hostname);
      if (!duplicateSelectorScanCompleted) {
        await scanAndPromptDuplicateSelectorProfiles();
      }
      return;
    }

    const storedConfig = await readConfigFromStorage();
    settingsConfig = normalizeSettingsConfig(storedConfig);
    writeConfigToStorage(settingsConfig, { skipAutoSync: true });
    resolveActiveProfileForHostname(location.hostname);
    await scanAndPromptDuplicateSelectorProfiles();
  }

  function findDuplicateSelectorGroups(root = getSettingsRoot()) {
    if (!root) return [];

    const bySelector = new Map();
    for (const [profileId, profile] of Object.entries(root.profiles || {})) {
      const selectorKey = normalizeSelectorForComparison(
        profile?.autoSpeedSelector,
      );
      if (!selectorKey) continue;

      const group = bySelector.get(selectorKey) || [];
      group.push({
        profileId,
        rawSelector: sanitizeSelectorValue(profile?.autoSpeedSelector),
      });
      bySelector.set(selectorKey, group);
    }

    return Array.from(bySelector.entries())
      .filter(([, profiles]) => profiles.length > 1)
      .map(([selectorKey, profiles]) => ({ selectorKey, profiles }))
      .sort((a, b) => a.selectorKey.localeCompare(b.selectorKey));
  }

  function mergeProfileIntoTarget(targetProfile, sourceProfile) {
    if (!targetProfile || !sourceProfile) return;

    if (
      targetProfile.autoHide === undefined &&
      sourceProfile.autoHide !== undefined
    ) {
      targetProfile.autoHide = !!sourceProfile.autoHide;
    }
    if (
      targetProfile.autoPauseOnBlur === undefined &&
      sourceProfile.autoPauseOnBlur !== undefined
    ) {
      targetProfile.autoPauseOnBlur = !!sourceProfile.autoPauseOnBlur;
    }
    if (
      targetProfile.autoSpeedFast === undefined &&
      sourceProfile.autoSpeedFast !== undefined
    ) {
      targetProfile.autoSpeedFast = normalizeFastSpeedValue(
        sourceProfile.autoSpeedFast,
        defaultFastSpeed,
      );
    }
    if (
      targetProfile.panelPosition === undefined &&
      normalizePanelPositionValue(sourceProfile.panelPosition)
    ) {
      targetProfile.panelPosition = normalizePanelPositionValue(
        sourceProfile.panelPosition,
      );
    }
    if (
      targetProfile.panelPositionIframe === undefined &&
      normalizePanelPositionValue(sourceProfile.panelPositionIframe)
    ) {
      targetProfile.panelPositionIframe = normalizePanelPositionValue(
        sourceProfile.panelPositionIframe,
      );
    }
  }

  function mergeDuplicateSelectorGroup(group, root = getSettingsRoot()) {
    if (!root || !group || !group.profiles?.length) return false;

    const orderedProfileIds = group.profiles
      .map(entry => entry.profileId)
      .filter(Boolean);
    if (orderedProfileIds.length < 2) return false;

    const targetProfileId =
      activeProfileId && orderedProfileIds.includes(activeProfileId)
        ? activeProfileId
        : orderedProfileIds[0];
    const targetProfile = root.profiles[targetProfileId];
    if (!targetProfile || typeof targetProfile !== 'object') return false;

    const canonicalSelector = group.selectorKey;
    targetProfile.autoSpeedSelector = sanitizeSelectorValue(
      targetProfile.autoSpeedSelector || canonicalSelector,
    );

    let changed = false;
    for (const sourceProfileId of orderedProfileIds) {
      if (sourceProfileId === targetProfileId) continue;
      const sourceProfile = root.profiles[sourceProfileId];
      if (!sourceProfile || typeof sourceProfile !== 'object') continue;

      mergeProfileIntoTarget(targetProfile, sourceProfile);

      for (const [pattern, mappedProfileId] of Object.entries(
        root.rules || {},
      )) {
        if (mappedProfileId === sourceProfileId) {
          root.rules[pattern] = targetProfileId;
          changed = true;
        }
      }

      if (sourceProfileId === defaultProfileId) {
        sourceProfile.autoSpeedSelector = '';
      } else {
        delete root.profiles[sourceProfileId];
      }
      changed = true;
    }

    return changed;
  }

  async function scanAndPromptDuplicateSelectorProfiles() {
    if (duplicateSelectorScanCompleted) return;

    const root = getSettingsRoot();
    if (!root) {
      duplicateSelectorScanCompleted = true;
      return;
    }

    const duplicateGroups = findDuplicateSelectorGroups(root);
    duplicateSelectorScanCompleted = true;
    if (!duplicateGroups.length) return;

    let hasAnyChange = false;
    for (const group of duplicateGroups) {
      const profileIds = group.profiles
        .map(entry => entry.profileId)
        .join(', ');
      const selectorPreview =
        group.profiles.find(entry => entry.rawSelector)?.rawSelector ||
        group.selectorKey;
      const targetProfile =
        activeProfileId &&
        group.profiles.some(entry => entry.profileId === activeProfileId)
          ? activeProfileId
          : group.profiles[0].profileId;

      const shouldMerge = window.confirm(
        [
          `Duplicate subtitle selector found: ${selectorPreview}`,
          `Profiles: ${profileIds}`,
          `Merge these profiles into "${targetProfile}"?`,
          'The active profile values are preserved on conflicts.',
        ].join('\n'),
      );

      if (!shouldMerge) continue;
      if (mergeDuplicateSelectorGroup(group, root)) {
        hasAnyChange = true;
      }
    }

    if (hasAnyChange) {
      writeConfigToStorage(settingsConfig);
      resolveActiveProfileForHostname(location.hostname);
    }
  }

  function getRuleMatchSpecificityScore(pattern) {
    if (!pattern.includes('*')) {
      return 1000000 + pattern.length;
    }

    const wildcardCount = (pattern.match(/\*/g) || []).length;
    const literalChars = pattern.replace(/\*/g, '').length;
    return literalChars * 100 - wildcardCount * 10;
  }

  function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function buildHostnamePatternRegex(pattern) {
    if (!pattern) return null;
    if (/[^a-z0-9*.-]/.test(pattern)) return null;

    const escapedPattern = escapeRegex(pattern).replace(/\\\*/g, '.*');
    return new RegExp(`^${escapedPattern}$`);
  }

  function findMatchingRule(hostname) {
    const root = getSettingsRoot();
    if (!root) return null;

    const normalizedHost = normalizeHostname(hostname);
    const rules = Object.entries(root.rules || {});

    let bestMatch = null;
    for (const [pattern, profileId] of rules) {
      const regex = buildHostnamePatternRegex(pattern);
      if (!regex) continue;
      if (!regex.test(normalizedHost)) continue;

      const score = getRuleMatchSpecificityScore(pattern);
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { pattern, profileId, score };
      }
    }

    return bestMatch;
  }

  function resolveActiveProfileForHostname(hostname) {
    activeHostname = normalizeHostname(hostname);
    activeRulePattern = null;
    activeProfileId = null;

    const bestMatch = findMatchingRule(activeHostname);
    if (!bestMatch) {
      return;
    }

    activeRulePattern = bestMatch.pattern;
    activeProfileId = bestMatch.profileId;
  }

  function getActiveProfileForRead() {
    if (!activeProfileId) return null;

    const root = getSettingsRoot();
    if (!root) return null;

    const profile = root.profiles[activeProfileId];
    if (!profile || typeof profile !== 'object') return null;

    return profile;
  }

  function createAutoProfileId(hostname) {
    const root = getSettingsRoot();
    const profiles = root?.profiles || {};

    const normalizedHost = normalizeHostname(hostname) || 'unknown-host';
    const sanitizedHost = normalizedHost.replace(/[^a-z0-9.-]/g, '_');
    const baseId = `auto:${sanitizedHost}`;
    let candidateId = baseId;
    let suffix = 2;

    while (Object.prototype.hasOwnProperty.call(profiles, candidateId)) {
      candidateId = `${baseId}-${suffix}`;
      suffix += 1;
    }

    return candidateId;
  }

  function ensureWritableProfile() {
    const root = getSettingsRoot();
    if (!root) return null;

    if (activeProfileId) {
      if (!root.profiles[activeProfileId]) {
        root.profiles[activeProfileId] = {};
        writeConfigToStorage(settingsConfig);
      }
      return root.profiles[activeProfileId];
    }

    const newProfileId = createAutoProfileId(
      activeHostname || location.hostname,
    );
    root.profiles[newProfileId] = {};
    root.rules[activeHostname] = newProfileId;

    activeRulePattern = activeHostname;
    activeProfileId = newProfileId;

    writeConfigToStorage(settingsConfig);
    return root.profiles[newProfileId];
  }

  function loadBooleanSettingFromProfile(profileKey, defaultValue = false) {
    const activeProfile = getActiveProfileForRead();
    if (!activeProfile) return defaultValue;

    const rawValue = activeProfile[profileKey];
    return typeof rawValue === 'boolean' ? rawValue : defaultValue;
  }

  function saveBooleanSettingToProfile(profileKey, value) {
    const writableProfile = ensureWritableProfile();
    if (!writableProfile) return;

    writableProfile[profileKey] = !!value;
    writeConfigToStorage(settingsConfig);
  }

  function loadTextSettingFromProfile(profileKey, defaultValue = '') {
    const activeProfile = getActiveProfileForRead();
    if (!activeProfile) return defaultValue;

    if (activeProfile[profileKey] === undefined) {
      return defaultValue;
    }

    return String(activeProfile[profileKey] || '').trim();
  }

  function saveTextSettingToProfile(profileKey, value) {
    const writableProfile = ensureWritableProfile();
    if (!writableProfile) return;

    writableProfile[profileKey] = String(value || '').trim();
    writeConfigToStorage(settingsConfig);
  }

  function loadPanelPositionFromProfile() {
    const activeProfile = getActiveProfileForRead();
    if (!activeProfile) return null;

    if (isRunningInsideIframe()) {
      return (
        normalizePanelPositionValue(activeProfile.panelPositionIframe) ||
        normalizePanelPositionValue(activeProfile.panelPosition)
      );
    }

    return normalizePanelPositionValue(activeProfile.panelPosition);
  }

  function savePanelPositionToProfile(position) {
    if (!position) return;

    const normalizedPosition = normalizePanelPositionValue(position);
    if (!normalizedPosition) return;

    const writableProfile = ensureWritableProfile();
    if (!writableProfile) return;

    if (isRunningInsideIframe()) {
      writableProfile.panelPositionIframe = normalizedPosition;
    } else {
      writableProfile.panelPosition = normalizedPosition;
    }
    writeConfigToStorage(settingsConfig);
  }

  function loadFastSpeedFromProfile(defaultValue) {
    const activeProfile = getActiveProfileForRead();
    if (!activeProfile) return defaultValue;

    return normalizeFastSpeedValue(activeProfile.autoSpeedFast, defaultValue);
  }

  function saveFastSpeedToProfile(value) {
    const parsed = normalizeFastSpeedValue(value, defaultFastSpeed);
    const writableProfile = ensureWritableProfile();
    if (!writableProfile) return;

    writableProfile.autoSpeedFast = parsed;
    writeConfigToStorage(settingsConfig);
  }

  async function loadPanelPositionSetting() {
    return loadPanelPositionFromProfile();
  }

  function savePanelPositionSetting(position) {
    savePanelPositionToProfile(position);
  }

  function clampPanelPosition(controlPanelEl, position) {
    if (!controlPanelEl || !position) return null;

    const panelWidth = controlPanelEl.offsetWidth || 0;
    const panelHeight = controlPanelEl.offsetHeight || 0;
    const maxLeft = Math.max(0, window.innerWidth - panelWidth);
    const maxTop = Math.max(0, window.innerHeight - panelHeight);

    const clampedLeft = Math.min(Math.max(position.left, 0), maxLeft);
    const clampedTop = Math.min(Math.max(position.top, 0), maxTop);

    return {
      left: clampedLeft,
      top: clampedTop,
    };
  }

  function persistControlPanelPosition(controlPanelEl) {
    if (!controlPanelEl) return;

    const rect = controlPanelEl.getBoundingClientRect();
    const clamped = clampPanelPosition(controlPanelEl, {
      top: rect.top,
      left: rect.left,
    });

    if (!clamped) return;

    controlPanelEl.style.top = `${clamped.top}px`;
    controlPanelEl.style.left = `${clamped.left}px`;
    panelPosition = clamped;
    savePanelPositionSetting(clamped);
  }

  function applyStoredPanelPosition(controlPanelEl) {
    if (!controlPanelEl) return;

    const hasStoredPanelPosition = !!panelPosition;
    const basePosition = panelPosition || panelDefaultPosition;
    const clamped = clampPanelPosition(controlPanelEl, basePosition);
    if (!clamped) return;

    controlPanelEl.style.top = `${clamped.top}px`;
    controlPanelEl.style.left = `${clamped.left}px`;

    if (!hasStoredPanelPosition) {
      return;
    }

    const changedFromSaved =
      Math.abs(panelPosition.top - clamped.top) > 0.01 ||
      Math.abs(panelPosition.left - clamped.left) > 0.01;

    panelPosition = clamped;
    if (changedFromSaved) {
      savePanelPositionSetting(clamped);
    }
  }

  async function loadSubtitleSelectorSetting() {
    return loadTextSettingFromProfile('autoSpeedSelector', '');
  }

  function saveSubtitleSelectorSetting(selector) {
    saveTextSettingToProfile('autoSpeedSelector', selector);
  }

  function clearSubtitleSelectorTextSelectableStyle() {
    if (!subtitleSelectorUserSelectStyleEl) return;

    subtitleSelectorUserSelectStyleEl.remove();
    subtitleSelectorUserSelectStyleEl = null;
  }

  function clearSubtitleSelectorIframeCenterStyle() {
    if (!subtitleSelectorIframeCenterStyleEl) return;

    subtitleSelectorIframeCenterStyleEl.remove();
    subtitleSelectorIframeCenterStyleEl = null;
  }

  function isRunningInsideIframe() {
    try {
      return window.self !== window.top;
    } catch (error) {
      // Cross-origin access to top can throw; if so, treat as iframe context.
      return true;
    }
  }

  function applySubtitleSelectorTextSelectableStyle() {
    clearSubtitleSelectorTextSelectableStyle();
    clearSubtitleSelectorIframeCenterStyle();

    const selector = (subtitleSelector || '').trim();
    if (!selector) return;

    try {
      document.querySelector(selector);
    } catch (error) {
      return;
    }

    subtitleSelectorUserSelectStyleEl = GM_addStyle(
      SUBTITLE_STYLES.selectable(selector),
    );

    if (!isRunningInsideIframe()) return;

    subtitleSelectorIframeCenterStyleEl = GM_addStyle(
      SUBTITLE_STYLES.centered(selector),
    );
  }

  async function loadFastSpeedSetting(defaultValue) {
    return loadFastSpeedFromProfile(defaultValue);
  }

  function handleAutoPauseTrigger() {
    if (!autoPauseOnBlurEnabled) return;
    if (!activeVideo || activeVideo.paused) return;

    if (document.visibilityState === 'visible' && document.hasFocus()) {
      return;
    }

    autoPausedByFocusLoss = true;
    activeVideo.pause();
  }

  function handleAutoResumeTrigger() {
    if (!autoPauseOnBlurEnabled) return;
    if (!autoPausedByFocusLoss) return;
    if (!activeVideo || !activeVideo.paused) return;

    if (document.visibilityState !== 'visible' || !document.hasFocus()) {
      return;
    }

    autoPausedByFocusLoss = false;
    activeVideo.play().catch(() => {
      autoPausedByFocusLoss = true;
    });
  }
  function saveFastSpeedSetting(value) {
    saveFastSpeedToProfile(value);
  }

  function stopSubtitlePresenceMonitoring() {
    if (subtitleObserverUnsubscribe) {
      subtitleObserverUnsubscribe();
      subtitleObserverUnsubscribe = null;
    }

    if (subtitleObserver) {
      subtitleObserver.disconnect();
      subtitleObserver = null;
    }
  }

  function startSubtitlePresenceMonitoring() {
    stopSubtitlePresenceMonitoring();

    if (!subtitleAutoSpeedEnabled) return;

    const hasSelector = !!(subtitleSelector && subtitleSelector.trim());
    if (!hasSelector) return;

    if (canUseSharedSubtitleObserver) {
      const observerControl = waitForEach(
        subtitleSelector,
        () => {
          syncSubtitleAutoSpeedSoon();
        },
        { once: false },
      );

      subtitleObserverUnsubscribe = observerControl?.unobserve || null;

      // Ensure selector-level dedupe is reset when monitoring restarts.
      if (observerControl?.reload) {
        observerControl.reload();
      }

      syncSubtitleAutoSpeedSoon();
      return;
    }

    subtitleObserver = new MutationObserver(() => {
      syncSubtitleAutoSpeedSoon();
    });
    subtitleObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
      attributeFilter: ['class', 'style', 'hidden'],
    });

    syncSubtitleAutoSpeedSoon();
  }

  function isVisibleSubtitleCandidate(element) {
    if (!(element instanceof Element) || !element.isConnected) {
      return false;
    }

    const computedStyle = window.getComputedStyle(element);
    if (!computedStyle) return false;

    if (
      computedStyle.display === 'none' ||
      computedStyle.visibility === 'hidden' ||
      computedStyle.visibility === 'collapse'
    ) {
      return false;
    }

    if (Number(computedStyle.opacity) === 0) {
      return false;
    }

    if (element.closest('[hidden], [aria-hidden="true"]')) {
      return false;
    }

    return element.getClientRects().length > 0;
  }

  function getSubtitleStateBySelector() {
    if (!subtitleSelector || !subtitleSelector.trim()) {
      subtitleSelectorInvalid = false;
      return {
        present: false,
        hasMusicalSymbols: false,
        selectorAvailable: false,
      };
    }

    try {
      subtitleSelectorInvalid = false;
      const matchedSubtitles = querySelectorAllDeep(subtitleSelector);
      if (!matchedSubtitles.length) {
        return {
          present: false,
          hasMusicalSymbols: false,
          selectorAvailable: false,
        };
      }

      let foundVisibleSubtitleText = false;
      for (const matchedSubtitle of matchedSubtitles) {
        const subtitleText = (
          matchedSubtitle?.innerText ??
          matchedSubtitle?.textContent ??
          ''
        ).trim();
        if (!subtitleText) continue;
        if (!isVisibleSubtitleCandidate(matchedSubtitle)) continue;

        foundVisibleSubtitleText = true;
        if (musicalSubtitlePattern.test(subtitleText)) {
          return {
            present: true,
            hasMusicalSymbols: true,
            selectorAvailable: true,
          };
        }
      }

      return {
        present: foundVisibleSubtitleText,
        hasMusicalSymbols: false,
        selectorAvailable: true,
      };
    } catch (error) {
      subtitleSelectorInvalid = true;
      return {
        present: false,
        hasMusicalSymbols: false,
        selectorAvailable: false,
      };
    }
  }

  function setPlaybackRateIfNeeded(video, rate) {
    if (!video || !Number.isFinite(rate) || rate <= 0) return;
    if (Math.abs(video.playbackRate - rate) < 0.001) return;
    video.playbackRate = rate;
  }

  function renderSubtitleTransitionToggle() {
    if (!subtitleSpeedTransitionToggleEl) return;

    const enabledSvg =
      typeof speedTransitionEnabled === 'string'
        ? speedTransitionEnabled
        : subtitleTransitionEnabledSvgFallback;
    const disabledSvg =
      typeof speedTransitionDisabled === 'string'
        ? speedTransitionDisabled
        : subtitleTransitionDisabledSvgFallback;

    subtitleSpeedTransitionToggleEl.innerHTML = subtitleAutoSpeedEnabled
      ? enabledSvg
      : disabledSvg;
    subtitleSpeedTransitionToggleEl.setAttribute(
      'aria-pressed',
      subtitleAutoSpeedEnabled ? 'true' : 'false',
    );
    subtitleSpeedTransitionToggleEl.title = subtitleAutoSpeedEnabled
      ? 'Subtitle speed transition is ON (selector present = 1x, selector absent = fast). Click to disable.'
      : 'Subtitle speed transition is OFF. Click to enable selector-driven speed transition.';
  }

  function updateSubtitleSelectorAvailabilityIndicator(isAvailable) {
    if (!subtitleSpeedTransitionToggleEl) return;
    subtitleSpeedTransitionToggleEl.classList.toggle(
      'subtitle-selector-available',
      !!isAvailable,
    );
  }

  function refreshSubtitleSelectorAvailabilityIndicator() {
    updateSubtitleSelectorAvailabilityIndicator(
      !!(subtitleSelector || '').trim(),
    );
  }

  function promptForSubtitleSelector() {
    const seedValue = (subtitleSelector || '').trim();
    const enteredValue = window.prompt(
      'Enter a CSS selector for subtitle text (example: .ytp-caption-segment). Duplicate selectors across profiles are checked on startup and can be merged. In iframe context, matched subtitle roots will also be centered in-frame:',
      seedValue,
    );

    if (enteredValue === null) return null;

    const normalizedValue = enteredValue.trim();
    if (!normalizedValue) return '';

    subtitleSelector = normalizedValue;
    saveSubtitleSelectorSetting(subtitleSelector);
    applySubtitleSelectorTextSelectableStyle();
    if (inputSubtitleSelectorEl) {
      inputSubtitleSelectorEl.value = subtitleSelector;
    }

    refreshSubtitleSelectorAvailabilityIndicator();

    return subtitleSelector;
  }

  function setSubtitleAutoSpeedEnabled(enabled) {
    const requestedEnabled = !!enabled;

    if (requestedEnabled && !(subtitleSelector || '').trim()) {
      const selectorFromPrompt = promptForSubtitleSelector();
      if (!selectorFromPrompt) {
        subtitleAutoSpeedEnabled = false;

        if (cbSubtitleAutoSpeedEl) {
          cbSubtitleAutoSpeedEl.checked = false;
        }

        renderSubtitleTransitionToggle();
        setPlaybackRateIfNeeded(activeVideo, 1);
        return;
      }
    }

    subtitleAutoSpeedEnabled = requestedEnabled;

    if (cbSubtitleAutoSpeedEl) {
      cbSubtitleAutoSpeedEl.checked = subtitleAutoSpeedEnabled;
    }

    renderSubtitleTransitionToggle();

    if (subtitleAutoSpeedEnabled) {
      startSubtitlePresenceMonitoring();
      syncSubtitleAutoSpeed(activeVideo);
      return;
    }

    stopSubtitlePresenceMonitoring();
    setPlaybackRateIfNeeded(activeVideo, 1);
  }

  function syncSubtitleAutoSpeed(video = activeVideo) {
    if (!video || video !== activeVideo) return;

    if (!subtitleAutoSpeedEnabled) {
      subtitleSelectorInvalid = false;
      lastSubtitlePresentState = null;
      refreshSubtitleSelectorAvailabilityIndicator();
      return;
    }

    if (!subtitleSelector || !subtitleSelector.trim()) {
      setPlaybackRateIfNeeded(video, 1);
      return;
    }

    const subtitleState = getSubtitleStateBySelector();
    refreshSubtitleSelectorAvailabilityIndicator();

    if (subtitleSelectorInvalid) {
      setPlaybackRateIfNeeded(video, 1);
      return;
    }

    if (subtitleState.present && subtitleState.hasMusicalSymbols) {
      setPlaybackRateIfNeeded(video, fastSpeed);
      return;
    }

    const subtitlePresent = subtitleState.present;
    lastSubtitlePresentState = subtitlePresent;
    if (subtitlePresent) {
      setPlaybackRateIfNeeded(video, 1);
      return;
    }

    setPlaybackRateIfNeeded(video, fastSpeed);
  }

  async function addToolbar() {
    // HTML Structure
    controlPanel = generateElements(htmlStructure);
    // CSS Styles
    GM_addStyle(styles);

    document.body.append(controlPanel);

    const contPanelHeader = controlPanel.querySelector('#contPanelHeader');
    const cbAutoHideEl = controlPanel.querySelector('#cbAutoHide');
    const cbAutoPauseOnBlurEl =
      controlPanel.querySelector('#cbAutoPauseOnBlur');
    cbSubtitleAutoSpeedEl = controlPanel.querySelector('#cbSubtitleAutoSpeed');
    subtitleSpeedTransitionToggleEl = controlPanel.querySelector(
      '#subtitleSpeedTransitionToggle',
    );
    trackIndicatorTextEl = controlPanel.querySelector('#track-indicator-text');
    trackIndicatorAudioEl = controlPanel.querySelector(
      '#track-indicator-audio',
    );
    trackIndicatorVideoEl = controlPanel.querySelector(
      '#track-indicator-video',
    );
    inputSubtitleSelectorEl = controlPanel.querySelector(
      '#inputSubtitleSelector',
    );
    numAutoFastSpeedEl = controlPanel.querySelector('#numAutoFastSpeed');
    panelAutoHideEnabled = await loadPanelAutoHideSetting();
    cbAutoHideEl.checked = panelAutoHideEnabled;
    if (cbAutoPauseOnBlurEl) {
      cbAutoPauseOnBlurEl.checked = autoPauseOnBlurEnabled;
    }
    if (cbSubtitleAutoSpeedEl) {
      cbSubtitleAutoSpeedEl.checked = subtitleAutoSpeedEnabled;
    }
    if (inputSubtitleSelectorEl) {
      inputSubtitleSelectorEl.value = subtitleSelector;
    }
    refreshSubtitleSelectorAvailabilityIndicator();
    if (numAutoFastSpeedEl) {
      numAutoFastSpeedEl.value = String(fastSpeed);
    }
    applyStoredPanelPosition(controlPanel);
    applyEffectivePanelUiState(controlPanel);
    vidProgressEl = controlPanel.querySelector(`#progress`);
    speedDispEl = controlPanel.querySelector('#speedDisp');
    volDispEl = controlPanel.querySelector('#volDisp');
    slidVolFinEl = controlPanel.querySelector(`.slidVolFin`);
    slidVolExtEl = controlPanel.querySelector(`.slidVolExt`);
    divHeightEl = controlPanel.querySelector('.divHeight');
    dimensionsAsPercentageEl = controlPanel.querySelector(
      '#dimensions-as-a-percentage',
    );
    videoPlayerStateEl = controlPanel.querySelector('#video-player-state');
    videoReadyStateEl = controlPanel.querySelector('#video-ready-state');
    videoNetworkStateEl = controlPanel.querySelector('#video-network-state');
    videoErrorStateEl = controlPanel.querySelector('#video-error-state');
    timeTrackingHeaderRowEl = controlPanel.querySelector('#time-related');
    timeTrackingPopupEl = controlPanel.querySelector('#time-related-popup');
    timeTrackingPlayingEl = controlPanel.querySelector('#time-spent-playing');
    timeTrackingWaitingEl = controlPanel.querySelector('#time-spent-waiting');
    timeTrackingTotalEl = controlPanel.querySelector('#time-spent-total');
    timeTrackingDurationEl = controlPanel.querySelector('#time-spent-duration');
    timeTrackingComparisonEl = controlPanel.querySelector(
      '#time-spent-comparison',
    );
    timeTrackingCurrentPositionEl = controlPanel.querySelector(
      '#time-spent-current-position',
    );
    spanTimeSavedSoFarEl = controlPanel.querySelector('#spanTimeSavedSoFar');

    // dragElement( controlPanel, controlPanel );
    makeDraggable(controlPanel);
    let panelDragStarted = false;
    contPanelHeader.addEventListener('mousedown', () => {
      panelDragStarted = true;
      controlPanel.style.transition = 'unset';
    });
    contPanelHeader.addEventListener('mouseup', () => {
      controlPanel.style.transition = 'left 0.5s, top 0.5s, opacity 0.2s';
    });
    window.addEventListener('mouseup', () => {
      if (!panelDragStarted) return;
      panelDragStarted = false;
      persistControlPanelPosition(controlPanel);
    });
    controlPanel.addEventListener('mouseenter', () => {
      panelMouseInside = true;
      applyEffectivePanelUiState(controlPanel);
    });
    controlPanel.addEventListener('mouseleave', () => {
      panelMouseInside = false;
      applyEffectivePanelUiState(controlPanel);
    });
    if (timeTrackingHeaderRowEl) {
      timeTrackingHeaderRowEl.addEventListener('click', () => {
        toggleTimeTrackingPopup();
      });
    }
    controlPanel.querySelector('.head').addEventListener('click', () => {
      panelUiState = (panelUiState + 1) % 3;
      if (panelUiState !== 2) panelUiLastNonHeadState = panelUiState;
      applyEffectivePanelUiState(controlPanel);
    });
    cbAutoHideEl.addEventListener('change', event => {
      panelAutoHideEnabled = event.target.checked;
      savePanelAutoHideSetting(panelAutoHideEnabled);
      applyEffectivePanelUiState(controlPanel);
    });
    if (cbAutoPauseOnBlurEl) {
      cbAutoPauseOnBlurEl.addEventListener('change', event => {
        autoPauseOnBlurEnabled = event.target.checked;
        saveAutoPauseOnBlurSetting(autoPauseOnBlurEnabled);
        if (autoPauseOnBlurEnabled) {
          handleAutoPauseTrigger();
        }
      });
    }
    if (cbSubtitleAutoSpeedEl) {
      cbSubtitleAutoSpeedEl.addEventListener('change', event => {
        setSubtitleAutoSpeedEnabled(event.target.checked);
      });
    }
    if (subtitleSpeedTransitionToggleEl) {
      subtitleSpeedTransitionToggleEl.addEventListener('click', () => {
        setSubtitleAutoSpeedEnabled(!subtitleAutoSpeedEnabled);
      });
    }

    if (inputSubtitleSelectorEl) {
      const applySelector = value => {
        subtitleSelector = (value || '').trim();
        saveSubtitleSelectorSetting(subtitleSelector);
        applySubtitleSelectorTextSelectableStyle();
        refreshSubtitleSelectorAvailabilityIndicator();
        if (subtitleAutoSpeedEnabled) {
          startSubtitlePresenceMonitoring();
        }
        syncSubtitleAutoSpeed(activeVideo);
      };

      inputSubtitleSelectorEl.addEventListener('change', event => {
        applySelector(event.target.value);
      });
      inputSubtitleSelectorEl.addEventListener('keyup', event => {
        if (event.key === 'Enter') {
          applySelector(event.target.value);
        }
      });
    }

    if (numAutoFastSpeedEl) {
      numAutoFastSpeedEl.addEventListener('change', event => {
        const parsed = parseFloat(event.target.value);
        if (!Number.isFinite(parsed) || parsed <= 0) {
          event.target.value = String(fastSpeed);
          return;
        }

        fastSpeed = parsed;
        saveFastSpeedSetting(fastSpeed);
        syncSubtitleAutoSpeed(activeVideo);
      });
    }
    controlPanel.querySelector('#speedToggle').addEventListener('click', () => {
      speedToggle();
    });
    controlPanel.querySelector('#buttonPlay').addEventListener('click', () => {
      togglePlayPause();
    });

    vidProgressEl.addEventListener('input', e => {
      activeVideo.currentTime = (e.target.value / 100) * activeVideo.duration;
    });
    slidVolFinEl.addEventListener('input', e => {
      activeVideo.volume = parseFloat(
        parseFloat(e.target.value),
      ); /* ; volumeDisplay.value = this.value */
    });
    if (slidVolExtEl) {
      slidVolExtEl.addEventListener('input', e => {
        if (!activeVideo) return;
        activeVideo.volume = parseFloat(e.target.value);
      });
    }

    controlPanel.querySelector('#rewind-btn').addEventListener('click', () => {
      activeVideo.currentTime = 0;
    });
    controlPanel
      .querySelector('.timejumpLOne')
      .addEventListener('click', () => {
        activeVideo.currentTime -= timeIncrSmall;
      });
    controlPanel
      .querySelector('.timejumpROne')
      .addEventListener('click', () => {
        activeVideo.currentTime += timeIncrSmall;
      });
    controlPanel
      .querySelector('.timejumpLTwo')
      .addEventListener('click', () => {
        activeVideo.currentTime -= timeIncrLarge;
      });
    controlPanel
      .querySelector('.timejumpRTwo')
      .addEventListener('click', () => {
        activeVideo.currentTime += timeIncrLarge;
      });
    controlPanel
      .querySelector('#checkbox-loop-vid')
      .addEventListener('click', event => {
        activeVideo.loop = event.target.checked;
      });

    controlPanel
      .querySelector(`#muteButton`)
      .addEventListener('click', function () {
        activeVideo.muted = !activeVideo.muted;
      });
    controlPanel.querySelector(`#frameStepL`).addEventListener('click', () => {
      frameStep('left');
    });
    controlPanel.querySelector(`#frameStepR`).addEventListener('click', () => {
      frameStep('right');
    });
    controlPanel
      .querySelector('#buttonResize')
      .addEventListener('click', () => {
        if (activeVideo.videoHeight)
          activeVideo.style.height = `${activeVideo.videoHeight}px`;
      });
    controlPanel
      .querySelector('#buttonScroll')
      .addEventListener('click', () => {
        activeVideo.scrollIntoView();
      });
    controlPanel.querySelector('#buttonLog').addEventListener('click', () => {
      console.log(activeVideo);
    });
    controlPanel.querySelector('#copyPageUrl').addEventListener('click', e => {
      e.preventDefault();
      GM_setClipboard(location.href);
      return false;
    });
    controlPanel.querySelector('#copyVidSrc').addEventListener('click', e => {
      GM_setClipboard(activeVideo.currentSrc);
    });
    controlPanel.querySelector(`#buttonSnap`).addEventListener('click', () => {
      snap();
    });
    controlPanel
      .querySelector('#buttonSnapClipboard')
      .addEventListener('click', () => {
        copyFrameToClipboard();
      });

    controlPanel
      .querySelector(`#buttonRotateL`)
      .addEventListener('click', () => {
        rotate(-90);
      });
    controlPanel
      .querySelector(`#buttonRotateR`)
      .addEventListener('click', () => {
        rotate(90);
      });
    controlPanel.querySelector(`#buttonPiP`).addEventListener('click', () => {
      requestPictureInPicture();
    });
    controlPanel
      .querySelector(`#buttonFullScreen`)
      .addEventListener('click', () => {
        activeVideo.requestFullscreen();
      });

    speedDispEl.addEventListener('change', e => {
      if (subtitleAutoSpeedEnabled) {
        const parsed = parseFloat(e.target.value);
        if (Number.isFinite(parsed) && parsed > 0) {
          fastSpeed = parsed;
          saveFastSpeedSetting(fastSpeed);
          if (numAutoFastSpeedEl) {
            numAutoFastSpeedEl.value = String(fastSpeed);
          }
          syncSubtitleAutoSpeed(activeVideo);
        }
        return;
      }

      activeVideo.playbackRate = e.target.value;
    });
    volDispEl.addEventListener('change', e => {
      activeVideo.volume = e.target.value;
    });

    setSubtitleAutoSpeedEnabled(subtitleAutoSpeedEnabled);

    return controlPanel;

    $('span.text').css('color', 'unset !important');

    $(`#progress`).on('mousedown', function () {
      if (getActiveVideo().paused) return;
      togglePlayPause();
    });
    $(`#progress`).on('mouseup', togglePlayPause);

    //?pppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppp

    initializeToolbar();
  }

  function applyEffectivePanelUiState(controlPanelEl) {
    const effectiveState = getEffectivePanelUiState();
    applyPanelUiState(controlPanelEl, effectiveState);
  }

  function getEffectivePanelUiState() {
    if (!panelAutoHideEnabled) return panelUiState;
    return panelMouseInside ? panelUiLastNonHeadState : 2;
  }

  async function loadPanelAutoHideSetting() {
    return loadBooleanSettingFromProfile('autoHide', false);
  }

  function savePanelAutoHideSetting(enabled) {
    saveBooleanSettingToProfile('autoHide', enabled);
  }

  async function loadAutoPauseOnBlurSetting() {
    return loadBooleanSettingFromProfile('autoPauseOnBlur', false);
  }

  function saveAutoPauseOnBlurSetting(enabled) {
    saveBooleanSettingToProfile('autoPauseOnBlur', enabled);
  }

  function applyPanelUiState(controlPanelEl, state) {
    const descendants = controlPanelEl.querySelectorAll('*');
    descendants.forEach(item => {
      item.style.display = '';
    });

    if (state === 0) {
      controlPanelEl
        .querySelectorAll(
          ':not(.important):not(#contPanelHeader *):not(#contPanelHeader)',
        )
        .forEach(item => {
          item.style.display = 'none';
        });
      return;
    }

    if (state === 1) {
      return;
    }

    descendants.forEach(item => {
      item.style.display = 'none';
    });

    const header = controlPanelEl.querySelector('#contPanelHeader');
    if (!header) return;

    header.style.display = '';
    header.querySelectorAll('*').forEach(item => {
      item.style.display = '';
    });
  }

  function animateContentChange(element) {
    if (!element) return;
    if (!element.matches(animatedContentSelector)) return;

    element.classList.remove(contentChangePulseClass);
    void element.offsetWidth;
    element.classList.add(contentChangePulseClass);
  }

  function setAnimatedTextContent(element, value) {
    if (!element) return;

    const nextValue = String(value ?? '');
    if (element.textContent === nextValue) return;

    element.textContent = nextValue;
    animateContentChange(element);
  }

  function initializeToolbar() {
    if (!activeVideo) return;

    slidVolFinEl.value = activeVideo.volume;
    if (slidVolExtEl) {
      slidVolExtEl.value = activeVideo.volume;
    }
    volDispEl.value = activeVideo.volume;
    speedDispEl.value = activeVideo.playbackRate;
    setAnimatedTextContent(
      divHeightEl,
      `${activeVideo.videoWidth}×${activeVideo.videoHeight}`,
    );
    divHeightEl.title = activeVideo.videoWidth * activeVideo.videoHeight;
    updatePlaybackPercentage(activeVideo);
    updateDimensionsAsPercentage(activeVideo);
    updateMediaStateIndicators(activeVideo);
  }

  function setMediaStateBadge(element, text, title, tone) {
    if (!element) return;

    const nextText = String(text ?? '');
    if (element.textContent !== nextText) {
      element.textContent = nextText;
      animateContentChange(element);
    }

    element.title = title;
    element.classList.remove('state-good', 'state-neutral', 'state-bad');
    element.classList.add(tone);
  }

  function getPlayerStateInfo(video) {
    if (!video) {
      return {
        text: 'none',
        title: 'Player state: no active media element.',
        tone: 'state-neutral',
      };
    }

    if (video.seeking) {
      return {
        text: 'seeking',
        title:
          'Player state: seeking = the media element is moving to a new playback position.',
        tone: 'state-neutral',
      };
    }

    if (video.ended) {
      return {
        text: 'ended',
        title: 'Player state: ended = playback reached the end of the media.',
        tone: 'state-bad',
      };
    }

    if (video.paused) {
      return {
        text: 'paused',
        title: 'Player state: paused = playback is not running.',
        tone: 'state-neutral',
      };
    }

    return {
      text: 'play',
      title: 'Player state: play = playback is actively running.',
      tone: 'state-good',
    };
  }

  function getReadyStateInfo(video) {
    const readyState = Number(video?.readyState);
    switch (readyState) {
      case 0:
        return {
          text: 'R0',
          title:
            'Ready state: 0 / HAVE_NOTHING = no information about the media is available yet.',
          tone: 'state-bad',
        };
      case 1:
        return {
          text: 'R1',
          title:
            'Ready state: 1 / HAVE_METADATA = metadata is available, but not enough data to play safely.',
          tone: 'state-neutral',
        };
      case 2:
        return {
          text: 'R2',
          title:
            'Ready state: 2 / HAVE_CURRENT_DATA = the current frame is available.',
          tone: 'state-neutral',
        };
      case 3:
        return {
          text: 'R3',
          title:
            'Ready state: 3 / HAVE_FUTURE_DATA = current and future playback data are available.',
          tone: 'state-good',
        };
      case 4:
        return {
          text: 'R4',
          title:
            'Ready state: 4 / HAVE_ENOUGH_DATA = enough media data is available for uninterrupted playback.',
          tone: 'state-good',
        };
      default:
        return {
          text: 'R?',
          title: 'Ready state: unknown value.',
          tone: 'state-neutral',
        };
    }
  }

  function getNetworkStateInfo(video) {
    const networkState = Number(video?.networkState);
    switch (networkState) {
      case 0:
        return {
          text: 'N0',
          title: 'Network state: 0 / NETWORK_EMPTY = no media is selected yet.',
          tone: 'state-neutral',
        };
      case 1:
        return {
          text: 'N1',
          title:
            'Network state: 1 / NETWORK_IDLE = the media element is idle and has enough data buffered for now.',
          tone: 'state-good',
        };
      case 2:
        return {
          text: 'N2',
          title:
            'Network state: 2 / NETWORK_LOADING = the browser is fetching media data.',
          tone: 'state-neutral',
        };
      case 3:
        return {
          text: 'N3',
          title:
            'Network state: 3 / NETWORK_NO_SOURCE = the media element has no usable source.',
          tone: 'state-bad',
        };
      default:
        return {
          text: 'N?',
          title: 'Network state: unknown value.',
          tone: 'state-neutral',
        };
    }
  }

  function getErrorStateInfo(video) {
    const errorCode = Number(video?.error?.code || 0);
    switch (errorCode) {
      case 0:
        return {
          text: 'ok',
          title: 'Error state: no media error is currently reported.',
          tone: 'state-good',
        };
      case 1:
        return {
          text: 'E1',
          title:
            'Error state: 1 / MEDIA_ERR_ABORTED = media fetching was aborted by the user or browser.',
          tone: 'state-bad',
        };
      case 2:
        return {
          text: 'E2',
          title:
            'Error state: 2 / MEDIA_ERR_NETWORK = a network error prevented loading or playback.',
          tone: 'state-bad',
        };
      case 3:
        return {
          text: 'E3',
          title:
            'Error state: 3 / MEDIA_ERR_DECODE = the browser could not decode the media.',
          tone: 'state-bad',
        };
      case 4:
        return {
          text: 'E4',
          title:
            'Error state: 4 / MEDIA_ERR_SRC_NOT_SUPPORTED = the media source is not supported.',
          tone: 'state-bad',
        };
      default:
        return {
          text: 'E?',
          title: 'Error state: unknown media error value.',
          tone: 'state-bad',
        };
    }
  }

  function updateMediaStateIndicators(video = activeVideo) {
    const playerState = getPlayerStateInfo(video);
    setMediaStateBadge(
      videoPlayerStateEl,
      playerState.text,
      playerState.title,
      playerState.tone,
    );

    const readyState = getReadyStateInfo(video);
    setMediaStateBadge(
      videoReadyStateEl,
      readyState.text,
      readyState.title,
      readyState.tone,
    );

    const networkState = getNetworkStateInfo(video);
    setMediaStateBadge(
      videoNetworkStateEl,
      networkState.text,
      networkState.title,
      networkState.tone,
    );

    const errorState = getErrorStateInfo(video);
    setMediaStateBadge(
      videoErrorStateEl,
      errorState.text,
      errorState.title,
      errorState.tone,
    );
  }

  function updatePlaybackPercentage(videoEl) {
    const spanPlaybackPercentage = document.querySelector(
      '#spanPlaybackPercentage',
    );
    if (!spanPlaybackPercentage) return;

    const duration = Number(videoEl?.duration);
    const currentTime = Number(videoEl?.currentTime);
    if (
      !Number.isFinite(duration) ||
      duration <= 0 ||
      !Number.isFinite(currentTime)
    ) {
      setAnimatedTextContent(spanPlaybackPercentage, '0%');
      return;
    }

    const percentPlayed = (currentTime / duration) * 100;
    const clampedPercent = Math.min(Math.max(percentPlayed, 0), 100);
    setAnimatedTextContent(
      spanPlaybackPercentage,
      `${clampedPercent.toFixed(1)}%`,
    );
  }

  function updateDimensionsAsPercentage(videoEl) {
    if (!dimensionsAsPercentageEl) return;

    const actualWidth = Number(videoEl?.videoWidth);
    const actualHeight = Number(videoEl?.videoHeight);
    if (
      !Number.isFinite(actualWidth) ||
      !Number.isFinite(actualHeight) ||
      actualWidth <= 0 ||
      actualHeight <= 0
    ) {
      setAnimatedTextContent(dimensionsAsPercentageEl, '');
      return;
    }

    const displayedWidth = Number(videoEl?.clientWidth);
    const displayedHeight = Number(videoEl?.clientHeight);
    if (
      !Number.isFinite(displayedWidth) ||
      !Number.isFinite(displayedHeight) ||
      displayedWidth <= 0 ||
      displayedHeight <= 0
    ) {
      setAnimatedTextContent(dimensionsAsPercentageEl, '');
      return;
    }

    const actualArea = actualWidth * actualHeight;
    const displayedArea = displayedWidth * displayedHeight;
    const percentage = (displayedArea / actualArea) * 100;

    // Toggle a class when percentage is less than or equal to 100%
    if (percentage <= 100) {
      dimensionsAsPercentageEl.classList.add('within-100');
    } else {
      dimensionsAsPercentageEl.classList.remove('within-100');
    }

    setAnimatedTextContent(
      dimensionsAsPercentageEl,
      `${percentage.toFixed(1)}%`,
    );
  }

  function titler(text) {
    if (document.getElementById('cbAutoSwitch')?.checked) document.title = text;
  }

  function updateTrackIndicators(video) {
    // Update textTracks indicator - show badge if 1 or more
    if (trackIndicatorTextEl) {
      const textTrackCount = video.textTracks ? video.textTracks.length : 0;
      if (textTrackCount >= 1) {
        trackIndicatorTextEl.setAttribute('data-track-count', textTrackCount);
        trackIndicatorTextEl.classList.add('track-indicator-text-available');
      } else {
        trackIndicatorTextEl.removeAttribute('data-track-count');
        trackIndicatorTextEl.classList.remove('track-indicator-text-available');
      }
    }

    // Update audioTracks indicator - show badge if 2 or more
    if (trackIndicatorAudioEl) {
      const audioTrackCount = video.audioTracks ? video.audioTracks.length : 0;
      if (audioTrackCount >= 2) {
        trackIndicatorAudioEl.setAttribute('data-track-count', audioTrackCount);
        trackIndicatorAudioEl.classList.add('track-indicator-audio-available');
      } else {
        trackIndicatorAudioEl.removeAttribute('data-track-count');
        trackIndicatorAudioEl.classList.remove(
          'track-indicator-audio-available',
        );
      }
    }

    // Update videoTracks indicator - show badge if 2 or more
    if (trackIndicatorVideoEl) {
      const videoTrackCount = video.videoTracks ? video.videoTracks.length : 0;
      if (videoTrackCount >= 2) {
        trackIndicatorVideoEl.setAttribute('data-track-count', videoTrackCount);
        trackIndicatorVideoEl.classList.add('track-indicator-video-available');
      } else {
        trackIndicatorVideoEl.removeAttribute('data-track-count');
        trackIndicatorVideoEl.classList.remove(
          'track-indicator-video-available',
        );
      }
    }
  }

  function videoEventListeners(video) {
    if (video.classList.contains('video-processed')) return; // 🛑

    video.addEventListener('loadedmetadata', async () => {
      const bitrate = await getBitrate(video);
      displayBitrate(bitrate);
    });

    const refreshMediaStateIndicators = () => {
      if (activeVideo === video) {
        updateMediaStateIndicators(video);
      }
    };

    [
      'loadstart',
      'loadedmetadata',
      'loadeddata',
      'canplay',
      'canplaythrough',
      'progress',
      'suspend',
      'stalled',
      'abort',
      'emptied',
      'error',
      'play',
      'playing',
      'pause',
      'ended',
      'seeking',
      'seeked',
      'waiting',
      'durationchange',
      'ratechange',
    ].forEach(eventName => {
      video.addEventListener(eventName, refreshMediaStateIndicators);
    });

    if (video.readyState >= 1) {
      // HAVE_METADATA or higher
      getBitrate(video).then(bitrate => displayBitrate(bitrate));
    }

    video.addEventListener('playing', () => {
      titler('[media playing]');
    });
    video.addEventListener('pause', () => {
      titler('[media  paused]');
      if (document.visibilityState === 'visible' && document.hasFocus()) {
        autoPausedByFocusLoss = false;
      }
    });
    video.addEventListener('waiting', () => {
      titler('[media waiting]');
    });
    video.addEventListener('stalled', () => {
      titler('[media stalled]');
    });

    let lastUpdate = 0;
    video.addEventListener('timeupdate', event => {
      const now = Date.now();
      if (now - lastUpdate < 50) return; // Only update every 50ms
      lastUpdate = now;

      if (activeVideo != event.target) return; // 🛑

      if (subtitleAutoSpeedEnabled) {
        syncSubtitleAutoSpeed(video);
      }

      vidProgressEl.value = (video.currentTime / video.duration) * 100;

      const duration = video.duration;
      const currentTime = video.currentTime;
      updatePlaybackPercentage(video);
      updateDimensionsAsPercentage(video);

      const videoArea = video.videoWidth * video.videoHeight;
      divHeightEl.style.backgroundColor =
        videoArea >= 1920 * 1080 ? '#ff8080' : '#2ecc71';

      updateFrameRate(video);

      const spanRemainingTime = document.querySelector('#spanRemainingTime');
      const spanCurrentTime = document.querySelector('#spanCurrentTime');
      const spanActualRemTime = document.querySelector(
        `#spanActualRemainingTime`,
      );

      fadeIn(spanRemainingTime);
      fadeIn(spanCurrentTime);

      const remainingTime = Math.round(duration - currentTime);
      const readable = forHumans(remainingTime);
      setAnimatedTextContent(spanRemainingTime, readable);
      setAnimatedTextContent(
        spanCurrentTime,
        forHumans(Math.round(currentTime)),
      );

      if (video.playbackRate == 1) {
        fadeOut(spanActualRemTime);
        return;
      } // 🛑
      fadeIn(spanActualRemTime);
      const actualRemainingTime = Math.round(
        (duration - currentTime) / video.playbackRate,
      );
      const readableActual = forHumans(actualRemainingTime);
      setAnimatedTextContent(spanActualRemTime, readableActual);
    });

    video.addEventListener('ratechange', event => {
      speedDispEl.value = event.target.playbackRate;
    });
    video.addEventListener('volumechange', event => {
      volDispEl.value = event.target.volume;
      slidVolFinEl.value = event.target.volume;
      if (slidVolExtEl) slidVolExtEl.value = event.target.volume;
    });

    // Update dimensions percentage when video element size changes
    if (window.ResizeObserver) {
      const resizeObserver = new ResizeObserver(() => {
        if (activeVideo === video) {
          updateDimensionsAsPercentage(video);
        }
      });
      resizeObserver.observe(video);
    }

    // Track change listeners
    const handleTrackChange = () => {
      if (activeVideo === video) {
        updateTrackIndicators(video);
      }
    };

    if (video.textTracks) {
      video.textTracks.addEventListener('addtrack', handleTrackChange);
      video.textTracks.addEventListener('removetrack', handleTrackChange);
    }
    if (video.audioTracks) {
      video.audioTracks.addEventListener('addtrack', handleTrackChange);
      video.audioTracks.addEventListener('removetrack', handleTrackChange);
    }
    if (video.videoTracks) {
      video.videoTracks.addEventListener('addtrack', handleTrackChange);
      video.videoTracks.addEventListener('removetrack', handleTrackChange);
    }

    // Initial update of track indicators
    updateTrackIndicators(video);

    video.classList.add('video-processed');
  }

  function rotate(inputAngle) {
    const currentTransform = activeVideo.style.transform;
    const match = currentTransform.match(/rotate\((-?\d+)deg\)/);
    const currentAngle = match ? match[1] : 0;
    const newAngle = +currentAngle + +inputAngle;
    activeVideo.style.transform = `rotate(${newAngle}deg)`;
  }

  function requestPictureInPicture() {
    if (!activeVideo) {
      console.warn('No active video found for Picture in Picture');
      return;
    }

    // Check if Picture in Picture API is supported
    if (!document.pictureInPictureEnabled) {
      console.warn('Picture in Picture is not supported by this browser');
      alert('Picture in Picture is not supported by this browser');
      return;
    }

    // Check if video supports Picture in Picture
    if (activeVideo.disablePictureInPicture) {
      console.warn('Picture in Picture is disabled for this video');
      alert('Picture in Picture is disabled for this video');
      return;
    }

    // Toggle Picture in Picture
    if (document.pictureInPictureElement) {
      document
        .exitPictureInPicture()
        .then(() => {
          console.log('Exited Picture in Picture');
        })
        .catch(error => {
          console.error('Error exiting Picture in Picture:', error);
        });
    } else {
      activeVideo
        .requestPictureInPicture()
        .then(() => {
          console.log('Entered Picture in Picture');
        })
        .catch(error => {
          console.error('Error entering Picture in Picture:', error);
          alert('Failed to enter Picture in Picture mode');
        });
    }
  }

  function snap() {
    const canvas = renderCurrentVideoFrame();
    if (!canvas) {
      alert('Unable to capture the current frame');
      return;
    }

    try {
      const imageUrl = canvas
        .toDataURL('image/png')
        .replace('image/png', 'image/octet-stream');
      const link = generateElements('<a></a>', document.body);
      const fileName = document.title ? document.title : location.href;
      link.setAttribute('download', `${fileName}.png`);
      link.setAttribute('href', imageUrl);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to capture frame', error);
      alert('Failed to capture the current frame');
    }
  }

  function renderCurrentVideoFrame() {
    if (!activeVideo || !activeVideo.videoWidth || !activeVideo.videoHeight) {
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = activeVideo.videoWidth;
    canvas.height = activeVideo.videoHeight;
    const canvasContext = canvas.getContext('2d');
    if (!canvasContext) return null;

    canvasContext.drawImage(activeVideo, 0, 0);
    return canvas;
  }

  async function copyFrameToClipboard() {
    if (!navigator.clipboard || typeof ClipboardItem === 'undefined') {
      alert('Image clipboard copy is not supported in this browser');
      return;
    }

    const canvas = renderCurrentVideoFrame();
    if (!canvas) {
      alert('Unable to capture the current frame');
      return;
    }

    try {
      const frameBlob = await new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
          if (blob) {
            resolve(blob);
            return;
          }

          reject(new Error('Canvas conversion failed'));
        }, 'image/png');
      });

      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': frameBlob,
        }),
      ]);
    } catch (error) {
      console.error('Failed to copy frame to clipboard', error);
      alert('Failed to copy frame to clipboard');
    }
  }

  function addMouseEvents(event) {
    if (event.target !== getActiveVideo()) return;

    if (event.button === 1) {
      event.preventDefault();
      togglePlayPause();
    }
  }

  function keyboardEvent(e) {
    let activeElementType = document.activeElement.tagName.toLowerCase();
    if (activeElementType === 'input') return; // 🛑

    if (!activeVideo) {
      return; // 🛑
    }

    // Shift+Z toggles subtitle speed transition (selector-driven speed)
    if (e.shiftKey && e.code === 'KeyZ') {
      setSubtitleAutoSpeedEnabled(!subtitleAutoSpeedEnabled);
      return;
    }

    if (e.key == 'j') {
      activeVideo.currentTime = activeVideo.currentTime - timeIncrSmall;
    }
    if (e.key == 'l') {
      activeVideo.currentTime = activeVideo.currentTime + timeIncrSmall;
    }
    if (e.key == 'z') {
      if (subtitleAutoSpeedEnabled) return;
      speedToggle();
    }
    if (e.key === 'x') {
      if (subtitleAutoSpeedEnabled) return;
      activeVideo.playbackRate = activeVideo.playbackRate - 0.5;
    }
    if (e.key === 'c') {
      if (subtitleAutoSpeedEnabled) return;
      activeVideo.playbackRate = activeVideo.playbackRate + 0.5;
    }
    if (e.key === 'm') {
      activeVideo.muted = !activeVideo.toggleAttribute('muted');
    }
    if (e.code === 'KeyB') {
      activeVideo.volume -= 0.01;
    }
    if (e.code === 'KeyN') {
      activeVideo.volume += 0.01;
    }
    if (e.shiftKey && e.code === 'KeyB') {
      activeVideo.volume -= 0.001;
    }
    if (e.shiftKey && e.code === 'KeyN') {
      activeVideo.volume += 0.001;
    }
    if (e.shiftKey && e.code === 'KeyM') {
      activeVideo.muted = false;
      activeVideo.volume = 0.5;
    }
  }

  function togglePlayPause() {
    activeVideo.paused ? activeVideo.play() : activeVideo.pause();
  }

  function speedToggle() {
    if (subtitleAutoSpeedEnabled) {
      syncSubtitleAutoSpeed(activeVideo);
      return;
    }

    if (activeVideo.playbackRate == 1) {
      activeVideo.playbackRate = fastSpeed;
    } else {
      activeVideo.playbackRate = 1;
    }
    // $( activeVideo ).parent().addClass( 'speedManual' )
  }

  function getActiveVideo() {
    let mediaEls = querySelectorAllDeep('video, audio');
    const workingMedia = mediaEls.filter(el => el.duration);
    const playingMedia = mediaEls.filter(el => !el.paused);
    let visibleEls = playingMedia.filter(el => isElementInViewport(el));

    const activeMedia = playingMedia.length
      ? playingMedia
      : visibleEls.length
        ? visibleEls
        : workingMedia;

    if (activeMedia[0]) return activeMedia[0];
    return null;
  }

  function frameStep(direction) {
    activeVideo.pause();
    if (direction === 'left') activeVideo.currentTime -= timeIncrTiny;
    if (direction === 'right') activeVideo.currentTime += timeIncrTiny;
  }

  const videoInfoCache = new Map();

  async function getBitrate(videoEl) {
    const videoUrl = videoEl.src;
    let videoInfo = videoInfoCache.get(videoUrl);
    if (videoInfo && videoInfo.bitrate) {
      return videoInfo.bitrate;
    }

    try {
      const response = await fetch(videoEl.currentSrc, { method: 'HEAD' });
      const contentLength = response.headers.get('Content-Length');
      if (contentLength && videoEl.duration && isFinite(videoEl.duration)) {
        const sizeInBytes = parseInt(contentLength, 10);
        const durationInSeconds = videoEl.duration;
        const bitrate = (sizeInBytes * 8) / durationInSeconds; // bits per second
        const roundedBitrate = Math.round(bitrate);
        videoInfo = videoInfo || {};
        videoInfo.bitrate = roundedBitrate;
        videoInfoCache.set(videoUrl, videoInfo);
        return roundedBitrate;
      }
    } catch (error) {
      // console.error("Error fetching video headers:", error);
    }
    return null; // Return null if bitrate can't be calculated
  }

  function displayBitrate(bitrate) {
    const spanBitrate = document.querySelector('#bitrate-display');
    if (spanBitrate) {
      if (bitrate) {
        let displayValue;
        if (bitrate >= 1000000) {
          displayValue = `${(bitrate / 1000000).toFixed(1)} Mbps`;
        } else {
          displayValue = `${(bitrate / 1000).toFixed(0)} kbps`;
        }
        setAnimatedTextContent(spanBitrate, displayValue);
      } else {
        setAnimatedTextContent(spanBitrate, '');
      }
    }
  }

  function updateFrameRate(videoEl) {
    if (!videoEl || !videoEl.src) return;

    const videoUrl = videoEl.src;
    let videoInfo = videoInfoCache.get(videoUrl);
    if (videoInfo && videoInfo.frameRate) {
      displayFrameRate(videoInfo.frameRate);
      return;
    }

    let stream;
    try {
      stream = videoEl.captureStream();
    } catch (error) {}
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;

    const settings = videoTrack.getSettings();
    const frameRate = Math.round(settings.frameRate / videoEl.playbackRate);

    videoInfo = videoInfo || {};
    videoInfo.frameRate = frameRate;
    videoInfoCache.set(videoUrl, videoInfo);

    displayFrameRate(frameRate);
  }

  function displayFrameRate(frameRate) {
    const spanFrameRate = document.querySelector(`#frame-rate-display`);
    if (spanFrameRate) {
      setAnimatedTextContent(spanFrameRate, frameRate);
      spanFrameRate.style.backgroundColor =
        frameRate >= 60 ? '#ff8080' : '#2ecc71';
    }
  }
})();
