(function() {
'use strict';

$( `<button style="">💤</button>` ).appendTo( document.body ).on( 'click', () => {
    setInterval( () => {
        window.scrollBy( 0, 100 )
        window.scrollBy( 0, -100 )
    }, 1000);
} )

})();