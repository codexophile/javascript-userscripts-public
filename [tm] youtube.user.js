(async function () {
  'use strict';

  (function () {
    'use strict';

    const SVGs = {
      detachRelated:
        '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="m348-292-56-56 172-172H320v-80h280v280h-80v-144L348-292Zm412-188v-280H480v-80h360v360h-80ZM200-120q-33 0-56.5-23.5T120-200v-640h80v640h640v80H200Z"/></svg>',
    };

    //* detaching related section
    GM_addStyle(`
    #related.detached {
      background: black;
      
      #header {
          position: sticky;
          top: 0;
          z-index: 1;
          background: black;
      }
      
      #contents > *:not(:is(
        yt-horizontal-list-renderer,
        ytd-reel-shelf-renderer
      )) {
          max-width: 15%;
      }
    }
  `);

    waitForEach('#related #chips', async chipsEl => {
      if (!location.href.match(/\/watch/)) return;
      const relatedEl = chipsEl.closest('#related');
      if (!relatedEl) {
        console.log('Error: Could not find #chips element in related section.');
        return;
      }
      const detachedStyleProperties = [
        'position',
        'top',
        'left',
        'z-index',
        'width',
        'height',
        'overflow-y',
      ];
      const originalStyles = Object.fromEntries(
        detachedStyleProperties.map(property => [
          property,
          {
            value: relatedEl.style.getPropertyValue(property),
            priority: relatedEl.style.getPropertyPriority(property),
          },
        ]),
      );
      const detachRelatedBtn = generateElements(
        `
        <button
          id="detachRelatedBtn"
          class="ytChipShapeChip"
        >
          ${SVGs.detachRelated}
        </button>
      `,
        chipsEl,
      );
      style(
        detachRelatedBtn,
        `
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 8px 8px 0;
        background: #292929;
        border-radius: 8px;
        border: unset;
      `,
      );
      let isDetached = false;

      detachRelatedBtn.addEventListener('click', () => {
        document.querySelector(`video`).pause();
        isDetached = !isDetached;

        if (isDetached) {
          relatedEl.style.setProperty('position', 'fixed', 'important');
          relatedEl.style.setProperty('top', '0', 'important');
          relatedEl.style.setProperty('left', '0', 'important');
          relatedEl.style.setProperty('z-index', '9999', 'important');
          relatedEl.style.setProperty('width', '100%', 'important');
          relatedEl.style.setProperty('height', '100vh', 'important');
          relatedEl.style.setProperty('overflow-y', 'scroll', 'important');
          relatedEl.classList.add('detached');
        } else {
          detachedStyleProperties.forEach(property => {
            const { value, priority } = originalStyles[property];
            if (value) {
              relatedEl.style.setProperty(property, value, priority);
            } else {
              relatedEl.style.removeProperty(property);
            }
          });
          relatedEl.classList.remove('detached');
        }

        detachRelatedBtn.setAttribute('aria-pressed', String(isDetached));
      });
      const hideUploaderCheckboxEl = generateElements(
        `
        <input
          type="checkbox"
          id="hideUploaderCheckbox"
          title="Hide videos from this uploader"
        >
      `,
        chipsEl,
      );
      hideUploaderCheckboxEl.addEventListener('change', () => {
        const thisUploader = document
          .querySelector(`#text-container.ytd-channel-name`)
          ?.textContent.trim();
        if (!thisUploader) {
          alert('Error: Could not find uploader name.');
          return;
        }
        const videoItemEls = document.querySelectorAll('yt-lockup-view-model');
        videoItemEls.forEach(videoItemEl => {
          const channelNameEl = videoItemEl.querySelector(
            "[role='text'].ytAttributedStringHost.ytContentMetadataViewModelMetadataText.ytContentMetadataViewModelMetadataTextLastPart.ytAttributedStringWhiteSpacePreWrap.ytAttributedStringLinkInheritColor:only-child",
          );
          const channelName = channelNameEl?.textContent.trim();
          if (channelName === thisUploader) {
            videoItemEl.style.display = hideUploaderCheckboxEl.checked
              ? 'none'
              : '';
          }
        });
      });
    });
  })();

  //* Fixing new youtube video metadata section under video thumbnail
  //* uploader, tagged channels, number of views, and upload date etc.
  waitForEach('.ytContentMetadataViewModelMetadataRow', metadataRowEl => {
    metadataRowEl.style.setProperty('flex-wrap', 'wrap', 'important');

    // wrapping verified badge with the channel name it belongs to
    const verifiedBadgeEls = metadataRowEl.querySelectorAll(
      '.ytIconWrapperHost.ytContentMetadataViewModelIcon[aria-label="Verified"]',
    );
    verifiedBadgeEls.forEach(verifiedBadgeEl => {
      const verifiedBadgeBelongsToEl = verifiedBadgeEl.previousElementSibling;
      createWrapperForMetadataSection(
        undefined,
        verifiedBadgeBelongsToEl,
        verifiedBadgeEl,
      );
    });

    // wrapping views count with its icon element
    const viewsCountIconEl = metadataRowEl.querySelector(
      '.ytContentMetadataViewModelLeadingIcon',
    );
    if (viewsCountIconEl) {
      const viewsCountEl = viewsCountIconEl.nextElementSibling;
      createWrapperForMetadataSection(
        undefined,
        viewsCountIconEl,
        viewsCountEl,
      );
    }
  });

  function createWrapperForMetadataSection(html = '<div></div>', ...elements) {
    const newEl = wrap(html, ...elements);
    style(
      newEl,
      `
      display: flex;
      align-items: center;
      gap: 3px;
    `,
    );
    return newEl;
  }

  //* auto click "show more" toggle buttons
  waitForEach('.expand-collapse-button', showMoreBtnEl => {
    const belongsToEl = showMoreBtnEl.closest('ytd-rich-section-renderer');
    if (belongsToEl?.querySelector('ytd-mini-game-card-view-model')) return;
    if (showMoreBtnEl.innerText.toLowerCase().includes('show more')) {
      showMoreBtnEl.click();
    }
  });

  fixUrl();
  for (const s of [
    'yt-navigate',
    'yt-navigate-start',
    'yt-page-data-fetched',
    'yt-page-data-updated',
    'yt-navigate-finish',
  ]) {
    document.addEventListener(s, fixUrl, true);
  }

  /**
   * Normalizes YouTube Shorts, live, and watch URLs without discarding the URL hash.
   *
   * @param {Event} [event] YouTube navigation event that should be stopped for redirects.
   * @returns {void}
   * @example
   * // https://www.youtube.com/watch?v=abcdefghijk#slot=2 remains unchanged in its hash.
   * fixUrl();
   */
  function fixUrl(event) {
    const currentUrl = new URL(location.href);
    const mediaMatch = currentUrl.pathname.match(/^\/(shorts|live)\/([^/]+)/);

    if (mediaMatch) {
      event?.stopPropagation();
      event?.stopImmediatePropagation();

      currentUrl.pathname = '/watch';
      currentUrl.search = '';
      currentUrl.searchParams.set('v', mediaMatch[2]);
      stopAndChangeUrl(currentUrl.href);
      return;
    }

    if (currentUrl.pathname !== '/watch') return;

    const videoID = currentUrl.searchParams.get('v');
    if (!videoID) return;

    currentUrl.search = '';
    currentUrl.searchParams.set('v', videoID);

    if (location.href !== currentUrl.href) {
      history.pushState({ state: 1 }, 'new state', currentUrl.href);
    }
  }

  GM_addStyle(`

        #buttonsContainer { display: flex }

        #buttonsContainer > * {

            width: 30px;
            height: 25px;
            line-height: 25px;
            /* making height = line-height, makes text center vertically */
            text-align: center;
            color: white;
            text-shadow: white 0px 0px 10px;

            display: block;
            border-radius: 4px;
            margin: 1px;
            border: none;
            background-color: #000000;
        }
        #buttonsContainer > *:hover {
        background: #202020;
        }
        #buttonsContainer > *:active {
            transform: matrix( 0.9, 0, 0, 0.9, 0, 2 );
        }
        #peekFullResThumb {
            text-decoration: none;
        }

    `);

  //* Toggle sidebar
  waitFor('#guide[opened]').then(() => {
    $(`#guide-button.ytd-masthead`).click();
  });

  //* @channelName links -> @channelName/videos/
  waitForEach(`[href*='/@'], [href*='/channel/']`, linkToChannelEl => {
    linkToChannelEl.href += '/videos/';
  });
  //* short links
  waitForEach(`[href*='/shorts/']`, linkToShortEl => {
    linkToShortEl.href = linkToShortEl.href.replace('/shorts/', '/watch?v=');
  });
  //* cleaning tracking params from links
  waitForEach(
    `:not(#storyboard) :is([href*="&list="],[href*="&index="],[href*="&pp="],[href*="&t="])`,
    videoLinkEl => {
      const matches = videoLinkEl.href.match(/\?v=(.{11})/);
      if (!matches) return;
      const videoID = matches[1];
      videoLinkEl.href = `https://www.youtube.com/watch?v=${videoID}`;
    },
  );

  function stopAndChangeUrl(url) {
    window.stop();
    location.replace(url);
  }

  //  MARK: CSS fixes with JavaScript
  //? adding this because stylus css fixes don't work

  //* video flex fix in 'videos' pages
  waitForEach('ytd-two-column-browse-results-renderer', element => {
    if (!location.href.match(/\/(videos|shorts)/)) return;
    element.style.setProperty('width', '100%', 'important');
    element.style.setProperty('max-width', '100%', 'important');
  });
})();
