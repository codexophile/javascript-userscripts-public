if ( !location.href.includes( '?link=' ) ) return // 🛑

link = location.href.match( /\?link=(.*$)/ )
link = decodeURI( link[ 1 ] )
$( '#link-upload-text input' ).val( link )
$( '#upload-button' ).click()
setTimeout( () => {
  location.href = 'https://www.seedr.cc'
}, 1000 )
//     }, 5000);
// } )

return
waitFor( '#account-image' ).then( ( el ) => { } )