( function () {
  'use strict'

  let activeVideo
  const fastSpeed = 3

  let observer = new MutationObserver( () => {
    activeVideo = getActiveVideo()
  } )
  observer.observe( document.body, { childList: true, subtree: true } )

  document.addEventListener( "keyup", keyboardEvent, false )

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

  function speedToggle () {
    if ( activeVideo.playbackRate == 1 ) {
      activeVideo.playbackRate = fastSpeed
    } else {
      activeVideo.playbackRate = 1
    }
    // $( activeVideo ).parent().addClass( 'speedManual' )
  }

  function getActiveVideo () {

    const videos = document.querySelectorAll( "video" )
    const count = videos.length
    let videosInVP = []
    let activeVideo

    if ( count == 1 )
      activeVideo = videos[ 0 ] // 🛑

    videos.forEach( video => {
      video.style.outline = ''
      if ( video && isElementInViewport( video ) )
        videosInVP.push( video )
    } )

    if ( videosInVP.length == 1 )
      activeVideo = videosInVP[ 0 ] // 🛑

    videosInVP.forEach( video => {
      if ( !video.paused )
        activeVideo = video // 🛑
    } )

    if ( activeVideo ) {
      // activeVideo.style.outline = 'solid red'
      return activeVideo
    }

  }

} )()