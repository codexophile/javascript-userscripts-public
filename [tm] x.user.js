(function () {
  'use strict';

  //* gallery-dl
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
        destination: 'X:\\Pic\\gallery-dl',
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
  // Add this to your userscript (assuming handleDownload is defined elsewhere)

  waitForEach('div[data-testid="videoPlayer"]', playerContainer => {
    // 3. Create the Download Button
    const btn = document.createElement('div');
    btn.className = 'x-dl-btn';
    btn.title = 'Download Video';

    // Using an SVG icon for a cleaner look that matches Twitter's UI
    btn.innerHTML = `
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="color: white;">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
    `;

    // 4. Style the button to look like a native overlay
    Object.assign(btn.style, {
      position: 'absolute',
      top: '12px',
      left: '12px',
      zIndex: '9999',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '32px',
      height: '32px',
      borderRadius: '9999px',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(4px)', // Gives it that "glass" effect Twitter uses
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
    });

    // 5. Add Hover Effects
    btn.onmouseenter = () => (btn.style.backgroundColor = 'rgba(0, 0, 0, 0.8)');
    btn.onmouseleave = () => (btn.style.backgroundColor = 'rgba(0, 0, 0, 0.6)');

    // 6. Handle Click
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();

      const article = playerContainer.closest('article[data-testid="tweet"]');
      const linkAnchor = article?.querySelector('time')?.closest('a');

      if (linkAnchor) {
        const tweetUrl = linkAnchor.href;
        const urlSegment = `url:${tweetUrl}::`;
        const destinationSegment = `dest:x:\\tw::`;
        const modeSegment = `mode:noprompt::`;
        const browserSegment = `browser:firefox::`;
        const profileSegment = `profile:3vm341ho.default-release::`;
        GM_setClipboard(
          `initiate-ytdlp:${urlSegment}${destinationSegment}${modeSegment}${browserSegment}${profileSegment}`,
        );
        console.log('Download initiated for:', tweetUrl);
      } else {
        alert('Could not find Tweet URL');
      }
    });

    // 7. Append to the player container
    playerContainer.appendChild(btn);
  });

  function handleDownload(videoElement) {}
})();
