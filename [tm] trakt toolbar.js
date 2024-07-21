( function () {
  'use strict'

  let query = ''
  let queryClean = ''
  let episode = false
  let season = false
  let showAll = false

  let shows = false
  let seasons = false

  let movieShowTitle


  if ( location.href.includes( '/seasons/all' ) ) {
    movieShowTitle = location.href.match( /shows\/(.+?)(\/|$)/ )[ 1 ]
    query += `${ movieShowTitle }`
    showAll = true
  }
  else if ( location.href.includes( '/shows/' ) ) {
    movieShowTitle = location.href.match( /shows\/(.+?)(\/|$)/ )[ 1 ]
    const seasonNumber = location.href.match( /seasons\/(\d+?)(\/|$)/ )[ 1 ].padStart( 2, "0" )
    query += `${ movieShowTitle } (s|season) ${ seasonNumber }`
    queryClean = `${ movieShowTitle }%20s${ seasonNumber }`
  }
  else if ( location.href.includes( '/seasons' ) ) {
    showAll = false
    season = true
    movieShowTitle = location.href.match( /shows\/(.+?)(\d\d\d\d)?(\/|$)/ )[ 1 ]
    const seasonNumber = location.href.match( /seasons\/(\d+?)(\/|$)/ )[ 1 ].padStart( 2, "0" )
    query += `${ movieShowTitle } (s|season) ${ seasonNumber }`
    queryClean = `${ movieShowTitle }%20s${ seasonNumber }`
  }
  if ( location.href.includes( '/episodes' ) ) {
    episode = true
    console.log( location.href )
    const episodeNumber = location.href.match( /episodes\/(\d+?)$/ )[ 1 ].padStart( 2, "0" )
    const episodeTitle = $( '.main-title' ).text()
    query += ` (e|episode) ${ episodeNumber } ${ episodeTitle }`
    queryClean += `e${ episodeNumber }`
  }
  if ( location.href.includes( '/movies' ) ) {
    movieShowTitle = location.href.match( /movies\/((\w|\d|-)+)$/ )[ 1 ]
    movieShowTitle = movieShowTitle.replaceAll( '(', '' ).replaceAll( ')', '' )
    query = movieShowTitle
  }

  if ( location.href.includes( 'shows' ) ) shows = true
  if ( location.href.includes( 'seasons' ) ) seasons = true
  if ( location.href.includes( 'episode' ) ) episode = true

  generateToolbar()

  function generateToolbar () {

    query = query.replaceAll( ' ', '%20' )
    query = query.replaceAll( '#', '%20' )
    query = query.replaceAll( '-', '%20' )
    query = query.replaceAll( '&', '%26' )
    query = query.replaceAll( '%20%20', '%20' )

    if ( !queryClean ) queryClean = query
    const imdbHref = `https://www.google.com/search?btnI=1&q=${ query }%20site:imdb.com/title`
    const wikiHref = `https://www.google.com/search?btnI=1&q=${ query }%20site:wikipedia.org`
    const tvTrHref = `https://www.google.com/search?btnI=1&q=${ query }%20site:tvtropes.org`
    const wikisHref = `https://www.google.com/search?q=${ query }%20wiki`
    const $letterboxdHref = `https://www.google.com/search?btnI=1&q=${ query }%20site:letterboxd.com`
    const RedGDisHref = `https://www.google.com/search?&q=${ query }+discussion%20site:reddit.com`
    const RedGHref = `https://www.google.com/search?&q=${ query }%20site:reddit.com`
    const simklHref = `https://simkl.com/search/?type=movies&q=${ query }`
    const rgHref = `https://www.google.com/search?btnI=1&q=${ movieShowTitle }%20site:ratingraph.com`
    const leetHref = `https://1337x.to/search/${ queryClean }%20720p/1/`
    const tpbHref = `https://thepiratebay.org/search.php?q=${ queryClean }%20720p`
    const hrefPlot = `https://www.google.com/search?q=${ query }%20plot`
    const ytHref = `https://www.youtube.com/results?search_query=${ query }%20-reaction%20-trailer%20-review%20-"movie%20clip"`
    // leetHref   = `https://1337x.to/search/${query.replaceAll( '(s|season)%20', 's').replaceAll( '%20(e|episode)%20', 'e').replaceAll( episodeTitle.replaceAll( ' ', '%20' ), '' )}%20720p/1/`

    let $toolBar = $( `
      <div id=toolBar>
        <div id=row1></div>
        <div id=row2></div>
        <div id=row3></div>
      </div>` )
    $toolBar.appendTo( document.body )

    const imdbUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAA7AAAAOwBeShxvQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAJBSURBVFiF7ZXNS1RhFMZ/733fOzPOR8ykM5PN+JEtwkVRTAuNgmyh4EZbSSgErY3+AlduwlWL3LQoIQsSWkREuYoIcRF9SbSxRSUoLrJmdOI6Xu/b4pZjXWcaJKag+a0u5zyc57nnHrhQo0aN/x2x+KjpFMIYBR2urrNeRYgRhWASdHNVzQG0AJg0QFTffCsELerX2tx8gelZC8PQnOsJM3F/DYBIUDA8sIfLE1m0drUX+sJcv7eGYUA0IohFJCeP+kklFONTObJrmp7OAJl2f8kMngBv3hW4cjuLqQRdx+sYn8q5QglnzwS5eie3pe07Xez/IBoxmL3RyM0HeRaWbVIJWTaAUW5D27E3YebVesn+2KUYphJ8WXWYmy/81FtYtvmUdXYfQH5XPXlhAWAq4dHEo5KAz61/tfRW/drdVTrOL5EZXGTmtbW7AMl6iakET19axGMSv+kNsB3bKQbo7qwjnVBs2JrnbwsebUUBTCVIJyUrWYeWRs/ZlKV1vyIec202NrWnX1EAAbSlTICyAbR3/m+p+AgPpFzjln1yx37ecshb7qGFAsWxjqOxN91nuYNbZfsU0NroGjeX2MDFsRW0BiGgKVnU3HqY58OSDUByrze8Z9rBJpOB7hBKChqiBkO9YRqiko7DAYZ6wxw75GOgJ8R6QRMLS4Z6i78Qv09w4oiftrSivyvI55xDpt3H42cWyXpJf1fI+26L0827+HJ/DgP0x7/o/15hiEG0HkWLSJXNc1owUmXPGjVq/IN8A/EMm7iAAlAEAAAAAElFTkSuQmCC'
    const wikiUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAsQAAALEBxi1JjQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAI4SURBVEiJ3Za9a2JBFMWP72ngSaKNkN3iYWOMjYKNJF1awZAXxVJE/QcCItjZS5o87JVAINhtskrMbhECwVIstRAL20gS/ABFzxYbhs2alxVWmwzcYn4znDMX7twZAPgK4BrACABXFCMAV6/a+L5C4b/jyvTqpmA9Y2x6dVrbkNYp/jkMzH9OEokENE3DxsYGJElCrVZDu91GKpWCoijo9/vQdR2RSARerxfj8RjFYhGqqiIUCmEymeDi4gLlcvmNyZvS8vv9nE6nvLm5Eezw8JAkmc1mCYCyLPPx8ZE+n0/sub+/ZzQafa9UF+u3VCrx5eWFdrtdsNvbW7ZaLcqyzOPjY2YyGbFms9lYqVSM7sIi9Hq9JMl0Oi3YwcEBSTIWi7FWq1FRFLF2cnLCo6Oj5Q0A8O7ujt1ul2azWbCHhwcOh0PG43HBJElitVqlJEnv6hhW0dnZGZxOJ8LhsGD5fB5WqxWj0UiwYDCIarWK+XxuJPV+BrIss9PpsF6vC5bL5djr9dhsNmkymQiAl5eX3NzcNOxHhhnMZjMUCgXs7e1hf38fDocDTqcT6XQaPp8PmqbB7Xaj0+lgMBgYnt4wAwDc2tri8/Mzy+Uy8/k8d3Z2KMsyW60WG40GdV2nqqr/6qgft1xd1zmdTnl6eipYMpkkSZ6fny/Tsj/e4HK5+PT0xO3tbcEsFgu73S4DgcD/GwCgx+NZYLu7u8uI83O8B+M16o8lAD/XaPAD+P21uMLqvy3fAHz5BQbZxBV/5f6iAAAAAElFTkSuQmCC'
    const rgUri = 'https://cdn.ratingraph.com/assets/images/icon-180.png'
    const tvtrUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAohJREFUWEdjNHBN/s8wgIBx1AGkhMDJquPgyJp6QZVh0TYRqkQcUVEAsxhkI7MWP9jik1e4GbI75Cl2BF4H5Ds/YIgyfw63BGY5TODvXwYG83gtihyB0wHIvmZgY2JgVuHFaZFJDPmOwHAAIwMDwwloXCMHOSFvkusIFAdoSX1hmJ9wGWeQE3LEip2CDD2LJQkpQ5GHO0BX+jPDnPgrKJLocU6syaSEBtwBKHGOZBO5jvj/j4HBNI5w2qCZA4gNBbgD7FTfM3SH3sAayqSGgm2iGsP33yxExRhKIqRGNPjnKjI8fc9JlOUgRUQ5gNjsSGywI7sOoxwgNxTIsRwjBMBlPFIhhOxSJnEOBkZhdqxBS67lJDkAWzR0TxNiWHlMguj4xqYQa11ATDS8/Lcer8W/fv9hCEyuR1GzdVErnO8dVw1mk+QARhF2hi9c+QzfuTywWg4yFJslIMUrplUz8PJwgfUtWbuHYfnG/aQ7oPFEPkN2gj/c8sAUVB/++vUHpwNwOYyoEDBvs2TYsrCFoX3Kcoaq3CiMYEQODmSLdh88yzBh7jqwNEkOEOf7xcDI+J/hxUdEqkc2AGYhLB7R4wPdsrayJAZ9HWWwssa+xQynLiBKXKKaZCCNoBBYu/UwQ4iPHd4QwOZbXL7HmQixpbANcxsZ6nsXMbRVJBF0gJaqPEN3bRpY3Y79pxk8HE1x6iE6BLBFwerNBxkWrN6FNUcQG2VEO2DLwlaGY2euMpy/cpshJzEAZzaESVDdAatm1DJUts9huPvwOUqKRnYJeqJEdkRgcgPDr9+/MRxOdAig69TVUGToqEqBC5c0z2S4fvsRirK6ghg4v2nCEqyhRrYDsJpGhuCoAwD+1w0QP8dOSgAAAABJRU5ErkJggg=='
    const UriLeet = 'https://www.wizcase.com/wp-content/uploads/2022/10/en-1337x-logo.jpg'
    const UriTPB = 'https://cdn-icons-png.flaticon.com/512/1119/1119638.png'
    const rgDisUri = 'https://cdn-icons-png.flaticon.com/512/4053/4053291.png'
    const redGUri = 'https://cdn-icons-png.flaticon.com/512/725/725298.png'
    const uriPlot = 'https://cdn-icons-png.flaticon.com/512/3336/3336640.png'
    const ytUri = 'https://cdn-icons-png.flaticon.com/512/1383/1383260.png'

    if ( seasons && !episode ) {
      const $ratingButton = $( '<button> ⭐ </button>' ).appendTo( $toolBar )
      $ratingButton.on( 'click', function () {
        let sum = 0
        let text = ''
        let $ratings = $( '.fanart > .corner-rating' )
        let ratingIndex = 0
        $ratings.each( function () {
          ratingIndex++
          const $this = $( this )
          let ratingText = $this.text()
          text += ` + ${ ratingText }`
          sum += Number( $this.text() )
        } )
        alert( `( ${ text } ) / ${ ratingIndex } = ${ sum / $ratings.length }` )
      } )
    }

    GM_addStyle( `
  
    #toolBar a {
      margin:  3px;
      color: white;
      text-shadow:
          0.07em 0 black,
          0 0.07em black,
          -0.07em 0 black,
          0 -0.07em black;
    }
  
    .toolbarIcon {
      width : 32px;
      height: 32px;
    }
  
    ` )


    $toolBar.css( 'position', 'fixed' ).css( 'background-color', '#ed1c24' )
    $toolBar.css( 'display', 'flex' ).css( `flex-direction`, `column` )
    $toolBar.css( 'right', '30px' ).css( 'top', '150px' )
    $toolBar.children().css( 'padding', '5px' )
    $toolBar.children().css( 'text-align', 'center' )
    $toolBar.find( 'img' ).css( 'display', 'block' )

    let $row1 = $( `#row1` )
    appendItem( $row1, wikiHref, wikiUri )
    appendItem( $row1, tvTrHref, tvtrUri )
    appendItem( $row1, imdbHref, imdbUri )
    appendItem( $row1, RedGDisHref, rgDisUri, undefined, 'Reddit discussions' )
    appendItem( $row1, ytHref, ytUri )

    let $row2 = $( `#row2` )
    appendItem( $row2, wikisHref, null, 'Wikis' )
    appendItem( $row2, leetHref, UriLeet )
    appendItem( $row2, tpbHref, UriTPB )
    appendItem( $row2, RedGHref, redGUri )
    appendItem( $row2, rgHref, rgUri )

    let $row3 = $( `#row3` )
    appendItem( $row3, hrefPlot, uriPlot )
    appendItem( $row3, simklHref,
      'https://play-lh.googleusercontent.com/DliaDatmrt_M8drBtsafddTyhcxN5W3UAcpQRjoq7MViP3iwHBMegVmKIxDAjHrFACQ=w240-h480-rw',
      'SIMKL' )
    appendItem( $row3, $letterboxdHref,
      'https://play-lh.googleusercontent.com/PFcm5Ne2otuXxkCNgql_XtpHjYrlhIGGQRFaz9XLFg2wikmMP5YCv_OsvFe1PLDAvGg',
      'Ltrbxd' )

    //// $simklLink = $( `<a href=${simklHref}  target=_blank > SIMKL</a>` ).appendTo( $toolBar )
    //// $letterboxdLink = $( `<a href=${$letterboxdHref} target=_blank > Letterboxd</a>` ).appendTo( $toolBar )

  }

  function appendItem ( parent, href, imageUrl, text = '█  ', toolTip = '' ) {
    const $toolbarItem = $( `<a href=${ href } target=_blank title=${ toolTip }> ${ text } </a>` )
    $toolbarItem.appendTo( parent )
    if ( imageUrl )
      $toolbarItem.prepend( `<img class=toolbarIcon src=${ imageUrl }>` )
  }

} )()