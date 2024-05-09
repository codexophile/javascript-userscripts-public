(function() {
'use strict';

$( `iframe` ).each( function() {
    let $this = $( this )
    let $newLink = $(  `<a href=${this.src} target=_blank>Source</a>` )
    $this.after( $newLink)
} )

})();