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
    return categories;
}