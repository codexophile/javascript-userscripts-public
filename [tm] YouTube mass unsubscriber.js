// /**
//   * Youtube bulk unsubscribe fn.
//  * Wrapping this in an IIFE for browser compatibility.
//   */

let timer2 = setInterval( () => {
  document.title = document.getElementsByTagName(
    "ytd-subscribe-button-renderer"
  ).length
}, 100 )

let parent = document.getElementsByClassName( "buttonsDiv" )[ 0 ]
let button = GM_addElement( parent, "button", { textContent: "😀" } )
button.onclick = function () {
  let timerVar = setInterval( () => {
    if ( document.getElementById( "grid-container" ) ) {
      clearInterval( timerVar )
      let response = confirm( "Proceed unsubscribing all?" )
      if ( response ) {
        clearInterval( timer2 );
        ( async function iife () {
          // This is the time delay after which the "unsubscribe" button is "clicked"; Tweak to your liking!
          var UNSUBSCRIBE_DELAY_TIME = 500

          // /**
          //   * Delay runner. Wraps `setTimeout` so it can be `await`ed on.
          //  * @param {Function} fn
          //   * @param {number} delay
          //  */
          var runAfterDelay = ( fn, delay ) =>
            new Promise( ( resolve, reject ) => {
              setTimeout( () => {
                fn()
                resolve()
              }, delay )
            } )

          // Get the channel list; this can be considered a row in the page.
          var channels = Array.from(
            document.getElementsByTagName( `ytd-channel-renderer` )
          )
          console.log( `${ channels.length } channels found.` )

          var ctr = 0
          for ( const channel of channels ) {
            // Get the subscribe button and trigger a "click"
            channel.querySelector( `[aria-label^='Unsubscribe from']` ).scrollIntoView( false )
            channel.querySelector( `[aria-label^='Unsubscribe from']` ).click()
            await runAfterDelay( () => {
              // Get the dialog container...
              document
                .getElementsByTagName( `yt-confirm-dialog-renderer` )[ 0 ]
                // and find the confirm button...
                .querySelector( `#confirm-button` )
                // and "trigger" the click!
                .click()
              console.log( `Unsubscribed ${ ctr + 1 }/${ channels.length }` )
              document.title = `${ ctr + 1 }/${ channels.length }`
              ctr++
            }, UNSUBSCRIBE_DELAY_TIME )
          }
          location.reload()
        } )()
      }
    }
  }, 100 )
}
