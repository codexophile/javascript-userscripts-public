(async function () {
  ('use strict');
  if (window.top != window.self) return; //don't run on frames or iframes

  const YT_DLP_LOGO_URL =
    'https://raw.githubusercontent.com/codexophile/javascript-userscripts-public/refs/heads/new-branch/%5Btm%5D%20Global.user.js-ytdlp.png';

  //* title

  const BLACKLIST = ['www.temu.com'];

  setSuffix();
  let observer = new MutationObserver(setSuffix);
  observer.observe(document.querySelector(`title`), {
    childList: true,
    subtree: true,
  });

  function setSuffix() {
    const locationHost = location.host;
    if (BLACKLIST.includes(locationHost)) return;
    const suffix = ` - [${locationHost}]`;
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
    //? 👇🏻 tab is in background
    if (document.hidden) return;
    //? 👇🏻 browser window is either not focused or minimized
    if (document.hasFocus()) return;
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

  waitForEach('h,h1,h2,h3,h4,h5,h6,iframe', element => {
    switch (element.tagName) {
      case 'H':
      case 'H1':
      case 'H2':
      case 'H3':
      case 'H4':
      case 'H5':
      case 'H6':
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

  // collapsible.addButton('🔊', null, () => {
  //   const text = window.getSelection().toString().replaceAll('\n', '. ');
  //   if (!text) return; // 🛑
  //   location.href = `edge-tts:${text}`;
  // });

  //* toggle mute
  const BTN_ID = 'tab-audio-toggle-btn';
  GM_addStyle(`
    #${BTN_ID} {
      background: #2b2b2b;
      color: #fff;
      font-size: 20px;
      line-height: 1;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      opacity: 0.85;
      transition: opacity 0.15s ease, transform 0.1s ease;
      user-select: none;
    }
    #${BTN_ID}:hover {
      opacity: 1;
      transform: scale(1.05);
    }
    #${BTN_ID}.muted {
      background: #b23a3a;
    }
  `);
  const toggleMuteBtn = collapsible.addButton('', null);
  toggleMuteBtn.id = BTN_ID;
  toggleMuteBtn.type = 'button';

  function render(isMuted) {
    toggleMuteBtn.textContent = isMuted ? '🔇' : '🔊';
    toggleMuteBtn.classList.toggle('muted', !!isMuted);
    toggleMuteBtn.title = isMuted
      ? 'Tab muted — click to unmute'
      : 'Tab audible — click to mute';
  }

  function refreshState() {
    GM_audio.getState(function (state) {
      if (!state) {
        console.error('[Tab Audio Toggle] failed to read audio state');
        return;
      }
      render(!!state.isMuted);
    });
  }

  toggleMuteBtn.addEventListener('click', function () {
    const currentlyMuted = toggleMuteBtn.classList.contains('muted');
    GM_audio.setMute({ isMuted: !currentlyMuted }, function (err) {
      if (err) {
        console.error('[Tab Audio Toggle] setMute failed:', err);
        return;
      }
      // Trust the state-change listener to update UI, but refresh
      // immediately too in case the listener is slow/unavailable.
      refreshState();
    });
  });

  // Keep the button in sync if muted/unmuted from elsewhere
  // (browser mute button, another extension, tab capture, etc.)
  GM_audio.addStateChangeListener(function (e) {
    if ('muted' in e) {
      render(!!e.muted);
    }
  });

  refreshState();

  //* ytdlp
  const ytDlpPopover = collapsible.addPopup('yt-dlp-popover');
  const ytdlpBtn = collapsible.addButton('', ytDlpPopover);
  ytdlpBtn.id = 'yt-dlp-Btn';
  GM_addElement(ytdlpBtn, 'img', {
    src: YT_DLP_LOGO_URL,
    alt: 'ytdlp logo',
  });

  GM_addElement(ytDlpPopover, 'button', {
    textContent: '⬇️',
    onclick: () => {
      GM_setClipboard(`initiate-ytdlp:url:${location.href}::`);
    },
  });
  GM_addElement(ytDlpPopover, 'button', {
    textContent: 'List',
    onclick: () => {
      invokeDownloader('ytdlp', {
        urlToDownload: location.href,
        mode: 'list',
        browser: 'firefox',
        profile: '3vm341ho.default-release',
      });
    },
  });
  generateElements(`<button>`);

  //* gallery-dl
  collapsible.addButton('🖼️', null, () => {
    const gallerydlCheckboxEls = document.querySelectorAll(
      `.gallery-dl-checkbox:checked`,
    );

    if (gallerydlCheckboxEls.length < 1) {
      invokeDownloader('gallerydl', {
        urlToDownload: location.href,
        destination: 'X:\\Pic\\gallery-dl',
        mode: 'regular',
      });
      return;
    }

    const selectedLinksSet = new Set();
    gallerydlCheckboxEls.forEach(checkboxEl => {
      const linkEl = checkboxEl.parentElement.querySelector('a');
      const url = linkEl.href;
      selectedLinksSet.add(url);
    });
  });

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
