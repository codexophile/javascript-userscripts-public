( function () {
  'use strict'

  if ( location.href.includes( '/promo/buyonline' ) )
    location.href = 'https://myslt.slt.lk/'

  waitFor( ".slider-wrapper" ).then( () => main() )
  window.addEventListener( 'urlchange', () => main() )

  function main () {


    if ( location.href != 'https://myslt.slt.lk/boardBand/summary' ) return

    $( "li.slide" ).eq( 0 ).before( $( "li.slide" ).eq( 1 ) ) // Swaps two elements

    let newSlide = $( "li.slide" ).eq( 1 ).clone()
    $( newSlide ).addClass( "newSlide" )
    $( newSlide ).appendTo( "ul.slider" )
    $( ".newSlide .name" ).text( "Off-peak" )

    let regex = /(\d+\.\d+) GB USED OF (\d+\.\d+) GB/

    let Total = $( ".used-of" ).eq( 0 ).text()
    let usedTotal = Total.match( regex )[ 1 ]
    let totalTotal = Total.match( regex )[ 2 ]

    let Peak = $( ".used-of" ).eq( 1 ).text()
    let usedPeak = Peak.match( regex )[ 1 ]
    let totalPeak = Peak.match( regex )[ 2 ]

    let usedOffPeak =
      Math.round( ( usedTotal - usedPeak + Number.EPSILON ) * 100 ) / 100
    let totalOffPeak = totalTotal - totalPeak

    percentOffPeak = Math.round( ( ( ( totalOffPeak - usedOffPeak ) / totalOffPeak ) * 100 + Number.EPSILON ) * 100 ) / 100

    $( ".progress-count" ).eq( 2 ).text( percentOffPeak + "%" )
    $( ".used-of" ).eq( 2 ).text( `${ usedOffPeak } / ${ totalOffPeak }` )

    // Moving the mid bar to the nav above

    $( 'button' ).css( 'position', 'unset' )
    $( '.function-box-wrapper' ).css( 'width', 'unset' )

    let midBar = $( '.package-functions' ).eq( 0 )
    let labels = $( '.pkg-details' )
    midBar.css( 'width', 'fit-content' )
    labels.css( 'width', 'unset' )
    labels.css( 'padding', '0px 10px' )
    $( '.pkg-details p' ).css( 'width', 'max-content' )
    let nav = $( 'nav' ).eq( 0 ).append( midBar )
    nav.css( 'display', 'flex' )

    $( newSlide.find( 'circle' )[ 1 ] ).attr( 'stroke-dashoffset', 0 )
    $( newSlide.find( 'circle' )[ 1 ] ).attr( 'stroke-dasharray', percentOffPeak * 63 / 10 )

  }

} )()