(async function () {
  'use strict';

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

  function fixUrl(event) {
    const locationHref = location.href;
    const liveOrShortMatch = locationHref.match(/\/(shorts|live)\//);

    if (liveOrShortMatch && event) {
      event.stopPropagation();
      event.stopImmediatePropagation();
    }

    if (liveOrShortMatch) {
      let href = location.href;
      href = href.replace(liveOrShortMatch[0], '/watch?v=');
      stopAndChangeUrl(href);
    }

    //? regex -> https://www.youtube.com/watch
    if (locationHref.match(/https:\/\/www\.youtube\.com\/watch/)) {
      const videoID = locationHref.match(/[\?&]v=(...........)/)[1];

      let hashSlots = locationHref.match(/#slot=\d+?($|#)/);
      hashSlots = hashSlots ? hashSlots[0] : '';
      const newUrl = `https://www.youtube.com/watch?v=${videoID}${hashSlots}`;

      if (location.href !== newUrl) {
        history.pushState({ state: 1 }, 'new state', newUrl);
      }
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

  //* reddit links
  // waitForEach( `[href^="https://www.reddit"], [href^="https://reddit"]`, ( linkEl ) => {
  //   linkEl.href = linkEl.href.replace( 'https://reddit', 'https://old.reddit' );
  //   linkEl.href = linkEl.href.replace( 'https://www.reddit', 'https://old.reddit' );
  // } );

  //* video flex fix in 'videos' pages
  //? adding this because stylus css fix doesn't work
  waitForEach('ytd-two-column-browse-results-renderer', element => {
    if (!location.href.match(/\/videos|\/shorts/)) return;
    element.style.width = 'unset !important';
    element.style.maxWidth = 'unset !important';
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
})();
