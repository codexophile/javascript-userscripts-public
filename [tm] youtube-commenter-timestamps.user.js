(function () {
  ('use strict');

  const CONFIG = {
    API_KEY: getYoutubeAPI(),
    MAX_PAGES: 10, // 10 pages * 100 = up to 1000 comments scanned
    ORDER: 'relevance', // 'relevance' or 'time'
    TRIGGER_WINDOW: 1.2, // seconds tolerance around the timestamp
    AUTO_DISMISS_MS: 8000, // auto-close popups after this long
  };

  const TIMESTAMP_RE = /(?<![\d:])(\d{1,2}(?::[0-5]\d){1,2})(?![\d:])/g;

  function timeStrToSeconds(str) {
    const parts = str.split(':').map(Number);
    let seconds = 0;
    for (const p of parts) seconds = seconds * 60 + p;
    return seconds;
  }

  function extractTimestamps(text) {
    const matches = text.matchAll(TIMESTAMP_RE);
    const out = [];
    for (const m of matches) {
      const seconds = timeStrToSeconds(m[1]);
      if (seconds > 0) out.push({ raw: m[1], seconds });
    }
    return out;
  }

  function apiGet(params) {
    const url =
      'https://www.googleapis.com/youtube/v3/commentThreads?' +
      new URLSearchParams(params).toString();
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url,
        onload: res => {
          try {
            const data = JSON.parse(res.responseText);
            if (data.error) reject(data.error);
            else resolve(data);
          } catch (e) {
            reject(e);
          }
        },
        onerror: reject,
      });
    });
  }

  async function fetchTimestampComments(videoId) {
    const results = [];
    let pageToken = '';
    let page = 0;

    while (page < CONFIG.MAX_PAGES) {
      const params = {
        part: 'snippet',
        videoId,
        maxResults: '100',
        order: CONFIG.ORDER,
        textFormat: 'plainText',
        key: CONFIG.API_KEY,
      };
      if (pageToken) params.pageToken = pageToken;

      let data;
      try {
        data = await apiGet(params);
      } catch (e) {
        console.error('[TimestampComments] API error', e);
        break;
      }

      for (const item of data.items || []) {
        const top = item.snippet.topLevelComment.snippet;
        const timestamps = extractTimestamps(top.textDisplay);
        if (timestamps.length === 0) continue;

        for (const ts of timestamps) {
          results.push({
            id: item.id + '-' + ts.seconds,
            author: top.authorDisplayName,
            authorChannelUrl: top.authorChannelUrl,
            authorProfileImageUrl: top.authorProfileImageUrl,
            publishedAt: top.publishedAt,
            likeCount: top.likeCount,
            text: top.textDisplay,
            seconds: ts.seconds,
            raw: ts.raw,
            shown: false,
          });
        }
      }

      pageToken = data.nextPageToken;
      page++;
      if (!pageToken) break;
    }

    results.sort((a, b) => a.seconds - b.seconds);
    return results;
  }

  function formatDate(iso) {
    const d = new Date(iso);
    return (
      d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }) +
      ' ' +
      d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    );
  }

  function ensureStack() {
    let stack = document.getElementById('yt-ts-popup-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.id = 'yt-ts-popup-stack';
      Object.assign(stack.style, {
        position: 'fixed',
        top: '80px',
        left: '20px',
        zIndex: '99999',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '340px',
      });
      document.body.appendChild(stack);
    }
    return stack;
  }

  function injectStyles() {
    const styleText = `
      @keyframes yt-ts-slide-in {
        from { transform: translateX(120%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes yt-ts-slide-out {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(120%); opacity: 0; }
      }
      .yt-ts-card {
        background: #0f0f0f;
        border: 1px solid #303030;
        border-left: 4px solid #ff0000;
        border-radius: 12px;
        padding: 12px 14px;
        color: #f1f1f1;
        font-family: "Roboto", Arial, sans-serif;
        box-shadow: 0 4px 16px rgba(0,0,0,0.5);
        animation: yt-ts-slide-in 0.25s ease-out;
      }
      .yt-ts-card.closing { animation: yt-ts-slide-out 0.25s ease-in forwards; }
      .yt-ts-header { display: flex; align-items: center; gap: 8px; }
      .yt-ts-avatar { width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0; }
      .yt-ts-name { font-size: 13px; font-weight: 500; color: #fff; text-decoration: none; }
      .yt-ts-name:hover { text-decoration: underline; color: #ff4444; }
      .yt-ts-meta { font-size: 11px; color: #aaa; margin-top: 1px; }
      .yt-ts-badge {
        margin-left: auto; background: #ff0000; color: #fff; font-size: 11px;
        font-weight: 600; padding: 2px 8px; border-radius: 10px; white-space: nowrap;
      }
      .yt-ts-text {
        font-size: 13px; line-height: 1.4; margin: 8px 0 6px; color: #ddd;
        max-height: 90px; overflow-y: auto;
      }
      .yt-ts-footer { display: flex; align-items: center; justify-content: space-between; }
      .yt-ts-likes { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #aaa; }
      .yt-ts-close {
        background: none; border: none; color: #888; cursor: pointer;
        font-size: 16px; line-height: 1; padding: 2px 6px;
      }
      .yt-ts-close:hover { color: #fff; }
    `;
    GM_addStyle(styleText);
  }

  function showPopup(comment) {
    const stack = ensureStack();

    const card = generateElements(`
      <div>
        <div class="yt-ts-header">
          <img class="yt-ts-avatar" src="${comment.authorProfileImageUrl}" alt="">
          <div style="min-width:0;">
            <a class="yt-ts-name" href="${comment.authorChannelUrl}" target="_blank" rel="noopener">${comment.author}</a>
            <div class="yt-ts-meta">${formatDate(comment.publishedAt)}</div>
          </div>
          <span class="yt-ts-badge">@${comment.raw}</span>
          <button class="yt-ts-close" title="Close">&times;</button>
        </div>
        <div class="yt-ts-text"></div>
        <div class="yt-ts-footer">
          <div class="yt-ts-likes">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#aaa">
              <path
                d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
            </svg>
            <span>${(comment.likeCount || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>
      `);
    card.className = 'yt-ts-card';
    card.querySelector('.yt-ts-text').textContent = comment.text;

    const close = () => {
      card.classList.add('closing');
      setTimeout(() => card.remove(), 250);
    };
    card.querySelector('.yt-ts-close').addEventListener('click', close);
    if (CONFIG.AUTO_DISMISS_MS > 0) setTimeout(close, CONFIG.AUTO_DISMISS_MS);

    stack.appendChild(card);
  }

  function watchVideo(video, comments) {
    video.addEventListener('timeupdate', () => {
      const t = video.currentTime;
      for (const c of comments) {
        if (c.shown) continue;
        if (Math.abs(t - c.seconds) <= CONFIG.TRIGGER_WINDOW) {
          c.shown = true;
          showPopup(c);
        }
      }
    });
  }

  let currentVideoId = null;

  async function init() {
    const videoId = new URLSearchParams(location.search).get('v');
    if (!videoId || videoId === currentVideoId) return;
    currentVideoId = videoId;

    const video = await waitFor('video');
    const comments = await fetchTimestampComments(videoId);
    console.log(
      `[TimestampComments] ${comments.length} timestamp mentions found`,
    );
    watchVideo(video, comments);
  }

  injectStyles();
  init();
  document.addEventListener('yt-navigate-finish', init);
})();
