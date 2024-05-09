waitFor( '.thumbnail-img' ).then( ( el ) => {
    
    imgSrc      =  el.src
    $imgElement = $( `<img src=${imgSrc}>` )
    $imgElement.on( 'load', function() {
       
        $storyboard = createStoryboard( 10, 10, $imgElement[0] )
        $( document.body ).append( $storyboard )
        
    } )

} )

return