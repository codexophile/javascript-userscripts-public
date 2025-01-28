// MARK: Text functions

async function getTranslation ( text, outputLanguage = 'en', inputLanguage = 'auto', alts = 3 ) {
  return new Promise( ( resolve, reject ) => {
    GM.xmlHttpRequest( {
      method: "POST",
      url: "http://127.0.0.1:5000/translate",
      data: JSON.stringify( {
        q: text,
        source: inputLanguage,
        target: outputLanguage,
        format: "text",
        alternatives: alts,
        api_key: ""
      } ),
      headers: {
        "Content-Type": "application/json"
      },
      onload: function ( response ) {
        try {
          const jsonResponse = JSON.parse( response.responseText );
          resolve( jsonResponse );
        } catch ( error ) {
          reject( error );
        }
      },
      onerror: function ( error ) {
        reject( error );
      }
    } );
  } );
}

function convertTimeToTimezone ( timeString, sourceTimezone, targetTimezone ) {
  // Validate input
  if ( !/^\d{2}:\d{2}$/.test( timeString ) ) {
    throw new Error( 'Invalid time format. Use HH:mm (24-hour format)' );
  }

  // Parse the input time
  const [ hours, minutes ] = timeString.split( ':' ).map( Number );

  // Create a Date object in the source timezone
  const sourceDate = new Date().toLocaleString( 'en-US', { timeZone: sourceTimezone } );
  const sourceDateObj = new Date( sourceDate );
  sourceDateObj.setHours( hours, minutes, 0, 0 );

  // Convert to target timezone
  const targetTime = sourceDateObj.toLocaleString( 'en-US', {
    timeZone: targetTimezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  } );

  // Extract and format time
  const [ targetTimeString ] = targetTime.split( ',' ).reverse();
  return targetTimeString.trim();
}

function getTimezoneDateTime ( timeZone ) {
  try {
    // Validate timezone input
    if ( !timeZone || typeof timeZone !== 'string' ) {
      throw new Error( 'Invalid timezone provided' );
    }

    // Create a date object in the specified time zone
    const fullDateTime = new Date().toLocaleString( 'en-US', {
      timeZone: timeZone,
      dateStyle: 'full',
      timeStyle: 'long'
    } );

    // Get the current time in the specified time zone
    const time = new Date().toLocaleTimeString( 'en-US', {
      timeZone: timeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    } );

    // Get the current date in the specified time zone
    const date = new Date().toLocaleDateString( 'en-US', {
      timeZone: timeZone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    } );

    return {
      fullDateTime,
      time,
      date,
      timeZone
    };
  } catch ( error ) {
    throw new Error( `Unable to retrieve time for timezone ${ timeZone }. Error: ${ error.message }` );
  }
}

function toSeconds ( timeString ) {

  const a = timeString.split( ':' ).reverse();
  let seconds = 0;

  if ( +a[ 2 ] ) seconds += ( +a[ 2 ] ) * 60 * 60;
  if ( +a[ 1 ] ) seconds += ( +a[ 1 ] ) * 60;
  if ( +a[ 0 ] ) seconds += ( +a[ 0 ] );

  return seconds;

}

function toSecondsFromHMS ( hours, minutes, seconds ) {
  let outputSeconds = 0;
  if ( hours ) outputSeconds += +hours * 60 * 60;
  if ( minutes ) outputSeconds += +minutes * 60;
  if ( seconds ) outputSeconds += +seconds;
  return outputSeconds;
}

function generateUniqueString ( length ) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while ( counter < length ) {
    result += characters.charAt( Math.floor( Math.random() * charactersLength ) );
    counter += 1;
  }
  return result;
}

function downloadText ( filename, text ) {
  const dlLink = document.createElement( 'a' );
  const uriContent = `data:text/plain;charset=utf-8,${ encodeURIComponent( text ) }`;
  dlLink.href = uriContent;
  dlLink.setAttribute( 'download', filename );
  dlLink.click();
}

function capitalizeFirstLetter ( string ) {
  return string.charAt( 0 ).toUpperCase() + string.slice( 1 );
}

function forHumans ( seconds ) {
  var levels = [
    [ Math.floor( seconds / 31536000 ), 'years' ],
    [ Math.floor( ( seconds % 31536000 ) / 86400 ), 'days' ],
    [ Math.floor( ( ( seconds % 31536000 ) % 86400 ) / 3600 ), 'H' ],
    [ Math.floor( ( ( ( seconds % 31536000 ) % 86400 ) % 3600 ) / 60 ), 'm' ],
    [ ( ( ( seconds % 31536000 ) % 86400 ) % 3600 ) % 60, 's' ],
  ];
  var returnText = '';

  for ( var i = 0, max = levels.length; i < max; i++ ) {
    if ( levels[ i ][ 0 ] === 0 ) continue;
    // @ts-ignore
    returnText += ' ' + levels[ i ][ 0 ] + ' ' + ( levels[ i ][ 0 ] === 1 ? levels[ i ][ 1 ].substr( 0, levels[ i ][ 1 ].length - 1 ) : levels[ i ][ 1 ] );
  };
  return returnText.trim();
}

//#region - Style related

function getStyleOrComputedStyle ( element, property ) {
  return element.style[ property ] ? element.style[ property ] : getComputedStyle( element )[ property ];
}

