( function () {
  'use strict';

  //* fix document.title
  document.title = `w3schools: ${ document.title }`;

  //* add buttons to copy code snippets
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