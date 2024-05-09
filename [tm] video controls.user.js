( function () {
  'use strict'
  console.log( 'test' )

  let initiated = false

  let timeIncrTiny = 6 / 160
  let timeIncrSmall = 5
  let timeIncrLarge = 60
  let currentVideo
  let defaultSpeed = 3

  document.addEventListener( "keyup", keyboardEvent, false )

  return
  waitFor( 'video' ).then( () => { videoEventListeners() } )

  setInterval( () => {

    let videosAll = $( 'video' )
    if ( videosAll.length == 0 ) { $( '.controlPanel' ).fadeOut(); return } // 🛑
    $( 'video[poster="data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA="]' ).remove() // gets rid of the video element added by imagus extension

    if ( currentVideo && getActiveVideo() != currentVideo ) {
      currentVideo.pause()
      videoEventListeners() // ❔ this adds eventlisteners to all the video elements. fix this if superfluous.
      $( '.controlPanel' ).fadeIn()
      initializeToolbar()
    }

    currentVideo = getActiveVideo()       //🔥

    if ( location.host === 'www.tiktok.com'
      && currentVideo
      && currentVideo.offsetHeight
      && ( currentVideo.offsetHeight < 250 || currentVideo.offsetWidth < 250 ) ) {

      if ( !$( currentVideo ).parent().hasClass( 'speedManual' ) ) currentVideo.playbackRate = defaultSpeed

      let controlPanel = $( '.controlPanel' )[ 0 ]
      if ( controlPanel ) {

        let currentVideoVPOffset = currentVideo.getBoundingClientRect()
        let controlPanelTop = currentVideoVPOffset.top - controlPanel.offsetHeight

        if ( controlPanelTop < 0 ) { $( controlPanel ).css( 'top', currentVideoVPOffset.bottom ) }
        else { $( controlPanel ).css( 'top', controlPanelTop ) }
        $( controlPanel ).css( 'left', currentVideoVPOffset.left )

      }
    }

    if ( initiated ) return // 🛑

    // if( currentVideo ) currentVideo.volume = 0.1
    addToolbar()
    initiated = true

  }, 100 )

  $( window ).on( "resize scroll", function () {
    if ( !currentVideo ) return // 🛑
    if ( !$( currentVideo ).isInViewport() ) { currentVideo.pause(); return }
  } )

  function addToolbar () {

    if ( $( `#video-controlPanel` ).length ) { $( `#video-controlPanel` ).fadeIn(); return } // 🛑

    let controlPanel = GM_addElement( document.body, 'div' )
    controlPanel.outerHTML = `
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
        transition      : left 0.5s, top 0.5s;
        border-radius   : 2px;
    ">

      <button class="butClose important" style="
        position: absolute;
        top     : 0px;
        right   : 0px;
      ">❌  </button>

      <span class="divHeight text" > x </span>
      <span class="divStatus text" > x </span>
      <span id=spanCurrentTime class="text" ></span>
      <span class=important> | </span>
      <span id=spanRemainingTime       class="text" >x</span>
      <span class=important> | </span>
      <span id=spanActualRemainingTime class="text" >x</span>

      <div class=important style="display: flex">
        <input type="number" title="Speed"  step="0.1"   class="numinp" id="speedDisp">
        <input type="number" title="Volume" step="0.001" class="numinp" id="volDisp">
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
        <a      id=copySrc0 title=Page  class="important button" href=${ location.href } > 🗄 </a>
        <button id=copySrc1 class=btsrc title=Src       > 🗄 </button>
        <button id=copySrc2 class=brsrc title=CurrentSrc> 🗄 </button>
        <button id=copyItemUrl  title='Copy URL of this item' class=important> 🖇️ </button>
      </div>
      <div class="buttonsRow important">
        <button id=buttonScroll title=Scroll into view  >                 📍 </button>
        <button id=buttonLog    title=Log video element to the console  > 📜 </button>
        <button id=buttonResize title=Resize >                            ↕  </button>
        <button id=frameStepL   title='Frame step' >                      ⇠ </button>
        <button id=frameStepR   title='Frame step' >                      ⇢ </button>
        <button id="buttonSnap" title="Snap">                            📷 </button>
      </div>

      <input type="range" class="slidVolFin important" min="0" max="0.25" step="0.001">
      <input type="range" id=progress class=important  min="0" max="100"  step="0.001" vlaue=0>

    </div>
    `
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

    input[type=range] {
      width: 100%;
      background-color: transparent;
      -webkit-appearance: none;
    }
    input[type=range]:focus {
      outline: none;
    }
    input[type=range]::-webkit-slider-runnable-track {
      background: #3071a9;
      border: 1.1px solid #010101;
      border-radius: 25px;
      width: 100%;
      height: 10px;
      cursor: pointer;
    }
    input[type=range]::-webkit-slider-thumb {
      margin-top: -1.1px;
      width: 15px;
      height: 10px;
      background: #ffffff;
      border: 1px solid #000000;
      border-radius: 50px;
      cursor: pointer;
      -webkit-appearance: none;
    }
    input[type=range]:focus::-webkit-slider-runnable-track {
      background: #367ebd;
    }
    input[type=range]::-moz-range-track {
      background: #3071a9;
      border: 1.1px solid #010101;
      border-radius: 25px;
      width: 100%;
      height: 10px;
      cursor: pointer;
    }
    input[type=range]::-moz-range-thumb {
      width: 15px;
      height: 10px;
      background: #ffffff;
      border: 1px solid #000000;
      border-radius: 50px;
      cursor: pointer;
    }
    input[type=range]::-ms-track {
      background: transparent;
      border-color: transparent;
      border-width: 1px 0;
      color: transparent;
      width: 100%;
      height: 10px;
      cursor: pointer;
    }
    input[type=range]::-ms-fill-lower {
      background: #2a6495;
      border: 1.1px solid #010101;
      border-radius: 50px;
    }
    input[type=range]::-ms-fill-upper {
      background: #3071a9;
      border: 1.1px solid #010101;
      border-radius: 50px;
    }
    input[type=range]::-ms-thumb {
      width: 15px;
      height: 10px;
      background: #ffffff;
      border: 1px solid #000000;
      border-radius: 50px;
      cursor: pointer;
      margin-top: 0px;
      /*Needed to keep the Edge thumb centred*/
    }
    input[type=range]:focus::-ms-fill-lower {
      background: #3071a9;
    }
    input[type=range]:focus::-ms-fill-upper {
      background: #367ebd;
    }
    @supports (-ms-ime-align:auto) {
      /* Pre-Chromium Edge only styles, selector taken from hhttps://stackoverflow.com/a/32202953/7077589 */
      input[type=range] {
        margin: 0;
        /*Edge starts the margin from the thumb, not the track as other browsers do*/
      }
    }

    ` )

    let $controlPanel = $( `.controlPanel` )
    $controlPanel.find( ':not(.important)' ).hide()
    $controlPanel.draggable()
    $controlPanel.on( 'mousedown', function () { $controlPanel.css( `transition`, `unset` ) } )
    $controlPanel.on( 'mouseup', function () { $controlPanel.css( `transition`, `left 0.5s, top 0.5s` ) } )

    $( 'span.text' ).css( 'color', 'unset !important' )

    let volumeSlider = $( '.slidVolFin' )[ 0 ]
    let volumeDisplay = $( '#volDisp' )[ 0 ]


    $( '.head' ).on( 'click', function () { $controlPanel.find( ':not(.important)' ).toggle() } )
    $( '.butClose' ).on( 'click', function () { $controlPanel.fadeOut() } )
    $( '#speedToggle' ).on( 'click', function () { speedToggle() } )
    $( `#muteButton` ).on( 'click', function () {
      let activeVideo = getActiveVideo()
      activeVideo.muted = !activeVideo.muted
    } )

    $( `#progress` ).on( 'input', function () {
      let currentVideo = getActiveVideo()
      currentVideo.currentTime = this.value / 100 * currentVideo.duration
    } )
    $( `#progress` ).on( 'mousedown', function () {
      if ( getActiveVideo().paused ) return
      togglePlayPause()
    } )
    $( `#progress` ).on( 'mouseup', togglePlayPause )

    volumeSlider.oninput = function () {
      getActiveVideo().volume = parseFloat( parseFloat( this.value ) )
      volumeDisplay.value = this.value
    }
    $( '#buttonPlay' ).click( function () { togglePlayPause() } )

    $( '.timejumpLOne' ).on( 'click', function () { getActiveVideo().currentTime -= timeIncrSmall } )
    $( '.timejumpROne' ).on( 'click', function () { getActiveVideo().currentTime += timeIncrSmall } )
    $( '.timejumpLTwo' ).on( 'click', function () { getActiveVideo().currentTime -= timeIncrLarge } )
    $( '.timejumpRTwo' ).on( 'click', function () { getActiveVideo().currentTime += timeIncrLarge } )
    $( `#frameStepL` ).on( 'click', function () {
      video = getActiveVideo()
      video.pause()
      video.currentTime -= timeIncrTiny
    } )
    $( `#frameStepR` ).on( 'click', function () {
      video = getActiveVideo()
      video.pause()
      video.currentTime += timeIncrTiny
    } )

    $( '#buttonResize' ).on( 'click', function () {
      video = getActiveVideo()
      if ( video.videoHeight ) video.style.height = `${ video.videoHeight }px`
    } )
    $( '#buttonScroll' ).on( 'click', function () { getActiveVideo().scrollIntoView() } )
    $( '#buttonLog' ).on( 'click', function () { console.log( getActiveVideo() ) } )
    $( '#copySrc0' ).on( 'click', function () { GM_setClipboard( location.href ); return false } )
    if ( getActiveVideo()?.src != getActiveVideo()?.currentSrc )
      $( '#copySrc1' ).on( 'click', function () { GM_setClipboard( getActiveVideo().src ) } )
    $( '#copySrc2' ).on( 'click', function () { GM_setClipboard( getActiveVideo().currentSrc ) } )
    $( '#copySrc2' ).on( 'mousedown', function ( e ) {
      e.preventDefault()
      if ( e.button == 1 ) { // middle mouse button
        tab = GM_openInTab( getActiveVideo().currentSrc )
        tab.close()
      }
    } )
    $( '#copyItemUrl' ).on( 'click', function () {
      videoEl = getActiveVideo()
      $linkEl = $( videoEl ).closest( 'a' )
      itemHref = $linkEl.attr( 'href' )
      GM_setClipboard( itemHref )
    } )

    $( `#buttonSnap` ).on( 'click', function () {

      video = getActiveVideo()
      var canvas = document.createElement( "canvas" )
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      var canvasContext = canvas.getContext( "2d" )
      canvasContext.drawImage( video, 0, 0 )
      imageUrl = canvas.toDataURL( 'image/png' ).replace( "image/png", "image/octet-stream" )

      link = $( `<a></a>` )[ 0 ]
      let fileName = document.title ? document.title : location.href
      link.setAttribute( 'download', `${ fileName }.png` )
      link.setAttribute( 'href', imageUrl )
      link.click()

    } )

    $( '#speedDisp' ).on( 'change', function () { getActiveVideo().playbackRate = this.value } )

    initializeToolbar()

  }

  function initializeToolbar () {

    if ( !( video = getActiveVideo() ) ) return // 🛑

    $( '.slidVolFin' )[ 0 ].value = video.volume
    $( '#volDisp' )[ 0 ].value = video.volume
    $( '#speedDisp' )[ 0 ].value = video.playbackRate
    $( '.divHeight' ).text( video.videoHeight )

  }

  function getActiveVideo () {

    let videos = document.getElementsByTagName( "video" )
    let count = videos.length
    let videosInVP = []

    if ( count == 1 ) return videos[ 0 ] // 🛑

    for ( var j = 0; j <= count; j++ )
      if ( videos[ j ] && $( videos[ j ] ).isInViewport() ) videosInVP.push( videos[ j ] )
    if ( videosInVP.length == 1 ) return videosInVP[ 0 ] // 🛑

    for ( let k = 0; k <= videosInVP.length - 1; k++ )
      if ( !videosInVP[ k ].paused ) return videosInVP[ k ] // 🛑

  }

  function videoEventListeners () {

    let $videos = $( 'video' )

    $videos.on( 'playing', function () {
      titler( "[media playing]" )
      $( '[style="padding: 0px; margin: 3px 3px 20px; background: padding-box padding-box rgb(248, 248, 255); border: 3px solid rgba(242, 242, 242, 0.6); border-radius: 2px; box-shadow: rgb(102, 102, 102) 0px 0px 2px; visibility: visible; display: block; z-index: 2147483647; inset: 163.5px auto auto 292.5px; width: 206px; height: 330px; position: fixed !important; box-sizing: content-box !important; max-width: none !important; max-height: none !important;"]' ).fadeOut()
      // $( '#speedDisp' ).value = getActiveVideo().playbackRate
    } )

    $videos.on( 'timeupdate', () => {

      let video = getActiveVideo()
      if ( !video ) return // 🛑
      $( '#progress.important' ).val( video.currentTime / video.duration * 100 )

      $( '[style="padding: 0px; margin: 3px 3px 20px; background: padding-box padding-box rgb(248, 248, 255); border: 3px solid rgba(242, 242, 242, 0.6); border-radius: 2px; box-shadow: rgb(102, 102, 102) 0px 0px 2px; visibility: visible; display: block; z-index: 2147483647; inset: 163.5px auto auto 292.5px; width: 206px; height: 330px; position: fixed !important; box-sizing: content-box !important; max-width: none !important; max-height: none !important;"]' ).fadeOut()

      duration = video.duration
      currentTime = video.currentTime
      if ( !duration && !currentTime ) { $( '#spanRemainingTime' ).fadeOut(); return } // 🛑

      $( '#spanRemainingTime' ).fadeIn()
      $( '#spanCurrentTime' ).fadeIn()

      remainingTime = Math.round( duration - currentTime )
      readable = forHumans( remainingTime )
      $( '#spanRemainingTime' ).text( readable )
      $( '#spanCurrentTime' ).text(
        forHumans(
          Math.round(
            currentTime ) ) )

      if ( video.playbackRate == 1 ) { $( '#spanActualRemainingTime' ).fadeOut(); return } // 🛑
      $( '#spanActualRemainingTime' ).fadeIn()
      actualRemainingTime = Math.round( ( duration - currentTime ) / video.playbackRate )
      readableActual = forHumans( actualRemainingTime )
      $( '#spanActualRemainingTime' ).text( readableActual )

    } )
    $videos.on( 'ratechange', () => { $( '#speedDisp' ).val( getActiveVideo()?.playbackRate ) } )
    $videos.on( 'volumechange', () => { if ( getActiveVideo() ) $( '#volDisp' ).val( getActiveVideo().volume ) } )
    $videos.on( 'pause', () => { titler( "[media  paused]" ) } )
    $videos.on( 'waiting', () => { titler( "[media waiting]" ) } )
    $videos.on( 'stalled', () => { titler( "[media stalled]" ) } )
    $videos.on( 'loadedmetadata', () => {
      if ( !( video = getActiveVideo() ) ) return
      $video = $( video )
      $( '.divHeight' ).text( video.videoHeight )
      if ( video.src != video.currentSrc ) $( '.btsrc' ).css( 'color', 'green' )
    } )
    $videos.on( 'ended', function () { if ( location.host === 'www.tiktok.com' ) speedToggle() } )

  }

  function titler ( text ) {
    $( '.divStatus' ).text( text )
    if ( document.getElementById( 'cbAutoSwitch' )?.checked )
      document.title = text
  }

  function keyboardEvent ( e ) {
    console.log( 'keyboard event' )

    let activeElementType = document.activeElement.tagName.toLowerCase()
    if ( activeElementType === 'input' ) return // 🛑

    let videoElement = getActiveVideo()

    if ( e.keyCode == 74 ) {
      // j
      videoElement.currentTime = videoElement.currentTime - timeIncrSmall
    }
    if ( e.keyCode == 76 ) {
      // l
      videoElement.currentTime = videoElement.currentTime + timeIncrSmall
    }
    if ( e.code == 'KeyZ' ) {
      speedToggle()
    }
    if ( e.keyCode === 88 ) {
      // x
      videoElement.playbackRate = videoElement.playbackRate - 0.5
    }
    if ( e.keyCode === 67 ) {
      // c
      videoElement.playbackRate = videoElement.playbackRate + 0.5
    }
    if ( e.code === "KeyM" ) {
      videoElement.muted = !videoElement.toggleAttribute( "muted" )
    }
    if ( e.code === "KeyB" ) {
      videoElement.volume -= 0.01
    }
    if ( e.code === "KeyN" ) {
      videoElement.volume += 0.01
    }
    if ( e.shiftKey && e.code === "KeyB" ) {
      videoElement.volume -= 0.001
    }
    if ( e.shiftKey && e.code === "KeyN" ) {
      videoElement.volume += 0.001
    }
    if ( e.shiftKey && e.code === "KeyM" ) {
      videoElement.muted = false
      videoElement.volume = 0.5
    }

  }

  function speedToggle () {
    let videoElement = getActiveVideo()
    if ( videoElement.playbackRate == 1 ) {
      videoElement.playbackRate = defaultSpeed
    } else {
      videoElement.playbackRate = 1
    }
    $( videoElement ).parent().addClass( 'speedManual' )
  }

  function togglePlayPause () {

    let curVid = getActiveVideo()
    curVid.paused ? curVid.play() : curVid.pause()

  }

} )()