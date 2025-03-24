( async function () {
  'use strict';
  if ( window.top != window.self ) return; //don't run on frames or iframes

  const modalObj = new ModalBox();
  const modalContentEl = generateElements( `<div></div>` );
  modalObj.setContent( modalContentEl );

  const { addButton } = await Collapsible();

  addButton( '🧹', null, async () => {
    const clearChatBtnEl = document.querySelector( `button[aria-label="Clear chat"]` );
    clearChatBtnEl.click();
    const continueBtn = await waitFor( 'mat-dialog-actions > [color="primary"]' );
    continueBtn.click();
  } );

  addButton( '🖼️', null, async () => {
    modalObj.show();
  } );

  downloadImgWithTextFunctionality( {
    siteName: 'AiStudio',
    imageElSelector: '[alt^="Generated Image"]',
    getDescription ( imgEl ) {
      const grandParentEl = imgEl.closest( 'ms-chat-turn' );
      const descriptionEl = prev( grandParentEl ).querySelector( '.user-prompt-container' );
      return descriptionEl.textContent;
    },
  } );

  waitForEach( '[mattooltip="Good response"]', ( el ) => {
    // if ( !document.hidden ) return;
    GM_setClipboard( `global-document-ready-${ document.title }` );
    GM_notification( {
      title: 'AiStudio',
      highlight: true,
      text: 'Ready',
      timeout: 1000
    } );

  } );

  hotkeys( 'alt+r', ( event, handler ) => {
    const rerunBtnEls = document.querySelectorAll( '[name="rerun-button"]' );
    const lastRerunBtnEl = rerunBtnEls[ rerunBtnEls.length - 1 ];
    lastRerunBtnEl.click();
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