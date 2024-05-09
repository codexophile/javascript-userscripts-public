$.fn.isInViewport = function () {

  if ( !$( this ).offset() ) return // 🛑
  var elementTop = $( this ).offset().top
  var elementBottom = elementTop + $( this ).outerHeight()

  var viewportTop = $( window ).scrollTop()
  var viewportBottom = viewportTop + $( window ).height()

  return elementBottom > viewportTop && elementTop < viewportBottom

}

function makeDraggable ( elmnt ) {

  // $( elmnt ).addClass( 'noAutoPosition' )
  var pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0

  if ( $( elmnt ).find( '.head' )[ 0 ] ) {
    // if present, the header is where you move the DIV from:
    $( elmnt ).find( '.head' )[ 0 ].onmousedown = dragMouseDown
  } else {
    // otherwise, move the DIV from anywhere inside the DIV:
    elmnt.onmousedown = dragMouseDown
  }
  // if (document.getElementById( elmnt.id + "header") ) {
  //   // if present, the header is where you move the DIV from:
  //   document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
  // } else {
  //   // otherwise, move the DIV from anywhere inside the DIV:
  //   elmnt.onmousedown = dragMouseDown;
  // }

  function dragMouseDown ( e ) {
    e = e || window.event
    $( e.path[ 1 ] ).css( 'transition', 'unset' )
    e.preventDefault()
    // get the mouse cursor position at startup:
    pos3 = e.clientX
    pos4 = e.clientY
    document.onmouseup = closeDragElement( e )
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag
  }

  function elementDrag ( e ) {
    e = e || window.event
    e.preventDefault()
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX
    pos2 = pos4 - e.clientY
    pos3 = e.clientX
    pos4 = e.clientY
    // set the element's new position:
    elmnt.style.top = elmnt.offsetTop - pos2 + "px"
    elmnt.style.left = elmnt.offsetLeft - pos1 + "px"
  }

  function closeDragElement ( e ) {
    // stop moving when mouse button is released:
    document.onmouseup = null
    document.onmousemove = null
    $( e.path[ 1 ] ).css( 'transition', 'left 0.5s, top 0.5s' )
  }
}

function getTextNodesIn ( el ) {
  return $( el ).find( ":not(iframe)" ).addBack().contents().filter( function () {
    return this.nodeType == 3
  } )
}

