(function () {
  ('use strict');
  if (window.top != window.self) return; //don't run on frames or iframes

  const MENU_BTN_SELECTOR =
    '.ytLockupViewModelMetadata :is(ytd-menu-renderer button, button-view-model button, yt-icon-button button)';
  const API_KEY = getYoutubeAPI();
  const thumbElSelectorsArr = [
    'ytd-video-renderer',
    'ytd-compact-video-renderer',
    'ytd-rich-item-renderer',
    'ytd-playlist-video-renderer',
    'a.ytp-videowall-still',
    'yt-lockup-view-model > div', // related section
    'yt-lockup-view-model .yt-lockup-view-model__content-image',
  ];
  const queryForThumbEls = thumbElSelectorsArr.join(', ');
  const menuSelectorArr = ['ytd-menu-popup-renderer'];
  const queryForMenuEls = menuSelectorArr.join(', ');
  const menuTriggerSelectorArr = ['.dropdown-trigger'];
  const queryForMenuTriggerEls = menuTriggerSelectorArr.join(', ');
  const ITEM_DIMENSIONS = '25px';

  GM_addStyle(`
      #buttonsContainerMain {
        display: none;
        a {
          text-decoration: none;
        }
      }
      :is(${queryForThumbEls}):hover #buttonsContainerMain {

        display: flex;
        flex-direction: column;

        .btns-container-row {
          display: flex;
          flex-direction: row;
          gap: 5px;

          & > * {
            font-size: 20px;
            width: ${ITEM_DIMENSIONS};
            height: ${ITEM_DIMENSIONS};
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: white;
          }
        }

      }
    `);

  //* youtube menu actions
  // waitForEach(queryForMenuTriggerEls, menuTriggerEl => {
  //   menuTriggerEl.addEventListener('click', async () => {
  //     const menuEl = document.querySelector(queryForMenuEls);
  //     const menuActionsCntEl = insertOrUpdateElement(
  //       '#menuActionsContainer',
  //       `<div id=menuActionsContainer>test</div>`,
  //       menuEl,
  //       true,
  //     );
  //     const thumbEl = menuTriggerEl.closest(queryForThumbEls);
  //     const videosLinkEl = await addLinkToVideos(thumbEl, menuActionsCntEl);
  //     console.log(videosLinkEl);
  //     videosLinkEl.style = `
  //     font-size: 20px;`;
  //   });
  // });

  //* thumbnail actions
  waitForEach(queryForThumbEls, thumbEl => {
    const isNested = thumbEl.closest(queryForThumbEls) !== thumbEl;
    if (isNested) return; // skip if it's a nested thumbnail element
    // if (thumbEl.querySelector(queryForThumbEls)) return; // skip if it has a child thumbnail element

    const btnsContainerMainEl = createButtonsContainer(thumbEl);
    const linkEl = thumbEl.querySelector('a');
    if (!linkEl) return;
    const itemUrl = linkEl.href;

    const btnsContainerRowEl01 = generateElements(
      '<div class="btns-container-row" id="row-01"></div>',
      btnsContainerMainEl,
    );

    generateElements(
      '<a id="allow-play-link">▶️</a>',
      btnsContainerRowEl01,
    ).setAttribute('href', itemUrl + '#allow-play');

    if (!location.href.match(/\/@|\/channel\//))
      addLinkToVideos(thumbEl, btnsContainerRowEl01);

    addHighResThumbButton(thumbEl, btnsContainerRowEl01);

    thumbEl.addEventListener('mouseover', () => {
      const fullResThumbBtnEl =
        btnsContainerRowEl01.querySelector('#peekFullResThumb');
      const linkToVidsEl = btnsContainerRowEl01.querySelector('#linkToVids');
      setPreviewImgHref(fullResThumbBtnEl, thumbEl);
      setLinkToVidsHref(linkToVidsEl, thumbEl);
    });

    generateElements(
      `<button>⬇️</button>`,
      btnsContainerRowEl01,
    ).addEventListener('click', () => {
      addHistoryEntry(itemUrl);
      invokeDownloader('ytdlp', {
        urlToDownload: itemUrl,
        destination: 'x:\\tiktok',
        mode: 'noprompt',
        browser: 'firefox',
        profile: '3vm341ho.default-release',
      });
    });

    generateElements(
      '<button>👎🏻</button>',
      btnsContainerRowEl01,
    ).addEventListener('click', async () => {
      const menuBtn = thumbEl.querySelector(MENU_BTN_SELECTOR);
      if (!menuBtn) throw new Error('Menu button not found');
      menuBtn.click();
      const notInterestedEl = await waitFor(
        'yt-list-item-view-model',
        'Not interested',
      );
      console.log(notInterestedEl);
      await asyncTimeout(250);
      notInterestedEl.click();
    });
  });

  function addHighResThumbButton(thumbEl, parentEl) {
    const btnEl = generateElements(`<a>🖼️</a>`);
    btnEl.id = 'peekFullResThumb';
    btnEl.target = '_blank';
    parentEl.append(btnEl);
    setPreviewImgHref(btnEl, thumbEl);
  }

  function setPreviewImgHref(btnEl, thumbEl) {
    btnEl.textContent = '⏳';
    const videoLink = thumbEl.querySelector('a');
    const videoId = getVideoIdFromLink(videoLink);
    const fullResSrc = `https://i.ytimg.com/vi_webp/${videoId}/maxresdefault.webp`;
    btnEl.href = fullResSrc;
    btnEl.textContent = '🖼️';
  }

  async function addLinkToVideos(thumbEl, parentEl) {
    const newEl = generateElements(`<a>Vid</a>`, parentEl);
    newEl.target = '_blank';
    newEl.id = 'linkToVids';
    style(newEl, `text-decoration: none;`);
    setLinkToVidsHref(newEl, thumbEl);
    newEl.addEventListener('mouseover', setLinkToVidsHref);
    return newEl;
  }

  async function setLinkToVidsHref(newEl, thumbEl) {
    newEl.textContent = '⏳';
    const linkToChannel = await getLinkToChannel(thumbEl);
    const linkToVideos = `${linkToChannel}/videos`;
    newEl.href = linkToVideos;
    newEl.textContent = 'Vid';
  }

  async function getLinkToChannel(thumbEl) {
    const linkToChannelEl = thumbEl.querySelector(
      '[href^="https://www.youtube.com/@"]',
    );
    if (linkToChannelEl) {
      const matches = linkToChannelEl.href.match(/@(.+?)(\/|$)/);
      if (!matches) return null;
      return `https://www.youtube.com/@${matches[1]}`;
    }
    const videoLinkEl = thumbEl.parentElement.querySelector('a');
    if (!videoLinkEl) return null;
    const videoId = getVideoIdFromLink(videoLinkEl);
    const channelId = await getChannelId(videoId, API_KEY);
    return `https://www.youtube.com/channel/${channelId}`;
  }

  function createButtonsContainer(parent) {
    const buttonsContainer = generateElements(
      `<div id=buttonsContainerMain></div>`,
    );
    parent.append(buttonsContainer);
    buttonsContainer.style = 'position: absolute; left: 5px; bottom: 5px;';

    return buttonsContainer;
  }

  function getVideoIdFromLink(linkEl) {
    const videoUrl = linkEl.href;
    const matches = videoUrl.match(/\/watch\?v=(.{11})/);
    if (!matches) return;
    return matches[1];
  }
})();
