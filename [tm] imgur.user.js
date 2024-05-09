(function() {
'use strict';

if( $( 'body > pre:only-child' ).text() === '{"data":{"error":"Imgur is temporarily over capacity. Please try again later."},"success":false,"status":403}' )
{
    let segment = location.href.match( /imgur\.com(.+)/ )[1]
    location.href = `https://imgur-com.translate.goog${segment}?_x_tr_sl=auto&_x_tr_tl=en&_x_tr_hl=en-US`
}

})();