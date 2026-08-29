(async function () {
  'use strict';

  const FAST_PLAYBACK_RATE = 3;

  //* auto speedup preview videos
  waitForEach('a video', previewVidEl => {
    previewVidEl.addEventListener('play', () => {
      setPlaybackRate(previewVidEl, FAST_PLAYBACK_RATE);
    });
    previewVidEl.addEventListener('ratechange', () => {
      setPlaybackRate(previewVidEl, FAST_PLAYBACK_RATE);
    });
  });

  function setPlaybackRate(vidEl, rate = 3) {
    if (location.href.includes('/video/')) return;
    if (vidEl.playbackRate === rate) return;
    vidEl.playbackRate = rate;
  }

  //* download item button
  waitForEach('[data-e2e="user-post-item"]', postItemEl => {
    const downloadBtnEl = generateElements('<button>⬇️</button>', postItemEl);
    downloadBtnEl.style.position = 'absolute';
    downloadBtnEl.style.top = '5px';
    downloadBtnEl.style.right = '5px';
    downloadBtnEl.style.zIndex = 9999;
    downloadBtnEl.addEventListener('click', () => {
      const linkToVid = postItemEl.querySelector('a').href;
      initiateYtdlp(linkToVid);
    });
  });

  //* download button (yt-dlp)
  const { addButton } = await Collapsible();
  addButton('⬇️', null, () => {
    let postLink = '';

    if (location.href.includes('/video/')) {
      postLink = location.href;
    } else {
      return;
    }

    initiateYtdlp(postLink);
  });

  function initiateYtdlp(url) {
    invokeDownloader('ytdlp', {
      urlToDownload: url,
      destination: 'x:\\tiktok',
      mode: 'noprompt',
      //? 👇🏻
      // browser: 'firefox',
      // profile: '3vm341ho.default-release',
    });
    addHistoryEntry(url);
  }

  // function invokeYtdlp(link) {
  //   const urlSegment = `url:${link}::`;
  //   const destinationSegment = `dest:x:\\tiktok::`;
  //   const modeSegment = `mode:noprompt::`;
  //   GM_setClipboard(
  //     `initiate-ytdlp:${urlSegment}${destinationSegment}${modeSegment}`,
  //   );
  //   addHistoryEntry(link);
  // }
})();
