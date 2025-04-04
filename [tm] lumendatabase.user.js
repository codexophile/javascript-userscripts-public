( function () {
  'use strict';
  if ( window.top != window.self ) return; //don't run on frames or iframes

  const originalLiEls = document.querySelectorAll( `.infringing-urls > li` );
  originalLiEls.forEach( ( liEl ) => {

    const originalText = liEl.innerText;
    liEl.textContent = '';

    const urlMatches = originalText.match( /^(.+?) - / );
    const url = urlMatches ? urlMatches[ 1 ] : '';

    const newLinkEl = generateElements( `<a>${ originalText }</a>`, liEl );
    newLinkEl.href = `https://${ url }/`;
    newLinkEl.target = '_blank';

  } );

} )();