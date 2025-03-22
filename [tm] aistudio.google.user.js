( function () {
  'use strict';
  if ( window.top != window.self ) return; //don't run on frames or iframes

  waitForEach( '[mattooltip="Good response"]', ( el ) => {
    // if ( !document.hidden ) return;
    GM_setClipboard( `global-document-ready-${ document.title }` );
    GM_notification( {
      title: 'DeepSeek',
      highlight: true,
      text: 'Ready',
      timeout: 1000
    } );

  } );

  hotkeys( 'alt+e', ( event, handler ) => {
    const editBtnEls = document.querySelectorAll( '.toggle-edit-button' );
    const lastEditBtnEl = editBtnEls[ editBtnEls.length - 1 ];
    lastEditBtnEl.click();
  } );

  hotkeys.filter = function ( event ) {
    return true;
  };

  hotkeys( 'enter', ( event, handler ) => {
    document.querySelector( '.run-button' ).click();
  } );

} )();