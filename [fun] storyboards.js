function playVideo ( videoEl, total, index ) {
  videoEl.scrollIntoView();
  const duration = videoEl.duration;
  videoEl.currentTime = ( duration / total ) * index;
  videoEl.play();
}

function setSlotScale ( sbParent, scaleFactor ) {

  const originalWidth = sbParent.querySelector( 'canvas' ).width;
  const originalHeight = sbParent.querySelector( 'canvas' ).height;

  sbParent.querySelectorAll( 'canvas, .storyboardItem' ).forEach( function ( canvas ) {
    canvas.style.width = ( originalWidth * scaleFactor ) + 'px';
    canvas.style.height = ( originalHeight * scaleFactor ) + 'px';
  } );

}

function setSlotSize ( sbParent, newWidth ) {

  const originalWidth = sbParent.querySelector( 'canvas' ).width;
  const originalHeight = sbParent.querySelector( 'canvas' ).height;
  const scale = newWidth / originalWidth;
  const newHeight = originalHeight * scale;

  sbParent.querySelectorAll( 'canvas, .storyboardItem' ).forEach( function ( el ) {
    el.style.width = newWidth + 'px';
    el.style.height = newHeight + 'px';
    // el.style.width = ( originalWidth * scaleFactor ) + 'px';
    // el.style.height = ( originalHeight * scaleFactor ) + 'px';
  } );

}

