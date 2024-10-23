( function () {
    'use strict';
    if ( window.top != window.self ) return; //don't run on frames or iframes

    document.querySelectorAll( `[data-testid="title-cast-item"]` ).forEach( castItemEl => {
        generateElements( `<button>📅</button>`, castItemEl ).addEventListener( 'click', async ( event ) => {
            const actorUrl = castItemEl.querySelector( `a` ).href;
            const result = await getActorAge( actorUrl );
            alert( result );
        } );
    } );

    async function getActorAge ( actorUrl ) {
        const actorDoc = await GMXmlHttpRequest( actorUrl );
        const birthdayElQuery = `[data-testid="birth-and-death-birthdate"]`;
        const birthDay = actorDoc.querySelector( birthdayElQuery ).textContent.replace( /^Born/, '' ).trim();
        const titleReleaseDay = document.querySelectorAll( '[href$="/releaseinfo/"]' )[ 1 ].textContent.replace( /\(.+?\)/, '' ).trim();
        const birthDayObj = new Date( birthDay );
        const titleReleaseDayObj = new Date( titleReleaseDay );
        const age = Math.floor( ( titleReleaseDayObj - birthDayObj ) / ( 1000 * 60 * 60 * 24 * 365.25 ) );
        return age;
    }

} )();