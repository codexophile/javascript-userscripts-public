//* sanitizing links
let observer = new MutationObserver( () => {
	const dirtyLinks = document.querySelectorAll( `[href*='?source=']` )
	dirtyLinks.forEach( link => {
		link.href = link.href.replace( /\?source=.+/, '' )
	} )
} )
observer.observe( document.body, { childList: true, subtree: true } )


//* image gallery
const modal = new modalBox()
let allImgUrls = []
$( `picture > img` ).each( function () {
	allImgUrls.push( this.src )
} )
const gallery = slideshowGallery( ...allImgUrls )
const $toggleGalleryBtn = $( '<button>🌌</button>' ).appendTo( document.body ).on( 'click', () => {
	modal.bodyAddContent( gallery )
	modal.display()
} )
style( $toggleGalleryBtn[ 0 ], `
	position: fixed;
	left: 100px;
	top: 100px;
` )

return
main()

window.addEventListener( 'urlchange', ( info ) => { main() } )

function main () {

	waitFor( 'main article.meteredContent section' ).then( ( el ) => {
		window.stop()
		location.href = `https://12ft.io/${ location.href }`
	} )

}