function createStoryboard ( horizontal, vertical, imgSrc, videoElement = null, imageMode = false, multipleImages = 0 ) {

  if ( imageMode ) {

    let $imgElement = $( imgSrc )
    $imgElement.css( `max-width`, `80vw` )
    $imgElement.on( 'click', ( event ) => {
      console.log( event.clientX, event.clientY )
      console.log( event.ofsetX, event.ofsetY )
      console.log( event.pageX, event.pageY )
      console.log( event.screenX, event.screenY )
    } )
    return imgSrc

  }

  let total, width, height

  let $main = $( '<div id=sbMain></div>' )
  const $controlsContainer = $( `<div id=controlsContainer></div>` ).appendTo( $main )
  const $container = $( `<div id=storyboard></div>` ).appendTo( $main ).css( `flex-wrap`, `wrap` ).css( `display`, `flex` )
  const $srollBackBtn = $( `<button> 🔙 </button>` ).on( 'click', () => {
    $container.find( '.wentPast' ).last()[ 0 ].scrollIntoView()
  } )
  const $imgSource = $( `<a href=${ imgSrc } target=_blank> SB src </a>` )
  const $copyBtn = $( `<button> Copy </button>` ).on( 'click', () => { navigator.clipboard.writeText( $imgSource.attr( 'href' ) ) } )
  const $inputBox = $( `<input type=text></input>` )
  const $inputBoxH = $( `<input type=text></input>` )
  const $inputBoxV = $( `<input type=text></input>` )
  const $applyButton = $( `<button> Apply </button>` ).on( 'click', () => {
    flushAndFill( $inputBoxH[ 0 ].value, $inputBoxV[ 0 ].value, $inputBox[ 0 ].value )
  } )
  $controlsContainer.append( $srollBackBtn, $imgSource, $copyBtn, $inputBox, $inputBoxH, $inputBoxV, $applyButton )
  video = videoElement ? $( videoElement )[ 0 ] : $( 'video' )[ 0 ]
  video.addEventListener( 'loadeddata', ( event ) => {
    const urlParams = new URLSearchParams( window.location.search )
    const slotNo = urlParams.get( 'slot' )
    if ( slotNo ) playVideo( video, total, slotNo )
  } )

  if ( !imgSrc ) return $main

  flushAndFill( horizontal, vertical, imgSrc )

  function flushAndFill ( horizontal, vertical, imgSrc ) {
    $container.children().remove()
    const imgEl = $( `<img src=${ imgSrc }>` )[ 0 ]
    imgEl.addEventListener( 'load', () => {

      total = horizontal * vertical
      repeat( total, () => { $container.append( `<div class=storyboardItem></div>` ) } )

      width = imgEl.naturalWidth
      height = imgEl.naturalHeight

      itemWidth = width / horizontal
      itemHeight = height / vertical

      $storyboardItems = $container.children()
      $storyboardItems.css( `background-image`, `url('${ imgSrc }')` )

      $storyboardItems.each( function ( index ) {

        x = index % horizontal
        y = Math.floor( index / vertical )

        xPosition = width - itemWidth * x
        yPosition = height - itemHeight * y

        $this = $( this )
        $this.data( 'index', index )
        $this.css( `background-position`, `${ xPosition }px ${ yPosition }px` )
        $this.on( 'click', function () { playVideo( video, total, index ) } )

      } )

      $storyboardItems.css( `width`, `${ itemWidth }` )
      $storyboardItems.css( `height`, `${ itemHeight }` )
      $storyboardItems.css( `margin`, `1px` )
      $storyboardItems.css( `border`, `solid` ).css( `border-color`, `white` )

      $container[ 0 ].scrollIntoView()
    } )
    video.addEventListener( 'timeupdate', () => {
      const duration = video.duration
      const currentSlotNo = Math.round( video.currentTime * total / duration )
      for ( let index = 0; index <= currentSlotNo; index++ ) {
        $storyboardItems[ index ].classList.add( 'wentPast' )
        $storyboardItems[ index ].style.border = '3px solid red'
      }
      for ( let index = currentSlotNo + 1; index <= total - 1; index++ ) {
        $storyboardItems[ index ].classList.remove( 'wentPast' )
        $storyboardItems[ index ].style.border = '3px solid white'
      }
    } )
  }

  function setBgDims () {

  }

  $controlSize = $( `<input type=range min=0 max=5 value=1 step=0.1>` )
  $controlSize.appendTo( $controlsContainer )
  $controlSize.on( 'input', function () {

    // $storyboardItems.css( `transform`, `scale(${ this.value })` )
    $storyboardItems.css( `width`, `${ this.value * itemWidth }` )
    $storyboardItems.css( `height`, `${ this.value * itemHeight }` )
    $storyboardItems.css( `background-size`, `${ this.value * width }px, ${ this.value * height }px` )

  } )


  return $main

}
function createStoryboardNew ( horizontal, vertical, imgElement, videoElement = null, imageMode = false, multipleImages = 0 ) {

  let $container = $( '<div id=storyboard></div>' ).css( `flex-wrap`, `wrap` ).css( `display`, `flex` )

  for ( let index = 0; index <= multipleImages; index++ ) {

    total = horizontal * vertical
    repeat( total, () => { $container.append( `<div class=storyboardItem></div>` ) } )

    width = imgElement.naturalWidth
    height = imgElement.naturalHeight

    itemWidth = width / horizontal
    itemHeight = height / vertical

    $storyboardItems = $container.children()
    $storyboardItems.css( `background-image`, `url(${ imgElement.src })` )

    video = videoElement ? $( videoElement )[ 0 ] : $( 'video' )[ 0 ]

    $storyboardItems.each( function ( index ) {

      x = index % horizontal
      y = Math.floor( index / vertical )

      xPosition = width - itemWidth * x
      yPosition = height - itemHeight * y

      $this = $( this )
      $this.data( 'index', index )
      $this.css( `background-position`, `${ xPosition }px ${ yPosition }px` )

      $this.on( 'click', function () {
        video.scrollIntoView()
        duration = video.duration
        //// video.play()
        if ( location.href.includes( 'dood' ) )
          video.currentTime = duration / total * ( index )
        else
          video.currentTime = duration / total * ( index )
      } )

    } )

    $storyboardItems.css( `width`, `${ itemWidth }` )
    $storyboardItems.css( `height`, `${ itemHeight }` )
    $storyboardItems.css( `margin`, `1px` )
    $storyboardItems.css( `border`, `solid` ).css( `border-color`, `white` )

    $controlSize = $( `<input type=range min=0 max=5 value=1 step=0.1>` )
    $controlSize.prependTo( $container )
    $controlSize.on( 'input', function () {

      $storyboardItems.css( `transform`, `scale(${ this.value })` )
      $storyboardItems.css( `width`, `${ this.value * itemWidth }` )
      $storyboardItems.css( `height`, `${ this.value * itemHeight }` )

    } )

  }

  // $controlSize_ = $( `<input type=range min=0 max=1000 value=1>` )
  // $controlSize_.prependTo( $container )
  // $controlSize_.on( 'input', function() {
  //     document.title = this.value
  //     $storyboardItems.css( `background-size`, `${this.value}%` )
  //     // $storyboardItems.css( `background-size`, `${this.value/itemWidth*100}%` )
  // } )

  return $container

}