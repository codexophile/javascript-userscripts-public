( () => {
    'use strict';
    if ( window.top != window.self ) return; //don't run on frames or iframes


    const setColor = ( el, color ) => {
        el.style.color = color;
        el.querySelectorAll( '*' ).forEach( item => item.style.color = color );
    };

    const handleDrag = ( e ) => {
        const color = e.offsetX <= 0 && e.offsetY <= 0 ? 'orange' : 'green';
        setColor( e.currentTarget, color );
    };

    const handleDragEnd = ( e ) => {
        const anchor = e.currentTarget;
        if ( e.offsetX > 0 || e.offsetY > 0 ) {
            location.href = anchor.href;
        } else {
            setColor( anchor, '' );
        }
    };

    const setupAnchor = ( anchor ) => {
        anchor.addEventListener( 'drag', handleDrag );
        anchor.addEventListener( 'dragend', handleDragEnd );
    };

    waitForEach( 'a', setupAnchor );

} )();