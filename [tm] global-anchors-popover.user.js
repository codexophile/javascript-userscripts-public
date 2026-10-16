(function () {
  'use strict';

  const OPEN_DELAY = 500;
  const CLOSE_DELAY = 200;
  const POPOVER_ID = 'cdx-main-popover';
  const ELEMENT_WIDTH = '20px';
  const svgsObj = {
    'open-in-new': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h560v-280h80v280q0 33-23.5 56.5T760-120H200Zm188-212-56-56 372-372H560v-80h280v280h-80v-144L388-332Z"/></svg>`,
    'open-here': `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M120-120v-320h80v184l504-504H520v-80h320v320h-80v-184L256-200h184v80H120Z"/></svg>`,
    'copy-link': `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M318-120q-82 0-140-58t-58-140q0-40 15-76t43-64l134-133 56 56-134 134q-17 17-25.5 38.5T200-318q0 49 34.5 83.5T318-200q23 0 45-8.5t39-25.5l133-134 57 57-134 133q-28 28-64 43t-76 15Zm79-220-57-57 223-223 57 57-223 223Zm251-28-56-57 134-133q17-17 25-38t8-44q0-50-34-85t-84-35q-23 0-44.5 8.5T558-726L425-592l-57-56 134-134q28-28 64-43t76-15q82 0 139.5 58T839-641q0 39-14.5 75T782-502L648-368Z"/></svg>`,
    popup:
      '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M520-400h200v-240H520v240ZM160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm0-80h640v-480H160v480Zm0 0v-480 480Z"/></svg>',
    freshrss: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><title>Logo FreshRSS</title><circle fill="#FFF" cx="128" cy="128" r="128"/><circle fill="#0062BE" cx="128" cy="128" r="33"/><g fill="none" stroke="#0062BE" stroke-width="24"><g stroke-opacity="0.3"><path d="M12,128 A116,116 0 1,1 128,244"/><path d="M54,128 A74,74 0 1,1 128,202"/></g><path d="M128,12 A116,116 0 0,1 244,128"/><path d="M128,54 A74,74 0 0,1 202,128"/></g></svg>`,
  };
  const srcObj = {
    openrss:
      'data:image/x-icon;base64,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',
    gallerydl:
      'data:image/webp;base64,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',
  };

  let openTimer = null;
  let closeTimer = null;
  let currentAnchor = null;

  const popoverEl = generateElements(`<div></div>`, document.body);
  popoverEl.id = POPOVER_ID;
  popoverEl.popover = 'manual';

  GM_addStyle(`

    #${POPOVER_ID} {

      margin: 0;
      padding: 0.75rem 1rem;
      border: 1px solid #ccc;
      border-radius: 8px;
      background-color: #121212;
      color: #f5f5f5;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);

      .cdx-popover-toolbar {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
      }

      button {
        padding: 0;
        width: ${ELEMENT_WIDTH};
        height: ${ELEMENT_WIDTH};

        img, svg {
          width: 100%;
          height: 100%;
        }
      }

    }

  `);

  popoverEl.addEventListener('mouseenter', () => clearTimeout(closeTimer));
  popoverEl.addEventListener('mouseleave', scheduleClose);

  // Delegated listeners — works for dynamically added anchors with zero extra wiring
  document.addEventListener('mouseover', onMouseOver, true);
  document.addEventListener('mouseout', onMouseOut, true);
  window.addEventListener('scroll', () => hidePopover(), {
    passive: true,
    capture: true,
  });

  function onMouseOver(e) {
    const anchorEl = e.target.closest('a');
    if (!anchorEl || anchorEl === currentAnchor) return;
    scheduleOpen(anchorEl);
  }

  function onMouseOut(e) {
    const anchorEl = e.target.closest('a');
    if (!anchorEl) return;
    // ignore if we're just moving to a child of the same anchor
    if (anchorEl.contains(e.relatedTarget)) return;
    scheduleClose();
  }

  function scheduleOpen(anchorEl) {
    clearTimeout(closeTimer);
    clearTimeout(openTimer);

    const isAlreadyOpen = popoverEl.matches(':popover-open');
    const delay = isAlreadyOpen ? 0 : OPEN_DELAY; // skip delay when just swapping links

    openTimer = setTimeout(() => openPopover(anchorEl), delay);
  }

  function openPopover(anchorEl) {
    currentAnchor = anchorEl;
    renderActions(anchorEl);
    popoverEl.showPopover();
    positionPopover(anchorEl);
  }

  function scheduleClose() {
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
    closeTimer = setTimeout(hidePopover, CLOSE_DELAY);
  }

  function hidePopover() {
    if (popoverEl.matches(':popover-open')) popoverEl.hidePopover();
    currentAnchor = null;
  }

  //  MARK: 🔥
  function renderActions(anchorEl) {
    const linkText = anchorEl.textContent.trim();
    const linkHref = anchorEl.href;
    popoverEl.textContent = ''; // clear previous

    const toolbar01El = generateElements(
      `<div class="cdx-popover-toolbar"></div>`,
      popoverEl,
    );

    createPopoverToolbarButton(
      svgsObj['open-in-new'],
      toolbar01El,
      () => openInBackgroundTab(linkHref),
      'Open in new tab',
    );
    createPopoverToolbarButton(
      svgsObj['popup'],
      toolbar01El,
      () => window.open(linkHref, '_blank', 'popup=yes'),
      'Open as a popup window',
    );
    createPopoverToolbarButton(
      svgsObj['open-here'],
      toolbar01El,
      () => (window.location.href = linkHref),
      'Open here',
    );
    createPopoverToolbarButton(
      svgsObj['copy-link'],
      toolbar01El,
      () => GM_setClipboard(linkHref),
      'Copy link',
    );
    createPopoverToolbarButton(
      svgsObj.freshrss,
      toolbar01El,
      () => {
        addHistoryEntry(linkHref);
        openInBackgroundTab(
          `http://localhost:8080/i/?c=feed&a=add&cat_id=1&url_rss=${encodeURIComponent(linkHref)}`,
        );
      },
      'Add to FreshRSS',
    );
    createPopoverToolbarButton(
      srcObj.openrss,
      toolbar01El,
      () => {
        addHistoryEntry(linkHref);
        openInBackgroundTab(`https://openrss.org/${linkHref}`);
      },
      'Open in OpenRSS',
    );
    createPopoverToolbarButton(srcObj.gallerydl, toolbar01El, () => {
      addHistoryEntry(linkHref);
      invokeDownloader('gallerydl', {
        urlToDownload: linkHref,
        destination: 'Y:\\Pic\\gallery-dl',
      });
    });

    generateElements(`<div id="link-text">${linkText}</div>`, popoverEl);
    generateElements(
      `<div
        id="link-href"
        style="font: 12px monospace; word-break: break-all;"
       >
        ${linkHref}
      </div>`,
      popoverEl,
    );
  }

  function createPopoverToolbarButton(
    graphic,
    parentEl,
    onClick,
    tooltipText = '',
  ) {
    const buttonEl = generateElements(`<button></button>`, parentEl);
    const graphicText = graphic.trimStart();

    if (graphicText.startsWith('<')) {
      buttonEl.append(generateElements(graphic));
    } else {
      const imageEl = document.createElement('img');
      imageEl.src = graphic;
      buttonEl.append(imageEl);
    }

    buttonEl.addEventListener('click', onClick);
    if (tooltipText) {
      buttonEl.setAttribute('title', tooltipText);
    }
    return buttonEl;
  }

  function openInBackgroundTab(url) {
    try {
      addHistoryEntry(url);
    } catch {}
    GM_openInTab(url, { active: true, setParent: true });
  }

  function positionPopover(anchorEl) {
    const rect = anchorEl.getBoundingClientRect();
    const popRect = popoverEl.getBoundingClientRect();

    let left = rect.left;
    let top = rect.bottom + 6;

    // clamp to viewport
    left = Math.min(left, window.innerWidth - popRect.width - 8);
    top = Math.min(top, window.innerHeight - popRect.height - 8);
    left = Math.max(left, 8);
    top = Math.max(top, 8);

    popoverEl.style.left = `${left}px`;
    popoverEl.style.top = `${top}px`;
  }
})();
