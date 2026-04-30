const htmlStructure = `
  <div class="controlPanel" id="video-controlPanel">
    <div id="contPanelHeader" class=important>
      <div id="header-row-one" class="header-row">
        <button class="head important" title="Cycle panel view">⚫</button>
        <div class="video-state-badges" aria-label="Video status indicators">
          <span id="video-player-state" class="media-state state-neutral" title="Player state">play</span>
          <span id="video-ready-state" class="media-state state-neutral" title="Ready state">R0</span>
          <span id="video-network-state" class="media-state state-neutral" title="Network state">N0</span>
          <span id="video-error-state" class="media-state state-good" title="Media error">ok</span>
        </div>
        <input type="checkbox" title="UI Auto Hide" id="cbAutoHide">
        <span id="frame-rate-display" class=important></span>
        <span id="bitrate-display" class=important></span>
        <span class="divHeight text important">x</span>
        <span id=dimensions-as-a-percentage></span>
      </div>
      <div id=time-related class="header-row">
        <span id="spanPlaybackPercentage" class="text" title="Playback progress percentage">0%</span>
        <span id="spanCurrentTime" class="text"></span>
        <span id="spanRemainingTime" class="text">x</span>
        <span id="spanActualRemainingTime" class="text">x</span>
        <span id="spanTimeSavedSoFar" class="text time-saved-badge" title="Time saved so far vs current position">—</span>
      </div>
      <div id="time-related-popup" class="time-related-popup" hidden aria-live="polite">
        <div class="time-related-popup-title">Video time summary</div>
        <div class="time-related-popup-row">
          <div class="time-related-popup-label">Time spent playing</div>
          <div id="time-spent-playing" class="time-related-popup-value">0:00</div>
        </div>
        <div class="time-related-popup-row">
          <div class="time-related-popup-label">Time spent waiting</div>
          <div id="time-spent-waiting" class="time-related-popup-value">0:00</div>
        </div>
        <div class="time-related-popup-row">
          <div class="time-related-popup-label">Total time spent</div>
          <div id="time-spent-total" class="time-related-popup-value">0:00</div>
        </div>
        <div class="time-related-popup-row">
          <div class="time-related-popup-label">Video duration</div>
          <div id="time-spent-duration" class="time-related-popup-value">0:00</div>
        </div>
        <div class="time-related-popup-row">
          <div class="time-related-popup-label">Comparison</div>
          <div id="time-spent-comparison" class="time-related-popup-value">No difference</div>
        </div>
        <div class="time-related-popup-row">
          <div class="time-related-popup-label">Time saved so far</div>
          <div id="time-spent-current-position" class="time-related-popup-value">—</div>
        </div>
      </div>
      <div id="header-row-two" class="header-row">
        <button class="important" id="buttonPlay">▶</button> 
        <button class="important" id="rewind-btn">0️⃣</button>
        <button class="important" id="speedToggle" title="Toggle speed between 1x and fast speed">💨</button>
        <button class="important" id="subtitleSpeedTransitionToggle" title="Toggle subtitle speed transition">🚀</button>
        <input type="checkbox" title="Auto Pause on Blur" id="cbAutoPauseOnBlur">
        <button id="track-indicator-text" class="track-indicator" title="Text tracks">📝</button>
        <button id="track-indicator-audio" class="track-indicator" title="Audio tracks">🎵</button>
        <button id="track-indicator-video" class="track-indicator" title="Video tracks">📹</button>
      </div>
    </div>
    
    <div class="controlRow">
      <input type="number" title="Speed" step="0.1" min="0.1" max="4" class="numinp" id="speedDisp" value="1">
      <input type="range" class="slidSpeedFin important vidContRange" min="0.1" max="4" step="0.1" value="1">
      <input type="checkbox" title="Auto Switch" id="cbAutoSwitch">
    </div>

    <div class="controlRow important">
      <input type="checkbox" title="Enable subtitle auto-speed mode." id="cbSubtitleAutoSpeed">
      <input type="number" title="Fast speed used when subtitle selector is not present." step="0.1" min="0.1" max="16" class="numinp" id="numAutoFastSpeed" value="3">
      <input type="text" title="CSS selector for subtitle element." id="inputSubtitleSelector" placeholder="Subtitle selector (example: .ytp-caption-segment)">
    </div>
      
    <div class="buttonsRow important">
      <button class="timejumpLTwo important">➖</button> 
      <button class="timejumpLOne important">➖</button> 
      <button class="timejumpROne important">➕</button> 
      <button class="timejumpRTwo important">➕</button>
      <input type="checkbox" class="important" title="Loop video" id="checkbox-loop-vid">
      <a id="copyPageUrl" title="Page" class="important button" href="${location.href}">📄</a>
      <button id="copyVidSrc" class="brsrc" title="CurrentSrc">🎞️</button>
    </div>

    <div class="buttonsRow important">
      <button id="buttonScroll" title="Scroll into view">📍</button>
      <button id="buttonLog" title="Log video element to the console">📜</button>
      <button id="buttonResize" title="Resize">↕</button> 
      <button id="frameStepL" title="Frame step">⇠</button> 
      <button id="frameStepR" title="Frame step">⇢</button> 
      <button id="buttonSnap" title="Snap">📷</button>
      <button id="buttonSnapClipboard" title="Copy frame to clipboard">📋</button>
      <button id="buttonPiP" title="Picture in Picture">📺</button>
      <button id="buttonFullScreen" title="Full Screen">⛶</button>
      <button id="buttonRotateL">⭯</button>
      <button id="buttonRotateR">⭮</button>
    </div>

    <fieldset id="volume-related-elements" class="important" style="display: flex;">
      <div id="volume-sliders" class="important">
        <input type="range" class="slidVolFin important vidContRange" min="0" max="0.25" step="0.001">
    <input type="range" class="slidVolExt important vidContRange" min="0.25" max="1" step="0.001" title="Extended volume (0.25 to 1)">
      </div>
      <input type="number" title="Volume" step="0.001" class="numinp" id="volDisp">
      <button id="muteButton" for="volDisp">🔊</button>
    </fieldset>
    
    <input type="range" id="progress" class="important vidContRange" min="0" max="100" step="0.001" value="0">

  </div>
`;

