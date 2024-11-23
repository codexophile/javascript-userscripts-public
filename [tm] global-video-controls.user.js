( async function () {
    'use strict';

    let activeVideo;
    const fastSpeed = 3;
    let timeIncrTiny = 6 / 160;
    let timeIncrSmall = 5;
    let timeIncrLarge = 60;

    let controlPanel, vidProgressEl, speedDispEl, volDispEl, slidVolFinEl, divHeightEl;

    new MutationObserver( main ).observe( document.body, { childList: true, subtree: true } );
    document.addEventListener( 'scroll', main );
    document.addEventListener( "keyup", keyboardEvent, false );

    async function main () {

        activeVideo = getActiveVideo();
        const vidContPanel = document.querySelector( `#video-controlPanel` );
        if ( !activeVideo ) {
            // vidContPanel.style.display = 'none';
        }

        if ( activeVideo && !vidContPanel ) {
            addToolbar();
            const collapsibleCont = await waitFor( '#collapsibleContent' );
            generateToolbarButton( '📹', collapsibleCont, null, () => { fadeToggle( document.querySelectorAll( `#video-controlPanel` ), 2500 ); } );
        }
        if ( !activeVideo && vidContPanel )
            vidContPanel.style.display = 'none';
        else if ( vidContPanel )
            vidContPanel.style.display = '';

        if ( activeVideo ) {
            videoEventListeners( activeVideo );
            initializeToolbar();
        }

    }

    function addToolbar () {

        // HTML Structure
        const controlPanel = generateElements( htmlStructure );
        // CSS Styles
        GM_addStyle( styles );

        document.body.append( controlPanel );
        controlPanel.querySelectorAll( ':not(.important)' ).forEach( item => { item.style.display = 'none'; } );

        const contPanelHeader = controlPanel.querySelector( '#contPanelHeader' );
        vidProgressEl = controlPanel.querySelector( `#progress` );
        speedDispEl = controlPanel.querySelector( '#speedDisp' );
        volDispEl = controlPanel.querySelector( '#volDisp' );
        slidVolFinEl = controlPanel.querySelector( `.slidVolFin` );
        divHeightEl = controlPanel.querySelector( '.divHeight' );

        // dragElement( controlPanel, controlPanel );
        makeDraggable( controlPanel );
        contPanelHeader.addEventListener( 'mousedown', () => { controlPanel.style.transition = 'unset'; } );
        contPanelHeader.addEventListener( 'mouseup', () => { controlPanel.style.transition = 'left 0.5s, top 0.5s, opacity 0.2s'; } );

        controlPanel.querySelector( '.butClose' ).addEventListener( 'click', () => { fadeOut( controlPanel, 250 ); } );
        controlPanel.querySelector( '.head' ).addEventListener( 'click', () => { toggle( controlPanel.querySelectorAll( ':not(.important)' ) ); } );
        controlPanel.querySelector( '#speedToggle' ).addEventListener( 'click', () => { speedToggle(); } );
        controlPanel.querySelector( '#buttonPlay' ).addEventListener( 'click', () => { togglePlayPause(); } );

        vidProgressEl.addEventListener( 'input', ( e ) => { activeVideo.currentTime = e.target.value / 100 * activeVideo.duration; } );
        slidVolFinEl.addEventListener( 'input', ( e ) => { activeVideo.volume = parseFloat( parseFloat( e.target.value ) );/* ; volumeDisplay.value = this.value */ } );

        controlPanel.querySelector( '.timejumpLOne' ).addEventListener( 'click', () => { activeVideo.currentTime -= timeIncrSmall; } );
        controlPanel.querySelector( '.timejumpROne' ).addEventListener( 'click', () => { activeVideo.currentTime += timeIncrSmall; } );
        controlPanel.querySelector( '.timejumpLTwo' ).addEventListener( 'click', () => { activeVideo.currentTime -= timeIncrLarge; } );
        controlPanel.querySelector( '.timejumpRTwo' ).addEventListener( 'click', () => { activeVideo.currentTime += timeIncrLarge; } );
        controlPanel.querySelector( '#checkbox-loop-vid' ).addEventListener( 'click', ( event ) => { activeVideo.loop = event.target.checked; } );

        controlPanel.querySelector( `#muteButton` ).addEventListener( 'click', function () { activeVideo.muted = !activeVideo.muted; } );
        controlPanel.querySelector( `#frameStepL` ).addEventListener( 'click', () => { frameStep( 'left' ); } );
        controlPanel.querySelector( `#frameStepR` ).addEventListener( 'click', () => { frameStep( 'right' ); } );
        controlPanel.querySelector( '#buttonResize' ).addEventListener( 'click', () => { if ( activeVideo.videoHeight ) activeVideo.style.height = `${ activeVideo.videoHeight }px`; } );
        controlPanel.querySelector( '#buttonScroll' ).addEventListener( 'click', () => { activeVideo.scrollIntoView(); } );
        controlPanel.querySelector( '#buttonLog' ).addEventListener( 'click', () => { console.log( activeVideo ); } );
        controlPanel.querySelector( '#copyPageUrl' ).addEventListener( 'click', ( e ) => { e.preventDefault(); GM_setClipboard( location.href ); return false; } );
        controlPanel.querySelector( '#copyVidSrc' ).addEventListener( 'click', ( e ) => { GM_setClipboard( activeVideo.currentSrc ); } );
        controlPanel.querySelector( `#buttonSnap` ).addEventListener( 'click', () => { snap(); } );
        controlPanel.querySelector( `#buttonGenSb` ).addEventListener( 'click', () => { generateStoryboard(); } );

        controlPanel.querySelector( `#buttonRotateL` ).addEventListener( 'click', () => { rotate( -90 ); } );
        controlPanel.querySelector( `#buttonRotateR` ).addEventListener( 'click', () => { rotate( 90 ); } );

        speedDispEl.addEventListener( 'change', ( e ) => { activeVideo.playbackRate = e.target.value; } );
        volDispEl.addEventListener( 'change', ( e ) => { activeVideo.volume = e.target.value; } );

        return controlPanel;

        $( 'span.text' ).css( 'color', 'unset !important' );


        $( `#progress` ).on( 'mousedown', function () {
            if ( getActiveVideo().paused ) return;
            togglePlayPause();
        } );
        $( `#progress` ).on( 'mouseup', togglePlayPause );

        //?pppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppp

        initializeToolbar();

    }

    function initializeToolbar () {

        slidVolFinEl.value = activeVideo.volume;
        volDispEl.value = activeVideo.volume;
        speedDispEl.value = activeVideo.playbackRate;
        divHeightEl.textContent = activeVideo.videoHeight;

    }

    function titler ( text ) {
        if ( document.getElementById( 'cbAutoSwitch' )?.checked )
            document.title = text;
    }

    function videoEventListeners ( video ) {

        if ( video.classList.contains( 'video-processed' ) ) return; // 🛑

        video.addEventListener( 'playing', () => { titler( "[media playing]" ); } );
        video.addEventListener( 'pause', () => { titler( "[media  paused]" ); } );
        video.addEventListener( 'waiting', () => { titler( "[media waiting]" ); } );
        video.addEventListener( 'stalled', () => { titler( "[media stalled]" ); } );


        video.addEventListener( 'timeupdate', ( event ) => {

            if ( activeVideo != event.target ) return; // 🛑

            vidProgressEl.value = video.currentTime / video.duration * 100;

            const duration = video.duration;
            const currentTime = video.currentTime;

            const spanRemainingTime = document.querySelector( '#spanRemainingTime' );
            const spanCurrentTime = document.querySelector( '#spanCurrentTime' );
            const spanActualRemTime = document.querySelector( `#spanActualRemainingTime` );

            fadeIn( spanRemainingTime );
            fadeIn( spanCurrentTime );

            const remainingTime = Math.round( duration - currentTime );
            const readable = forHumans( remainingTime );
            spanRemainingTime.textContent = readable;
            spanCurrentTime.textContent = forHumans( Math.round( currentTime ) );

            if ( video.playbackRate == 1 ) { fadeOut( spanActualRemTime ); return; } // 🛑
            fadeIn( spanActualRemTime );
            const actualRemainingTime = Math.round( ( duration - currentTime ) / video.playbackRate );
            const readableActual = forHumans( actualRemainingTime );
            spanActualRemTime.textContent = readableActual;

        } );

        video.addEventListener( 'ratechange', ( event ) => { speedDispEl.value = event.target.playbackRate; } );
        video.addEventListener( 'volumechange', ( event ) => {
            volDispEl.value = event.target.volume;
            slidVolFinEl.value = event.target.volume;
        } );

        video.classList.add( 'video-processed' );

    }

    function rotate ( inputAngle ) {
        const currentTransform = activeVideo.style.transform;
        const match = currentTransform.match( /rotate\((-?\d+)deg\)/ );
        const currentAngle = match ? match[ 1 ] : 0;
        const newAngle = +currentAngle + +inputAngle;
        activeVideo.style.transform = `rotate(${ newAngle }deg)`;
    }

    function snap () {

        const canvas = generateElements( '<canvas></canvas>', document.body );
        canvas.width = activeVideo.videoWidth;
        canvas.height = activeVideo.videoHeight;
        const canvasContext = canvas.getContext( "2d" );
        canvasContext.drawImage( activeVideo, 0, 0 );
        const imageUrl = canvas.toDataURL( 'image/png' ).replace( "image/png", "image/octet-stream" );

        const link = generateElements( '<a></a>', document.body );
        const fileName = document.title ? document.title : location.href;
        link.setAttribute( 'download', `${ fileName }.png` );
        link.setAttribute( 'href', imageUrl );
        link.click();

        canvas.remove();
        link.remove();

    }

    function generateStoryboard () {
        activeVideo.currentTime = 0;
        setInterval( () => {
            activeVideo.currentTime += 60;
        }, 1000 );
        // while ( activeVideo.currentTime < activeVideo.duration ) {
        // }
    }

    function keyboardEvent ( e ) {

        let activeElementType = document.activeElement.tagName.toLowerCase();
        if ( activeElementType === 'input' ) return; // 🛑

        if ( !activeVideo ) {
            return; // 🛑
        }

        if ( e.key == 'j' ) {
            activeVideo.currentTime = activeVideo.currentTime - timeIncrSmall;
        }
        if ( e.key == 'l' ) {
            activeVideo.currentTime = activeVideo.currentTime + timeIncrSmall;
        }
        if ( e.key == 'z' ) {
            speedToggle();
        }
        if ( e.key === 'x' ) {
            activeVideo.playbackRate = activeVideo.playbackRate - 0.5;
        }
        if ( e.key === 'c' ) {
            activeVideo.playbackRate = activeVideo.playbackRate + 0.5;
        }
        if ( e.key === "m" ) {
            activeVideo.muted = !activeVideo.toggleAttribute( "muted" );
        }
        if ( e.code === "KeyB" ) {
            activeVideo.volume -= 0.01;
        }
        if ( e.code === "KeyN" ) {
            activeVideo.volume += 0.01;
        }
        if ( e.shiftKey && e.code === "KeyB" ) {
            activeVideo.volume -= 0.001;
        }
        if ( e.shiftKey && e.code === "KeyN" ) {
            activeVideo.volume += 0.001;
        }
        if ( e.shiftKey && e.code === "KeyM" ) {
            activeVideo.muted = false;
            activeVideo.volume = 0.5;
        }

    }

    function togglePlayPause () {
        activeVideo.paused ? activeVideo.play() : activeVideo.pause();
    }

    function speedToggle () {
        if ( activeVideo.playbackRate == 1 ) {
            activeVideo.playbackRate = fastSpeed;
        } else {
            activeVideo.playbackRate = 1;
        }
        // $( activeVideo ).parent().addClass( 'speedManual' )
    }

    function getActiveVideo () {

        let mediaEls = [ ...document.querySelectorAll( "video, audio" ) ];
        const workingMedia = mediaEls.filter( el => el.duration );
        const playingMedia = mediaEls.filter( el => !el.paused );
        let visibleEls = playingMedia.filter( el => isElementInViewport( el ) );

        const activeMedia =
            playingMedia.length ? playingMedia : visibleEls.length ? visibleEls : workingMedia;

        if ( activeMedia[ 0 ] ) return activeMedia[ 0 ];
        return null;

    }

    function frameStep ( direction ) {
        activeVideo.pause();
        if ( direction === 'left' )
            activeVideo.currentTime -= timeIncrTiny;
        if ( direction === 'right' )
            activeVideo.currentTime += timeIncrTiny;
    }

} )();