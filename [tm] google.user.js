( function () {
  'use strict';

  if ( location.href.includes( '/url?q=' ) ) {
    window.stop();
    let targetUrl = window.location.href.slice( window.location.href.indexOf( "q=" ) + 2 );
    location.replace( targetUrl );
    return;
  }

  if ( location.href.includes( '/sorry/' ) ) {

    const $parent = $( '[style="font-size:13px;"]' );
    const params = new URLSearchParams( location.search );
    const targetUrl = params.get( 'continue' );
    const paramsForYT = new URLSearchParams( targetUrl );
    const youtubeID = paramsForYT.get( 'https://www.youtube.com/watch?v' );

    $parent.append( '<hr>' );
    $parent.append( `
            <div>
                <span> Target: </span>
                <a href=${ targetUrl }> ${ targetUrl } </a>
            </div>
        ` );

    return;

  }

  if ( location.href.includes( '#newTab' ) ) {
    let url = $( '[data-async-context^="query:"]' ).children().first().find( 'a[href]' ).attr( 'href' );
    window.open( url );
  }

  waitForEach( `[href^="https://www.reddit"]`, ( linkEl ) => {
    linkEl.href = linkEl.href.replace( 'https://www.reddit', 'https://old.reddit' );
  } );

  waitForEach( `[href^="https://stackoverflow.com/questions/"]`, async ( linkEl ) => {
    const mainContainerEl = linkEl.parentElement;
    const parentEl = generateElements( `<div></div>`, mainContainerEl );
    const tempDoc = await GMXmlHttpRequest( linkEl.href, null );
    tempDoc.querySelectorAll( '.post-layout  [href*="/questions/tagged/"]' ).forEach( item => {
      parentEl.append( item );
      style( item, `
                font-size: large;
                margin: 3px;
                padding: 3px;
                background-color: #99c3ff;
                border-radius: 3px;
                color: black;
            `);
    } );
  } );

} )();