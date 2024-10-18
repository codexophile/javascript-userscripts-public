( function () {
    'use strict';
    if ( window.top != window.self ) return; //don't run on frames or iframes

    const API_KEY = 'AIzaSyB41uuRwzZyKBJcMPr-kyNwXBpeOcESOpU';  // Replace this with your YouTube API Key
    const regionCode = 'US';  // Adjust this according to your preferred region
    let newTitle, interval;

    main();
    window.addEventListener( 'urlchange', main );

    async function main () {

        clearInterval( interval );

        const videoId = getVideoId();
        if ( !videoId ) return;
        const categories = await fetchCategories();
        const categoryAndTags = await getVideoDetails( videoId, categories );
        const newContent = JSON.stringify( categoryAndTags ).replaceAll( '"', '' );
        const videoTitleEl = await waitFor( '#title.ytd-watch-metadata yt-formatted-string' );
        const videoTitle = videoTitleEl.innerText;
        newTitle = `${ videoTitle } | ${ newContent }`;
        interval = setInterval( () => {
            document.title = newTitle;
        }, 1000 );


    }
    // Function to extract video ID from the URL
    function getVideoId () {
        const urlParams = new URLSearchParams( window.location.search );
        return urlParams.get( 'v' );
    }

    // Function to fetch video details (category and tags)
    async function getVideoDetails ( videoId, categories ) {
        const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${ videoId }&key=${ API_KEY }`;

        const response = await GMXmlHttpRequestAsync( apiUrl );
        const data = JSON.parse( response );
        const categoryId = data.items[ 0 ].snippet.categoryId;
        const category = categories[ categoryId ];
        const tags = data.items[ 0 ].snippet.tags;
        return { category, tags };
    }

    // Function to fetch available video categories from YouTube Data API
    async function fetchCategories () {
        const apiUrl = `https://www.googleapis.com/youtube/v3/videoCategories?part=snippet&regionCode=${ regionCode }&key=${ API_KEY }`;
        const response = await GMXmlHttpRequestAsync( apiUrl );
        const data = JSON.parse( response );
        const categories = {};
        if ( data.items && data.items.length > 0 ) {
            data.items.forEach( category => {
                categories[ category.id ] = category.snippet.title;
            } );
        }
        console.log( categories );
        return categories;
    }

} )();