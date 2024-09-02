( async function () {
  'use strict'

  $( 'a[title]' ).attr( 'title', '' )

  if ( location.href.includes( '/videos/' ) ) {


    const fpplay = await waitFor( 'a.fp-play' )
    fpplay.click()
    const videoElement = await waitFor( 'video' )
    videoElement.addEventListener( 'loadedmetadata', async ( event ) => {
      event.target.pause()
      if ( !!document.querySelector( `#slotsDiv` ).children.length )
        return
      const storyboard = await prepareStoryboard( $storyBoard[ 0 ], document, null, videoElement, 'flex' )
      storyboard.scrollIntoView()
    } )

    let $storyBoard = $( `<div></div>` )
    $( '.block-video' ).after( $storyBoard )

    const storyboard = await prepareStoryboard( $storyBoard[ 0 ], document, null, videoElement, 'flex' )
    storyboard.scrollIntoView()

    //* Related videos

    // const relatedItems = document.querySelectorAll( `.list-videos .item` )
    // lazyLoad( async item => {
    //   const itemLink = item.querySelector( 'a' ).href
    //   const $relatedItemSbParent = $( `<div id=relItemSbP></div>` ).insertAfter( item )
    //   const tempDoc = await GMXmlHttpRequest( itemLink )
    //   try {
    //     prepareStoryboard( $relatedItemSbParent[ 0 ], tempDoc, itemLink, null, 'toggleable', item )

    //   } catch ( error ) {
    //     console.log( error )
    //   }
    // }, ...relatedItems )

    document.querySelectorAll( `.list-videos .item` ).forEach( async item => {

      const itemLink = item.querySelector( 'a' ).href
      const $relatedItemSbParent = $( `<div id=relItemSbP></div>` ).insertAfter( item )
      const tempDoc = await GMXmlHttpRequest( itemLink )
      try {
        prepareStoryboard( $relatedItemSbParent[ 0 ], tempDoc, itemLink, null, 'toggleable', item )

      } catch ( error ) {
        console.log( error )
      }
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

  function prepareStoryboard ( parent, scriptSource, linkToVid, videoElement, sbFunction, thisEl ) {

    let scriptEl
    if ( scriptSource.querySelectorAll( 'script[type="text/javascript"]' )[ 2 ] )
      scriptEl = scriptSource.querySelectorAll( 'script[type="text/javascript"]' )[ 2 ]
    else
      scriptEl = scriptSource.querySelectorAll( 'script[type="text/javascript"]' )[ 1 ]
    // GM_setClipboard( scriptEl.innerHTML )

    let frequencyPer = scriptEl.innerHTML.match( /timeline_screens_interval: '(\d+)'/ )[ 1 ]

    const nOfSlotMatch = scriptEl.innerHTML.match( /timeline_screens_count: '(\d+)'/ )
    let nOfSlots
    if ( nOfSlotMatch )
      nOfSlots = nOfSlotMatch[ 1 ]
    else if ( videoElement )
      nOfSlots = videoElement.duration / frequencyPer
    else {
      const durationString = thisEl.querySelector( '.duration' ).textContent
      const duration = toSeconds( durationString )
      nOfSlots = duration / frequencyPer
    }
    const urlTemplate = scriptEl.innerHTML.match( /timeline_screens_url: '(.+?)'/ )[ 1 ]

    let imgUrls = []
    repeat( +nOfSlots, j => {
      const thisUrl = urlTemplate.replace( '{time}', +j + 1 )
      imgUrls.push( thisUrl )
    } )

    if ( sbFunction === 'flex' ) {
      // if ( !videoElement.duration ) return null
      return storyboard( parent, 1, 1, linkToVid, videoElement, frequencyPer, nOfSlots, ...imgUrls )
    }
    if ( sbFunction === 'toggleable' )
      return storyboardToggleable( parent, 1, 1, linkToVid, videoElement, frequencyPer, nOfSlots, ...imgUrls )

  }


} )()