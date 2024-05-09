var time;
let amountOfMinutes = 5;

$chatList = $( '[aria-label="Chat list"]' )

function logout() {
    location.href = 'about:blank'
}

function resetTimer() {
    clearTimeout(time);
    time = setTimeout( logout, amountOfMinutes * 60 * 1000 )
}

document.onload       = resetTimer;
document.onmousemove  = resetTimer;
document.onmousedown  = resetTimer; // touchscreen presses
document.ontouchstart = resetTimer;
document.onclick      = resetTimer; // touchpad clicks
document.onkeydown    = resetTimer; // onkeypress is deprectaed
document.addEventListener('scroll', resetTimer, true); // improved; see comments

GM_addStyle( `[role=region] > div:focus {
                border-width: 1px;
                border-style: solid !important;
                border-color: red !important;
              }` );

document.addEventListener( 'keydown', function( event ) {
    
    switch( event.code ) {

        case 'Space':
            // event.preventDefault()
            console.log( event.metaKey )
            $( '[data-testid="compose-box"] [contenteditable="true"]' ).focus()
            break
        
        case 'ArrowUp':
            $messageItems = $( `[data-testid="conversation-panel-messages"] .focusable-list-item` )
            console.log( $messageItems )
            if( !$( document.activeElement ).is( $messageItems ) )
                $messageItems.last().parent().focus()
            break

        case 'PageUp':
            $( '[aria-label="Chat list"]' ).focus()
            console.log( document.activeElement )
            break
            
    }
} )

window.onblur = function() {}