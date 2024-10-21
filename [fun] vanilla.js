//ANCHOR - Text functions

function toSeconds ( timeString ) {

    const a = timeString.split( ':' ).reverse();
    let seconds = 0;

    if ( +a[ 2 ] ) seconds += ( +a[ 2 ] ) * 60 * 60;
    if ( +a[ 1 ] ) seconds += ( +a[ 1 ] ) * 60;
    if ( +a[ 0 ] ) seconds += ( +a[ 0 ] );

    return seconds;

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
    var returntext = '';

    for ( var i = 0, max = levels.length; i < max; i++ ) {
        if ( levels[ i ][ 0 ] === 0 ) continue;
        returntext += ' ' + levels[ i ][ 0 ] + ' ' + ( levels[ i ][ 0 ] === 1 ? levels[ i ][ 1 ].substr( 0, levels[ i ][ 1 ].length - 1 ) : levels[ i ][ 1 ] );
    };
    return returntext.trim();
}

//ANCHOR - Style related

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

//ANCHOR Storyboard functions

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

async function sbControls ( video, trueNoOfSlots, sbParent ) {

    await waitFor( '.collapsible-content' );
    const collapsible = await Collapsible();

    if ( video ) {

        collapsible.addButton( '🔙', null, async () => {
            const targetEl = [ ...sbParent.querySelectorAll( '.wentPast' ) ].pop();
            targetEl.scrollIntoView( { behavior: 'instant', block: 'center' } );
            await asyncTimeout( 250 );
            await blink( targetEl, 250, 2 );
        } ).classList.add( 'storyboardControl' );

        collapsible.addButton( '💠', null, () => {
            const isHidden = sbParent.style.display === 'none';
            sbParent.style.display = isHidden ? 'block' : 'none';
            sbParent.scrollIntoView( { block: isHidden ? 'start' : 'center' } );
        } ).classList.add( 'storyboardControl' );

        const sbSlider = generateElements( `
            <input class=storyboardControl type="range" id="sizeSlider" min="50" max="300" value="100">` );
        sbSlider.addEventListener( 'input', function () {
            const scaleFactor = sbSlider.value / 100;
            setSlotScale( sbParent, scaleFactor );
        } );
        collapsible.addElement( sbSlider );

    }
    else {

    }

    // calculateWidthAndExpand( collapsibleEl );

    const jumpToSlot = () => {
        const matches = location.hash.match( /#slot=(\d+?)($|#)/ );
        if ( !matches ) return;

        addHistoryEntry( location.href.replace( location.hash, '' ) );
        const slotNo = matches[ 1 ];
        if ( slotNo ) playVideo( video, trueNoOfSlots, slotNo );
    };

    if ( video.readyState > 0 ) jumpToSlot();
    video.addEventListener( 'loadeddata', jumpToSlot );

    video.addEventListener( 'timeupdate', () => {
        const duration = video.duration;
        const currentSlotNo = Math.round( ( video.currentTime * trueNoOfSlots ) / duration );
        const storyboardItems = sbParent.querySelectorAll( '.storyboardItem' );

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
}

async function storyboard ( {
    storyboardParent,
    horizontal,
    vertical,
    linkToVid = null,
    vidOnPage,
    samplingFq = null,
    trueNoOfSlots,
    imgUrls = []
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

    const results = await Promise.allSettled( promises );
    let index = 0;

    results.forEach( result => {
        result.value.forEach( slot => {
            slotsDiv.append( slot );
            slot.index = index;
            if ( linkToVid ) {
                const link = wrap( `<a></a>`, slot.querySelector( 'canvas' ) );
                link.href = `${ linkToVid }#slot=${ index }`;
                link.target = '_blank';
                Object.assign( link.style, {
                    display: 'block',
                    width: '100%',
                    height: '100%',
                    top: '0px',
                    left: '0px',
                } );
                // slot.append( link );
            }
            slot.addEventListener( 'click', ev => {
                const samplingFreq = samplingFq || ( vidOnPage.duration / trueNoOfSlots );
                // const samplingFreq = samplingFq || ( vidOnPage.duration / ( horizontal * vertical ) );
                const newTime = ev.target.closest( 'div' ).index * samplingFreq;
                vidOnPage.currentTime = newTime;
                vidOnPage.play();
                vidOnPage.scrollIntoView( { behavior: 'instant', block: 'center' } );
            } );
            index++;
        } );
    } );

    setSlotSize( storyboardParent, '200' );
    sbControls( vidOnPage, trueNoOfSlots, storyboardParent );
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
    imgUrls = [] } ) {
    const slotsDiv = await storyboard( { storyboardParent, horizontal, vertical, linkToVid, vidOnPage, samplingFq, trueNoOfSlots, imgUrls } );
    Object.assign( slotsDiv.style, {
        maxWidth: '90vw',
        maxHeight: '80vh',
        overflow: 'auto',
    } );

    return slotsDiv;
}

async function storyboardFlex ( horizontal, vertical, imgSrc, index, trueNoOfSlots ) {
    console.log( imgSrc );
    const imgElement = new Image();
    imgElement.style.display = 'none';
    imgElement.src = imgSrc;
    document.body.appendChild( imgElement );

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


//ANCHOR Rest

function getAccentColorFromFavicon () {
    return new Promise( ( resolve ) => {
        // Find the favicon
        const faviconElement = document.querySelector( "link[rel*='icon']" ) || document.createElement( 'link' );
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
    GM_setClipboard( dataURL, 'text/html' );
    console.log( 'Image copied to clipboard using fallback method' );
}

function getFaviconUrl () {
    const links = document.querySelectorAll( 'link[rel~="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]' );
    if ( links.length > 0 ) {
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


function asyncTimeout ( ms ) {
    return new Promise( resolve => setTimeout( resolve, ms ) );
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
        GM_xmlhttpRequest( {
            method: 'GET',
            url: url,
            headers: headers,
            responseType: 'document',
            onload: response => {
                const resText = response.responseText;
                if ( returnHtml )
                    resolve( resText );
                const tempDoc = generateDoc( resText, true );
                resolve( tempDoc );
            },
            onerror: () => reject( 'onerror' ),
            ontimeout: () => reject( 'ontimeout' )
        } );
        // function errorFunction () { reject( 'error loading page' ) }
    } );

}
function GMXmlHttpRequestAsync ( url ) {

    return new Promise( ( resolve, reject ) => {
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


function pipeline ( ...functions ) {
    functions.reduce( ( accumilator, currentFn ) => {
        return currentFn( accumilator );
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

async function GMXmlHttpReqResponse ( url ) {

    const promise = new Promise( ( resolve, reject ) => {
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

function eagerLoad ( selector, load, scrollableEl = window ) {

    let items = [];

    // for all the elements that exist at page load
    document.querySelectorAll( selector ).forEach( item => { items.push( item ); } );
    // for the elements that appear after page load
    let observer = new MutationObserver( ( mutations ) => {
        mutations.forEach( mutation => {
            mutation.addedNodes.forEach( item => {
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
                if ( item.nodeType === 1 && item.matches( selector ) ) items.push( item );
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
function Download ( { url, filename } ) {
    const [ fetching, setFetching ] = useState( false );
    const [ error, setError ] = useState( false );

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
    const { timeout = 0, once = false } = options;
    const processedElements = new Set();

    function processElements () {
        document.querySelectorAll( selector ).forEach( element => {
            if ( !processedElements.has( element ) ) {
                processedElements.add( element );
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

    // Return a function to stop observing
    return () => observer.disconnect();
}

//ANCHOR - Dom manipulations

function empty ( element ) {
    element.childNodes.forEach( node => {
        node.remove();
    } );
}

//ANCHOR - JQ Alternatives
//# JQ Alternatives

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

function generateDoc ( html, returnTrusted ) {

    let escapeHTMLPolicy;

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

//ANCHOR - Functions for global script
//# Functions for global script

function generateToolbarButton ( text, parent, popup, onclick ) {
    const button = generateElements( `<button class=popupButton>${ text }</button>` );
    const collapsibleContent = document.querySelector( `#collapsibleContent` );
    parent.append( button );
    // calculateWidthAndExpand( collapsibleContent );
    if ( popup ) {
        button.addEventListener( 'click', () => { togglePopup( popup ); } );
    }
    if ( onclick )
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
    toolbarPopup.classList.add( 'toolbarPopup' );
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