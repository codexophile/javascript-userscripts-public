const locationHref = location.href

if ( locationHref.includes( 'https://trakt.tv/' ) ) {
    if ( locationHref.includes( '/shows/' ) ) {
        const seasonNumber = locationHref.match( /seasons\/(\d+?)(\/|$)/ )[ 1 ].padStart( 2, "0" )
        GM_setValue( 'traktSeasonNumber', seasonNumber )
    }
    else if ( locationHref.includes( '/seasons' ) ) {
        const seasonNumber = locationHref.match( /seasons\/(\d+?)(\/|$)/ )[ 1 ].padStart( 2, "0" )
        GM_setValue( 'traktSeasonNumber', seasonNumber )
    }
    if ( locationHref.includes( '/episodes' ) ) {
        const episodeNumber = locationHref.match( /episodes\/(\d+?)$/ )[ 1 ].padStart( 2, "0" )
        GM_setValue( 'traktEpisodeNumber', episodeNumber )
    }
    return
}


document.getElementById( 'ratings' ).scrollIntoView()

const queryForSeasons = '#graph_show_episodes_average_rating .highcharts-markers.highcharts-scatter-series'

const season = GM_getValue( 'traktSeasonNumber' )
const episode = GM_getValue( 'traktEpisodeNumber' )
GM_deleteValue( 'traktSeasonNumber' )
GM_deleteValue( 'traktEpisodeNumber' )

let observer = new MutationObserver( () => {
    if ( !document.querySelector( queryForSeasons ) ) return // 🛑
    observer.disconnect()

    const seasonElement = document.querySelectorAll( queryForSeasons )[ season - 1 ]
    const episodeElement = seasonElement.querySelectorAll( '.highcharts-point' )[ episode - 1 ]

    //// seasonElement.style = 'outline: 0.5px solid yellow !important; border-radius: 0.25rem'
    episodeElement.style = 'outline: 0.5px solid yellow !important; border-radius: 0.25rem'

} )
observer.observe( document.body, { childList: true, subtree: true } )