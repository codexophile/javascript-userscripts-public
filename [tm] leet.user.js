// Adding append to search query buttons
let button720p = $( `<button> 720p     </button>` ).on( 'click', appendToSearchQuery )
let buttonComplete = $( `<button> Complete </button>` ).on( 'click', appendToSearchQuery )
let buttons01e01 = $( `<button> s01e01   </button>` ).on( 'click', appendToSearchQuery )

$( '.search-box' ).append( button720p, buttonComplete, buttons01e01 )

function appendToSearchQuery ( event ) {
    let currentUrl = location.href
    const regex = /search\/(.*?)\//
    let result = currentUrl.match( regex )
    let newQuery = `${ result[ 1 ] } ${ event.target.innerText }`
    location.href = location.href.replace( regex, `search/${ newQuery }/` )
}

// Rest
let href = location.href

if ( href.includes( '/torrent/' ) ) {
    $magnetLink = $( 'ul:not(.dropdown-menu) > li > [href*=magnet]' )
    createSeedrLink( $magnetLink )
}

if ( href.includes( '/search/' ) ) {

    let $torrentLinks = $( `[href*='/torrent/']` ).each( function () {

        let $this = $( this )
        let $newDiv = $( `<div class='newDiv' style="width: 10%"></div>` ).appendTo( $this.parent() ).
            load( `${ this.href } ul:not(.dropdown-menu) > li > [href*=magnet]`, () => {
                let magnet = $newDiv.find( 'a' )
                magnet.text( '🧲' )
                magnet.children().remove()
                magnet.css( `padding`, `unset` )
                magnet.css( `width`, `50%` )
                createSeedrLink( magnet )
            } )

        let parentCell = $this.parent()
        parentCell.css( `display`, `flex` ).css( `width`, `unset` ).css( `justify-content`, `space-between` )

    } )

}

function createSeedrLink ( $originalMagnet ) {

    link = $originalMagnet.attr( 'href' )
    $originalMagnet.after( `
        <a id=seedrLink href=https://www.seedr.cc/files?link=${ link } target=_blank>
            <img src="https://static.seedr.cc/images/seed_v2.png">
        </a>` )
    $seedrLink = $( '#seedrLink' )
    $seedrLink.addClass( $originalMagnet.attr( 'class' ) )

    $originalMagnet.parent().css( `display`, `flex` )
    $seedrLink.css( `width`, `50%` ).css( `margin`, `6px` )
    $seedrLink.css( 'box-sizing', 'border-box' )
    $seedrLink.css( 'padding', 'unset' )

}