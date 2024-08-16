( async function () {
  'use strict'

  let activeVideo
  const fastSpeed = 3
  let timeIncrTiny = 6 / 160
  let timeIncrSmall = 5
  let timeIncrLarge = 60

  let controlPanel, vidProgressEl, speedDispEl, volDispEl, slidVolFinEl, divHeightEl

  new MutationObserver( main ).observe( document.body, { childList: true, subtree: true } )
  document.addEventListener( 'scroll', main )
  document.addEventListener( "keyup", keyboardEvent, false )

  async function main () {

    activeVideo = getActiveVideo()
    const vidContPanel = document.querySelector( `#video-controlPanel` )

    if ( activeVideo && !vidContPanel ) {
      addToolbar()
      const collapsibleCont = await waitFor( '#collapsibleContent' )
      generateToolbarButton( '📹', collapsibleCont, null, () => { fadeToggle( document.querySelectorAll( `#video-controlPanel` ), 2500 ) } )
    }
    if ( !activeVideo && vidContPanel )
      vidContPanel.style.display = 'none'
    else if ( vidContPanel )
      vidContPanel.style.display = ''

    if ( activeVideo ) {
      videoEventListeners( activeVideo )
      initializeToolbar()
    }

  }

  function addToolbar () {

    controlPanel = generateElements( `
    <div
      class="controlPanel"
      id="video-controlPanel"
      style="
        position        : fixed;
        top             : 100px;
        left            : 10px;
        width           : fit-content;
        z-index         : 100000;
        background-color: grey;
        transition      : left 0.5s, top 0.5s, opacity 0.2s;
        border-radius   : 2px;
    ">

      <div id='contPanelHeader' class=important style='
        width: 100%;
        height: 20px;
        background-color: #14855a;
      '>
        <span class="divHeight text" > x </span>
        <span id=spanCurrentTime class="text" ></span>
        <span class=important> | </span>
        <span id=spanRemainingTime       class="text" >x</span>
        <span class=important> | </span>
        <span id=spanActualRemainingTime class="text" >x</span>
      </div>
    
      <button class="butClose important" style="
        position: absolute;
        top     : 0px;
        right   : 0px;
      ">❌  </button>
      
      <div class=important style="display: flex">
        <input type="number" title="Speed"  step="0.1"   class="numinp" id="speedDisp">
        <input type="number" title="Volume" step="0.001" class="numinp" id="volDisp" style="width: 60px">
          <button id=muteButton for="volDisp"  >🔊</button>
          <input type="checkbox" title="Auto Switch"                    id="cbAutoSwitch">
      </div>
        
      <div class="buttonsRow important">
        <button class="head important">          ⚫</button>
        <button class=important id="buttonPlay">  ▶ </button> 
        <button class=important id=speedToggle > 💨 </button>
        <button class="timejumpLTwo">            ➖ </button> 
        <button class="timejumpLOne important">  ➖ </button> 
        <button class="timejumpROne important">  ➕ </button> 
        <button class="timejumpRTwo">            ➕ </button> 
        <a      id=copyPageUrl title=Page  class="important button" href=${ location.href } > 📄 </a>
        <button id=copyVidSrc class=brsrc title=CurrentSrc> 🎞️ </button>
      </div>
      <div class="buttonsRow important">
        <button id=buttonScroll title=Scroll into view  >                 📍 </button>
        <button id=buttonLog    title=Log video element to the console  > 📜 </button>
        <button id=buttonResize title=Resize >                            ↕  </button> 
        <button id=frameStepL   title='Frame step' >                      ⇠ </button> 
        <button id=frameStepR   title='Frame step' >                      ⇢ </button> 
        <button id="buttonSnap" title="Snap">                            📷 </button>
      </div>

      <input type="range" class="slidVolFin important vidContRange" min="0" max="0.25" step="0.001">
      <input type="range" id=progress class="important vidContRange"  min="0" max="100"  step="0.001" value=0>

    </div>
    ` )
    GM_addStyle( `

    .controlPanel        { opacity: 0.5; transition: 0.2s }
    .controlPanel:hover  { opacity: 1   }

    input[type=range]    { width  : -webkit-fill-available; margin-top : 1.5px; margin-bottom: 1.5px }
  
    .buttonsRow          { flex-wrap: wrap; display: flex     }
    .buttonsRow button   {
      margin    : 2px;
      box-sizing: border-box
    }
    input[type=number]   { width : 4em                        }
    .button,
    .controlPanel button { width : 30px; height: 30px         } 
    .controlPanel *      { font-size: small                   }

    /* Range controls*/

    input.vidContRange[type=range] {
      width: 100%;
      background-color: transparent;
      -webkit-appearance: none;
    }
    input.vidContRange[type=range]:focus {
      outline: none;
    }
    input.vidContRange[type=range]::-webkit-slider-runnable-track {
      background: #3071a9;
      border: 1.1px solid #010101;
      border-radius: 25px;
      width: 100%;
      height: 10px;
      cursor: pointer;
    }
    input.vidContRange[type=range]::-webkit-slider-thumb {
      margin-top: -1.1px;
      width: 15px;
      height: 10px;
      background: #ffffff;
      border: 1px solid #000000;
      border-radius: 50px;
      cursor: pointer;
      -webkit-appearance: none;
    }
    input.vidContRange[type=range]:focus::-webkit-slider-runnable-track {
      background: #367ebd;
    }
    input.vidContRange[type=range]::-moz-range-track {
      background: #3071a9;
      border: 1.1px solid #010101;
      border-radius: 25px;
      width: 100%;
      height: 10px;
      cursor: pointer;
    }
    input.vidContRange[type=range]::-moz-range-thumb {
      width: 15px;
      height: 10px;
      background: #ffffff;
      border: 1px solid #000000;
      border-radius: 50px;
      cursor: pointer;
    }
    input.vidContRange[type=range]::-ms-track {
      background: transparent;
      border-color: transparent;
      border-width: 1px 0;
      color: transparent;
      width: 100%;
      height: 10px;
      cursor: pointer;
    }
    input.vidContRange[type=range]::-ms-fill-lower {
      background: #2a6495;
      border: 1.1px solid #010101;
      border-radius: 50px;
    }
    input.vidContRange[type=range]::-ms-fill-upper {
      background: #3071a9;
      border: 1.1px solid #010101;
      border-radius: 50px;
    }
    input.vidContRange[type=range]::-ms-thumb {
      width: 15px;
      height: 10px;
      background: #ffffff;
      border: 1px solid #000000;
      border-radius: 50px;
      cursor: pointer;
      margin-top: 0px;
      /*Needed to keep the Edge thumb centred*/
    }
    input.vidContRange[type=range]:focus::-ms-fill-lower {
      background: #3071a9;
    }
    input.vidContRange[type=range]:focus::-ms-fill-upper {
      background: #367ebd;
    }
    /*TODO: Use one of the selectors from https://stackoverflow.com/a/20541859/7077589 and figure out
    how to remove the virtical space around the range input.vidContRange in IE*/
    @supports (-ms-ime-align:auto) {
      /* Pre-Chromium Edge only styles, selector taken from hhttps://stackoverflow.com/a/32202953/7077589 */
      input.vidContRange[type=range] {
        margin: 0;
        /*Edge starts the margin from the thumb, not the track as other browsers do*/
      }
    }
    
    ` )

    document.body.append( controlPanel )
    controlPanel.querySelectorAll( ':not(.important)' ).forEach( item => { item.style.display = 'none' } )

    const contPanelHeader = controlPanel.querySelector( '#contPanelHeader' )
    vidProgressEl = controlPanel.querySelector( `#progress` )
    speedDispEl = controlPanel.querySelector( '#speedDisp' )
    volDispEl = controlPanel.querySelector( '#volDisp' )
    slidVolFinEl = controlPanel.querySelector( `.slidVolFin` )
    divHeightEl = controlPanel.querySelector( '.divHeight' )

    dragElement( controlPanel, contPanelHeader )
    contPanelHeader.addEventListener( 'mousedown', () => { controlPanel.style.transition = 'unset' } )
    contPanelHeader.addEventListener( 'mouseup', () => { controlPanel.style.transition = 'left 0.5s, top 0.5s, opacity 0.2s' } )

    controlPanel.querySelector( '.butClose' ).addEventListener( 'click', () => { fadeOut( controlPanel, 250 ) } )
    controlPanel.querySelector( '.head' ).addEventListener( 'click', () => { toggle( controlPanel.querySelectorAll( ':not(.important)' ) ) } )
    controlPanel.querySelector( '#speedToggle' ).addEventListener( 'click', () => { speedToggle() } )
    controlPanel.querySelector( '#buttonPlay' ).addEventListener( 'click', () => { togglePlayPause() } )

    vidProgressEl.addEventListener( 'input', ( e ) => { activeVideo.currentTime = e.target.value / 100 * activeVideo.duration } )
    slidVolFinEl.addEventListener( 'input', ( e ) => { activeVideo.volume = parseFloat( parseFloat( e.target.value ) )/* ; volumeDisplay.value = this.value */ } )

    controlPanel.querySelector( '.timejumpLOne' ).addEventListener( 'click', () => { activeVideo.currentTime -= timeIncrSmall } )
    controlPanel.querySelector( '.timejumpROne' ).addEventListener( 'click', () => { activeVideo.currentTime += timeIncrSmall } )
    controlPanel.querySelector( '.timejumpLTwo' ).addEventListener( 'click', () => { activeVideo.currentTime -= timeIncrLarge } )
    controlPanel.querySelector( '.timejumpRTwo' ).addEventListener( 'click', () => { activeVideo.currentTime += timeIncrLarge } )

    controlPanel.querySelector( `#muteButton` ).addEventListener( 'click', function () { activeVideo.muted = !activeVideo.muted } )
    controlPanel.querySelector( `#frameStepL` ).addEventListener( 'click', () => { frameStep( 'left' ) } )
    controlPanel.querySelector( `#frameStepR` ).addEventListener( 'click', () => { frameStep( 'right' ) } )
    controlPanel.querySelector( '#buttonResize' ).addEventListener( 'click', () => { if ( activeVideo.videoHeight ) activeVideo.style.height = `${ activeVideo.videoHeight }px` } )
    controlPanel.querySelector( '#buttonScroll' ).addEventListener( 'click', () => { activeVideo.scrollIntoView() } )
    controlPanel.querySelector( '#buttonLog' ).addEventListener( 'click', () => { console.log( activeVideo ) } )
    controlPanel.querySelector( '#copyPageUrl' ).addEventListener( 'click', ( e ) => { e.preventDefault(); GM_setClipboard( location.href ); return false } )
    controlPanel.querySelector( '#copyVidSrc' ).addEventListener( 'click', ( e ) => { GM_setClipboard( activeVideo.currentSrc ) } )
    controlPanel.querySelector( `#buttonSnap` ).addEventListener( 'click', () => { snap() } )

    speedDispEl.addEventListener( 'change', ( e ) => { activeVideo.playbackRate = e.target.value } )
    volDispEl.addEventListener( 'change', ( e ) => { activeVideo.volume = e.target.value } )

    return controlPanel

    $( 'span.text' ).css( 'color', 'unset !important' )


    $( `#progress` ).on( 'mousedown', function () {
      if ( getActiveVideo().paused ) return
      togglePlayPause()
    } )
    $( `#progress` ).on( 'mouseup', togglePlayPause )

    //?pppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppp

    initializeToolbar()

  }

  function initializeToolbar () {

    slidVolFinEl.value = video.volume
    volDispEl.value = video.volume
    speedDispEl.value = video.playbackRate
    divHeightEl.textContent = video.videoHeight

  }

  function titler ( text ) {
    if ( document.getElementById( 'cbAutoSwitch' )?.checked )
      document.title = text
  }

  function videoEventListeners ( video ) {

    if ( video.classList.contains( 'video-processed' ) ) return // 🛑

    video.addEventListener( 'playing', () => { titler( "[media playing]" ) } )
    video.addEventListener( 'pause', () => { titler( "[media  paused]" ) } )
    video.addEventListener( 'waiting', () => { titler( "[media waiting]" ) } )
    video.addEventListener( 'stalled', () => { titler( "[media stalled]" ) } )


    video.addEventListener( 'timeupdate', ( event ) => {

      if ( activeVideo != event.target ) return // 🛑

      vidProgressEl.value = video.currentTime / video.duration * 100

      const duration = video.duration
      const currentTime = video.currentTime

      const spanRemainingTime = document.querySelector( '#spanRemainingTime' )
      const spanCurrentTime = document.querySelector( '#spanCurrentTime' )
      const spanActualRemTime = document.querySelector( `#spanActualRemainingTime` )

      fadeIn( spanRemainingTime )
      fadeIn( spanCurrentTime )

      const remainingTime = Math.round( duration - currentTime )
      const readable = forHumans( remainingTime )
      spanRemainingTime.textContent = readable
      spanCurrentTime.textContent = forHumans( Math.round( currentTime ) )

      if ( video.playbackRate == 1 ) { fadeOut( spanActualRemTime ); return } // 🛑
      fadeIn( spanActualRemTime )
      const actualRemainingTime = Math.round( ( duration - currentTime ) / video.playbackRate )
      const readableActual = forHumans( actualRemainingTime )
      spanActualRemTime.textContent = readableActual

    } )

    video.addEventListener( 'ratechange', ( event ) => { speedDispEl.value = event.target.playbackRate } )
    video.addEventListener( 'volumechange', ( event ) => {
      volDispEl.value = event.target.volume
      slidVolFinEl.value = event.target.volume
    } )

    video.classList.add( 'video-processed' )

  }

  function snap () {

    const canvas = generateElements( '<canvas></canvas>', document.body )
    canvas.width = activeVideo.videoWidth
    canvas.height = activeVideo.videoHeight
    const canvasContext = canvas.getContext( "2d" )
    canvasContext.drawImage( activeVideo, 0, 0 )
    const imageUrl = canvas.toDataURL( 'image/png' ).replace( "image/png", "image/octet-stream" )
    console.log( imageUrl )

    const link = generateElements( '<a></a>', document.body )
    const fileName = document.title ? document.title : location.href
    link.setAttribute( 'download', `${ fileName }.png` )
    link.setAttribute( 'href', imageUrl )
    link.click()

    canvas.remove()
    link.remove()

  }

  function keyboardEvent ( e ) {

    let activeElementType = document.activeElement.tagName.toLowerCase()
    if ( activeElementType === 'input' ) return // 🛑

    if ( !activeVideo ) {
      console.log( 'No activeVideo' )
      return // 🛑
    }

    if ( e.key == 'j' ) {
      activeVideo.currentTime = activeVideo.currentTime - timeIncrSmall
    }
    if ( e.key == 'l' ) {
      activeVideo.currentTime = activeVideo.currentTime + timeIncrSmall
    }
    if ( e.key == 'z' ) {
      console.log( activeVideo )
      speedToggle()
    }
    if ( e.key === 'x' ) {
      activeVideo.playbackRate = activeVideo.playbackRate - 0.5
    }
    if ( e.key === 'c' ) {
      activeVideo.playbackRate = activeVideo.playbackRate + 0.5
    }
    if ( e.key === "m" ) {
      activeVideo.muted = !activeVideo.toggleAttribute( "muted" )
    }
    if ( e.code === "KeyB" ) {
      activeVideo.volume -= 0.01
    }
    if ( e.code === "KeyN" ) {
      activeVideo.volume += 0.01
    }
    if ( e.shiftKey && e.code === "KeyB" ) {
      activeVideo.volume -= 0.001
    }
    if ( e.shiftKey && e.code === "KeyN" ) {
      activeVideo.volume += 0.001
    }
    if ( e.shiftKey && e.code === "KeyM" ) {
      activeVideo.muted = false
      activeVideo.volume = 0.5
    }

  }

  function togglePlayPause () {
    activeVideo.paused ? activeVideo.play() : activeVideo.pause()
  }

  function speedToggle () {
    if ( activeVideo.playbackRate == 1 ) {
      activeVideo.playbackRate = fastSpeed
    } else {
      activeVideo.playbackRate = 1
    }
    // $( activeVideo ).parent().addClass( 'speedManual' )
  }

  function getActiveVideo () {

    const videos = document.querySelectorAll( "video, audio" )
    let videosInVP = []
    let activeVideo

    if ( videos.length )
      activeVideo = videos[ 0 ] // 🛑

    videos.forEach( video => {
      video.style.outline = ''
      if ( video && isElementInViewport( video ) )
        videosInVP.push( video )
    } )

    // console.log( videosInVP )

    if ( videosInVP.length == 1 )
      activeVideo = videosInVP[ 0 ] // 🛑

    videosInVP.forEach( video => {
      if ( !video.paused )
        activeVideo = video // 🛑
    } )

    if ( activeVideo ) {
      activeVideo.style.outline = 'solid red'
      return activeVideo
    }

  }

  function frameStep ( direction ) {
    activeVideo.pause()
    if ( direction === 'left' )
      activeVideo.currentTime -= timeIncrTiny
    if ( direction === 'right' )
      activeVideo.currentTime += timeIncrTiny
  }

} )()