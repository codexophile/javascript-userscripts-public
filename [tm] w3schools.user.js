( function () {
  'use strict';

  const codeBlockEls = document.querySelectorAll( 'pre:has(>code)' );
  codeBlockEls.forEach( el => {
    const copyBtnEl = generateElements( `<button class=copyRole>😊</button>` );
    el.after( copyBtnEl );
    copyBtnEl.addEventListener( 'click', function () {
      const text = el.innerText;
      GM_setClipboard( text );
    } );
  } );

} )();