( function () {
    "use strict"

    if ( location.href.includes( '/search/' ) ) {
        document.querySelectorAll( `[href="/vip"]` ).forEach( item => {
            item.parentElement.style.display = 'none'
        } )
    }
    return
    if ( !document.querySelectorAll( '[href*="/vip/"][class*=info]' ) ) return // 🛑


    let snigels = document.getElementsByClassName( '.snigel' )
    let elements = document.getElementsByClassName( '.playwire' )
    let byhref = document.querySelectorAll( '[href*="/vip/"][class*=info]' )

    for ( let j = 0; j <= elements.length - 1; j++ )
        elements[ j ].parentElement.parentElement.style.display = 'none'
    for ( let k = 0; k <= snigels.length - 1; k++ )
        snigels[ j ].parentElement.parentElement.style.display = 'none'
    for ( let l = 0; l <= byhref.length - 1; l++ )
        byhref[ l ].parentElement.parentElement.style.display = 'none'


} )()