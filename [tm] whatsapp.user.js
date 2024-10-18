( function () {
    'use strict';

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