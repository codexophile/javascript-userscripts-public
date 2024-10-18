// Utility functions
const waitFor = ( selector ) => new Promise( resolve => {
    if ( document.querySelector( selector ) ) {
        return resolve( document.querySelector( selector ) );
    }
    const observer = new MutationObserver( () => {
        if ( document.querySelector( selector ) ) {
            resolve( document.querySelector( selector ) );
            observer.disconnect();
        }
    } );
    observer.observe( document.body, {
        childList: true,
        subtree: true
    } );
} );

const asyncTimeout = ( ms ) => new Promise( resolve => setTimeout( resolve, ms ) );

const blink = async ( element, duration, times ) => {
    const originalOpacity = element.style.opacity;
    for ( let i = 0; i < times; i++ ) {
        element.style.opacity = '0';
        await asyncTimeout( duration / 2 );
        element.style.opacity = originalOpacity;
        await asyncTimeout( duration / 2 );
    }
};

// Main functions
const playVideo = ( videoEl, total, index ) => {
    videoEl.scrollIntoView();
    videoEl.currentTime = ( videoEl.duration / total ) * index;
    videoEl.play();
};

const setSlotScale = ( sbParent, scaleFactor ) => {
    const [ canvas ] = sbParent.querySelectorAll( 'canvas' );
    const originalWidth = canvas.width;
    const originalHeight = canvas.height;

    sbParent.querySelectorAll( 'canvas, .storyboardItem' ).forEach( el => {
        el.style.width = `${ originalWidth * scaleFactor }px`;
        el.style.height = `${ originalHeight * scaleFactor }px`;
    } );
};

const setSlotSize = ( sbParent, newWidth ) => {
    const [ canvas ] = sbParent.querySelectorAll( 'canvas' );
    const scale = newWidth / canvas.width;

    sbParent.querySelectorAll( 'canvas, .storyboardItem' ).forEach( el => {
        el.style.width = `${ newWidth }px`;
        el.style.height = `${ canvas.height * scale }px`;
    } );
};

const sbControls = async ( video, trueNoOfSlots, sbParent ) => {
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

        const sbSlider = document.createElement( 'input' );
        sbSlider.type = 'range';
        sbSlider.id = 'sizeSlider';
        sbSlider.min = '50';
        sbSlider.max = '300';
        sbSlider.value = '100';
        sbSlider.classList.add( 'storyboardControl' );
        sbSlider.addEventListener( 'input', () => setSlotScale( sbParent, sbSlider.value / 100 ) );
        collapsible.addElement( sbSlider );
    }

    const jumpToSlot = () => {
        const matches = location.hash.match( /#slot=(\d+?)($|#)/ );
        if ( !matches ) return;

        history.pushState( null, '', location.href.replace( location.hash, '' ) );
        const slotNo = parseInt( matches[ 1 ], 10 );
        if ( slotNo ) playVideo( video, trueNoOfSlots, slotNo );
    };

    if ( video.readyState > 0 ) jumpToSlot();
    video.addEventListener( 'loadeddata', jumpToSlot );

    video.addEventListener( 'timeupdate', () => {
        const currentSlotNo = Math.round( ( video.currentTime * trueNoOfSlots ) / video.duration );
        sbParent.querySelectorAll( '.storyboardItem' ).forEach( ( item, index ) => {
            item.classList.toggle( 'wentPast', index <= currentSlotNo );
            item.style.border = index <= currentSlotNo ? '3px solid red' : '3px solid white';
        } );
    } );
};

