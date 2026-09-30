(async function () {
  'use strict';

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
    element.style.setProperty('width', '90vw', 'important');
    element.style.setProperty('max-width', '90vw', 'important');
  });
})();
