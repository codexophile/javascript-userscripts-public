$( 'a[title]' ).attr( 'title', '' )

let siteName = location.origin
let stupidString
switch ( siteName ) {
  default:
    // case 'https://www.gayhardfuck.com':
    // case 'https://www.yesgay.xyz':
    stupidString = 'timeline'
    break
  case 'https://www.onlygayvideo.com':
    stupidString = 'timelinescreenshots'
    break
}

let mainStructure = `<div id='storyBoard'></div>`
if ( location.href.includes( '/videos/' ) ) {

  $( '.block-video' ).after( mainStructure )

  waitFor( 'a.fp-play' ).then( ( el ) => {
    el.click()
  } )

  waitFor( 'video' ).then( ( el ) => {
    $( el ).on( 'durationchange', function ( el ) {
      proceed( el )
    } )
  } )

}

//* loading storyboards for related videos
const $items = $( `#list_videos_related_videos_items > .item` )

return
lazyLoad( ( item ) => {

  const $item = $( item )
  const duration = getDuration( $item )
  const linkToVid = $item.find( 'a' )[ 0 ].href
  const sbParent = $( `<div></div>` ).insertAfter( item )

  GM_xmlhttpRequest( {
    method: 'GET',
    url: linkToVid,
    responseType: 'document',
    onload: function ( response ) {
      const resText = response.responseText
      const tempDoc = generateDoc( resText )
      const baseUrl = tempDoc.querySelector( '[property="og:image"]' ).content
      let nOfFrames = Math.ceil( duration / 15 )
      const allUrls = []
      repeat( nOfFrames + 1, k => {
        let imgPath = baseUrl.replace( 'preview.mp4', `timelines/${ stupidString }/150x120/${ k }` )
        allUrls.push( imgPath )
      } )
      storyboardHorizontal( sbParent, 1, 1, linkToVid, null, 15, nOfFrames, ...allUrls )
    }
  } )

}, ...$items )


//// $( '.item .img' ).each( function( e ) { loadPreview( this ) } )
// related videos section
$( '.item .img' ).on( 'mousemove', function ( e ) {

  loadPreview( this )
  let $thisElement = $( this )
  let $metaEl = $thisElement.find( 'meta' )
  var parentOffset = $( this ).parent().offset()
  var relX = e.pageX - parentOffset.left
  let rightBound = $( this ).parent()[ 0 ].getBoundingClientRect().width
  let nOfFrames = $metaEl.attr( 'frames' )
  let val = Math.ceil( relX / rightBound * nOfFrames )
  let $image = $thisElement.find( '#deepContent img#' + val )
  $image.css( 'display', 'unset' )
  $image.parent().append( $image )

} )

function getDuration ( $el ) {
  let duration = $el.find( '.duration' ).text()
  var a = duration.split( ':' )
  duration = 0
  for ( let j = a.length; j > 0; j-- )
    duration += ( a[ j - 1 ] ) * Math.pow( 60, a.length - j )
  return duration
}

function loadPreview ( element ) {

  let $thisElement = $( element )
  if ( !$thisElement.find( '#deepContent' ).length ) {

    let deeperLink = $thisElement.parent().attr( 'href' )
    $thisElement.append( '<div id=deepContent style="width:100%"></div>' )
    let $deepDiv = $thisElement.find( '#deepContent' )

    $deepDiv.load( deeperLink + ' [property="og:image"]', function () {

      $metaElement = $deepDiv.find( 'meta' )
      URLSegment = $metaElement[ 0 ].content.match( /videos_screenshots\/(\d+)\// )[ 1 ]

      duration = getDuration( $thisElement )

      let nOfFrames = Math.ceil( duration / 15 )

      $metaElement.attr( 'segment', URLSegment )
      $metaElement.attr( 'duration', duration )
      $metaElement.attr( 'frames', nOfFrames )

      let urlPart1 = `${ siteName }/contents/videos_screenshots/`
      let urlPart3 = `/timelines/${ stupidString }/150x120/`
      let videoID = $thisElement.parent().attr( 'href' ).match( /videos\/(\d+)\// )[ 1 ]

      repeat( nOfFrames + 1, k => {
        let imgPath = urlPart1 + URLSegment + '/' + videoID + urlPart3 + k + '.jpg'
        $deepDiv.append( '<img id="' + k + '" style="display:none; position:absolute; width:100%; top:-21%" src=' + imgPath + '></img>' )
      } )

    } )

  }

}

function proceed ( el ) {

  let videoElement = el.target
  let $storyBoard = $( '#storyBoard' )
  let frequencyPer = $( 'script[type="text/javascript"]' )[ 2 ].innerHTML.match( /timeline_screens_interval: '(\d+)'/ )[ 1 ]
  let nOfSlots = Math.ceil( videoElement.duration / frequencyPer )
  let videoID = location.href.match( /videos\/(\d+)\// )[ 1 ]
  let urlSegment = $( '[property="og:image"]' )[ 0 ].content.match( /videos_screenshots\/(\d+)\// )[ 1 ]
  let imgUrls = []
  repeat( nOfSlots + 1, j => {
    const thisUrl = `${ siteName }/contents/videos_screenshots/${ urlSegment }/${ videoID }/timelines/${ stupidString }/150x120/${ j }.jpg`
    imgUrls.push( thisUrl )
  } )
  storyboard( $storyBoard[ 0 ], 1, 1, null, videoElement, frequencyPer, nOfSlots, ...imgUrls )
  console.log( 'after' )

  $storyBoard[ 0 ].scrollIntoView()

}

function waitFor ( selector ) {

  return new Promise( ( resolve ) => {

    if ( document.querySelector( selector ) ) {
      return resolve( document.querySelector( selector ) )
    }

    const observer = new MutationObserver( ( mutations ) => {
      if ( document.querySelector( selector ) ) {
        resolve( document.querySelector( selector ) )
        observer.disconnect()
      }
    } )

    observer.observe( document.body, {
      childList: true,
      subtree: true,
    } )

  } )

}