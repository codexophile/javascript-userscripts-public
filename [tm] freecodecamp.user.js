( function () {
  'use strict';
  if ( window.top != window.self ) return; //don't run on frames or iframes

  fixTitle();

  function fixTitle () {
    const tagEl = document.querySelector( `[href*="/news/tag/"]` );
    const tag = tagEl ? tagEl.textContent : '';
    if ( !tag ) return;
    const newString = `freeCodeCamp[${ tag }] - ${ document.title }`;
    document.title = newString;
  }

} )();