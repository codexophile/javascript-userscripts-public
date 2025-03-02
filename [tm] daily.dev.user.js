( async function () {
  'use strict';
  if ( window.top != window.self ) return; //don't run on frames or iframes

  markAndFilter( 'main article', 'a[class*=Card_link__]', 'href', /\/posts\/.*?(.........$)/ );

  //* automatically opens the comment section when clicking on an open external button
  waitForEach( `[href*='/r/']`, ( OpenExternalBtn ) => {
    OpenExternalBtn.addEventListener( 'click', ( event ) => {
      OpenExternalBtn.closest( 'article' ).querySelector( 'a' ).click();
    } );
  } );

} )();