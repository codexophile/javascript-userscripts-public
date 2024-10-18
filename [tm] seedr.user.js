( function () {
  'use strict';

  if ( !location.href.includes( '?link=' ) ) return; // 🛑

  const matches = location.href.match( /\?link=(.*$)/ );
  if ( !matches ) return; // 🛑
  const magnetLink = decodeURI( matches[ 1 ] );

  const inputEl = document.querySelector( '#link-upload-text input' );
  inputEl.value = magnetLink;
  document.querySelector( '#upload-button' ).click();

  setTimeout( () => {
    location.href = 'https://www.seedr.cc';
  }, 1000 );

} )();