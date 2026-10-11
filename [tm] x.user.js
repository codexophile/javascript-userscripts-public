(function () {
  'use strict';

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
