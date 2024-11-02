( function () {
    'use strict';
    if ( window.top != window.self ) return; //don't run on frames or iframes

    document.querySelectorAll( `[data-testid="title-cast-item"]` ).forEach( castItemEl => {
        generateElements( `<button>📅</button>`, castItemEl ).addEventListener( 'click', async ( event ) => {
            const actorUrl = castItemEl.querySelector( `a` ).href;
            event.target.textContent = '⌛';
            try {
                const result = await getActorAge( actorUrl );
                event.target.textContent = '✅';
                alert( `
                    Age at title release: ${ result[ 0 ] } years
                    Age at death: ${ result[ 1 ] } years
                    Age now: ${ result[ 2 ] } years
                ` );
            } catch {
                event.target.textContent = '⚠️';
            }
        } );
    } );

    async function getActorAge ( actorUrl ) {

        const actorDoc = await GMXmlHttpRequest( actorUrl );
        const birthdayElQuery = `[data-testid="birth-and-death-birthdate"]`;
        const deathDayElQuery = `[data-testid="birth-and-death-deathdate"]`;

        const birthDay = actorDoc.querySelector( birthdayElQuery ).textContent.replace( /^Born/, '' ).trim();
        const deathDay = actorDoc.querySelector( deathDayElQuery )?.textContent.replace( /^Died/, '' ).trim();
        const titleReleaseDay = document.querySelectorAll( '[href$="/releaseinfo/"]' )[ 1 ].textContent.replace( /\(.+?\)/, '' ).trim();
        const today = new Date();

        const birthDayObj = new Date( birthDay );
        const titleReleaseDayObj = new Date( titleReleaseDay );
        const deathDayObj = new Date( deathDay );

        const ageThen = convertToYears( titleReleaseDayObj - birthDayObj );
        const ageNow = convertToYears( today - birthDayObj );
        const ageAtDeath = convertToYears( deathDayObj - birthDayObj );

        return [ ageThen, ageAtDeath, ageNow ];

        function convertToYears ( DateObj ) {
            return Math.floor( ( DateObj ) / ( 1000 * 60 * 60 * 24 * 365.25 ) );
        }

    }

} )();