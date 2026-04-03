const htmlStructure = `
  <div class="controlPanel" id="video-controlPanel">
    <div id="contPanelHeader" class=important>
      <span id="frame-rate-display" class=important></span>
      <span id="bitrate-display" class=important></span>
      <span class="divHeight text important">x</span>
      <span id="spanCurrentTime" class="text"></span>
      <span id="spanRemainingTime" class="text">x</span>
      <span id="spanActualRemainingTime" class="text">x</span>
      <button class="butClose important">❌</button>
    </div>
    
    <div class="controlRow">
      <input type="number" title="Speed" step="0.1" min="0.1" max="4" class="numinp" id="speedDisp" value="1">
      <input type="number" title="Volume" step="0.001" class="numinp" id="volDisp">
      <input type="range" class="slidSpeedFin important vidContRange" min="0.1" max="4" step="0.1" value="1">
      <button id="muteButton" for="volDisp">🔊</button>
      <input type="checkbox" title="Auto Switch" id="cbAutoSwitch">
    </div>
      
    <div class="buttonsRow important">
      <button class="head important">⚫</button>
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
      <button id="buttonGenSb">📸</button>
      <button id="buttonPiP" title="Picture in Picture">📺</button>
      <button id="buttonFullScreen" title="Full Screen">⛶</button>
      <button id="buttonRotateL">⭯</button>
      <button id="buttonRotateR">⭮</button>
    </div>

    <input type="range" class="slidVolFin important vidContRange" min="0" max="0.25" step="0.001">
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
  }

  #contPanelHeader span {
    background-color: #2ecc71;
    color: #2c3e50;
    padding: ${margins};
    margin: 0 ${margins};
    border-radius: 4px;
    font-weight: bold;
  }

  .butClose {
    position: absolute;
    top: 5px;
    right: 5px;
    background: none;
    border: none;
    color: #e74c3c;
    cursor: pointer;
    font-size: 16px;
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

  #video-controlPanel input[type="checkbox"] {
    margin: 0 ${margins};
  }

  .vidContRange {
    width: 100%;
    margin: ${margins} 0;
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
