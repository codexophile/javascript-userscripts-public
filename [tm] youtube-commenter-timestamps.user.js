(function () {
  const API_KEY = getYoutubeAPI();
  // matches m:ss, mm:ss, h:mm:ss etc. Adjust as needed.
  const TIMESTAMP_RE = /\b(\d{1,2}:)?\d{1,2}:\d{2}\b/;

  async function fetchAllCommentsWithTimestamps(videoId) {
    const results = [];
    let pageToken = '';

    do {
      const url = new URL(
        'https://www.googleapis.com/youtube/v3/commentThreads',
      );
      url.searchParams.set('part', 'snippet');
      url.searchParams.set('videoId', videoId);
      url.searchParams.set('order', 'relevance'); // API's relevance sort
      url.searchParams.set('maxResults', '100');
      url.searchParams.set('textFormat', 'plainText');
      url.searchParams.set('key', API_KEY);
      if (pageToken) url.searchParams.set('pageToken', pageToken);

      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`YT API error ${res.status}: ${JSON.stringify(err)}`);
      }
      const data = await res.json();

      for (const item of data.items) {
        const top = item.snippet.topLevelComment.snippet;
        const text = top.textDisplay;
        if (TIMESTAMP_RE.test(text)) {
          results.push({
            author: top.authorDisplayName,
            text,
            likeCount: top.likeCount,
            publishedAt: top.publishedAt,
            commentId: item.snippet.topLevelComment.id,
          });
        }
      }

      pageToken = data.nextPageToken || '';
    } while (pageToken);

    return results;
  }

  async function run() {
    const videoId = getVideoId();
    if (!videoId) return;

    try {
      const timestampComments = await fetchAllCommentsWithTimestamps(videoId);
      console.log(
        `Found ${timestampComments.length} comments mentioning a timestamp:`,
        timestampComments,
      );
      // do whatever you want with them here — render a panel, log, store, etc.
    } catch (e) {
      console.error('Failed to fetch comments', e);
    }
  }

  run();
})();