function addStyle ( css ) {
  const allStyleEls = document.head.querySelectorAll( `style` );
  let alreadyExists;
  allStyleEls.forEach( styleEl => {
    if ( styleEl.innerText === css ) { alreadyExists = true; }
  } );
  if ( alreadyExists ) return; // 🛑
  const newStyleEl = generateElements( `<style>${ css }</style>`, document.head, true );
  return newStyleEl;
}

function style ( targetEl, css, debug ) {
  css
    .replaceAll( /\s{2,}/g, '' ) // gets rid of white spaces
    .split( ';' )
    .filter( line => line )  // gets rid of empty lines
    .forEach( declaration => {
      if ( debug ) console.log( declaration );
      const [ property, value ] = declaration.split( ':' );
      const propertySplit = property.split( '-' );
      const propertyLhs = propertySplit[ 0 ].toLowerCase();
      const propertyRhs = propertySplit[ 1 ] ? capitalizeFirstLetter( propertySplit[ 1 ] ) : '';
      targetEl.style[ `${ propertyLhs }${ propertyRhs }` ] = value;
    } );
}

function positionRelativeToElement ( targetEl, staticEl, x = 0, y = 0, positionProperty = 'absolute' ) {
  var rect = staticEl.getBoundingClientRect();
  style( targetEl, `
        position: ${ positionProperty };
        left: ${ rect.left + x }px;
        top: ${ rect.top + y }px;
        zIndex: 1
    `);

}

//#region Time related

function asyncTimeout ( ms ) {
  return new Promise( resolve => setTimeout( resolve, ms ) );
}

function timer ( interval = 1000, tick = null, done = null ) {

  let timerInterval;
  let timeLeft;
  let isPaused = false;

  function startTimer ( timerDuration ) {
    timeLeft = timerDuration; // Set the initial time
    isPaused = false; // Reset paused state
    timerInterval = setInterval( () => {
      if ( timeLeft <= 0 ) {
        clearInterval( timerInterval );
        done();
      } else {
        tick( timeLeft );
        timeLeft--; // Decrease time left
      }
    }, interval );
  }

  function pauseTimer () {
    if ( !isPaused ) {
      clearInterval( timerInterval ); // Stop the timer
      isPaused = true; // Set paused state
      console.log( 'Timer paused' );
    }
  }

  function resumeTimer () {
    if ( isPaused ) {
      startTimer( timeLeft ); // Resume with remaining time
      console.log( 'Timer resumed' );
    }
  }

  function updateTimer ( newDuration ) {
    clearInterval( timerInterval ); // Clear existing interval
    startTimer( newDuration ); // Start with new duration
  }

  return { startTimer, pauseTimer, resumeTimer, updateTimer };
}

//#region Functions that use Mutation Observers

function waitNotExist ( selector ) {

  return new Promise( ( resolve ) => {

    if ( !document.querySelector( selector ) ) {
      return resolve( 'at start' );
    }

    const observer = new MutationObserver( () => {
      if ( !document.querySelector( selector ) ) {
        observer.disconnect();
        return resolve( 'observer' );
      }
    } );

    observer.observe( document.body, { childList: true, subtree: true } );

  } );

}
function waitForAll ( selector ) {
  // waitFor( '[role=main]' ).then( ( els ) => {} )

  return new Promise( ( resolve ) => {

    if ( document.querySelector( selector ) ) { return resolve( document.querySelectorAll( selector ) ); }

    const observer = new MutationObserver( () => {
      if ( document.querySelector( selector ) ) {
        resolve( document.querySelectorAll( selector ) );
        observer.disconnect();
      }
    } );

    observer.observe( document.body, { childList: true, subtree: true } );

  } );

}
function waitFor ( selector ) {
  // waitFor( '[role=main]' ).then( ( el ) => {} )
  return new Promise( ( resolve ) => {
    waitForAll( selector ).then( ( els ) => { resolve( els[ 0 ] ); } );
  } );
}
function waitForNew ( selector ) {

  document.querySelectorAll( selector ).forEach( item => { item.classList.add( 'waitForNewDone' ); } );

  return new Promise( async ( resolve ) => {
    const newEl = await waitFor( `${ selector }:not(.waitForNewDone)` );
    resolve( newEl );
  } );

}
function waitForEach ( selector, callback, options = {} ) {
  // @ts-ignore
  const { timeout = 0, once = false } = options;
  const processedEls = new Set();

  function processElements () {
    document.querySelectorAll( selector ).forEach( element => {
      if ( !processedEls.has( element ) ) {
        processedEls.add( element );
        callback( element );
      }
    } );
  }

  // Initial processing
  processElements();

  // Set up the observer
  const observer = new MutationObserver( processElements );
  observer.observe( document.body, { childList: true, subtree: true } );

  // Set up the timeout if specified
  if ( timeout > 0 ) {
    setTimeout( () => observer.disconnect(), timeout );
  }

  function reload () {
    processedEls.clear();
    processElements();
  }

  return { observer, reload };
}

