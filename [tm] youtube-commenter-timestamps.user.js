(function () {
  ('use strict');

  const CONFIG = {
    API_KEY: getYoutubeAPI(),
    MAX_PAGES: 10, // 10 pages * 100 = up to 1000 comments scanned
    ORDER: 'relevance', // 'relevance' or 'time'
    TRIGGER_WINDOW: 1.2, // seconds tolerance around the timestamp
    AUTO_DISMISS_MS: 16000, // auto-close popups after this long
  };

  BASE_FONT_SIZE = 15;
  FONT_SIZE_L1 = BASE_FONT_SIZE + 1;
  FONT_SIZE_L2 = BASE_FONT_SIZE + 2;
  FONT_SIZE_L3 = BASE_FONT_SIZE + 5;

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

  function apiGet(endpoint, params) {
    const url =
      `https://www.googleapis.com/youtube/v3/${endpoint}?` +
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
        data = await apiGet('commentThreads', params);
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
            commentId: item.id,
            author: top.authorDisplayName,
            authorChannelUrl: top.authorChannelUrl,
            authorProfileImageUrl: top.authorProfileImageUrl,
            publishedAt: top.publishedAt,
            likeCount: top.likeCount,
            text: top.textDisplay,
            seconds: ts.seconds,
            raw: ts.raw,
            shown: false,
            dismissed: false,
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

  async function fetchReplies(commentId) {
    const replies = [];
    let pageToken = '';

    for (let page = 0; page < CONFIG.MAX_PAGES; page++) {
      const params = {
        part: 'snippet',
        parentId: commentId,
        maxResults: '100',
        textFormat: 'plainText',
        key: CONFIG.API_KEY,
      };
      if (pageToken) params.pageToken = pageToken;

      const data = await apiGet('comments', params);
      for (const item of data.items || []) {
        const reply = item.snippet;
        replies.push({
          author: reply.authorDisplayName,
          authorProfileImageUrl: reply.authorProfileImageUrl,
          publishedAt: reply.publishedAt,
          text: reply.textDisplay,
        });
      }

      pageToken = data.nextPageToken;
      if (!pageToken) break;
    }

    return replies;
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
        right: '20px',
        zIndex: '99999',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '600px',
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
      #yt-ts-popup-stack {
        --yt-ts-background: #212121;
        --yt-ts-surface: #272727;
        --yt-ts-surface-hover: #3f3f3f;
        --yt-ts-border: #3f3f3f;
        --yt-ts-text: #f1f1f1;
        --yt-ts-secondary-text: #aaa;
        --yt-ts-accent: #c5221f;
        --yt-ts-accent-hover: #d83b35;
      }
      .yt-ts-card {
        background: var(--yt-ts-background);
        border: 1px solid var(--yt-ts-border);
        border-left: 4px solid var(--yt-ts-accent);
        border-radius: 10px;
        padding: 14px 16px;
        color: var(--yt-ts-text);
        font-family: "Roboto", Arial, sans-serif;
        font-size: 14px;
        line-height: 1.4;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.45);
        animation: none;
      }
      .yt-ts-card.entering { animation: yt-ts-slide-in 0.25s ease-out; }
      .yt-ts-card.closing { animation: yt-ts-slide-out 0.25s ease-in forwards; }
      .yt-ts-controls {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-bottom: 8px;
      }
      .yt-ts-controls[hidden] { display: none; }
      .yt-ts-control {
        min-height: 32px;
        padding: 0 14px;
        border: 1px solid #606060;
        border-radius: 18px;
        background: transparent;
        color: #f1f1f1;
        cursor: pointer;
        font: 500 13px/1 "Roboto", Arial, sans-serif;
        letter-spacing: 0.01em;
        transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease;
      }
      .yt-ts-control:hover { background: var(--yt-ts-surface-hover); border-color: #777; }
      .yt-ts-control:active { background: #4a4a4a; }
      .yt-ts-control:focus-visible,
      .yt-ts-close:focus-visible {
        outline: 2px solid #8ab4f8;
        outline-offset: 2px;
      }
      .yt-ts-control:disabled {
        border-color: #4a4a4a;
        color: #777;
        cursor: wait;
        opacity: 0.75;
      }
      .yt-ts-control--destructive {
        border-color: #8d3a37;
        color: #ffb4ae;
      }
      .yt-ts-control--destructive:hover {
        background: #542a29;
        border-color: var(--yt-ts-accent-hover);
        color: #ffd8d4;
      }
      .yt-ts-progress { height: 3px; margin: 0 -16px -14px; background: #3a3a3a; }
      .yt-ts-progress-bar { height: 100%; width: 100%; background: var(--yt-ts-accent); transform-origin: left; }
      .yt-ts-header { display: flex; align-items: center; gap: 8px; }
      .yt-ts-avatar { width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0; }
      .yt-ts-name { font-size: ${BASE_FONT_SIZE}px; font-weight: 500; color: #fff; text-decoration: none; }
      .yt-ts-name:hover { text-decoration: underline; color: #ffb4ae; }
      .yt-ts-meta { font-size: ${BASE_FONT_SIZE}px; color: var(--yt-ts-secondary-text); margin-top: 1px; }
      .yt-ts-badge {
        margin-left: auto; background: #542a29; color: #ffb4ae; font-size: ${BASE_FONT_SIZE}px;
        font-weight: 600; padding: 3px 9px; border: 1px solid #8d3a37; border-radius: 12px; white-space: nowrap;
      }
      .yt-ts-text {
        font-size: ${FONT_SIZE_L2}px; line-height: 1.45; margin: 10px 0 8px; color: #e4e4e4;
        max-height: 90px; overflow-y: auto;
      }
      .yt-ts-footer {
        margin: 5px;
        display: flex;
        align-items: center;
        justify-content:
        space-between;
      }
      .yt-ts-likes { display: flex; align-items: center; gap: 5px; font-size: ${FONT_SIZE_L2}px; color: var(--yt-ts-secondary-text); }
      .yt-ts-replies-button { margin-left: auto; }
      .yt-ts-replies { border-top: 1px solid var(--yt-ts-border); margin-top: 10px; padding-top: 10px; }
      .yt-ts-reply { display: flex; gap: 8px; margin-top: 8px; }
      .yt-ts-reply:first-child { margin-top: 0; }
      .yt-ts-reply-avatar { width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0; }
      .yt-ts-reply-content { min-width: 0; }
      .yt-ts-reply-meta { color: var(--yt-ts-secondary-text); font-size: ${BASE_FONT_SIZE}px; }
      .yt-ts-reply-text { color: #ddd; font-size: ${BASE_FONT_SIZE}px; line-height: 1.35; margin-top: 2px; white-space: pre-wrap; }
      .yt-ts-close {
        width: 32px;
        height: 32px;
        margin: -4px -8px -4px 0;
        border: 0;
        border-radius: 50%;
        background: transparent;
        color: #aaa;
        cursor: pointer;
        font-size: ${FONT_SIZE_L3}px;
        line-height: 1;
        padding: 0;
      }
      .yt-ts-close:hover { background: var(--yt-ts-surface-hover); color: #fff; }
    `;
    GM_addStyle(styleText);
  }

  function showPopup(comment, video) {
    if (blockNewPopups) return;
    const stack = ensureStack();
    ensureControls();
    const existingPopup = activePopups.get(comment.id);
    if (existingPopup) {
      existingPopup.refresh();
      return;
    }

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
          <button class="yt-ts-control yt-ts-replies-button" type="button">Load replies</button>
        </div>
        <div class="yt-ts-replies" hidden></div>
        <div class="yt-ts-progress"><div class="yt-ts-progress-bar"></div></div>
      </div>
      `);
    card.className = 'yt-ts-card';
    card.classList.add('entering');
    card.addEventListener(
      'animationend',
      () => card.classList.remove('entering'),
      { once: true },
    );
    card.dataset.likeCount = String(comment.likeCount || 0);
    card.querySelector('.yt-ts-text').textContent = comment.text;

    const repliesButton = card.querySelector('.yt-ts-replies-button');
    const repliesContainer = card.querySelector('.yt-ts-replies');
    let repliesLoaded = false;
    repliesButton.addEventListener('click', async event => {
      event.stopPropagation();
      if (repliesLoaded) {
        repliesContainer.hidden = !repliesContainer.hidden;
        repliesButton.textContent = repliesContainer.hidden
          ? 'Show replies'
          : 'Hide replies';
        return;
      }

      repliesButton.disabled = true;
      repliesButton.textContent = 'Loading replies...';
      try {
        const replies = await fetchReplies(comment.commentId);
        repliesContainer.replaceChildren();
        if (replies.length === 0) {
          repliesContainer.textContent = 'No replies found.';
        } else {
          for (const reply of replies) {
            const replyEl = generateElements(`
              <div class="yt-ts-reply">
                <img class="yt-ts-reply-avatar" alt="">
                <div class="yt-ts-reply-content">
                  <div class="yt-ts-reply-meta"></div>
                  <div class="yt-ts-reply-text"></div>
                </div>
              </div>
            `);
            replyEl.querySelector('.yt-ts-reply-avatar').src =
              reply.authorProfileImageUrl;
            replyEl.querySelector('.yt-ts-reply-meta').textContent =
              `${reply.author} - ${formatDate(reply.publishedAt)}`;
            replyEl.querySelector('.yt-ts-reply-text').textContent = reply.text;
            repliesContainer.append(replyEl);
          }
        }
        repliesLoaded = true;
        repliesContainer.hidden = false;
        repliesButton.textContent = 'Hide replies';
      } catch (error) {
        console.error('[TimestampComments] replies API error', error);
        repliesContainer.textContent = 'Unable to load replies.';
        repliesContainer.hidden = false;
        repliesButton.textContent = 'Retry loading replies';
      } finally {
        repliesButton.disabled = false;
      }
    });

    const progressBar = card.querySelector('.yt-ts-progress-bar');
    let remainingMs = CONFIG.AUTO_DISMISS_MS;
    let lastFrameTime = null;
    let animationFrameId = null;
    let isHovered = false;
    let isClosed = false;

    const updateProgress = timestamp => {
      if (isClosed) return;
      if (lastFrameTime === null) lastFrameTime = timestamp;
      if (!isHovered && !video.paused) {
        remainingMs -= timestamp - lastFrameTime;
        progressBar.style.transform = `scaleX(${Math.max(remainingMs, 0) / CONFIG.AUTO_DISMISS_MS})`;
      }
      lastFrameTime = timestamp;
      if (remainingMs <= 0) {
        close();
        return;
      }
      animationFrameId = requestAnimationFrame(updateProgress);
    };

    const resetProgress = () => {
      remainingMs = CONFIG.AUTO_DISMISS_MS;
      lastFrameTime = null;
      progressBar.style.transform = 'scaleX(1)';
    };

    const pauseProgress = () => {
      resetProgress();
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    };

    const resumeProgress = () => {
      if (isClosed || isHovered || video.paused || CONFIG.AUTO_DISMISS_MS <= 0)
        return;
      if (animationFrameId === null) {
        lastFrameTime = null;
        animationFrameId = requestAnimationFrame(updateProgress);
      }
    };

    const refresh = () => {
      resetProgress();
      if (!isHovered) resumeProgress();
    };

    const close = permanently => {
      if (isClosed) return;
      isClosed = true;
      if (permanently) comment.dismissed = true;
      activePopups.delete(comment.id);
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
      video.removeEventListener('pause', pauseProgress);
      video.removeEventListener('play', resumeProgress);
      updateControls();
      card.classList.add('closing');
      setTimeout(() => card.remove(), 250);
    };

    card.addEventListener('mouseenter', () => {
      isHovered = true;
      pauseProgress();
    });
    card.addEventListener('mouseleave', () => {
      isHovered = false;
      resumeProgress();
    });
    card
      .querySelector('.yt-ts-close')
      .addEventListener('click', () => close(true));
    card.addEventListener('click', e => {
      if (e.target.closest('.yt-ts-close, .yt-ts-replies-button')) return;
      const video = document.querySelector('video');
      if (video) {
        video.currentTime = comment.seconds;
        video.play();
      }
    });

    stack.appendChild(card);
    activePopups.set(comment.id, { refresh, close });
    [...stack.querySelectorAll('.yt-ts-card')]
      .sort((a, b) => Number(b.dataset.likeCount) - Number(a.dataset.likeCount))
      .forEach(sortedCard => stack.appendChild(sortedCard));
    updateControls();
    if (CONFIG.AUTO_DISMISS_MS > 0) {
      video.addEventListener('pause', pauseProgress);
      video.addEventListener('play', resumeProgress);
      resumeProgress();
    }
  }

  const activePopups = new Map();
  let blockNewPopups = false;

  function updateControls() {
    const controls = document.getElementById('yt-ts-controls');
    if (controls) controls.hidden = activePopups.size === 0;
  }

  function ensureControls() {
    const stack = ensureStack();
    let controlsDivEl = document.getElementById('yt-ts-controls');
    if (!controlsDivEl) {
      controlsHtml = `
        <button class="yt-ts-control" type="button">Close all</button>
        <button class="yt-ts-control yt-ts-control--destructive" type="button">Close all and block</button>
      `;
      controlsDivEl = generateElements(`<div>${controlsHtml}</div>`);
      controlsDivEl.id = 'yt-ts-controls';
      controlsDivEl.className = 'yt-ts-controls';
      const [closeAllButton, blockButton] =
        controlsDivEl.querySelectorAll('button');
      closeAllButton.addEventListener('click', () => {
        for (const popup of activePopups.values()) popup.close();
      });
      blockButton.addEventListener('click', () => {
        blockNewPopups = true;
        for (const popup of activePopups.values()) popup.close();
      });
      stack.prepend(controlsDivEl);
    }
    updateControls();
  }

  function watchVideo(video, comments) {
    let previousTime = video.currentTime;

    video.addEventListener('timeupdate', () => {
      const t = video.currentTime;
      if (t < previousTime) {
        for (const comment of comments) {
          if (
            !comment.dismissed &&
            comment.seconds >= t - CONFIG.TRIGGER_WINDOW
          ) {
            comment.shown = false;
          }
        }
      }
      previousTime = t;

      for (const c of comments) {
        if (c.shown || c.dismissed) continue;
        if (Math.abs(t - c.seconds) <= CONFIG.TRIGGER_WINDOW) {
          c.shown = true;
          showPopup(c, video);
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
      comments,
    );
    watchVideo(video, comments);
  }

  injectStyles();
  init();
  document.addEventListener('yt-navigate-finish', init);
})();
