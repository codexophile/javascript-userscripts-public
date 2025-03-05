( function () {
  'use strict';
  if ( window.top != window.self ) return; //don't run on frames or iframes

  waitForEach( 'div:has(>.ds-icon-button)[class]', ( el ) => {
    GM_setClipboard( `global-document-ready-${ document.title }` );
    if ( !document.hidden ) return;
    GM_notification( {
      title: 'DeepSeek',
      highlight: true,
      text: 'Ready',
      timeout: 1000
    } );

  } );

} )();