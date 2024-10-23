// http://www.blankwebsite.com
// https://example.com

( async function () {
    'use strict';

    const temp = await GMXmlHttpRequest( 'https://www.imdb.com/name/nm0001851/' );
    const temp2 = temp.querySelector( '[data-testid="birth-and-death-birthdate"]' ).textContent;
    alert( temp2 );


} )();
