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
    cbSubtitleAutoSpeedEl,
    inputSubtitleSelectorEl,
    numAutoFastSpeedEl,
    autoSpeedStateEl;
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
  const defaultProfileId = 'default';
  const musicalSubtitlePattern = /[♪♫♬♩🎵🎶]/;
  const hasModernGMStorage =
    typeof GM !== 'undefined' &&
    typeof GM.getValue === 'function' &&
    typeof GM.setValue === 'function';
  const trackedShadowRootsByHost = new WeakMap();
  let shadowRootTrackingInstalled = false;

  let settingsConfig = null;
  let activeRulePattern = null;
  let activeProfileId = null;
  let activeHostname = '';

  let subtitleAutoSpeedEnabled = false;
  let subtitleSelector = '';
  let subtitleSelectorInvalid = false;
  let subtitleObserver = null;
  let subtitleObserverUnsubscribe = null;
  let lastSubtitlePresentState = null;

  const canUseSharedSubtitleObserver =
    typeof waitForEach === 'function' &&
    typeof CentralObserverManager !== 'undefined' &&
    typeof CentralObserverManager.observe === 'function';

  const syncSubtitleAutoSpeedSoon = debounce(() => {
    syncSubtitleAutoSpeed();
  }, 75);
  const debouncedMain = debounce(main, 150);

  installShadowRootTracking();

  await hydrateStoredSettings();

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
      syncSubtitleAutoSpeed(activeVideo);
    }
  }

  async function hydrateStoredSettings() {
    await ensureSettingsConfigLoaded();
    subtitleAutoSpeedEnabled = await loadSubtitleAutoSpeedEnabledSetting();
    autoPauseOnBlurEnabled = await loadAutoPauseOnBlurSetting();
    subtitleSelector = await loadSubtitleSelectorSetting();
    fastSpeed = await loadFastSpeedSetting(fastSpeed);
    panelAutoHideEnabled = await loadPanelAutoHideSetting();
    panelPosition = await loadPanelPositionSetting();
  }

  function getDefaultProfileShape() {
    return {
      autoHide: false,
      autoPauseOnBlur: false,
      autoSpeedEnabled: false,
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
    if (typeof source.autoSpeedEnabled === 'boolean') {
      normalized.autoSpeedEnabled = source.autoSpeedEnabled;
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

  function writeConfigToStorage(config) {
    if (!hasModernGMStorage) return;

    Promise.resolve(GM.setValue(settingsConfigStorageKey, config)).catch(
      () => {},
    );
  }

  async function ensureSettingsConfigLoaded() {
    if (settingsConfig) {
      resolveActiveProfileForHostname(location.hostname);
      return;
    }

    const storedConfig = await readConfigFromStorage();
    settingsConfig = normalizeSettingsConfig(storedConfig);
    writeConfigToStorage(settingsConfig);
    resolveActiveProfileForHostname(location.hostname);
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

    return normalizePanelPositionValue(activeProfile.panelPosition);
  }

  function savePanelPositionToProfile(position) {
    if (!position) return;

    const normalizedPosition = normalizePanelPositionValue(position);
    if (!normalizedPosition) return;

    const writableProfile = ensureWritableProfile();
    if (!writableProfile) return;

    writableProfile.panelPosition = normalizedPosition;
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

  async function loadSubtitleAutoSpeedEnabledSetting() {
    return loadBooleanSettingFromProfile('autoSpeedEnabled', false);
  }

  function saveSubtitleAutoSpeedEnabledSetting(enabled) {
    saveBooleanSettingToProfile('autoSpeedEnabled', enabled);
  }

  async function loadSubtitleSelectorSetting() {
    return loadTextSettingFromProfile('autoSpeedSelector', '');
  }

  function saveSubtitleSelectorSetting(selector) {
    saveTextSettingToProfile('autoSpeedSelector', selector);
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

  function setAutoSpeedStatus(text, color) {
    if (!autoSpeedStateEl) return;

    autoSpeedStateEl.textContent = text;
    if (color) {
      autoSpeedStateEl.style.backgroundColor = color;
    } else {
      autoSpeedStateEl.style.backgroundColor = '#95a5a6';
    }
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

  function getSubtitleStateBySelector() {
    if (!subtitleSelector || !subtitleSelector.trim()) {
      subtitleSelectorInvalid = false;
      return { present: false, hasMusicalSymbols: false };
    }

    try {
      subtitleSelectorInvalid = false;
      const matchedSubtitles = querySelectorAllDeep(subtitleSelector);
      if (!matchedSubtitles.length) {
        return { present: false, hasMusicalSymbols: false };
      }

      for (const matchedSubtitle of matchedSubtitles) {
        const subtitleText = (matchedSubtitle?.textContent || '').trim();
        if (subtitleText && musicalSubtitlePattern.test(subtitleText)) {
          return { present: true, hasMusicalSymbols: true };
        }
      }

      return { present: true, hasMusicalSymbols: false };
    } catch (error) {
      subtitleSelectorInvalid = true;
      return { present: false, hasMusicalSymbols: false };
    }
  }

  function setPlaybackRateIfNeeded(video, rate) {
    if (!video || !Number.isFinite(rate) || rate <= 0) return;
    if (Math.abs(video.playbackRate - rate) < 0.001) return;
    video.playbackRate = rate;
  }

  function syncSubtitleAutoSpeed(video = activeVideo) {
    if (!video || video !== activeVideo) return;

    if (!subtitleAutoSpeedEnabled) {
      subtitleSelectorInvalid = false;
      lastSubtitlePresentState = null;
      setAutoSpeedStatus('AUTO OFF', '#95a5a6');
      return;
    }

    if (!subtitleSelector || !subtitleSelector.trim()) {
      setPlaybackRateIfNeeded(video, 1);
      setAutoSpeedStatus('SELECTOR REQUIRED', '#f39c12');
      return;
    }

    const subtitleState = getSubtitleStateBySelector();

    if (subtitleSelectorInvalid) {
      setPlaybackRateIfNeeded(video, 1);
      setAutoSpeedStatus('INVALID SELECTOR', '#e74c3c');
      return;
    }

    if (subtitleState.present && subtitleState.hasMusicalSymbols) {
      setPlaybackRateIfNeeded(video, fastSpeed);
      setAutoSpeedStatus('AUTO FAST (MUSIC)', '#8e44ad');
      return;
    }

    const subtitlePresent = subtitleState.present;
    lastSubtitlePresentState = subtitlePresent;
    if (subtitlePresent) {
      setPlaybackRateIfNeeded(video, 1);
      setAutoSpeedStatus('AUTO NORMAL', '#2ecc71');
      return;
    }

    setPlaybackRateIfNeeded(video, fastSpeed);
    setAutoSpeedStatus('AUTO FAST', '#3498db');
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
    inputSubtitleSelectorEl = controlPanel.querySelector(
      '#inputSubtitleSelector',
    );
    numAutoFastSpeedEl = controlPanel.querySelector('#numAutoFastSpeed');
    autoSpeedStateEl = controlPanel.querySelector('#autoSpeedState');
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
        subtitleAutoSpeedEnabled = event.target.checked;
        saveSubtitleAutoSpeedEnabledSetting(subtitleAutoSpeedEnabled);

        if (subtitleAutoSpeedEnabled) {
          startSubtitlePresenceMonitoring();
          syncSubtitleAutoSpeed(activeVideo);
        } else {
          stopSubtitlePresenceMonitoring();
          setPlaybackRateIfNeeded(activeVideo, 1);
          setAutoSpeedStatus('AUTO OFF', '#95a5a6');
        }
      });
    }

    if (inputSubtitleSelectorEl) {
      const applySelector = value => {
        subtitleSelector = (value || '').trim();
        saveSubtitleSelectorSetting(subtitleSelector);
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

    if (subtitleAutoSpeedEnabled) {
      startSubtitlePresenceMonitoring();
      syncSubtitleAutoSpeed(activeVideo);
    } else {
      setAutoSpeedStatus('AUTO OFF', '#95a5a6');
    }

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
    updateExtendedVolumeSliderVisibility();
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

  function updateExtendedVolumeSliderVisibility() {
    if (!slidVolExtEl) return;

    if (getEffectivePanelUiState() === 2) {
      slidVolExtEl.style.display = 'none';
      return;
    }

    const primaryAtMax =
      !!slidVolFinEl &&
      Math.abs(parseFloat(slidVolFinEl.value) - parseFloat(slidVolFinEl.max)) <
        0.0005;
    const volumeAboveBase = !!activeVideo && activeVideo.volume > 0.25;
    const showExtendedSlider = primaryAtMax || volumeAboveBase;

    slidVolExtEl.style.display = showExtendedSlider ? '' : 'none';
  }

  function initializeToolbar() {
    if (!activeVideo) return;

    slidVolFinEl.value = activeVideo.volume;
    if (slidVolExtEl) {
      slidVolExtEl.value = activeVideo.volume;
    }
    volDispEl.value = activeVideo.volume;
    updateExtendedVolumeSliderVisibility();
    speedDispEl.value = activeVideo.playbackRate;
    divHeightEl.textContent = `${activeVideo.videoWidth}×${activeVideo.videoHeight}`;
    divHeightEl.title = activeVideo.videoWidth * activeVideo.videoHeight;
    updatePlaybackPercentage(activeVideo);
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
      spanPlaybackPercentage.textContent = '0%';
      return;
    }

    const percentPlayed = (currentTime / duration) * 100;
    const clampedPercent = Math.min(Math.max(percentPlayed, 0), 100);
    spanPlaybackPercentage.textContent = `${clampedPercent.toFixed(1)}%`;
  }

  function titler(text) {
    if (document.getElementById('cbAutoSwitch')?.checked) document.title = text;
  }

  function videoEventListeners(video) {
    if (video.classList.contains('video-processed')) return; // 🛑

    video.addEventListener('loadedmetadata', async () => {
      const bitrate = await getBitrate(video);
      displayBitrate(bitrate);
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

      const videoArea = video.videoWidth * video.videoHeight;
      const spanVidHeight = document.querySelector(`.divHeight`);
      spanVidHeight.style.backgroundColor =
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
      spanRemainingTime.textContent = readable;
      spanCurrentTime.textContent = forHumans(Math.round(currentTime));

      if (video.playbackRate == 1) {
        fadeOut(spanActualRemTime);
        return;
      } // 🛑
      fadeIn(spanActualRemTime);
      const actualRemainingTime = Math.round(
        (duration - currentTime) / video.playbackRate,
      );
      const readableActual = forHumans(actualRemainingTime);
      spanActualRemTime.textContent = readableActual;
    });

    video.addEventListener('ratechange', event => {
      speedDispEl.value = event.target.playbackRate;
    });
    video.addEventListener('volumechange', event => {
      volDispEl.value = event.target.volume;
      slidVolFinEl.value = event.target.volume;
      if (slidVolExtEl) slidVolExtEl.value = event.target.volume;
      updateExtendedVolumeSliderVisibility();
    });

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
    const canvas = generateElements('<canvas></canvas>', document.body);
    canvas.width = activeVideo.videoWidth;
    canvas.height = activeVideo.videoHeight;
    const canvasContext = canvas.getContext('2d');
    canvasContext.drawImage(activeVideo, 0, 0);
    const imageUrl = canvas
      .toDataURL('image/png')
      .replace('image/png', 'image/octet-stream');

    const link = generateElements('<a></a>', document.body);
    const fileName = document.title ? document.title : location.href;
    link.setAttribute('download', `${fileName}.png`);
    link.setAttribute('href', imageUrl);
    link.click();

    canvas.remove();
    link.remove();
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
        spanBitrate.textContent = displayValue;
      } else {
        spanBitrate.textContent = '';
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
      spanFrameRate.textContent = frameRate;
      spanFrameRate.style.backgroundColor =
        frameRate >= 60 ? '#ff8080' : '#2ecc71';
    }
  }
})();
