waitFor( '[style^=left] [style^="background-image"]' ).then( ( el ) => { 

    let storyBUrl = el.style.backgroundImage.match( /"(.*)"/ )
    storyBUrl     = storyBUrl[1]

    $imgElement = $( `<img src=${storyBUrl}>` )
    $imgElement.on( 'load', function() {
        
        let $storyBParent = $( '#watch_feed > div > div:first-child > :first-child > :first-child' )
        $storyBParent.parent().parent().css( `height`, `unset` ).css( `max-height`, `unset` )
        $storyBParent.css( `flex-wrap`, `wrap` )
        $storyBParent.children().css( `height`, `80vh` )
        console.clear()
        console.log( $storyBParent )
        
        $storyboard = createStoryboard( 10, 10, $imgElement[0], null, true )
        $storyBParent.append( $storyboard )
        
    } )
    
 } )