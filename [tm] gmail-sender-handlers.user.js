function blogtrottrHandler () {

}

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

}

function muoHandler () { }

function redditHandler () { }

function mailbrewHandler () { }
