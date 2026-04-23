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
    subtitleSpeedTransitionToggleEl,
    inputSubtitleSelectorEl,
    numAutoFastSpeedEl;
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
  let duplicateSelectorScanCompleted = false;

  let subtitleAutoSpeedEnabled = false;
  let subtitleSelector = '';
  let subtitleSelectorInvalid = false;
  let subtitleObserver = null;
  let subtitleObserverUnsubscribe = null;
  let subtitleSelectorUserSelectStyleEl = null;
  let subtitleSelectorIframeCenterStyleEl = null;
  let lastSubtitlePresentState = null;

  const canUseSharedSubtitleObserver =
    typeof waitForEach === 'function' &&
    typeof CentralObserverManager !== 'undefined' &&
    typeof CentralObserverManager.observe === 'function';

  const syncSubtitleAutoSpeedSoon = debounce(() => {
    syncSubtitleAutoSpeed();
  }, 75);
  const debouncedMain = debounce(main, 150);
  const subtitleTransitionEnabledSvgFallback = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" stroke-width="3" stroke="#000000" fill="none"><path d="M28.79,44l-9.4-9.4S31.76,5.41,56.77,7C56.77,7,60.25,30.12,28.79,44Z" fill="#FFD166" /><path d="M56,16.82a10.87,10.87,0,0,1-6-3.08,11,11,0,0,1-3.11-6.15" /><circle cx="42.32" cy="21.44" r="5.48" fill="#118AB2" /><circle cx="40.5" cy="19.5" r="1.5" fill="#FFFFFF" stroke="none" /><path d="M30.61,43.16,30,47.84a.24.24,0,0,0,.33.25l8-3.47A2.32,2.32,0,0,0,39.63,43l1.22-5.83" fill="#EF476F" /><path d="M20,33.29l-4.69.6a.23.23,0,0,1-.24-.32l3.46-7.95a2.33,2.33,0,0,1,1.67-1.35l5.82-1.22" fill="#EF476F" /><path d="M21.49,36.68c-6.55,2.1-6.88,12.47-6.88,12.47s10.08.11,12.59-6.76" fill="#FF9F1C" /><line x1="10.88" y1="52.82" x2="7.12" y2="56.59" stroke-linecap="round" /><line x1="10.6" y1="45.63" x2="7.41" y2="48.81" stroke-linecap="round" /><line x1="17.94" y1="53.11" x2="14.76" y2="56.3" stroke-linecap="round" /></svg>`;
  const subtitleTransitionDisabledSvgFallback = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" stroke-width="3" stroke="#000000" fill="none"><path d="M28.79,44l-9.4-9.4S31.76,5.41,56.77,7C56.77,7,60.25,30.12,28.79,44Z" /><path d="M56,16.82a10.87,10.87,0,0,1-6-3.08,11,11,0,0,1-3.11-6.15" /><circle cx="42.32" cy="21.44" r="5.48" /><path d="M30.61,43.16,30,47.84a.24.24,0,0,0,.33.25l8-3.47A2.32,2.32,0,0,0,39.63,43l1.22-5.83" /><path d="M20,33.29l-4.69.6a.23.23,0,0,1-.24-.32l3.46-7.95a2.33,2.33,0,0,1,1.67-1.35l5.82-1.22" /><path d="M21.49,36.68c-6.55,2.1-6.88,12.47-6.88,12.47s10.08.11,12.59-6.76" /><line x1="10.88" y1="52.82" x2="7.12" y2="56.59" stroke-linecap="round" /><line x1="10.6" y1="45.63" x2="7.41" y2="48.81" stroke-linecap="round" /><line x1="17.94" y1="53.11" x2="14.76" y2="56.3" stroke-linecap="round" /></svg>`;
  const contentChangePulseClass = 'content-change-pulse';
  const animatedContentSelector =
    '#frame-rate-display, #bitrate-display, .divHeight';

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
    applySubtitleSelectorTextSelectableStyle();
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
      if (!duplicateSelectorScanCompleted) {
        await scanAndPromptDuplicateSelectorProfiles();
      }
      return;
    }

    const storedConfig = await readConfigFromStorage();
    settingsConfig = normalizeSettingsConfig(storedConfig);
    writeConfigToStorage(settingsConfig);
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
      targetProfile.autoSpeedEnabled === undefined &&
      sourceProfile.autoSpeedEnabled !== undefined
    ) {
      targetProfile.autoSpeedEnabled = !!sourceProfile.autoSpeedEnabled;
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

    const selectableCss = `${selector}, ${selector} * {
      user-select: text !important;
      -webkit-user-select: text !important;
      -moz-user-select: text !important;
      -ms-user-select: text !important;
    }`;

    subtitleSelectorUserSelectStyleEl = GM_addStyle(selectableCss);

    if (!isRunningInsideIframe()) return;

    const centeredCss = `${selector} {
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
    }`;

    subtitleSelectorIframeCenterStyleEl = GM_addStyle(centeredCss);
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
      return { present: false, hasMusicalSymbols: false };
    }

    try {
      subtitleSelectorInvalid = false;
      const matchedSubtitles = querySelectorAllDeep(subtitleSelector);
      if (!matchedSubtitles.length) {
        return { present: false, hasMusicalSymbols: false };
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
          return { present: true, hasMusicalSymbols: true };
        }
      }

      return { present: foundVisibleSubtitleText, hasMusicalSymbols: false };
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

    return subtitleSelector;
  }

  function setSubtitleAutoSpeedEnabled(enabled, options = {}) {
    const { persist = true } = options;
    const requestedEnabled = !!enabled;

    if (requestedEnabled && !(subtitleSelector || '').trim()) {
      const selectorFromPrompt = promptForSubtitleSelector();
      if (!selectorFromPrompt) {
        subtitleAutoSpeedEnabled = false;

        if (cbSubtitleAutoSpeedEl) {
          cbSubtitleAutoSpeedEl.checked = false;
        }
        if (persist) {
          saveSubtitleAutoSpeedEnabledSetting(false);
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
    if (persist) {
      saveSubtitleAutoSpeedEnabledSetting(subtitleAutoSpeedEnabled);
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
      return;
    }

    if (!subtitleSelector || !subtitleSelector.trim()) {
      setPlaybackRateIfNeeded(video, 1);
      return;
    }

    const subtitleState = getSubtitleStateBySelector();

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

    setSubtitleAutoSpeedEnabled(subtitleAutoSpeedEnabled, { persist: false });

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
    updateExtendedVolumeSliderVisibility();
    speedDispEl.value = activeVideo.playbackRate;
    setAnimatedTextContent(
      divHeightEl,
      `${activeVideo.videoWidth}×${activeVideo.videoHeight}`,
    );
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