const margins = '2px';

const styles = `
  .controlPanel {
    position: fixed;
    top: 100px;
    left: 10px;
    width: fit-content;
    z-index: 100000;
    background-color: #2c3e50;
    transition: left 0.5s, top 0.5s, opacity 0.2s;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    font-family: 'Courier New', monospace;
    color: #ecf0f1;
    padding: ${margins};
    opacity: 0.5;
  }

  .controlPanel, .controlPanel * {
    user-select: none;
  }

  .controlPanel:hover {
    opacity: 1;
  }

  #contPanelHeader {
    background-color: #34495e;
    padding: ${margins};
    border-radius: 6px 6px 0 0;
    position: relative;
    font-size: 12px;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: ${margins};
  }

  #contPanelHeader .header-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
  }

  #header-row-two {
    justify-content: flex-start;
  }

  #time-related {
    cursor: pointer;
  }

  #time-related-popup {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    min-width: 220px;
    max-width: min(92vw, 360px);
    padding: 8px;
    border-radius: 8px;
    border: 1px solid rgba(236, 240, 241, 0.18);
    background: linear-gradient(180deg, #34495e 0%, #2c3e50 100%);
    box-shadow: 0 10px 18px rgba(0, 0, 0, 0.28);
    z-index: 4;
  }

  #time-related-popup[hidden] {
    display: none;
  }

  .time-related-popup-title {
    margin-bottom: 6px;
    font-size: 12px;
    font-weight: 700;
    color: #ecf0f1;
    letter-spacing: 0.02em;
  }

  .time-related-popup-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 4px 0;
  }

  .time-related-popup-label {
    font-size: 11px;
    color: #d6eaf8;
    line-height: 1.2;
  }

  .time-related-popup-value {
    margin-left: auto;
    font-size: 11px;
    font-weight: 700;
    color: #ecf0f1;
    line-height: 1.2;
    text-align: right;
    white-space: nowrap;
  }

  #subtitleSpeedTransitionToggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: visible;
    min-width: 30px;
    min-height: 30px;
  }

  #subtitleSpeedTransitionToggle::after {
    content: '';
    position: absolute;
    top: -1px;
    right: -1px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #2ecc71;
    border: 1px solid #ecf0f1;
    box-shadow: 0 0 0 1px rgba(44, 62, 80, 0.7);
    z-index: 3;
    opacity: 0;
    transform: scale(0.6);
    transition: opacity 0.2s ease, transform 0.2s ease;
    pointer-events: none;
  }

  #subtitleSpeedTransitionToggle.subtitle-selector-available::after {
    opacity: 1;
    transform: scale(1);
  }

  #subtitleSpeedTransitionToggle svg {
    width: 18px;
    height: 18px;
    display: block;
  }

  .video-state-badges {
    display: inline-flex;
    align-items: center;
    gap: 1px;
    margin: 0 ${margins};
    flex-wrap: wrap;
  }

  #contPanelHeader .media-state {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 32px;
    padding: 1px 4px;
    border-radius: 999px;
    font-size: 12px;
    line-height: 1.1;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    background-color: #95a5a6;
    color: #ecf0f1;
  }

  #contPanelHeader .media-state.state-good {
    background-color: #2ecc71;
    color: #1f2d2a;
  }

  #contPanelHeader .media-state.state-neutral {
    background-color: #f1c40f;
    color: #2c3e50;
  }

  #contPanelHeader .media-state.state-bad {
    background-color: #e74c3c;
    color: #fff;
  }

  #contPanelHeader span {
    background-color: #2ecc71;
    color: #2c3e50;
    display: inline-block;
    padding: ${margins};
    margin: 0 ${margins};
    border-radius: 4px;
    font-weight: bold;
  }

  /* Show dimensions as blue when the displayed area is less than or equal to 100% */
  #video-controlPanel #dimensions-as-a-percentage.within-100 {
    background-color: #3498db;
  }

  #contPanelHeader .content-change-pulse {
    animation: contentChangePulse 320ms ease-out;
  }

  @keyframes contentChangePulse {
    0% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(236, 240, 241, 0);
    }
    35% {
      transform: scale(1.08);
      box-shadow: 0 0 0 4px rgba(236, 240, 241, 0.18);
    }
    100% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(236, 240, 241, 0);
    }
  }

  #spanPlaybackPercentage {
    background-color: #f1c40f !important;
    color: #2c3e50 !important;
  }

  #spanTimeSavedSoFar.time-saved-badge {
    background-color: #3498db !important;
    color: #ecf0f1 !important;
  }

  .controlRow, .buttonsRow {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    margin: ${margins} 0;
  }

  #video-controlPanel :is(.numinp, button, .button) {
    background-color: #3498db;
    border: none;
    color: #fff;
    padding: ${margins};
    margin: ${margins};
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
  }

  #video-controlPanel :is(.numinp:hover, button:hover, .button:hover) {
    background-color: #2980b9;
  }

  #video-controlPanel input[type="text"] {
    min-width: 280px;
    background-color: #3498db;
    border: none;
    color: #fff;
    padding: ${margins};
    margin: ${margins};
    border-radius: 4px;
  }

  #video-controlPanel input[type="text"]::placeholder {
    color: #d6eaf8;
  }

  #video-controlPanel input[type="checkbox"] {
    margin: 0 ${margins};
  }

  .vidContRange {
    display: block;
    width: 100%;
    margin: 10px 0px;
    -webkit-appearance: none;
    background: transparent;
  }

  .vidContRange::-webkit-slider-runnable-track {
    background: #3498db;
    height: 6px;
    border-radius: 3px;
  }

  .vidContRange::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 18px;
    height: 18px;
    background: #ecf0f1;
    border: 2px solid #3498db;
    border-radius: 50%;
    margin-top: -6px;
    cursor: pointer;
  }

  .vidContRange:focus {
    outline: none;
  }

  .vidContRange:focus::-webkit-slider-runnable-track {
    background: #2980b9;
  }

  .track-indicator {
    display: none;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: visible;
    min-width: 30px;
    min-height: 30px;
  }

  .track-indicator::after {
    content: attr(data-track-count);
    position: absolute;
    top: -4px;
    right: -6px;
    min-width: 18px;
    height: 18px;
    padding: 0 4px;
    border-radius: 50%;
    background: #2ecc71;
    border: 1px solid #ecf0f1;
    box-shadow: 0 0 0 1px rgba(44, 62, 80, 0.7);
    z-index: 3;
    opacity: 0;
    transform: scale(0.6);
    transition: opacity 0.2s ease, transform 0.2s ease;
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: bold;
    color: #1f2d2a;
    line-height: 1;
  }

  #track-indicator-text.track-indicator-text-available::after,
  #track-indicator-audio.track-indicator-audio-available::after,
  #track-indicator-video.track-indicator-video-available::after {
    opacity: 1;
    transform: scale(1);
  }

  /* Show the whole button only when availability threshold is met */
  #track-indicator-text.track-indicator-text-available,
  #track-indicator-audio.track-indicator-audio-available,
  #track-indicator-video.track-indicator-video-available {
    display: inline-flex;
  }
`;
