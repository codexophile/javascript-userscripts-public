function dailyDevHandler () {

  const itemsParentEl = document.querySelector( 'div[dir="ltr"] > table' );
  itemsParentEl.classList.add( 'fixedCSS' );
  style( itemsParentEl, `
    display: flex;
    flex-wrap: wrap;
  `);

  const locatorEls = document.querySelectorAll( '[href*="t.daily.de"][class*=button]' );
  locatorEls.forEach( locatorEl => {
    const itemEl = grandParent( locatorEl, 12 );
    itemsParentEl.prepend( itemEl );
    style( itemEl, `
      display: block;
      width: 45%;
    `);
  } );

}

function simklHandler () {

}

function mediumDailyDigestHandler () {

  //* sanitizing links
  const dirtyLinks = document.querySelectorAll( `[href*='?source=']` );
  dirtyLinks.forEach( link => {
    link.href = link.href.replace( /\?source=.+/, '' );
  } );

  //*
  const mediumParent = generateElements( '<div id=mediumParent></div>', null, true );
  mediumParent.style = 'display: flex; flex-wrap: wrap';
  document.querySelector( 'table[role=presentation]:not([class])' ).parentElement.prepend( mediumParent );
  mediumParent.classList.add( 'fixedCSS' );

  document.querySelectorAll( `img[alt=Claps]` ).forEach( item => {
    const mainItem = grandParent( item, 6 );
    if ( !mainItem.querySelector( '[alt="Member-only content"]' ) ) {
      mainItem.style.width = '48%';
      mediumParent.prepend( mainItem );
    }
  } );

}

function muoHandler () {

  document.querySelector( `center` ).classList.add( 'fixedCSS' );

  const linksDiv = generateElements( `<div></div>`, null, true );
  linksDiv.style.display = 'grid';
  document.querySelector( 'center' ).prepend( linksDiv );
  const linksToArticles = document.querySelectorAll( `h2 > a` );
  linksToArticles.forEach( link => {
    if ( link.href.includes( '.tradepub.com' ) ) return;
    // to avoid commercial links 👆🏻
    link.style.fontSize = 'large';
    linksDiv.prepend( link );
  } );

  sanitizeTrackingLinks( `[href*=".awstrack.me/"]`, /^.+?\.awstrack\.me\/.+?\//, /\?.*/ );

  const ICYMILocator = contains( 'h3 > strong', 'ICYMI' )[ 0 ];
  if ( !ICYMILocator ) return; // 🛑
  const ICYMIHeader = grandParent( ICYMILocator, 5 );
  const ICYMIContent = next( ICYMIHeader );
  linksDiv.append( ICYMIHeader, ICYMIContent );


}

function redditHandler () { }

function mailbrewHandler () { }