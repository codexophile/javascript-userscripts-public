if ( match = location.href.match( /\?link=(.+)(\?|&|$)/ ) ) {
    waitFor( '[data-cy="add-link-button"]' ).then( ( el ) => el.click() )
    waitFor( '#add-link-input' ).then( ( el ) => {
        setTimeout( () => {
            el.value = match[ 1 ]
            setTimeout( () => {
                var eve = new Event( 'input', { bubbles: true, cancelable: true } )
                el.dispatchEvent( eve )
            }, 1000 )
            el.dispatchEvent( new KeyboardEvent( 'keydown', { 'key': 'a' } ) )
            el.dispatchEvent( new KeyboardEvent( 'keyup', { 'key': 'a' } ) )
            console.log( el )
            // $( '#btn-summarize-modal' ).click() 
        }, 1000 )
    } )
}