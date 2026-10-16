(async function () {
  'use strict';

  const SVG = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="m334-80-74-30 58-141q-106-28-172-114T80-560v-160q0-66 47-113t113-47q22 0 42 7.5t40 15.5l238 97-160 60v60l440 280 40 200h-80l-40-80H560v160h-80v-160h-80L334-80Zm66-240h353l-63-40H400q-66 0-113-47t-47-113h80q0 33 23.5 56.5T400-440h165L320-596v-124q0-33-23.5-56.5T240-800q-33 0-56.5 23.5T160-720v160q0 100 70 170t170 70ZM211.5-691.5Q200-703 200-720t11.5-28.5Q223-760 240-760t28.5 11.5Q280-737 280-720t-11.5 28.5Q257-680 240-680t-28.5-11.5ZM400-360Z"/></svg>`;

  //  MARK: Collapsible
  const { addButton, addPopup } = await Collapsible();
  const twitterPopover = addPopup('twitter-popover');
  const twitterBtnEl = addButton('', twitterPopover);
  generateElements(SVG, twitterBtnEl);
  const nitterStatusUrl = 'https://status.d420.de/api/v1/instances';
  const result = await fetchJson(nitterStatusUrl);
  const urls = result.hosts
    .filter(h => h.rss)
    .sort((a, b) => b.points - a.points)
    .map(h => h.url);
  urls.forEach(url => {
    const linkEl = generateElements(
      `<a href="${url}" target="_blank">${url}</a>`,
      twitterPopover,
    );
    style(
      linkEl,
      `
      display: block;
      padding: 4px 8px;
      text-decoration: none;
    `,
    );
  });
  twitterBtnEl.addEventListener('click', async () => {
    const query = '#twitter-popover.collapsible-popover > a';
    await waitFor(query);
    const linkEls = document.querySelectorAll(query);
    linkEls.forEach(linkEl => {});
  });

  //* gallery-dl
  waitForEach('li', liEl => {
    if (!location.href.includes('/media?filter=photo')) return;
    addGalleryDlCheckbox(liEl);
  });

  const ARTICLE_SELECTOR = 'article[data-testid="tweet"]';
  const LOCATOR_SELECTOR = '[aria-label="More"]';
  waitForEach(`${ARTICLE_SELECTOR} ${LOCATOR_SELECTOR}`, locatorEl => {
    const parentEl = grandParent(locatorEl, 4);
    const galleryDlBtnEl = generateElements(`<button>🖼️⬇️</button>`);
    parentEl.prepend(galleryDlBtnEl);
    galleryDlBtnEl.addEventListener('click', () => {
      const grandParentEl = grandParent(parentEl, 2);
      const tweetLinkEl = grandParentEl.querySelector('time')?.closest('a');
      let tweetUrl;
      if (tweetLinkEl) {
        tweetUrl = tweetLinkEl.href;
      } else {
        tweetUrl = location.href;
      }
      invokeDownloader('gallerydl', {
        urlToDownload: tweetUrl,
        destination: 'Y:\\Pic\\gallery-dl',
        mode: 'auto-start',
      });
    });
  });

  //* Auto click 'show more'
  waitForEach('[data-testid="tweet-text-show-more-link"]', showMoreLink => {
    showMoreLink.click();
  });

  //* sets volume to a low value
  waitForEach('video,audio', mediaItem => {
    mediaItem.addEventListener('volumechange', () => {
      if (mediaItem.volume === 1) mediaItem.volume = 0.01;
    });
  });

  //* Automatically clicking 'New post notifications for ' item
  const notifQuery = '[data-testid="notification"]';
  waitForEach(notifQuery, notifEl => {
    if (!location.href.includes('#notif')) return;
    if (notifEl.textContent.includes('New post notifications for ')) {
      notifEl.click();
    }
  });

  //* video download buttons
  waitForEach('div[data-testid="videoPlayer"]', playerContainer => {
    const btnsContainerEl = generateElements(`<div></div>`, playerContainer);
    style(
      btnsContainerEl,
      `
      position: absolute;
      top: 10px;
      left: 10px;
      z-index: 9999;
      display: flex;
      gap: 8px;
    `,
    );
    btnsContainerEl.append(
      createDownloadButton('Y:\\@TOP\\twitter', 'top'),
      createDownloadButton('Y:\\@BOTTOM\\twitter', 'bottom'),
      createDownloadButton('Y:\\@ANY\\twitter', 'top'),
    );
  });

  const createDownloadButton = destination => {
    const downloadBtnEl = document.createElement('div');
    downloadBtnEl.className = 'x-dl-btn';
    downloadBtnEl.title = `Download Video to ${destination}`;

    downloadBtnEl.textContent = destination.match(/@(.)/)[1].toUpperCase();

    Object.assign(downloadBtnEl.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '32px',
      height: '32px',
      borderRadius: '9999px',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(4px)',
      transition: 'background-color 0.2s ease',
    });

    downloadBtnEl.onmouseenter = () =>
      (downloadBtnEl.style.backgroundColor = 'rgba(0, 0, 0, 0.8)');
    downloadBtnEl.onmouseleave = () =>
      (downloadBtnEl.style.backgroundColor = 'rgba(0, 0, 0, 0.6)');

    downloadBtnEl.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();

      const article = e.target.closest('article[data-testid="tweet"]');
      const linkAnchor = article?.querySelector('time')?.closest('a');

      if (!linkAnchor) {
        alert('Could not find Tweet URL');
        return;
      }

      const tweetUrl = linkAnchor.href;
      invokeDownloader('ytdlp', {
        urlToDownload: tweetUrl,
        destination: destination,
        mode: 'noprompt',
        browser: 'firefox',
        profile: '3vm341ho.default-release',
      });
      console.log('Download initiated for:', tweetUrl);
    });

    return downloadBtnEl;
  };
})();
