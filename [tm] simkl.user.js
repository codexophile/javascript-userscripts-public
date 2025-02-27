( async function () {
  'use strict';

  const { addElement } = await Collapsible();

  addYtsBtn();

  const episodeRegex = /\/season-(\d+)\/episode-(\d+)/;
  const matches = location.href.match( episodeRegex );
  if ( !matches ) return; // 🛑

  const buttonOriginal = document.getElementsByClassName( `SimklTVDetailEpisodeSeriesfakeflexbtn` )[ 0 ];
  const buttonLeet = buttonOriginal.cloneNode( true );
  buttonOriginal.after( buttonLeet );

  const showName = document.getElementsByClassName( `SimklTVDetailSeriesTitleLink` )[ 0 ].innerText;
  const seasonN = matches[ 1 ].padStart( 2, 0 );
  const episodeN = matches[ 2 ].padStart( 2, 0 );

  buttonLeet.onclick = () => {
    window.open( `https://1337x.to/search/${ showName }%20S${ seasonN }E${ episodeN }%20720p/1/` );
  };

  function addYtsBtn () {
    const imdbId = getImdbId();
    if ( !imdbId ) return; // 🛑

    const ytsFaviconUrl = `https://www.google.com/s2/favicons?sz=64&domain=yts.mx`;
    const ytsLinkEl = generateElements( `<a><img src=${ ytsFaviconUrl }></a>` );
    ytsLinkEl.className = 'button-like';
    ytsLinkEl.href = `https://yts.mx/browse-movies${ getImdbId() }`;
    ytsLinkEl.target = '_blank';
    addElement( ytsLinkEl );

  }

  function getImdbId () {
    const imdbLinkEl = document.querySelector( `[href^="https://www.imdb.com/title/tt"]` );
    if ( !imdbLinkEl ) {
      alert( 'No IMDb link found' );
      return;
    }
    return imdbLinkEl.href.match( /\/tt.+[$\/]/ )[ 0 ];
  }

} )();