const storyboard = async ( {
    storyboardParent,
    horizontal,
    vertical,
    linkToVid = null,
    vidOnPage,
    samplingFq = null,
    trueNoOfSlots,
    imgUrls = []
} ) => {
    const slotsDiv = document.createElement( 'div' );
    slotsDiv.id = 'slotsDiv';
    Object.assign( slotsDiv.style, {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-evenly'
    } );
    storyboardParent.append( slotsDiv );

    if ( !imgUrls.length ) {
        console.error( 'imgUrls: Error!' );
        return;
    }

    const createStoryboardItem = async ( url, index ) => {
        const slots = await storyboardFlex( horizontal, vertical, url, index, trueNoOfSlots );
        slots.forEach( ( slot, slotIndex ) => {
            slotsDiv.append( slot );
            slot.index = index * horizontal * vertical + slotIndex;
            if ( linkToVid ) {
                const link = document.createElement( 'a' );
                link.href = `${ linkToVid }#slot=${ slot.index }`;
                link.target = '_blank';
                Object.assign( link.style, {
                    display: 'block',
                    width: '100%',
                    height: '100%',
                    top: '0px',
                    left: '0px',
                } );
                link.append( slot.querySelector( 'canvas' ) );
                slot.append( link );
            }
            slot.addEventListener( 'click', () => {
                const samplingFreq = samplingFq || ( vidOnPage.duration / ( horizontal * vertical ) );
                vidOnPage.currentTime = slot.index * samplingFreq;
                vidOnPage.play();
                vidOnPage.scrollIntoView( { behavior: 'instant', block: 'center' } );
            } );
        } );
    };

    await Promise.all( imgUrls.map( createStoryboardItem ) );

    setSlotSize( storyboardParent, '200' );
    sbControls( vidOnPage, trueNoOfSlots, storyboardParent );
    return slotsDiv;
};

const storyboardToggleable = async ( options ) => {
    const slotsDiv = await storyboard( options );
    Object.assign( slotsDiv.style, {
        maxWidth: '90vw',
        maxHeight: '80vh',
        overflow: 'auto',
    } );
    return slotsDiv;
};

const storyboardFlex = async ( horizontal, vertical, imgSrc, index, trueNoOfSlots ) => {
    const imgElement = new Image();
    imgElement.style.display = 'none';
    imgElement.src = imgSrc;
    document.body.appendChild( imgElement );

    try {
        await new Promise( ( resolve, reject ) => {
            imgElement.onload = resolve;
            imgElement.onerror = reject;
        } );

        const normalTotal = horizontal * vertical;
        const noOfSlotsRemaining = trueNoOfSlots - ( index * normalTotal );
        const thisIsFinalSb = noOfSlotsRemaining < normalTotal;

        if ( thisIsFinalSb ) {
            vertical = Math.ceil( noOfSlotsRemaining / horizontal );
        }

        const total = horizontal * vertical;
        const itemWidth = imgElement.naturalWidth / horizontal;
        const itemHeight = imgElement.naturalHeight / vertical;

        return Array.from( { length: total }, ( _, i ) => {
            const storyboardItem = document.createElement( 'div' );
            storyboardItem.classList.add( imgSrc.slice( -7 ), 'storyboardItem' );

            const canvas = document.createElement( 'canvas' );
            canvas.width = itemWidth;
            canvas.height = itemHeight;
            const ctx = canvas.getContext( '2d' );
            const x = i % horizontal;
            const y = Math.floor( i / horizontal );
            ctx.drawImage(
                imgElement,
                x * itemWidth, y * itemHeight,
                itemWidth, itemHeight,
                0, 0,
                canvas.width, canvas.height
            );
            storyboardItem.append( canvas );

            Object.assign( storyboardItem.style, {
                backgroundColor: 'black',
                textShadow: 'white 0px 0px 10px',
                width: `${ itemWidth }px`,
                height: `${ itemHeight }px`,
                margin: '1px',
                border: 'solid white',
            } );

            return storyboardItem;
        } );
    } catch ( error ) {
        console.error( 'Storyboard image load error:', error );
        const errorEl = document.createElement( 'div' );
        errorEl.textContent = 'Image load error';
        Object.assign( errorEl.style, {
            color: 'red',
            fontSize: '20px',
        } );
        return [ errorEl ];
    } finally {
        imgElement.remove();
    }
};

export { storyboard, storyboardToggleable };