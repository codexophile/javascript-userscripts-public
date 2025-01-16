( function () {
  'use strict';

  const USER_TIMEZONE_MAP = {
    'Kevin Andrés': 'America/Guayaquil',
    'Ravi Tissera': 'Europe/Paris',
    'Chathun Hashan Komasaru': 'Europe/London',
    'Vidyuth Rajan': 'Asia/Muscat',
    'Gelo Santos': 'Asia/Dubai',
    'Pasi': 'Australia/Perth',
    'Hans Ignacio': 'Asia/Manila',
    'Rajitha': 'Australia/Melbourne'
  };

  function getUserName () {
    const profileNameParentEl = document.querySelector( '[title="Profile details"]+[role=button]' );
    if ( !profileNameParentEl ) return;

    const profileNameEl = profileNameParentEl.querySelector( '[dir="auto"]' );
    if ( !profileNameEl ) return;

    return profileNameEl.textContent;
  }

  function updateUserTime () {

    const profileNameParentEl = document.querySelector( '[title="Profile details"]+[role=button]' );
    if ( !profileNameParentEl ) return;

    const userName = getUserName();
    if ( !userName ) return;

    const userTimezone = USER_TIMEZONE_MAP[ userName ];
    if ( !userTimezone ) return;

    try {
      const userTime = getTimezoneDateTime( userTimezone ).fullDateTime;

      let userTimeEl = document.getElementById( 'user-time' );
      if ( !userTimeEl ) {
        userTimeEl = document.createElement( 'div' );
        userTimeEl.id = 'user-time';
        profileNameParentEl.appendChild( userTimeEl );
      }

      userTimeEl.textContent = `${ userTimezone } - ${ userTime }`;
    } catch ( error ) {
      console.error( `Failed to update time for ${ userName }:`, error );
    }
  }

  // Use requestAnimationFrame for more efficient periodic updates
  function startUserTimeUpdates () {
    let lastUpdateTime = 0;

    function checkAndUpdateTime ( currentTime ) {
      // Update every second (1000 ms)
      if ( currentTime - lastUpdateTime >= 1000 ) {
        updateUserTime();
        lastUpdateTime = currentTime;
      }

      requestAnimationFrame( checkAndUpdateTime );
    }

    requestAnimationFrame( checkAndUpdateTime );
  }

  // Start the updates
  startUserTimeUpdates();

  //* Local time for message items
  waitForEach( '[data-pre-plain-text] [aria-hidden]', ( timestampEl ) => {
    try {

      const userName = getUserName();
      if ( !userName ) return;

      const userTimezone = USER_TIMEZONE_MAP[ userName ];
      if ( !userTimezone ) return;

      const grandParentEl = grandParent( timestampEl, 4 );
      const timestampDisplayEl = grandParentEl.querySelector( '[dir=auto]:not(.copyable-text)' );

      const originalTimestamp = timestampDisplayEl.textContent;
      const newTimestamp = convertTimeToTimezone( originalTimestamp, 'Asia/Colombo', userTimezone );

      timestampDisplayEl.textContent = `${ timestampDisplayEl.textContent } • ${ newTimestamp }`;
      timestampDisplayEl.parentElement.parentElement.style.marginTop = 'unset';
    } catch ( error ) {
      console.log( error );
    }
  } );

  //* keyboard shortcut for translation
  document.addEventListener( 'keydown', async function ( event ) {
    if ( !( event.altKey && event.key === 'r' ) ) return;
    event.preventDefault();

    const inputBoxEl = document.querySelector( 'footer .lexical-rich-text-input' );
    const inputText = inputBoxEl.textContent;
    const translationObj = await getTranslation( inputText, 'es' );
    console.log( translationObj );
    alert( translationObj.translatedText );
  } );

  //* Auto exiting when inactive
  return;

  let amountOfMinutes = 5;
  var time;

  function logout () {
    location.href = 'about:blank';
  }

  function resetTimer () {
    clearTimeout( time );
    time = setTimeout( logout, amountOfMinutes * 60 * 1000 );
  }

  document.onload = resetTimer;
  document.onmousemove = resetTimer;
  document.onmousedown = resetTimer; // touchscreen presses
  document.ontouchstart = resetTimer;
  document.onclick = resetTimer; // touchpad clicks
  document.onkeydown = resetTimer; // onkeypress is deprecated
  document.addEventListener( 'scroll', resetTimer, true ); // improved; see comments

  document.addEventListener( 'keydown', function ( event ) {


    // switch ( event.code ) {

    //     case 'Space':
    //         // event.preventDefault()
    //         console.log( event.metaKey );
    //         $( '[data-testid="compose-box"] [contenteditable="true"]' ).focus();
    //         break;

    //     case 'ArrowUp':
    //         $messageItems = $( `[data-testid="conversation-panel-messages"] .focusable-list-item` );
    //         console.log( $messageItems );
    //         if ( !$( document.activeElement ).is( $messageItems ) )
    //             $messageItems.last().parent().focus();
    //         break;

    //     case 'PageUp':
    //         $( '[aria-label="Chat list"]' ).focus();
    //         console.log( document.activeElement );
    //         break;

    // }

    if ( !event.altKey ) return; // 🛑

    switch ( event.key ) {

      case "d": // next
        event.preventDefault();
        console.log( 'xxxx' );
        $( '[aria-label*="unread message"]' ).first().click();
        break;
    }


  } );

  window.onblur = function () { };

} )();