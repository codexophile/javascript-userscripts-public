( function () {
    'use strict';
    if ( window.top != window.self ) return; //don't run on frames or iframes

    const API_KEY = 'AIzaSyB41uuRwzZyKBJcMPr-kyNwXBpeOcESOpU';  // Replace this with your YouTube API Key
    const regionCode = 'US';  // Adjust this according to your preferred region

    main();

    async function main () {
        const videoId = getVideoId();
        if ( !videoId ) return;
        if ( document.title.includes( '{category:' ) ) return;
        const categories = await fetchCategories();
        const categoryAndTags = await getVideoDetails( videoId, categories );
        const newContent = JSON.stringify( categoryAndTags ).replaceAll( '"', '' );
        const videoTitleEl = await waitFor( '#title.ytd-watch-metadata yt-formatted-string' );
        const videoTitle = videoTitleEl.innerText;
        const newTitle = `${ videoTitle } | ${ newContent }`;
        document.title = newTitle;
    }

    let titleObserver = new MutationObserver( main );
    titleObserver.observe( document.querySelector( 'title' ), { childList: true, subtree: true } );

} )();