async function sbControls ( video, trueNoOfSlots, sbParent, imgUrls ) {

  const collapsible = await Collapsible();

  if ( video ) {

    collapsible.collapsibleContent.querySelectorAll( '.storyboardControl' ).forEach(
      item => item.remove()
    );

    collapsible.addButton( '🔙', null, async () => {
      const targetEl = [ ...sbParent.querySelectorAll( '.wentPast' ) ].pop();
      targetEl.scrollIntoView( { behavior: 'instant', block: 'center' } );
      await asyncTimeout( 250 );
      await blink( targetEl, 250, 2 );
      // @ts-ignore
    } ).classList.add( 'storyboardControl' );

    collapsible.addButton( '💠', null, () => {
      const isHidden = sbParent.style.display === 'none';
      sbParent.style.display = isHidden ? 'block' : 'none';
      sbParent.scrollIntoView( { block: isHidden ? 'start' : 'center' } );
      // @ts-ignore
    } ).classList.add( 'storyboardControl' );

    const imgUrlsPopupEl = collapsible.addPopup();
    const imgUrlsListEl = generateElements( `<ol></ol>`, imgUrlsPopupEl );
    imgUrls.forEach( ( url, index ) => {
      generateElements( `
                <li>
                    <a href="${ url }" target="_blank">${ index }</a>
                </li>
            `, imgUrlsListEl );
    } );
    collapsible.addButton( '🌆', imgUrlsPopupEl ).classList.add( 'storyboardControl' );

    if ( video.readyState > 0 ) jumpToSlot();
    video.addEventListener( 'loadeddata', jumpToSlot );
    video.addEventListener( 'loadeddata', addTimeStrings );

    video.addEventListener( 'timeupdate', () => {
      const duration = video.duration;
      const currentSlotNo = Math.round( ( video.currentTime * trueNoOfSlots ) / duration );
      const storyboardItems = sbParent.querySelectorAll( '.storyboardItem' );
      setHash( `slot=${ currentSlotNo }` );

      storyboardItems.forEach( ( item, index ) => {
        if ( index <= currentSlotNo ) {
          item.classList.add( 'wentPast' );
          item.style.border = '3px solid red';
        } else {
          item.classList.remove( 'wentPast' );
          item.style.border = '3px solid white';
        }
      } );
    } );

    function addTimeStrings () {
      const slotEls = sbParent.querySelectorAll( '.storyboardItem' );
      repeat( trueNoOfSlots, ( index ) => {
        const timeStringEl = generateElements( `<div></div>`, slotEls[ index ] );
        timeStringEl.classList.add( 'timeString' );
        timeStringEl.textContent = `${ Math.round( ( index * video.duration ) / trueNoOfSlots ) }`;
        style( timeStringEl, `
            color: white;
            background-color: black;
            width: fit-content;
            position: relative;
            top: -15%;
            left: 5%;
        `);
      } );
    }

  }
  else {

  }

  // calculateWidthAndExpand( collapsibleEl );

  function jumpToSlot () {
    const matches = location.hash.match( /#slot=(\d+?)($|#)/ );
    if ( !matches ) return;

    addHistoryEntry( location.href.replace( location.hash, '' ) );
    const slotNo = matches[ 1 ];
    if ( slotNo ) playVideo( video, trueNoOfSlots, slotNo );
  };


}

async function storyboard ( {
  storyboardParent,
  horizontal,
  vertical,
  linkToVid = null,
  vidOnPage,
  samplingFq = null,
  trueNoOfSlots,
  imgUrls = [],
  offset = 0
} ) {

  const slotsDiv = document.createElement( 'div' );
  storyboardParent.append( slotsDiv );
  slotsDiv.id = 'slotsDiv';
  slotsDiv.style.display = 'flex';
  slotsDiv.style.flexWrap = 'wrap';
  slotsDiv.style.justifyContent = 'space-evenly';

  if ( !imgUrls.length ) alert( 'imgUrls: Error!' );

  const promises = imgUrls.map( ( url, index ) =>
    storyboardFlex( horizontal, vertical, url, index, trueNoOfSlots )
  );

  // @ts-ignore
  const results = await Promise.allSettled( promises );
  let index = 0;

  results.forEach( result => {
    result.value.forEach( slot => {
      slotsDiv.append( slot );
      slot.index = index;
      if ( linkToVid ) {
        const link = wrap( `<a></a>`, slot.querySelector( 'canvas' ) );
        // @ts-ignore
        link.href = `${ linkToVid }#slot=${ index }`;
        // @ts-ignore
        link.target = '_blank';
        // @ts-ignore
        Object.assign( link.style, {
          display: 'block',
          width: '100%',
          height: '100%',
          top: '0px',
          left: '0px',
        } );
      }

      slot.addEventListener( 'click', ev => {
        const samplingFreq =
          samplingFq ||
          ( vidOnPage.duration / trueNoOfSlots ) ||
          ( vidOnPage.duration / ( horizontal * vertical ) );
        // const samplingFreq = samplingFq || ( vidOnPage.duration / ( horizontal * vertical ) );
        const newTime = ( ev.target.closest( 'div' ).index + offset ) * samplingFreq;
        vidOnPage.currentTime = newTime;
        vidOnPage.play();
        vidOnPage.scrollIntoView( { behavior: 'instant', block: 'center' } );
      } );
      index++;
    } );
  } );

  setSlotSize( storyboardParent, '200' );
  sbControls( vidOnPage, trueNoOfSlots, storyboardParent, imgUrls );
  return slotsDiv;
}

async function storyboardToggleable ( {
  storyboardParent,
  horizontal,
  vertical,
  linkToVid = null,
  vidOnPage,
  samplingFq = null,
  trueNoOfSlots,
  imgUrls = [],
  maxHeight = '80vh', // Added default value for maxHeight
} ) {
  const slotsDiv = await storyboard( {
    storyboardParent,
    horizontal,
    vertical,
    linkToVid,
    vidOnPage,
    samplingFq,
    trueNoOfSlots,
    imgUrls,
  } );

  Object.assign( slotsDiv.style, {
    maxWidth: '90vw',
    maxHeight, // Using the optional maxHeight parameter
    overflow: 'auto',
  } );

  return slotsDiv;
}

async function storyboardFlex ( horizontal, vertical, imgSrc, index, trueNoOfSlots ) {

  let imgElement;
  try {
    imgElement = GM_addElement( document.body, 'img', { src: imgSrc } );
  } catch ( error ) {
    console.log( error );
    imgElement = generateElements( `<img>`, document.body );
    imgElement.src = imgSrc;
  }

  imgElement.style.display = 'none';
  document.body.appendChild( imgElement );

  // @ts-ignore
  const promise = new Promise( ( resolve, reject ) => {
    imgElement.onload = () => {
      const allSlots = [];
      const normalTotal = horizontal * vertical;
      const noOfSlotsRemaining = trueNoOfSlots - ( index * normalTotal );
      const thisIsFinalSb = noOfSlotsRemaining < normalTotal;

      if ( thisIsFinalSb ) vertical = Math.ceil( noOfSlotsRemaining / horizontal );

      const total = horizontal * vertical;
      const itemWidth = imgElement.naturalWidth / horizontal;
      const itemHeight = imgElement.naturalHeight / vertical;

      for ( let i = 0; i < total; i++ ) {
        const storyboardItem = document.createElement( 'div' );
        storyboardItem.classList.add( imgSrc.slice( -7 ), 'storyboardItem' );
        allSlots.push( storyboardItem );

        const x = i % horizontal;
        const y = Math.floor( i / horizontal );

        const canvas = document.createElement( 'canvas' );
        const ctx = canvas.getContext( '2d' );
        // Set canvas dimensions
        canvas.width = itemWidth;
        canvas.height = itemHeight;
        // Draw the part of the image into the canvas
        ctx.drawImage(
          imgElement,
          x * itemWidth, y * itemHeight, // Source x, y
          itemWidth, itemHeight,          // Source width, height
          0, 0,                              // Destination x, y
          canvas.width, canvas.height         // Destination width, height
        );
        storyboardItem.append( canvas );

        Object.assign( storyboardItem.style, {
          backgroundColor: 'black',
          textShadow: 'white 0px 0px 10px',
          // backgroundImage: `url('${ imgElement.src }')`,
          // backgroundPosition: `${ -x * itemWidth }px ${ -y * itemHeight }px`,
          width: `${ itemWidth }px`,
          // minWidth: `${ itemWidth }px`,
          height: `${ itemHeight }px`,
          margin: '1px',
          border: 'solid white',
        } );
      }

      resolve( allSlots );
      imgElement.remove();
    };

    imgElement.onerror = () => {
      console.log( `Storyboard image load error!: ${ imgSrc }` );
      const errorEl = document.createElement( 'div' );
      errorEl.textContent = 'Image load error';
      Object.assign( errorEl.style, {
        color: 'red',
        fontSize: '20px',
      } );
      resolve( [ errorEl ] );
      imgElement.remove();
    };
  } );

  return await promise;
}
