(async function () {
  ('use strict');
  if (window.top != window.self) return; //don't run on frames or iframes

  // const config = getPlayerConfig({
  //   functionNames: ['renderVideoPlayerV3', 'renderVideoPlayer'],
  // });
  // // config.thumbnailFallback.urlBase should now be available
  // console.log(location.href, config);

  //* Beep
  beep();
  function beep() {
    const blackListUrls = [
      'https://www.google.com/url?q=',
      'https://mail.google.com',
    ];
    if (blackListUrls.some(url => location.href.includes(url))) return; // 🛑
    if (document.hidden) return;
    GM_setClipboard(`global-document-ready-${document.title}`);
  }

  //* toolbar and toolbar buttons
  const collapsible = await Collapsible('', {
    width: '300px',
    height: '50px',
    collapsedWidth: '40px',
  });
  collapsible.collapsibleToggler.click();

  collapsible.addButton('🔝', null, () => window.scrollTo(0, 0));
  const headersPopup = collapsible.addPopup();
  collapsible.addButton('🇭', headersPopup);
  const iframesPopup = collapsible.addPopup();
  collapsible.addButton('ℹ️', iframesPopup);

  waitForEach('h,h1,h2,iframe', element => {
    switch (element.tagName) {
      case 'H':
      case 'H1':
      case 'H2':
        generateElements(
          `<div>${element.textContent}</div>`,
          headersPopup,
        ).addEventListener('click', () => {
          element.scrollIntoView();
        });
        break;
      case 'IFRAME':
        const iframeLinkEl = generateElements(
          `<a href=${element.src} target=_blank>${element.src}</a>`,
          iframesPopup,
        );
        iframeLinkEl.style.display = 'block';
        break;

      default:
        break;
    }
  });

  collapsible.addButton('🔊', null, () => {
    const text = window.getSelection().toString().replaceAll('\n', '. ');
    if (!text) return; // 🛑
    location.href = `edge-tts:${text}`;
  });

  const ytdlpBtn = collapsible.addButton('ytdlp', null, () => {
    GM_setClipboard(`initiate-ytdlp:url:${location.href}::`);
  });
  ytdlpBtn.id = 'yt-dlp-Btn';

  const rssLinks = document.querySelectorAll(
    'link[rel="alternate"][type="application/rss+xml"], link[rel="alternate"][type="application/atom+xml"]',
  );
  if (rssLinks.length) {
    const rssFeedsContainer = collapsible.addPopup();
    collapsible.addButton('📶', rssFeedsContainer);

    const addFeedBtnEl = generateElements(
      `<a>➕ Inoreader</a>`,
      rssFeedsContainer,
    );
    var encodedURI = encodeURIComponent(window.location);
    addFeedBtnEl.href = `https://www.inoreader.com/search/feeds/${encodedURI}`;
    addFeedBtnEl.target = '_blank';

    rssLinks.forEach(link => {
      generateElements(
        `<a
                        href='${link.href}'
                        target=_blank
                        style='display: block;'
                >${link.title}</a>`,
        rssFeedsContainer,
      );
    });
  }

  //* scraping meta elements
  const metaElements = document.querySelectorAll('meta');
  if (metaElements.length) {
    const metaData = [];
    metaElements.forEach(meta => {
      const metaObj = {};

      // Collect all attributes
      for (const attr of meta.attributes) {
        metaObj[attr.name] = attr.value;
      }

      if (Object.keys(metaObj).length > 0) {
        metaData.push(metaObj);
      }
    });

    // Create content container
    const metaContentContainer = document.createElement('div');

    // Display meta elements in a formatted list
    metaData.forEach((metaObj, index) => {
      const metaEntry = generateElements(
        `<div style="margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #404040;"></div>`,
        metaContentContainer,
      );

      Object.entries(metaObj).forEach(([key, value]) => {
        generateElements(
          `<div style="word-break: break-word; font-size: 12px; margin: 4px 0;">
            <strong style="color: #a0a0a0;">${key}:</strong> 
            <span style="color: #d0d0d0;">${value}</span>
          </div>`,
          metaEntry,
        );
      });
    });

    // Create button and attach VanillaDialog
    const metaBtn = collapsible.addButton('🏷️', null, () => {});
    new VanillaDialog({
      title: `Page Meta Tags (${metaData.length})`,
      content: metaContentContainer,
      mode: 'modal',
      trigger: metaBtn,
      closeOnBackdrop: true,
      closeButton: true,
    });
  }
})();
