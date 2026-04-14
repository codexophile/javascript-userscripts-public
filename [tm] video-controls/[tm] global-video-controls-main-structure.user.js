const htmlStructure = `
  <div class="controlPanel" id="video-controlPanel">
    <div id="contPanelHeader" class=important>
      <button class="head important" title="Cycle panel view (compact/full/header-only)">⚫</button>
      <span id="frame-rate-display" class=important></span>
      <span id="bitrate-display" class=important></span>
      <span class="divHeight text important">x</span>
      <span id="spanPlaybackPercentage" class="text" title="Playback progress percentage">0%</span>
      <span id="spanCurrentTime" class="text"></span>
      <span id="spanRemainingTime" class="text">x</span>
      <span id="spanActualRemainingTime" class="text">x</span>
    </div>
    
    <div class="controlRow">
      <input type="number" title="Speed" step="0.1" min="0.1" max="4" class="numinp" id="speedDisp" value="1">
      <input type="number" title="Volume" step="0.001" class="numinp" id="volDisp">
      <input type="range" class="slidSpeedFin important vidContRange" min="0.1" max="4" step="0.1" value="1">
      <button id="muteButton" for="volDisp">🔊</button>
      <input type="checkbox" title="Auto Switch" id="cbAutoSwitch">
      <input type="checkbox" title="Auto Hide (header-only on mouse leave)" id="cbAutoHide">
      <input type="checkbox" title="Pause video when the tab loses focus, the browser is minimized, or focus moves away" id="cbAutoPauseOnBlur">
    </div>

    <div class="controlRow important" title="Subtitle auto-speed: selector present = normal speed, selector absent = fast speed.">
      <input type="checkbox" title="Enable subtitle auto-speed mode" id="cbSubtitleAutoSpeed">
      <input type="number" title="Fast speed used when subtitle selector is not present" step="0.1" min="0.1" max="16" class="numinp" id="numAutoFastSpeed" value="3">
      <input type="text" title="CSS selector for subtitle element. If selector exists in DOM => normal speed, otherwise fast speed." id="inputSubtitleSelector" placeholder="Subtitle selector (example: .ytp-caption-segment)">
      <span id="autoSpeedState" class="text important" title="Current subtitle auto-speed state">AUTO OFF</span>
    </div>
      
    <div class="buttonsRow important">
      <button class="important" id="buttonPlay">▶</button> 
      <button class="important" id="speedToggle">💨</button>
      <button class="important" id="rewind-btn">0️⃣</button>
      <button class="timejumpLTwo">➖</button> 
      <button class="timejumpLOne important">➖</button> 
      <button class="timejumpROne important">➕</button> 
      <button class="timejumpRTwo">➕</button>
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
      <button id="buttonPiP" title="Picture in Picture">📺</button>
      <button id="buttonFullScreen" title="Full Screen">⛶</button>
      <button id="buttonRotateL">⭯</button>
      <button id="buttonRotateR">⭮</button>
    </div>

    <input type="range" class="slidVolFin important vidContRange" min="0" max="0.25" step="0.001">
    <input type="range" class="slidVolExt important vidContRange" min="0.25" max="1" step="0.001" style="display: none;" title="Extended volume (0.25 to 1)">
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
    font-size: small;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
  }

  #contPanelHeader span {
    background-color: #2ecc71;
    color: #2c3e50;
    padding: ${margins};
    margin: 0 ${margins};
    border-radius: 4px;
    font-weight: bold;
  }

  #spanPlaybackPercentage {
    background-color: #f1c40f !important;
    color: #2c3e50 !important;
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

  #autoSpeedState {
    display: inline-flex;
    align-items: center;
    white-space: nowrap;
    background-color: #95a5a6 !important;
    color: #fff !important;
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
`;
