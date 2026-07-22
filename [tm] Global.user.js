(async function () {
  ('use strict');
  if (window.top != window.self) return; //don't run on frames or iframes

  const YT_DLP_LOGO_URL =
    'https://raw.githubusercontent.com/codexophile/javascript-userscripts-public/refs/heads/new-branch/%5Btm%5D%20Global.user.js-ytdlp.png';

  //* title
  setSuffix();
  let observer = new MutationObserver(setSuffix);
  observer.observe(document.querySelector(`title`), {
    childList: true,
    subtree: true,
  });

  function setSuffix() {
    const suffix = ` - [${location.hostname}]`;
    if (document.title.includes(suffix)) return;
    document.title += suffix;
  }

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
    // width: '300px',
    // height: '50px',
    // collapsedWidth: '40px',
  });
  collapsible.collapsibleToggler.click();

  collapsible.addButton('🔝', null, () => window.scrollTo(0, 0));
  const headersPopover = collapsible.addPopup('headers-popover');
  collapsible.addButton('🇭', headersPopover);
  let iframesPopover;

  waitForEach('h,h1,h2,iframe', element => {
    switch (element.tagName) {
      case 'H':
      case 'H1':
      case 'H2':
        generateElements(
          `<div>${element.textContent}</div>`,
          headersPopover,
        ).addEventListener('click', () => {
          element.scrollIntoView();
        });
        break;
      case 'IFRAME':
        if (!iframesPopover) {
          iframesPopover = collapsible.addPopup('iframes-popover');
          collapsible.addButton('ℹ️', iframesPopover);
        }
        const iframeLinkEl = generateElements(
          `<a href=${element.src} target=_blank>${element.src}</a>`,
          iframesPopover,
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

  const ytdlpBtn = collapsible.addButton('', null, () => {
    GM_setClipboard(`initiate-ytdlp:url:${location.href}::`);
  });
  ytdlpBtn.id = 'yt-dlp-Btn';
  generateElements(`<img src="${YT_DLP_LOGO_URL}" alt="ytdlp logo">`, ytdlpBtn);

  const rssLinks = document.querySelectorAll(
    'link[rel="alternate"][type="application/rss+xml"], link[rel="alternate"][type="application/atom+xml"]',
  );
  if (rssLinks.length) {
    const rssFeedsPopover = collapsible.addPopup('rss-feeds-popover');
    collapsible.addButton('📶', rssFeedsPopover);
    addLinkToFeedReader(
      'Inoreader',
      'https://www.inoreader.com/search/feeds/',
      rssFeedsPopover,
    );
    addLinkToFeedReader(
      'Feedly',
      'https://feedly.com/i/discover?query=suggesto%2F',
      rssFeedsPopover,
    );

    rssLinks.forEach(link => {
      generateElements(
        `<a
          href='${link.href}'
          target=_blank
          style='display: block;'
        >${link.title}</a>`,
        rssFeedsPopover,
      );
    });
  }

  function addLinkToFeedReader(readerName, baseUrl, parentEl) {
    const addFeedBtnEl = generateElements(`<a>➕ ${readerName}</a>`, parentEl);
    var encodedURI = encodeURIComponent(window.location);
    addFeedBtnEl.href = `${baseUrl}${encodedURI}`;
    addFeedBtnEl.target = '_blank';
    addFeedBtnEl.style = `
        display: block;
        font-size: 14px;
      `;
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