function eagerLoad ( selector, load, scrollableEl = window ) {

  let items = [];

  // for all the elements that exist at page load
  document.querySelectorAll( selector ).forEach( item => { items.push( item ); } );
  // for the elements that appear after page load
  let observer = new MutationObserver( ( mutations ) => {
    mutations.forEach( mutation => {
      mutation.addedNodes.forEach( item => {
        // @ts-ignore
        if ( item.nodeType === 1 && item.matches( selector ) ) items.push( item );
      } );
    } );
  } );
  observer.observe( document.body, { childList: true, subtree: true } );

  eventTrigger();
  scrollableEl.addEventListener( 'scroll', eventTrigger );
  'DOMContentLoaded load resize'.split( ' ' ).forEach( event => {
    window.addEventListener( event, eventTrigger );
  } );

  function eventTrigger () {
    items.forEach( ( item, index ) => {
      if ( item.getBoundingClientRect().top - window.innerHeight > 500 ) return; // 🛑
      items.splice( index, 1 );
      load( item );
    } );
  }

}
function lazyLoadWithObserver ( selector, load, scrollableEl = window ) {

  let items = [];

  // for all the elements that exist at page load
  document.querySelectorAll( selector ).forEach( item => { items.push( item ); } );
  console.log( selector );
  // for the elements that appear after page load
  let observer = new MutationObserver( ( mutations ) => {
    mutations.forEach( mutation => {
      mutation.addedNodes.forEach( item => {
        if ( item.nodeType === 1 && item.matches( selector ) ) {
          items.push( item );
          lazy();
        }
      } );
    } );
  } );
  observer.observe( document.body, { childList: true, subtree: true } );

  lazy();
  scrollableEl.addEventListener( 'scroll', lazy );
  'DOMContentLoaded load resize'.split( ' ' ).forEach( event => {
    window.addEventListener( event, lazy );
  } );

  function lazy () {
    items.forEach( ( item, index ) => {
      if ( !isElementInViewport( item ) ) return; // 🛑
      items.splice( index, 1 );
      load( item );
    } );
  }

}
function lazyLoad ( load, ...items ) {

  lazy();
  'DOMContentLoaded load resize scroll'.split( ' ' ).forEach( event => {
    window.addEventListener( event, lazy );
  } );

  function lazy () {
    items.forEach( ( item, index ) => {
      if ( !isElementInViewport( item ) ) return; // 🛑
      items.splice( index, 1 );
      load( item );
    } );
  }

}

//#region Rest

function getAccentColorFromFavicon () {
  return new Promise( ( resolve ) => {
    // Find the favicon
    const faviconElement = document.querySelector( "link[rel*='icon']" ) || document.createElement( 'link' );
    // @ts-ignore
    const faviconUrl = faviconElement.href || '/favicon.ico';

    // Create an image element to load the favicon
    const img = new Image();
    img.crossOrigin = "Anonymous";  // This allows us to work with images from other domains
    img.src = faviconUrl;

    img.onload = function () {
      // Create a canvas to draw the image
      const canvas = document.createElement( 'canvas' );
      const ctx = canvas.getContext( '2d' );
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage( img, 0, 0, img.width, img.height );

      // Get image data
      const imageData = ctx.getImageData( 0, 0, canvas.width, canvas.height );
      const data = imageData.data;

      // Analyze colors
      const colors = [];
      for ( let i = 0; i < data.length; i += 4 ) {
        const r = data[ i ];
        const g = data[ i + 1 ];
        const b = data[ i + 2 ];
        const a = data[ i + 3 ];

        // Skip fully transparent pixels
        if ( a === 0 ) continue;

        colors.push( { r, g, b } );
      }

      // Find the most vibrant color
      let accentColor = { r: 0, g: 0, b: 0 };
      let maxSaturation = 0;

      for ( let color of colors ) {
        // @ts-ignore
        const [ h, s, l ] = rgbToHsl( color.r, color.g, color.b );

        // Choose the color with highest saturation, avoiding too dark or too light colors
        if ( s > maxSaturation && l > 0.3 && l < 0.7 ) {
          maxSaturation = s;
          accentColor = color;
        }
      }

      resolve( `rgb(${ accentColor.r }, ${ accentColor.g }, ${ accentColor.b })` );
    };

    img.onerror = function () {
      // If favicon couldn't be loaded, return a default color
      resolve( '#000000' );
    };
  } );
}

function getAccentColor () {
  // Step 1: Extract colors from the page
  const elements = document.getElementsByTagName( '*' );
  const colors = [];

  for ( let element of elements ) {
    const style = window.getComputedStyle( element );
    const backgroundColor = style.getPropertyValue( 'background-color' );
    const color = style.getPropertyValue( 'color' );

    if ( backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)' ) {
      colors.push( backgroundColor );
    }
    if ( color ) {
      colors.push( color );
    }
  }

  // Step 2: Analyze colors to find a suitable accent color
  const uniqueColors = [ ...new Set( colors ) ];
  let accentColor = '#000000'; // Default to black
  let maxSaturation = 0;

  for ( let color of uniqueColors ) {
    const [ r, g, b ] = color.match( /\d+/g ).map( Number );
    // @ts-ignore
    const [ h, s, l ] = rgbToHsl( r, g, b );

    // Choose the color with highest saturation, avoiding too dark or too light colors
    if ( s > maxSaturation && l > 0.3 && l < 0.7 ) {
      maxSaturation = s;
      accentColor = color;
    }
  }

  return accentColor;
}

