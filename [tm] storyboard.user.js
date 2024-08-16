( async function () {
  'use strict'

  $( 'a[title]' ).attr( 'title', '' )

  if ( location.href.includes( '/videos/' ) ) {


    const fpplay = await waitFor( 'a.fp-play' )
    fpplay.click()
    const videoElement = await waitFor( 'video' )

    let $storyBoard = $( `<div></div>` )
    $( '.block-video' ).after( $storyBoard )

    const storyboard = await prepareStoryboard( $storyBoard[ 0 ], document, null, videoElement, 'flex' )
    storyboard.scrollIntoView()

    //* Related videos

    const relatedVideos = document.querySelectorAll( `.list-videos .item` ).forEach( async item => {

      const itemLink = item.querySelector( 'a' ).href
      const $relatedItemSbParent = $( `<div id=relItemSbP></div>` ).insertAfter( item )
      const tempDoc = await GMXmlHttpRequest( itemLink )
      prepareStoryboard( $relatedItemSbParent[ 0 ], tempDoc, itemLink, null, 'toggleable' )

    } )

  }
  else {

    document.querySelectorAll( `.list-videos .item` ).forEach( async item => {

      const itemLink = item.querySelector( 'a' ).href
      const $relatedItemSbParent = $( `<div id=relItemSbP></div>` ).insertAfter( item )
      const tempDoc = await GMXmlHttpRequest( itemLink )
      prepareStoryboard( $relatedItemSbParent[ 0 ], tempDoc, itemLink, null, 'toggleable' )

    } )

  }

  function prepareStoryboard ( parent, scriptSource, linkToVid, videoElement, sbFunction ) {

    let scriptEl
    if ( scriptSource.querySelectorAll( 'script[type="text/javascript"]' )[ 2 ] )
      scriptEl = scriptSource.querySelectorAll( 'script[type="text/javascript"]' )[ 2 ]
    else
      scriptEl = scriptSource.querySelectorAll( 'script[type="text/javascript"]' )[ 1 ]

    let frequencyPer = scriptEl.innerHTML.match( /timeline_screens_interval: '(\d+)'/ )[ 1 ]
    let nOfSlots = scriptEl.innerHTML.match( /timeline_screens_count: '(\d+)'/ )[ 1 ]
    const urlTemplate = scriptEl.innerHTML.match( /timeline_screens_url: '(.+?)'/ )[ 1 ]

    let imgUrls = []
    repeat( +nOfSlots, j => {
      const thisUrl = urlTemplate.replace( '{time}', +j + 1 )
      imgUrls.push( thisUrl )
    } )

    if ( sbFunction === 'flex' )
      return storyboard( parent, 1, 1, linkToVid, videoElement, frequencyPer, nOfSlots, ...imgUrls )
    if ( sbFunction === 'toggleable' )
      return storyboardToggleable( parent, 1, 1, linkToVid, videoElement, frequencyPer, nOfSlots, ...imgUrls )

  }


} )()