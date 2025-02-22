( function () {
  'use strict';

  document.addEventListener( 'keydown', doc_keyDown, false );
  document.addEventListener( 'keyup', doc_keyUp, false );
  // had to use keyup variation because a certain key combination didn't work in the other



  function doc_keyDown ( e ) {

    console.log( e.key.charCodeAt( 0 ) - 49 );

    // numbers from 1 to 9 for word hints
    if ( e.key.charCodeAt( 0 ) >= 49 && e.key.charCodeAt( 0 ) <= 57 ) {
      e.preventDefault();
      document.querySelectorAll( "div[data-test='hint-token'],[data-test='challenge-tap-token']" )[ e.key.charCodeAt( 0 ) - 49 ].click();
    }

    // backspace, space and a-z keys focuses the text area and send the pressed key again in the text area
    if ( ( e.code == "Backspace" || e.code == "Space" || ( e.key.charCodeAt( 0 ) >= 97 && e.key.charCodeAt( 0 ) <= 122 ) ) && document.getElementsByTagName( 'textarea' )[ 0 ] ) {

      var textEl = document.getElementsByTagName( 'textarea' )[ 0 ];
      textEl.focus();
      // textEl.value += e.key;
      // textEl.value = e.key;

    }

    // console.log(e.code);

    // can't speak and can't hear buttons
    if ( e.ctrlKey && e.key == 'q' ) {
      const skipBtn = document.querySelector( "[data-test=player-skip]" );
      if ( !skipBtn && skipBtn.innerText === "SKIP" ) return; // 🛑
      skipBtn.click();
    }
    // discuss button
    var discusButton = document.querySelector( "[data-test=discussion-button]" );
    if ( e.code == "KeyD" && discusButton )
      discusButton.click();

    // tab to set focus on the text area
    if ( e.code == "Tab" )
      document.getElementsByTagName( 'textarea' )[ 0 ].focus();

    // condition to check if a choice element exists
    let choiceParent;
    let choiceEls;
    if ( [ 'j', 'k', 'l', ';' ].includes( e.key ) ) {
      choiceParent = document.querySelector( `[aria-label='choice']` );
      if ( !choiceParent ) return; // 🛑
      choiceEls = document.querySelector( `[aria-label='choice']` ).children;
    }

    switch ( e.key ) {
      case 'j':
        choiceEls[ 0 ].click();
        break;
      case 'k':
        choiceEls[ 1 ].click();
        break;
      case 'l':
        choiceEls[ 2 ].click();
        break;
      case ';':
        choiceEls[ 3 ].click();
        break;
      default:
        break;
    }

  }

  function doc_keyUp ( e ) {

    // ctrl + space to speak
    if ( e.ctrlKey && e.code == "Space" )
      document.querySelectorAll( '[dir=ltr] > button' )[ 0 ].click();

    // ctrl + shift + space slow speak
    if ( e.shiftKey && e.ctrlKey && e.code == "Space" )
      document.querySelectorAll( '[dir=ltr] > button' )[ 1 ].click();

  }

} )();