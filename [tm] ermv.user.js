( async function () {
    'use strict';

    const vidOnPage = await waitFor( `video` );
    if ( !vidOnPage.duration ) {
        vidOnPage.addEventListener( 'loadedmetadata', () => {
            main();
            return;
        } );
    }
    main();

    async function main () {
        const metaEl = document.querySelector( `[property="og:video:url"]` );
        let storyboardSrc = metaEl.content.replace( /\.m3u8$/, '.jpg' );
        if ( !storyboardSrc.includes( '.jpg' ) ) {
            const $scriptEl = $( `script:contains("sprite")` );
            const match = $scriptEl.text().match( /sprite: '(.+?)',/ );
            storyboardSrc = match[ 1 ];
        }
        const trueNoOfSlots = Math.round( vidOnPage.duration / 10 );
        const siblingEl = document.querySelector( `.video-toolbar` );
        const storyboardParent = generateElements( `<div></div>` );
        siblingEl.after( storyboardParent );
        console.log( vidOnPage.duration, trueNoOfSlots );

        await storyboard( {
            storyboardParent,
            horizontal: 5,
            vertical: Math.ceil( trueNoOfSlots / 5 ),
            vidOnPage,
            samplingFq: 10,
            trueNoOfSlots,
            imgUrls: [ storyboardSrc ]
        } );
    }
    return;

    const query = `#player-api-control_471_fluid_timeline_preview_container`;
    const thumbContainer = document.querySelector( query );
    alert( thumbContainer );

} )();