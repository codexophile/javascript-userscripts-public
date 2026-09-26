(async function () {
  ('use strict');
  if (window.top != window.self) return; //don't run on frames or iframes

  const YT_DLP_LOGO_URL =
    'https://raw.githubusercontent.com/codexophile/javascript-userscripts-public/refs/heads/new-branch/%5Btm%5D%20Global.user.js-ytdlp.png';
  const SVGS = {
    rssYes:
      '<?xml version="1.0" encoding="utf-8"?><svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.2426 7.75738C18.5858 10.1005 18.5858 13.8995 16.2426 16.2427M7.75736 16.2426C5.41421 13.8995 5.41421 10.1005 7.75736 7.75735M4.92893 19.0711C1.02369 15.1658 1.02369 8.8342 4.92893 4.92896M19.0711 4.929C22.9763 8.83424 22.9763 15.1659 19.0711 19.0711M14 12C14 13.1046 13.1046 14 12 14C10.8954 14 10 13.1046 10 12C10 10.8955 10.8954 10 12 10C13.1046 10 14 10.8955 14 12Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    rssNo:
      '<?xml version="1.0" encoding="utf-8"?><svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.2426 7.75736C17.6695 9.18422 18.2275 11.1509 17.9166 13M7.75736 16.2426C5.41421 13.8995 5.41421 10.1005 7.75736 7.75732M4.92893 19.0711C1.02369 15.1658 1.02369 8.83418 4.92893 4.92893M19.0711 4.92898C21.9628 7.8207 22.7133 12.0428 21.3225 15.6251M10.5 10.6771C10.1888 11.0297 10 11.4928 10 12C10 13.1046 10.8954 14 12 14C12.5072 14 12.9703 13.8112 13.3229 13.5M21 21L3 3" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    tools:
      '<?xml version="1.0" encoding="iso-8859-1"?><svg height="800px" width="800px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 	 viewBox="0 0 390.344 390.344" xml:space="preserve"><path style="fill:#FFFFFF;" d="M186.269,228.638l-25.988-25.988L27.497,336.986c-7.046,7.046-7.046,18.941,0,26.57	c7.046,7.046,18.941,7.046,25.471,0L186.269,228.638z"/><path style="fill:#FFC10D;" d="M146.188,115.895l-20.622,20.622l218.958,221.091c5.43,5.43,14.61,5.43,20.622,0	c5.43-5.947,5.43-15.192,0-21.139L146.188,115.895z"/><polygon style="fill:#56ACE0;" points="64.346,167.935 176.572,54.093 168.426,45.43 97.445,57.39 26.398,129.471 "/><path style="fill:#FFFFFF;" d="M222.6,139.749l-11.378,11.378l25.988,25.988l11.378-11.378c-5.947-3.814-11.895-8.663-16.808-14.093	C228.03,147.895,225.315,144.081,222.6,139.749z"/><path style="fill:#FFC10D;" d="M248.071,137.034c25.988,27.087,69.366,30.319,97.551,2.198c12.994-12.994,20.04-30.901,20.04-49.325	l-17.842,17.842c-20.04,18.941-48.226,18.424-67.749,0c-18.424-18.941-18.424-49.325,0-67.749l17.907-18.424h-0.517	c-18.424,0-35.749,7.046-48.226,20.622C224.216,68.186,223.699,110.464,248.071,137.034z"/><path style="fill:#194F82;" d="M380.338,321.858L252.402,192.824l16.291-16.808c33.616,10.279,63.935,3.814,91.604-21.657	c23.273-23.855,32-58.505,22.238-90.505c-2.715-7.564-11.378-10.279-17.907-4.331l-33.034,33.034	c-10.279,9.762-25.471,10.279-36.848,0c-10.279-10.279-10.279-27.087,0-37.366l33.616-33.034c5.43-5.947,3.232-15.192-4.331-17.907	c-33.616-10.279-66.651-1.616-90.505,22.756s-30.901,60.703-20.622,91.604l-16.808,16.808l-34.715-35.232l38.465-39.046	c4.331-4.331,4.331-10.861,0-15.192l-20.04-20.04c-2.715-2.715-5.947-3.814-9.762-3.232L90.398,36.768	C88.2,37.285,86.067,38.384,84.451,40L3.643,121.842c-4.331,4.331-4.331,10.861,0,15.192l53.139,53.657	c4.848,3.814,9.762,4.331,15.192,0l38.465-38.465l34.715,35.232l-133.366,134.4c-15.709,15.709-15.709,41.18,0,56.889	c16.808,16.291,42.279,14.61,56.372,0l132.784-134.4l127.354,128.97c14.093,13.576,34.133,15.192,50.941,0	C393.849,358.707,393.849,335.951,380.338,321.858z M364.628,357.608c-5.43,5.43-14.61,5.43-20.622,0l-218.44-221.091l20.622-20.622	l218.44,221.091C370.576,342.416,370.576,352.178,364.628,357.608z M27.497,363.038c-7.046-7.046-7.046-18.941,0-26.57	l132.784-133.883l25.988,25.988L52.968,363.038C46.503,370.085,34.544,370.085,27.497,363.038z M168.426,45.43l8.145,8.663	L64.346,167.935l-37.947-38.465L97.38,57.907L168.426,45.43z M297.396,21.576h0.517L280.006,40	c-18.424,18.941-18.424,49.325,0,67.749c19.523,18.424,47.127,18.941,67.75,0l17.907-17.907c0,17.907-7.046,35.749-20.04,49.325	c-28.703,28.186-71.564,25.471-97.552-2.198c-24.372-26.57-23.855-68.848,1.616-94.836	C261.647,29.204,278.972,21.576,297.396,21.576z M237.275,177.115l-25.988-25.988l11.378-11.378	c2.715,4.331,5.43,8.145,9.244,11.895c4.848,5.43,10.861,10.279,16.808,14.093L237.275,177.115z"/></svg>',
  };

  GM_addStyle(`
    .collapsible-button {
      padding: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3px;

      &:has(> svg) {
        background-color: #ababab;
      }
    }
  `);

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

  //  MARK: Page Tools
  const toolsPopoverEl = collapsible.addPopup('page-tools-popover');
  const toolsBtnEl = collapsible.addButton('', toolsPopoverEl);
  generateElements(SVGS.tools, toolsBtnEl);

  //* crt.name
  generateElements(
    `
    <button>
      <a href="https://crt.name/v1/search?apex=${location.host}" target="_blank">
        <img src="https://www.google.com/s2/favicons?domain=crt.name&sz=64">
      </a>
    </button>
    `,
    toolsPopoverEl,
  );

  //*
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

  GM_addElement(ytDlpPopover, 'input', {
    textContent: 'noprompt',
    type: 'checkbox',
    id: 'ytdlp-noprompt-checkbox',
    class: 'ytdlp-option',
  });
  GM_addElement(ytDlpPopover, 'label', {
    textContent: 'noprompt',
    for: 'ytdlp-noprompt-checkbox',
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

  //  MARK: gallery-dl
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
    invokeDownloader('gallerydl', {
      urlToDownload: [...selectedLinksSet].join(','),
      destination: 'X:\\Pic\\gallery-dl',
      mode: 'regular',
    });
  });

  //  MARK: RSS
  const rssLinks = document.querySelectorAll(
    'link[rel="alternate"][type="application/rss+xml"], link[rel="alternate"][type="application/atom+xml"]',
  );

  const rssFeedsPopover = collapsible.addPopup('rss-feeds-popover');
  const rssBtnEl = collapsible.addButton('', rssFeedsPopover);
  generateElements(rssLinks.length ? SVGS.rssYes : SVGS.rssNo, rssBtnEl);
  const rssIconEl = rssBtnEl.querySelector('svg');
  if (rssIconEl) {
    rssIconEl.style.display = 'block';
    rssIconEl.style.width = '100%';
    rssIconEl.style.height = '100%';
  }
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
  addLinkToFeedReader(
    'FreshRSS',
    'http://localhost:8080/i/?c=feed&a=add&cat_id=1&url_rss=',
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
