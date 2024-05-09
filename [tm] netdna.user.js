locationHref = location.href
if( !locationHref.includes( 'https://' ) ) {
    window.stop()
    location.href = locationHref.replace( 'http://', 'https://' )
}

if( document.getElementsByTagName("h2")[0] && document.getElementsByTagName("h2")[0].innerText === 'WHOOPS, LOOKS LIKE SOMETHING WENT WRONG' ) {
    window.stop()
    location.reload()
}

if( !location.href.includes( '/f/' ) ) return // 🛑

$sibling = $( '.btn' )
$parent  = $sibling.parent()
$newDiv = $( '<div id=newDiv></div>' )
$sibling.after( $newDiv )
$newDiv.load( `${$sibling.attr( 'href' )} a.btn`, function() {
    link = $newDiv.find( 'a' ).attr( 'href' )
    $newDiv.load( `${link} a.btn`, function() {
        link = $newDiv.find( 'a' ).attr( 'href' )
        $newDiv.load( `${link} .wrapper.download`, function() {
            console.log( 'success' )
            $sibling.slideUp()
        })
                // location.href = $newDiv.find( 'a' ).attr( 'href' ) 
    } )
} )