// Helper function to convert RGB to HSL
function rgbToHsl ( r, g, b ) {
  r /= 255, g /= 255, b /= 255;
  const max = Math.max( r, g, b ), min = Math.min( r, g, b );
  let h, s, l = ( max + min ) / 2;

  if ( max === min ) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / ( 2 - max - min ) : d / ( max + min );
    switch ( max ) {
      case r: h = ( g - b ) / d + ( g < b ? 6 : 0 ); break;
      case g: h = ( b - r ) / d + 2; break;
      case b: h = ( r - g ) / d + 4; break;
    }
    h /= 6;
  }

  return [ h, s, l ];
}


function copyImageToClipboard ( img ) {
  if ( navigator.clipboard && navigator.clipboard.write ) {
    // Modern method using Clipboard API
    img.crossOrigin = "anonymous";
    img.onload = function () {
      const canvas = document.createElement( 'canvas' );
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext( '2d' ).drawImage( img, 0, 0 );
      canvas.toBlob( blob => {
        navigator.clipboard.write( [
          new ClipboardItem( { 'image/png': blob } )
        ] ).then( () => {
          console.log( 'Image copied to clipboard successfully' );
        } ).catch( err => {
          console.error( 'Error copying image to clipboard:', err );
          fallbackCopyMethod( img );
        } );
      }, 'image/png' );
    };
    img.onerror = function () {
      console.error( 'Error loading image for clipboard' );
      fallbackCopyMethod( img );
    };
    // Trigger a reload to ensure we have permission to read the image data
    img.src = img.src;
  } else {
    // Fallback for browsers without Clipboard API support
    fallbackCopyMethod( img );
  }
}

function fallbackCopyMethod ( img ) {
  const canvas = document.createElement( 'canvas' );
  canvas.width = img.width;
  canvas.height = img.height;
  canvas.getContext( '2d' ).drawImage( img, 0, 0 );
  const dataURL = canvas.toDataURL( 'image/png' );
  // @ts-ignore
  GM_setClipboard( dataURL, 'text/html' );
  console.log( 'Image copied to clipboard using fallback method' );
}

function getFaviconUrl () {
  const links = document.querySelectorAll( 'link[rel~="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]' );
  if ( links.length > 0 ) {
    // @ts-ignore
    return links[ 0 ].href;
  } else {
    // Optionally return a default favicon if none is found
    return '/favicon.ico';
  }
}

function addAiImageDownloadButtons () {

}

function isIterable ( obj ) {
  // checks for null and undefined
  if ( obj == null ) {
    return false;
  }
  return typeof obj[ Symbol.iterator ] === 'function';
}




function getTextNodes ( el ) {
  let textNodes = [];
  el.childNodes.forEach( node => {
    if ( node.nodeType === Node.TEXT_NODE )
      textNodes.push( node );
  } );
  return textNodes;
}

async function load ( url, selector, parent ) {
  const html = await GMXmlHttpRequest( url, null, true );
  const doc = generateDoc( html );
  const selected = doc.querySelectorAll( selector );
  if ( parent ) {
    parent.append( selected );
  }
  return selected;
}


function GMXmlHttpRequest ( url, headers = '', returnHtml ) {

  return new Promise( ( resolve, reject ) => {
    // @ts-ignore
    GM_xmlhttpRequest( {
      method: 'GET',
      url: url,
      headers: headers,
      responseType: 'document',
      onload: response => {
        const resText = response.responseText;
        if ( !resText ) {
          reject( 'no response text' );
          return false;
        }
        if ( returnHtml )
          resolve( resText );
        const tempDoc = generateDoc( resText, true );
        resolve( tempDoc );
      },
      onerror: () => reject( 'onerror' ),
      ontimeout: () => reject( 'ontimeout' )
    } );
  } );

}
function GMXmlHttpRequestAsync ( url ) {

  return new Promise( ( resolve, reject ) => {
    // @ts-ignore
    GM_xmlhttpRequest( {
      url: url,
      onload: response => {
        resolve( response.response );
      },
      onerror: () => reject( 'onerror' ),
      ontimeout: () => reject( 'ontimeout' )
    } );
    // function errorFunction () { reject( 'error loading page' ) }
  } );

}
async function GMXmlHttpReqResponse ( url ) {

  const promise = new Promise( ( resolve, reject ) => {
    // @ts-ignore
    GM_xmlhttpRequest( {
      method: 'GET',
      url: url,
      responseType: 'document',
      onload: function ( response ) {
        resolve( response.responseText );
      }
      ,
      onerror: () => { reject( 'error' ); }
    } );
  } );
  return await promise;
}


function pipeline ( ...functions ) {
  functions.reduce( ( accumulator, currentFn ) => {
    return currentFn( accumulator );
  } );
}

function sanitizeTrackingLinks ( selector, mainTrackerRegex, secondaryTrackerRegex ) {
  document.querySelectorAll( selector ).forEach( ( link ) => {
    link.removeAttribute( 'data-saferedirecturl' );
    let newHref = link.href.replace( mainTrackerRegex, '' );
    newHref = decodeURIComponent( newHref );
    if ( !secondaryTrackerRegex ) {
      link.href = newHref;
      return;
    }
    newHref = newHref.replace( secondaryTrackerRegex, '' );
    link.href = newHref;
  } );
}

