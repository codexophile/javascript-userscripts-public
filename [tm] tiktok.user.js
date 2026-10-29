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
  const dataE2eArr = ['user-post-item', 'collection-item', 'user-liked-item'];
  const query = dataE2eArr.map(dataE2e => `[data-e2e="${dataE2e}"]`).join(',');
  waitForEach(query, postItemEl => {
    const actualPostItemEl = grandParent(postItemEl, 2);

    const toolsCntEl = generateElements(
      `<div class=gfms-container></div>`,
      postItemEl,
    );
    style(
      toolsCntEl,
      `
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 9999;
      `,
    );
    const downloadBtnEl = generateElements('<button>⬇️</button>', toolsCntEl);
    downloadBtnEl.addEventListener('click', () => {
      const linkToVid = postItemEl.querySelector('a').href;
      initiateYtdlp(linkToVid);
    });
    generateElements(`<button>🪚</button>`, toolsCntEl).addEventListener(
      'click',
      () => {
        const prevElsArr = prevAll(actualPostItemEl);
        prevElsArr.forEach(el => {
          el.remove();
        });
      },
    );
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
      destination: 'Y:\\@TOP\\tiktok',
      mode: 'noprompt',
      autoRetryInfoJson: true,
      //? 👇🏻
      browser: 'firefox',
      profile: '3vm341ho.default-release',
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
