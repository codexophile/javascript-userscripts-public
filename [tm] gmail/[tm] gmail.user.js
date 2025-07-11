( function () {
  'use strict';

  function main ( selectorForSenderElement ) {

    if ( document.querySelector( '.fixedCSS' ) ) { console.log( '%c🏁', 'font-size: large' ); return; } // 🛑

    let senderElement = document.querySelectorAll( selectorForSenderElement )[ 0 ];
    let senderName;

    if ( !senderElement ) { console.log( '%c⌛', 'font-size: large' ); return; } // 🛑

    senderName = senderElement.textContent.replace( / \[Masked\] ?/, '' ).trim();
    console.log( `%c🔥 ${ senderName }`, 'font-size: large; color: gold' );

    const senderHandlers = {
      'Blogtrottr': blogtrottrHandler,
      'daily.dev': dailyDevHandler,
      'Simkl': simklHandler,
      'Medium Daily Digest': mediumDailyDigestHandler,

      'MUO': muoHandler,
      'MUO Windows': muoHandler,
      'MUO Daily': muoHandler,
      'MUO Weekly': muoHandler,
      'MakeUseOf': muoHandler,
      'How-To Geek': muoHandler,
      'XDA': muoHandler,

      'Reddit': redditHandler,
      'Mailbrew': mailbrewHandler,
      'Recomendo': recomendoHandler,
      'Web Tools Weekly': webToolsWeeklyHandler,
    };

    if ( senderHandlers[ senderName ] ) {
      senderHandlers[ senderName ]();
    }

    document.querySelectorAll( `a` ).forEach( item => {
      item.removeAttribute( 'data-saferedirecturl' );
    } );

    const moreBtn = document.querySelector( `[aria-label="More message options"]` );
    const lgLink = document.querySelector( `[href*='&view=lg']:not(.moved)` );
    if ( moreBtn && lgLink ) {
      moreBtn.classList.add( '.marked' );
      console.log( 'xxx', moreBtn, lgLink );
      lgLink.classList.add( 'moved' );
      lgLink.style.fontSize = 'x-large';
      lgLink.style.margin = '10px';
      moreBtn.parentElement.append( lgLink );
    }

    // document.querySelector( '[style="height: 657px;"]' )?.scrollTo( 0, 150 )

    return;

  }

  if ( location.href.includes( 'view=lg' ) ) {
    main( '.maincontent hr + table b' );
    return;
  }

  let observer = new MutationObserver( () => { main( `span[name][email].gD` ); } );
  observer.observe( document.body, { childList: true, subtree: true } );

  GM_addStyle( `
        [cellpadding="3"][class]{ max-width: 33% }
        [cellpadding="3"][class] td > a' {
            position: sticky;
            top: 5px;
    }` );

} )();