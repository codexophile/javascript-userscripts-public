( async function () {
    'use strict';

    if ( location.href === 'https://www.doesthedogdie.com/categories' ) {

        let triggersArray = [];
        const locators = document.querySelectorAll( `.icon-pin-full` );
        locators.forEach( item => {
            const triggerEl = item.parentElement.parentElement.querySelector( 'a' );
            triggersArray.push( triggerEl.href.replace( 'https://www.doesthedogdie.com/', '' ) );
        } );
        console.log( triggersArray );
        GM_setClipboard( JSON.stringify( triggersArray ) );
    }

    const triggers = [ "is-there-eye-mutilation", "is-there-excessive-gore", "is-there-genital-trauma-mutilation", "does-a-head-get-squashed", "is-there-body-horror", "is-there-finger-toe-mutilation", "are-any-teeth-damaged", "is-there-shaving-cutting", "is-someone-crushed-to-death", "is-there-throat-mutilation", "is-there-amputation", "does-someone-break-a-bone", "are-there-dislocations", "are-there-jump-scares", "does-someone-vomit", "is-there-audio-gore", "is-there-on-screen-pooping", "is-someone-eaten", "is-a-trans-person-depicted-predatorily", "are-there-transphobic-slurs", "is-there-deadnaming-or-birthnaming", "are-there-flashing-lights-or-images", "is-there-shakey-cam", "are-there-sudden-loud-noises", "is-there-screaming", "is-there-blood-gore" ];

    const mainEl = document.querySelector( 'main' );

    const posterEl = document.querySelector( `.itemDetail > div:nth-child(1)` );
    const descriptionEl = document.querySelector( `.itemDetail > div:nth-child(2)` );
    const $movieDetailsContainer = $( `<div id=movie-details></div>` ).prependTo( mainEl );
    style( $movieDetailsContainer[ 0 ], `
        display: flex;
        justify-content: space-evenly;
    ` );
    $movieDetailsContainer.append( posterEl, descriptionEl );

    const $triggersContainerEl = $( `<div id=triggers-container></div>` ).insertAfter( $movieDetailsContainer );
    style( $triggersContainerEl[ 0 ], `
        display: flex;
        flex-wrap: wrap;
        justify-content: space-evenly;
    `);

    const locators = document.querySelectorAll( `.name > a` );
    locators.forEach( item => {

        item.textContent = item.textContent
            .replace( 'Is there', '' )
            .replace( 'Are there', '' )
            .replace( '?', '' );

        triggers.forEach( trigger => {
            if ( item.href.includes( trigger ) ) {
                const el = grandParent( item, 5 );
                el.style.margin = '5px';
                $triggersContainerEl.append( el );
            }
        } );
    } );

    filter();

    const commentsContainers = document.querySelectorAll( `.commentsContainer` );
    toggle( commentsContainers );
    const collapsible = await waitFor( '#collapsibleContent' );
    generateToolbarButton( 'Toggle', collapsible, null, () => {
        toggle( commentsContainers );
    } );

    function filter () {
        const toBeFiltered = document.querySelectorAll( '[data-answer="no"]' );
        toBeFiltered.forEach( element => element.style.display = 'none' );
    }

} )();