( function () {
  'use strict';



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

} )();