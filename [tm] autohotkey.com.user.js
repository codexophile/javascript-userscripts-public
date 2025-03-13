( function () {
  'use strict';
  if ( window.top != window.self ) return; //don't run on frames or iframes

  waitFor( '[aria-label="Use the dark or light theme"]' ).then( ( darkModeBtnEl ) => {
    const bodyEl = document.body;
    const backgroundColor = window.getComputedStyle( bodyEl ).backgroundColor;
    if ( backgroundColor !== 'rgb(255, 255, 255)' ) return;
    darkModeBtnEl.click();
  } );


} )();