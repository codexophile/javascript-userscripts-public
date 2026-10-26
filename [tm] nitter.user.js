(async function () {
  'use strict';

  const metaEl = document.querySelector(`[property="og:site_name"]`);
  if (!metaEl?.getAttribute('content')?.toLowerCase().includes('nitter')) {
    return;
  }

  const { addButton } = await Collapsible();
  addButton('', undefined, () => {
    const newUrl = getTwitterUrl(location.href);
    location.href = newUrl;
  });

  function getTwitterUrl(nitterUrl) {
    const newUrl = nitterUrl
      .replace(location.host, 'twitter.com')
      .replace(/#m$/, '');
    console.log('new', newUrl);
    return newUrl;
  }

  waitForEach('.timeline-item', timelineItemEl => {
    const link = timelineItemEl.querySelector('a').href;
    addGfmsContainer(link, timelineItemEl);
  });

  waitForEach('.tweet-header', tweetHeaderEl => {
    const linkEl = tweetHeaderEl.querySelector('.tweet-date > a');
    const nweetUrl = linkEl?.href || location.href;
    addGfmsContainer(nweetUrl, tweetHeaderEl);
  });

  function addGfmsContainer(url, parentEl) {
    const toolsCntEl = generateElements(
      `
      <div
        class="gfms-container"
        data-gfms-url=${url}
      ></div>`,
      parentEl,
    );
    style(toolsCntEl, `position: absolute; top: 0; right: 0; z-index: 9999;`);
    generateElements(`<button>⬇️</button>`, toolsCntEl).addEventListener(
      'click',
      () => {
        invokeDownloader('ytdlp', {
          browser: 'firefox',
          profile: '3vm341ho.default-release',
          urlToDownload: getTwitterUrl(url),
          destination: 'Y:\\@ANY\\twitter\\',
          mode: 'noprompt',
        });
      },
    );
    generateElements(`<button>🖼️⬇️</button>`, toolsCntEl).addEventListener(
      'click',
      () => {
        invokeDownloader('gallerydl', {
          browser: 'firefox',
          profile: '3vm341ho.default-release',
          urlToDownload: getTwitterUrl(url),
          destination: 'Y:\\Pic\\gallery-dl',
          mode: 'auto-start',
        });
      },
    );
  }
})();
