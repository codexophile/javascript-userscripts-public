( async function () {
  'use strict';
  if ( window.top != window.self ) return; //don't run on frames or iframes

  const selector = 'div.container.main-container div.graphBody-wrapper div.text-center > p';
  waitForEach( selector, async ( locatorEl ) => {
    const endDateObj = await getEndDate();
    // 👇🏻 add one day to the end date specified in the website
    const actualEndDateObj = endDateObj.setDate( endDateObj.getDate() + 1 );
    const remainingDays = getRemainingDays( new Date(), actualEndDateObj );
    const remainingDataAmount = await getRemainingDataAmount();
    const estdDailyUsage = getEstdDailyUsage( remainingDataAmount, remainingDays );
    displayEstdDailyUsage( remainingDataAmount, remainingDays, estdDailyUsage );
  } );

  async function displayEstdDailyUsage ( remainingDataAmount, remainingDays, estdDailyUsage ) {
    const parentEl = document.querySelector( `.graphBody-wrapper` );
    generateElements( `
      <div>
        <div>Data remaining            : ${ remainingDataAmount } GB</div>
        <div>Days remaining            : ${ remainingDays.toFixed( 2 ) }</div>
        <div>Estd allowable daily usage: ${ estdDailyUsage.toFixed( 2 ) } GB</div>
      </div>
    `, parentEl );
  }

  function getEstdDailyUsage ( amount, days ) {
    return amount / days;
  }

  async function getRemainingDataAmount () {
    const selector = 'div.container.main-container div.graphBody-wrapper div.text-center > .used-of';
    const el = await waitFor( selector );
    const matches = el.textContent.match( /\d+(\.\d+)?/g );
    const usedAmount = matches[ 0 ];
    const packageAmount = matches[ 1 ];
    const remainingAmount = packageAmount - usedAmount;
    return remainingAmount;
  }

  function getRemainingDays ( start, end ) {
    const millisecondsInADay = 1000 * 60 * 60 * 24;
    const remainingTimeInMilliseconds = end - start;
    const remainingTimeInDays = remainingTimeInMilliseconds / millisecondsInADay;
    return remainingTimeInDays;
  }

  async function getEndDate () {

    const selector = 'div.container.main-container div.graphBody-wrapper div.text-center > p';
    const endDateEl = await waitFor( selector );
    console.log( endDateEl );
    const matches = endDateEl.textContent.match( /\(Valid Till : (.+?)\)/ );
    if ( !matches ) return;
    const endDate = matches[ 1 ];

    // Parse the date, using current year 
    const endDateObj = new Date( endDate );
    const currentYear = new Date().getFullYear();
    endDateObj.setFullYear( currentYear );
    return endDateObj;

  }

} )();