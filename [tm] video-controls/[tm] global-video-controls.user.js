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
    divHeightEl,
    cbSubtitleAutoSpeedEl,
    inputSubtitleSelectorEl,
    numAutoFastSpeedEl,
    autoSpeedStateEl;
  let panelUiState = 0;
  let panelUiLastNonHeadState = 0;
  let panelAutoHideEnabled = false;
  let panelMouseInside = false;
  const panelAutoHideStorageKey = `global-video-controls:autoHide:${location.hostname}`;
  const autoSpeedEnabledStorageKey = `global-video-controls:autoSpeedEnabled:${location.hostname}`;
  const autoSpeedSelectorStorageKey = `global-video-controls:autoSpeedSelector:${location.hostname}`;
  const autoSpeedFastSpeedStorageKey = `global-video-controls:autoSpeedFast:${location.hostname}`;

  let subtitleAutoSpeedEnabled = loadSubtitleAutoSpeedEnabledSetting();
  let subtitleSelector = loadSubtitleSelectorSetting();
  let subtitleSelectorInvalid = false;
  let subtitleObserver = null;
  let subtitlePollIntervalId = null;
  let lastSubtitlePresentState = null;

  const syncSubtitleAutoSpeedSoon = debounce(() => {
    syncSubtitleAutoSpeed();
  }, 75);

  fastSpeed = loadFastSpeedSetting(fastSpeed);

  new MutationObserver(debounce(main, 150)).observe(document.body, {
    childList: true,
    subtree: true,
  });
  document.addEventListener('scroll', debounce(main, 150));
  document.addEventListener('keyup', keyboardEvent, false);
  document.addEventListener('mousedown', addMouseEvents);
  window.addEventListener('beforeunload', stopSubtitlePresenceMonitoring);

  async function main() {
    activeVideo = getActiveVideo();
    const vidContPanel = document.querySelector(`#video-controlPanel`);
    if (!activeVideo) {
      // vidContPanel.style.display = 'none';
    }

    if (activeVideo && !vidContPanel) {
      addToolbar();
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

  function loadSubtitleAutoSpeedEnabledSetting() {
    try {
      return localStorage.getItem(autoSpeedEnabledStorageKey) === 'true';
    } catch (error) {
      return false;
    }
  }

  function saveSubtitleAutoSpeedEnabledSetting(enabled) {
    try {
      localStorage.setItem(autoSpeedEnabledStorageKey, String(enabled));
    } catch (error) {}
  }

  function loadSubtitleSelectorSetting() {
    try {
      return localStorage.getItem(autoSpeedSelectorStorageKey) || '';
    } catch (error) {
      return '';
    }
  }

  function saveSubtitleSelectorSetting(selector) {
    try {
      localStorage.setItem(autoSpeedSelectorStorageKey, selector);
    } catch (error) {}
  }

  function loadFastSpeedSetting(defaultValue) {
    try {
      const raw = localStorage.getItem(autoSpeedFastSpeedStorageKey);
      if (!raw) return defaultValue;

      const parsed = parseFloat(raw);
      if (!Number.isFinite(parsed) || parsed <= 0) return defaultValue;
      return parsed;
    } catch (error) {
      return defaultValue;
    }
  }

  function saveFastSpeedSetting(value) {
    try {
      localStorage.setItem(autoSpeedFastSpeedStorageKey, String(value));
    } catch (error) {}
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
    if (subtitleObserver) {
      subtitleObserver.disconnect();
      subtitleObserver = null;
    }

    if (subtitlePollIntervalId) {
      clearInterval(subtitlePollIntervalId);
      subtitlePollIntervalId = null;
    }
  }

  function startSubtitlePresenceMonitoring() {
    stopSubtitlePresenceMonitoring();

    if (!subtitleAutoSpeedEnabled) return;

    subtitleObserver = new MutationObserver(() => {
      syncSubtitleAutoSpeedSoon();
    });
    subtitleObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden'],
    });

    subtitlePollIntervalId = setInterval(() => {
      if (!activeVideo) return;
      syncSubtitleAutoSpeed(activeVideo);
    }, 300);
  }

  function isSubtitlePresentBySelector() {
    if (!subtitleSelector || !subtitleSelector.trim()) {
      subtitleSelectorInvalid = false;
      return false;
    }

    try {
      subtitleSelectorInvalid = false;
      return !!document.querySelector(subtitleSelector);
    } catch (error) {
      subtitleSelectorInvalid = true;
      return false;
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

    const subtitlePresent = isSubtitlePresentBySelector();

    if (subtitleSelectorInvalid) {
      setPlaybackRateIfNeeded(video, 1);
      setAutoSpeedStatus('INVALID SELECTOR', '#e74c3c');
      return;
    }

    lastSubtitlePresentState = subtitlePresent;
    if (subtitlePresent) {
      setPlaybackRateIfNeeded(video, 1);
      setAutoSpeedStatus('AUTO NORMAL', '#2ecc71');
      return;
    }

    setPlaybackRateIfNeeded(video, fastSpeed);
    setAutoSpeedStatus('AUTO FAST', '#3498db');
  }

  function addToolbar() {
    // HTML Structure
    const controlPanel = generateElements(htmlStructure);
    // CSS Styles
    GM_addStyle(styles);

    document.body.append(controlPanel);

    const contPanelHeader = controlPanel.querySelector('#contPanelHeader');
    const cbAutoHideEl = controlPanel.querySelector('#cbAutoHide');
    cbSubtitleAutoSpeedEl = controlPanel.querySelector('#cbSubtitleAutoSpeed');
    inputSubtitleSelectorEl = controlPanel.querySelector(
      '#inputSubtitleSelector',
    );
    numAutoFastSpeedEl = controlPanel.querySelector('#numAutoFastSpeed');
    autoSpeedStateEl = controlPanel.querySelector('#autoSpeedState');
    panelAutoHideEnabled = loadPanelAutoHideSetting();
    cbAutoHideEl.checked = panelAutoHideEnabled;
    if (cbSubtitleAutoSpeedEl) {
      cbSubtitleAutoSpeedEl.checked = subtitleAutoSpeedEnabled;
    }
    if (inputSubtitleSelectorEl) {
      inputSubtitleSelectorEl.value = subtitleSelector;
    }
    if (numAutoFastSpeedEl) {
      numAutoFastSpeedEl.value = String(fastSpeed);
    }
    applyEffectivePanelUiState(controlPanel);
    vidProgressEl = controlPanel.querySelector(`#progress`);
    speedDispEl = controlPanel.querySelector('#speedDisp');
    volDispEl = controlPanel.querySelector('#volDisp');
    slidVolFinEl = controlPanel.querySelector(`.slidVolFin`);
    divHeightEl = controlPanel.querySelector('.divHeight');

    // dragElement( controlPanel, controlPanel );
    makeDraggable(controlPanel);
    contPanelHeader.addEventListener('mousedown', () => {
      controlPanel.style.transition = 'unset';
    });
    contPanelHeader.addEventListener('mouseup', () => {
      controlPanel.style.transition = 'left 0.5s, top 0.5s, opacity 0.2s';
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
    if (cbSubtitleAutoSpeedEl) {
      cbSubtitleAutoSpeedEl.addEventListener('change', event => {
        subtitleAutoSpeedEnabled = event.target.checked;
        saveSubtitleAutoSpeedEnabledSetting(subtitleAutoSpeedEnabled);

        if (subtitleAutoSpeedEnabled) {
          startSubtitlePresenceMonitoring();
          syncSubtitleAutoSpeed(activeVideo);
        } else {
          stopSubtitlePresenceMonitoring();
          setAutoSpeedStatus('AUTO OFF', '#95a5a6');
        }
      });
    }

    if (inputSubtitleSelectorEl) {
      const applySelector = value => {
        subtitleSelector = (value || '').trim();
        saveSubtitleSelectorSetting(subtitleSelector);
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
    controlPanel.querySelector(`#buttonGenSb`).addEventListener('click', () => {
      generateStoryboard();
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
    if (!panelAutoHideEnabled) {
      applyPanelUiState(controlPanelEl, panelUiState);
      return;
    }

    if (panelMouseInside) {
      applyPanelUiState(controlPanelEl, panelUiLastNonHeadState);
      return;
    }

    applyPanelUiState(controlPanelEl, 2);
  }

  function loadPanelAutoHideSetting() {
    try {
      return localStorage.getItem(panelAutoHideStorageKey) === 'true';
    } catch (error) {
      return false;
    }
  }

  function savePanelAutoHideSetting(enabled) {
    try {
      localStorage.setItem(panelAutoHideStorageKey, String(enabled));
    } catch (error) {}
  }

  function applyPanelUiState(controlPanelEl, state) {
    const descendants = controlPanelEl.querySelectorAll('*');
    descendants.forEach(item => {
      item.style.display = '';
    });

    if (state === 0) {
      controlPanelEl.querySelectorAll(':not(.important)').forEach(item => {
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

    const headButton = controlPanelEl.querySelector('button.head');
    if (!headButton) return;

    headButton.style.display = '';
    let parent = headButton.parentElement;
    while (parent && parent !== controlPanelEl) {
      parent.style.display = '';
      parent = parent.parentElement;
    }
  }

  function initializeToolbar() {
    slidVolFinEl.value = activeVideo.volume;
    volDispEl.value = activeVideo.volume;
    speedDispEl.value = activeVideo.playbackRate;
    divHeightEl.textContent = `${activeVideo.videoWidth}×${activeVideo.videoHeight}`;
    divHeightEl.title = activeVideo.videoWidth * activeVideo.videoHeight;
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

  function generateStoryboard() {
    activeVideo.currentTime = 0;
    setInterval(() => {
      activeVideo.currentTime += 60;
    }, 1000);
    // while ( activeVideo.currentTime < activeVideo.duration ) {
    // }
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
    let mediaEls = [...document.querySelectorAll('video, audio')];
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
