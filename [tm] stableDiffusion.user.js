(function() {
'use strict';

console.log( $( `.progress` ) )
let observer = new MutationObserver( ( mutations ) => {

  mutations.forEach( () => {

    //<div class="progress" style="overflow:visible;width:2.5%;white-space:nowrap;">&nbsp;&nbsp;2% ETA: 02:54</div>
    let $element = $( `.progress` )
    if( $element.length ) {
        alert()
    }

  } )
  
} )

observer.observe( document.body, { childList: true, subtree: true } )

})();