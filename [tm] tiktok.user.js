(async function () {
  'use strict';

  const FAST_PLAYBACK_RATE = 3.5;

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
    // if (location.href.includes('/video/')) return;
    if (vidEl.playbackRate === rate) return;
    vidEl.playbackRate = rate;
  }

  //* download item button
  const query = getTiktokPostQuery();
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
        top: 40px;
        left: 10px;
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
  const { addButton, addPopup } = await Collapsible();
  addButton('⬇️', null, () => {
    let postLink = '';

    if (location.href.includes('/video/')) {
      postLink = location.href;
    } else {
      return;
    }

    initiateYtdlp(postLink);
  });

  //*

  const MAIN_CONTAINER_SELECTOR = '#user-post-item-list';

  const tiktokPopoverEl = addPopup('tiktok-popover');
  const tiktokCollapsibleButton = addButton('', tiktokPopoverEl);
  generateElements(
    '<img src="' + getFaviconUrl() + '">',
    tiktokCollapsibleButton,
  );
  addCheckboxWithLabel('hide-videos', 'Hide videos', tiktokPopoverEl, event => {
    if (event.target.checked) {
      document
        .querySelector(MAIN_CONTAINER_SELECTOR)
        .classList.add('hide-videos');
    } else {
      document
        .querySelector(MAIN_CONTAINER_SELECTOR)
        .classList.remove('hide-videos');
    }
  });

  GM_addStyle(`

    ${MAIN_CONTAINER_SELECTOR}.hide-videos {

      display: flex;
      flex-direction: raw;
      flex-wrap: wrap;

      & > div {
        width: 300px !important;
      }

      & > div:has([href*="/video/"]) {
        visibility: hidden;
        max-width: 10px;
        max-height: 10px;
        /* display: none; */
      }

    }

  `);

  //  MARK:    helpers
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
})();
