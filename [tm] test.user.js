// http://www.blankwebsite.com
// https://example.com

( async function () {
    'use strict';

    const doc = await GMXmlHttpRequest( 'https://www.boyfriendtv.com/videos/1255514/daddy-is-home-from-work-early/', null );
    const bftvScript = doc.querySelector( 'script[type="application/ld+json"]' );
    const durationMatches = bftvScript.textContent.match( /"duration":"PT(.+?)H(.+?)M(.+?)S"/ );
    const durationString = `${ durationMatches[ 1 ] }:${ durationMatches[ 2 ] }:${ durationMatches[ 3 ] }`;
    const durationInSeconds = toSeconds( durationString );
    if ( secondsAmount < 15 * 60 )
        item.remove();
    GM_setClipboard( durationInSeconds );


} )();
