// ==UserScript==
// @name         IMDb Actor Ages Calculator
// @description  Adds age calculation buttons to IMDb cast lists
// @match        https://www.imdb.com/title/*
// @grant        GM.xmlHttpRequest
// ==/UserScript==

( function () {
    'use strict';

    // Don't run on frames or iframes
    if ( window.top !== window.self ) return;

    // Constants
    const SELECTORS = {
        CAST_ITEM: '[data-testid="title-cast-item"]',
        ACTOR_LINK: 'a',
        BIRTH_DATE: '[data-testid="birth-and-death-birthdate"]',
        DEATH_DATE: '[data-testid="birth-and-death-deathdate"]',
        RELEASE_DATE: '[href$="/releaseinfo/"]'
    };

    const BUTTON_STATES = {
        INITIAL: '📅',
        LOADING: '⌛',
        SUCCESS: '✅',
        ERROR: '⚠️'
    };

    class AgeCalculator {
        static convertToYears ( milliseconds ) {
            return Math.floor( milliseconds / ( 1000 * 60 * 60 * 24 * 365.25 ) );
        }

        static calculateAges ( birthDate, releaseDate, deathDate = null ) {
            const today = new Date();
            const birthDateObj = new Date( birthDate );
            const releaseDateObj = new Date( releaseDate );

            const ageThen = this.convertToYears( releaseDateObj - birthDateObj );
            const wouldBeToday = this.convertToYears( today - birthDateObj );
            const ageAtDeath = deathDate ?
                this.convertToYears( new Date( deathDate ) - birthDateObj ) :
                null;

            return { ageThen, wouldBeToday, ageAtDeath };
        }
    }

    class ActorDataFetcher {
        static async fetchActorPage ( url ) {
            try {
                return await new Promise( ( resolve, reject ) => {
                    GM.xmlHttpRequest( {
                        method: 'GET',
                        url: url,
                        onload: ( response ) => {
                            if ( response.status === 200 ) {
                                const parser = new DOMParser();
                                resolve( parser.parseFromString( response.responseText, 'text/html' ) );
                            } else {
                                reject( new Error( `Failed to fetch actor page: ${ response.status }` ) );
                            }
                        },
                        onerror: () => reject( new Error( 'Network error occurred' ) ),
                    } );
                } );
            } catch ( error ) {
                throw new Error( `Failed to fetch actor data: ${ error.message }` );
            }
        }

        static extractDates ( doc ) {
            const birthDateEl = doc.querySelector( SELECTORS.BIRTH_DATE );
            const deathDateEl = doc.querySelector( SELECTORS.DEATH_DATE );

            if ( !birthDateEl ) {
                throw new Error( 'Birth date not found' );
            }

            const birthDateText = birthDateEl.textContent.replace( /^Born/, '' ).trim();
            const deathDateText = deathDateEl?.textContent.replace( /^Died/, '' ).trim() || null;

            // Year validation
            const yearRegex = /\d{4}/;
            if ( !yearRegex.test( birthDateText ) ) {
                const errorText = `Incomplete birth date information: ${ birthDateText }. Full year is required.`;
                alert( errorText );
                throw new Error( errorText );
            }

            // Optional: Additional validation for death date if present
            if ( deathDateText && !yearRegex.test( deathDateText ) ) {
                const errorText = `Incomplete death date information: ${ deathDateText }. Full year is required.`;
                alert( errorText );
                throw new Error( errorText );
            }

            return {
                birthDate: birthDateText,
                deathDate: deathDateText
            };
        }
    }

    class UIManager {
        static createAgeButton () {
            const button = document.createElement( 'button' );
            button.textContent = BUTTON_STATES.INITIAL;
            button.classList.add( 'age-calculator-button' );
            return button;
        }

        static updateButtonState ( button, state ) {
            button.textContent = BUTTON_STATES[ state ];
        }

        static displayAgeInfo ( { ageThen, wouldBeToday, ageAtDeath } ) {
            const message = [
                `Age at title release: ${ ageThen } years`,
                `Would be today: ${ wouldBeToday } years`,
                ageAtDeath ? `Age at death: ${ ageAtDeath } years` : 'Currently alive'
            ].join( '\n' );

            alert( message );
        }
    }

    async function handleButtonClick ( event, actorUrl ) {
        const button = event.target;
        UIManager.updateButtonState( button, 'LOADING' );

        try {
            // Get release date from current page
            const releaseDate = document.querySelectorAll( SELECTORS.RELEASE_DATE )[ 1 ]
                ?.textContent.replace( /\(.+?\)/, '' ).trim();

            if ( !releaseDate ) {
                throw new Error( 'Release date not found' );
            }

            // Fetch and process actor data
            const actorDoc = await ActorDataFetcher.fetchActorPage( actorUrl );
            const { birthDate, deathDate } = ActorDataFetcher.extractDates( actorDoc );

            // Calculate ages
            const ages = AgeCalculator.calculateAges( birthDate, releaseDate, deathDate );

            // Update UI
            UIManager.updateButtonState( button, 'SUCCESS' );
            UIManager.displayAgeInfo( ages );

        } catch ( error ) {
            alert( 'Error calculating age:', error );
            UIManager.updateButtonState( button, 'ERROR' );
        }
    }

    // Initialize buttons for each cast member
    function initialize () {
        document.querySelectorAll( SELECTORS.CAST_ITEM ).forEach( castItemEl => {
            const actorLink = castItemEl.querySelector( SELECTORS.ACTOR_LINK );
            if ( !actorLink ) return;

            const button = UIManager.createAgeButton();
            button.addEventListener( 'click', ( event ) =>
                handleButtonClick( event, actorLink.href ) );
            castItemEl.appendChild( button );
        } );
    }

    // Start the script
    initialize();
} )();