function beep ( duration, frequency, volume, type, callback ) {
  // @ts-ignore
  var audioCtx = new ( window.AudioContext || window.webkitAudioContext || window.audioContext );

  //All arguments are optional:

  //duration of the tone in milliseconds. Default is 500
  //frequency of the tone in hertz. default is 440
  //volume of the tone. Default is 1, off is 0.
  //type of tone. Possible values are sine, square, sawtooth, triangle, and custom. Default is sine.
  //callback to use on end of tone
  var oscillator = audioCtx.createOscillator();
  var gainNode = audioCtx.createGain();

  oscillator.connect( gainNode );
  gainNode.connect( audioCtx.destination );

  if ( volume ) { gainNode.gain.value = volume; }
  if ( frequency ) { oscillator.frequency.value = frequency; }
  if ( type ) { oscillator.type = type; }
  if ( callback ) { oscillator.onended = callback; }

  oscillator.start( audioCtx.currentTime );
  oscillator.stop( audioCtx.currentTime + ( ( duration || 500 ) / 1000 ) );

}

function markElAsProcessed ( el, markedEls, execute ) {
  if ( markedEls.includes( el ) === false ) {
    markedEls.push( el );
    execute( el );
  }
}

function generateAllYouTubeSbUrls ( fullYTHtml ) {

  //# Based on:
  // https://github.com/hjk789/Userscripts/tree/master/YouTube-Clickbait-Buster
  // "Peek video content" button onClick function

  const resText = fullYTHtml;
  const fullStoryboardURL = resText.match( /"playerStoryboardSpecRenderer":.+?"(https.+?)",/ );

  if ( !fullStoryboardURL || fullStoryboardURL[ 1 ].includes( "googleadservices" ) ) {
    // It can happen sometimes that the storyboard provided is of the ad, instead of the video itself.
    // But this seems to only happen on videos that don't have a storyboard available anyway.
    const temp = 'Storyboard not available for this video!';
    // @ts-ignore
    return { temp, temp, temp };
  }

  const urlSplit = fullStoryboardURL[ 1 ].split( "|" );
  let mode = urlSplit[ 3 ] ? 3 : 1;
  // YouTube provides 2 modes of storyboards: one with 25 frames per chunk
  // and another one with 60 frames per chunk.I've choose the former mode,
  // as in the second one the frames are too tiny to see anything.
  // But in short videos with less than 30 seconds, only the latter is available.
  if ( !urlSplit[ mode ] ) {
    // There's also a third mode, videos that have only one mode and ongoing lives storyboards,
    // but I couldn't find any way to make them work.
    alert( "Storyboard not available for this video yet! Try again some hours later." );
    return;
  }

  const storyboardId = urlSplit[ mode ].replace( /.+#rs/, "&sigh=rs" );
  if ( mode == 3 ) mode--;

  const videoLength = +resText.match( /"lengthSeconds":"(\d+)","ownerProfileUrl/ )[ 1 ];
  const samplingFq =
    videoLength <= 120
      ? 1 : videoLength <= 300
        ? 2 : videoLength < 900
          ? 5 : 10;
  // Depending on the video length, YouTube takes snapshots with different time spaces.

  const trueNoOfSlots = Math.round( videoLength / samplingFq );
  const noOfSbs = trueNoOfSlots / 25;
  let allUrls = [];
  repeat( noOfSbs, ( index ) => {
    const base = urlSplit[ 0 ].replace( "L$L/$N", `L${ mode }/M${ index }` );
    // The storyboard URL uses the "L#/M#" parameter to
    // determine the type and part of the storyboard to load.
    // L1 is the storyboard chunk with 60 frames, and L2 is the one with 25 frames.
    // M0 is the first chunk, M1 the second, and so on.
    allUrls.push( base + storyboardId );
  } );

  return { allUrls, trueNoOfSlots, samplingFq };

}

function repeat ( times, repeatWhat ) {
  for ( let index = 0; index < times; index++ ) {
    repeatWhat( index );
  }
}



function makeElementDraggableAndResizable ( element ) {
  let isDragging = false;
  let isResizing = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;

  // Create and append resize handle
  const resizeHandle = document.createElement( 'div' );
  resizeHandle.style.cssText = `
        width: 10px;
        height: 10px;
        background-color: #666;
        position: absolute;
        right: 0;
        bottom: 0;
        cursor: se-resize;
    `;
  element.appendChild( resizeHandle );

  // Make sure the element is positioned relatively or absolutely
  if ( getComputedStyle( element ).position === 'static' ) {
    element.style.position = 'relative';
  }

  // Add necessary styles
  element.style.cursor = 'move';
  element.style.userSelect = 'none';

  // Drag functionality
  function dragStart ( e ) {
    if ( e.target === resizeHandle ) return;

    isDragging = true;

    if ( e.type === "touchstart" ) {
      initialX = e.touches[ 0 ].clientX - xOffset;
      initialY = e.touches[ 0 ].clientY - yOffset;
    } else {
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
    }
  }

  function dragEnd () {
    isDragging = false;
    isResizing = false;
    initialX = currentX;
    initialY = currentY;
  }

  function drag ( e ) {
    if ( isDragging ) {
      e.preventDefault();

      if ( e.type === "touchmove" ) {
        currentX = e.touches[ 0 ].clientX - initialX;
        currentY = e.touches[ 0 ].clientY - initialY;
      } else {
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
      }

      xOffset = currentX;
      yOffset = currentY;

      element.style.transform = `translate(${ currentX }px, ${ currentY }px)`;
    }
  }

  // Resize functionality
  function resizeStart ( e ) {
    if ( e.target === resizeHandle ) {
      isResizing = true;
      e.stopPropagation();
    }
  }

  function resize ( e ) {
    if ( isResizing ) {
      e.preventDefault();

      const rect = element.getBoundingClientRect();
      let width, height;

      if ( e.type === "touchmove" ) {
        width = e.touches[ 0 ].clientX - rect.left;
        height = e.touches[ 0 ].clientY - rect.top;
      } else {
        width = e.clientX - rect.left;
        height = e.clientY - rect.top;
      }

      // Set minimum size
      width = Math.max( 50, width );
      height = Math.max( 50, height );

      element.style.width = width + 'px';
      element.style.height = height + 'px';
    }
  }

  // Add event listeners
  element.addEventListener( 'mousedown', dragStart );
  element.addEventListener( 'touchstart', dragStart );
  document.addEventListener( 'mousemove', drag );
  document.addEventListener( 'touchmove', drag );
  document.addEventListener( 'mouseup', dragEnd );
  document.addEventListener( 'touchend', dragEnd );

  resizeHandle.addEventListener( 'mousedown', resizeStart );
  resizeHandle.addEventListener( 'touchstart', resizeStart );
  document.addEventListener( 'mousemove', resize );
  document.addEventListener( 'touchmove', resize );
}

function makeDraggable ( element ) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  const header = document.getElementById( "contPanelHeader" );

  if ( header ) {
    header.onmousedown = dragMouseDown;
  } else {
    element.onmousedown = dragMouseDown;
  }

  function dragMouseDown ( e ) {
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag ( e ) {
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    element.style.top = ( element.offsetTop - pos2 ) + "px";
    element.style.left = ( element.offsetLeft - pos1 ) + "px";
  }

  function closeDragElement () {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

function dragElement ( targetEl, dragHandleEl ) {

  targetEl.style.position = 'fixed';
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

  if ( dragHandleEl )
    dragHandleEl.onmousedown = dragMouseDown;
  else
    targetEl.onmousedown = dragMouseDown;

  function dragMouseDown ( e ) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag ( e ) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    targetEl.style.top = ( targetEl.offsetTop - pos2 ) + "px";
    targetEl.style.left = ( targetEl.offsetLeft - pos1 ) + "px";
  }

  function closeDragElement () {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

// @ts-ignore
function blink ( element, interval, numberOfTimes ) {
  return new Promise( async resolve => {
    element.style.transform = 'scale(1.3,1.3)';
    await asyncTimeout( interval );
    element.style.transform = '';
    await asyncTimeout( interval );
    element.style.transform = 'scale(1.3,1.3)';
    await asyncTimeout( interval );
    element.style.transform = '';
    resolve;
  } );
}

function fauxHistoryPushState ( url, timeout = 3000 ) {
  // @ts-ignore
  const backgroundTab = GM_openInTab( url, true );
  setTimeout( () => { backgroundTab.close(); }, timeout );
}

function addHistoryEntry ( newUrl ) {
  const originalUrl = location.href;
  history.pushState( { state: 1 }, "new state", newUrl );
  history.pushState( { state: 1 }, "new state", originalUrl );
}

function removeEmptytextEls ( parent ) {
  const divsOrPs = parent.querySelectorAll( 'div, p' );
  divsOrPs.forEach( ( el ) => {
    if ( !el.textContent.trim() ) {
      el.remove();
    }
  } );
}

/**
 * Modern browsers can download files that aren't from same origin this is a workaround to download a remote file
 * @param `url` Remote URL for the file to be downloaded
 */
// @ts-ignore
function Download ( { url, filename } ) {
  // @ts-ignore
  const [ fetching, setFetching ] = useState( false );
  // @ts-ignore
  const [ error, setError ] = useState( false );

  // @ts-ignore
  const download = ( url, name ) => {
    if ( !url ) {
      throw new Error( "Resource URL not provided! You need to provide one" );
    }
    setFetching( true );
    fetch( url )
      .then( response => response.blob() )
      .then( blob => {
        setFetching( false );
        const blobURL = URL.createObjectURL( blob );
        const a = document.createElement( "a" );
        a.href = blobURL;
        // @ts-ignore
        a.style = "display: none";

        if ( name && name.length ) a.download = name;
        document.body.appendChild( a );
        a.click();
      } )
      .catch( () => setError( true ) );
  };

  // return (
  //     <button
  //         disabled={ fetching }
  //         onClick={ () => download( url, filename ) }
  //         aria-label="download gif"
  //     >
  //         DOWNLOAD
  //     </button>
  // )
}

function isElementInViewport ( el ) {

  // Special bonus for those using jQuery
  // @ts-ignore
  if ( typeof jQuery === "function" && el instanceof jQuery ) {
    el = el[ 0 ];
  }

  var rect = el.getBoundingClientRect();

  return (
    rect.top >= 0 &&
    // rect.left >= 0 &&
    rect.bottom <= ( window.innerHeight || document.documentElement.clientHeight )
    // && /* or $(window).height() */ rect.right <= ( window.innerWidth || document.documentElement.clientWidth ) /* or $(window).width() */
  );
}

const downloadFile = ( file ) => {
  const element = document.createElement( 'a' );
  element.setAttribute( 'href', 'Download Btn' );
  element.setAttribute( 'download', file );

  element.style.display = 'none';

  document.body.appendChild( element );

  element.click();
  document.body.removeChild( element );
};

// var saveData = ( function () {
//     var a = document.createElement( "a" );
//     document.body.appendChild( a );
//     a.style = "display: none";
//     return function ( data, fileName ) {
//         var json = JSON.stringify( data ),
//             blob = new Blob( [ json ], { type: "octet/stream" } ),
//             url = window.URL.createObjectURL( blob );
//         a.href = url;
//         a.download = fileName;
//         a.click();
//         window.URL.revokeObjectURL( url );
//     };
// }() );

function isInIframe () {
  return window !== window.parent;
}

function iframeRef ( frameRef ) {
  return frameRef.contentWindow
    ? frameRef.contentWindow.document
    : frameRef.contentDocument;
}



//#region Dom manipulations

function empty ( element ) {
  element.childNodes.forEach( node => {
    node.remove();
  } );
}

//#region JQ Alternatives
//# JQ Alternatives

function convertElementType ( element, newType ) {
  // Input validation
  if ( !( element instanceof HTMLElement ) ) {
    throw new Error( 'First parameter must be an HTML element' );
  }
  if ( typeof newType !== 'string' || !newType.trim() ) {
    throw new Error( 'Second parameter must be a valid element type string' );
  }

  // Create the new element
  const newElement = document.createElement( newType.toLowerCase() );

  // Copy all attributes
  Array.from( element.attributes ).forEach( attr => {
    newElement.setAttribute( attr.name, attr.value );
  } );

  // Copy all child nodes
  Array.from( element.childNodes ).forEach( child => {
    newElement.appendChild( child.cloneNode( true ) );
  } );

  // Copy event listeners if using jQuery
  if ( window.jQuery ) {
    const events = jQuery._data( element, 'events' );
    if ( events ) {
      for ( let type in events ) {
        events[ type ].forEach( event => {
          jQuery( newElement ).on( type, event.handler );
        } );
      }
    }
  }

  // Replace the old element with the new one
  if ( element.parentNode ) {
    element.parentNode.replaceChild( newElement, element );
  }

  return newElement;
}

function elementsToArray ( els ) {
  return els instanceof Element ? [ els ] : els;
}

function contains ( selector, text, parent = document ) {
  const elsContaining = [ ...parent.querySelectorAll( selector ) ].filter( ( el ) =>
    el.textContent.includes( text )
  );
  return elsContaining;
}

function next ( el, selector ) {
  const nextEl = el.nextElementSibling;
  if ( !selector || ( nextEl && nextEl.matches( selector ) ) ) {
    return nextEl;
  }
  return null;
}

function prev ( el, selector ) {
  const prevEl = el.previousElementSibling;
  if ( !selector || ( prevEl && prevEl.matches( selector ) ) ) {
    return prevEl;
  }
  return null;
}

async function fadeOut ( targetEl, duration ) {
  if ( !duration ) duration = 250;
  targetEl.style.transition = `opacity ${ duration / 1000 }s`;
  targetEl.style.opacity = 0;
  await asyncTimeout( duration );
  targetEl.style.display = "none";
}

async function fadeIn ( targetEl, duration ) {
  if ( !duration ) duration = 250;
  targetEl.style.transition = `opacity ${ duration / 1000 }s`;
  targetEl.style.opacity = 0;
  targetEl.style.display = "";
  targetEl.style.opacity = 1;
}

function fadeToggle ( targetEls, duration ) {
  const elementsArray = elementsToArray( targetEls );
  elementsArray.forEach( item => {
    if ( item.style.display == 'none' ) {
      fadeIn( item, duration );
    } else {
      fadeOut( item, duration );
    }
  } );
}

function toggle ( els ) {
  const elementsArray = elementsToArray( els );
  elementsArray.forEach( el => {
    if ( el.style.display == 'none' ) {
      el.style.display = '';
    } else {
      el.style.display = 'none';
    }
  } );
}

function wrap ( wrapperHtml, ...els ) {
  const wrappingElement = generateElements( wrapperHtml, null, true );
  els[ 0 ].before( wrappingElement );
  // @ts-ignore
  wrappingElement.append( ...els );
  return wrappingElement;
}

function unwrap ( el ) {
  el.replaceWith( ...el.childNodes );
}

function parents ( el, selector ) {
  const parents = [];
  while ( ( el = el.parentNode ) && el !== document ) {
    if ( !selector || el.matches( selector ) ) parents.push( el );
  }
  return parents;
}

function grandParent ( child, iterations ) {

  let currentIteration = iterations;
  let parent = child.parentNode;

  if ( currentIteration === 1 )
    return parent;

  return grandParent( parent, currentIteration - 1 );

}

// @ts-ignore
function generateDoc ( html, returnTrusted ) {

  let escapeHTMLPolicy;

  // @ts-ignore
  escapeHTMLPolicy = trustedTypes.createPolicy( "forceInner", {
    createHTML: ( to_escape ) => to_escape
  } );

  const template = document.createElement( 'template' );
  document.body.prepend( template );

  template.innerHTML = escapeHTMLPolicy.createHTML( html.trim() );

  const templateContent = template.content;
  template.remove();
  return templateContent;
  // return template.content;

}

function generateElements ( html, parent, returnTrusted ) {

  const doc = generateDoc( html, returnTrusted );
  const children = doc.children;
  let returnChildren = [ ...children ];
  if ( parent ) {
    returnChildren.length = 0;
    for ( const child of children ) {
      returnChildren.push(
        parent.appendChild( child ) );
    }
  }
  return returnChildren.length === 1 ? returnChildren[ 0 ] : returnChildren;

}

//#region Functions for global script
//# Functions for global script

function generateToolbarButton ( text, parent, popup, onclick ) {
  const button = generateElements( `<button class=popupButton>${ text }</button>` );
  // @ts-ignore
  const collapsibleContent = document.querySelector( `#collapsibleContent` );
  parent.append( button );
  // calculateWidthAndExpand( collapsibleContent );
  if ( popup ) {
    // @ts-ignore
    button.addEventListener( 'click', () => { togglePopup( popup ); } );
  }
  if ( onclick )
    // @ts-ignore
    button.addEventListener( 'click', onclick );
  return button;
}

// function createToolbarPopup () {
//     const toolbarPopup = generateElements( '<div></div>' );
//     toolbarPopup.classList.add( 'toolbarPopup' );
//     toolbarPopup.style = `
//         font-size:  large;
//         max-height: 50vh;
//         position:   absolute;
//         overflow:   auto;
//         display:    none;
//         background-color: gray;
//     `;
//     collapsibleContent.append( toolbarPopup );
//     return toolbarPopup;
// }
function createToolbarPopup ( collapsibleContent ) {
  const toolbarPopup = generateElements( '<div></div>' );
  // @ts-ignore
  toolbarPopup.classList.add( 'toolbarPopup' );
  // @ts-ignore
  toolbarPopup.style = `
        font-size:  large;
        max-height: 50vh;
        position:   absolute;
        overflow:   auto;
        display:    none;
        background-color: gray;
    `;
  collapsibleContent.append( toolbarPopup );
  return toolbarPopup;
}

function togglePopup ( popup ) {
  toggle( popup );
  const popupHeight = getComputedStyle( popup ).height
    .replace( /px$/, '' );
  popup.style.top = `-${ +popupHeight + 5 }px`;
}

function calculateWidthAndExpand ( collapsibleContent ) {
  let totalWidth = 0;
  for ( const child of collapsibleContent.children ) {
    let widthValue = +getStyleOrComputedStyle( child, 'width' ).replace( 'px', '' );
    let marginValue = +getStyleOrComputedStyle( child, 'margin' ).replace( 'px', '' );
    totalWidth += ( widthValue ? widthValue : 0 ) + marginValue * 2;
  }
  collapsibleContent.style.width = `${ totalWidth }px`;
}

//#region Site specific functions

async function getVoeStoryboardImg ( voeUrl ) {
  const levelOneHtml = await GMXmlHttpRequest( voeUrl, null, true );
  const levelTwoUrl = levelOneHtml.match( /window\.location\.href = '(.+?)'/ )[ 1 ];
  const levelTwoDoc = await GMXmlHttpRequest( levelTwoUrl );
  const posterImgUrl = levelTwoDoc.querySelector( '[name="og:image"]' ).content;
  const storyboardUrl = posterImgUrl.replace( /_storyboard_L\d+/, '_storyboard_L0' );
  return storyboardUrl;
}

async function bftStoryboardFromUrl ( bftvUrl, sbGrandParent ) {

  const bftvDoc = await GMXmlHttpRequest( bftvUrl );
  const bftvScript = bftvDoc.querySelector( 'script[type="application/ld+json"]' );

  const durationMatches = bftvScript.textContent.match( /"duration":"PT(.+?)H(.+?)M(.+?)S"/ );
  const durationString = `${ durationMatches[ 1 ] }:${ durationMatches[ 2 ] }:${ durationMatches[ 3 ] }`;
  const durationInSeconds = toSeconds( durationString );

  // const thumbnailSrc = bftvDoc.querySelector( 'meta[property="og:image"]' ).content;
  // const thumbEl = generateElements( `<img src=${ thumbnailSrc }>`, item );
  // thumbEl.style.maxHeight = '300px';
  // generateElements( `<div>${ durationString }</div>`, item );

  const otherScript = contains( 'script', 'initPlayer', bftvDoc )[ 0 ];
  const thumbBase = otherScript.textContent.match( /thumbBase: '(.+?)'/ )[ 1 ];
  const thumbCount = otherScript.textContent.match( /thumbsCount: (\d+)/ )[ 1 ];
  let imgUrls = [];
  for ( let i = 1; i <= thumbCount; i++ ) {
    const thisUrl = thumbBase.replace( '{THUMB_ID}', i );
    imgUrls.push( thisUrl );
  }

  const storyboardParent = generateElements( '<div></div>', sbGrandParent );
  return await storyboard( {
    storyboardParent,
    horizontal: 1,
    vertical: 1,
    linkToVid: bftvUrl,
    trueNoOfSlots: thumbCount,
    imgUrls: imgUrls
  } );

}