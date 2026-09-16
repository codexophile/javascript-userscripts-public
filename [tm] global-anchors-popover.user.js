(function () {
  'use strict';

  const OPEN_DELAY = 500;
  const CLOSE_DELAY = 200;
  const POPOVER_ID = 'cdx-main-popover';
  const ELEMENT_WIDTH = '20px';
  const svgsObj = {
    'open-in-new': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h560v-280h80v280q0 33-23.5 56.5T760-120H200Zm188-212-56-56 372-372H560v-80h280v280h-80v-144L388-332Z"/></svg>`,
    'copy-link': `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M318-120q-82 0-140-58t-58-140q0-40 15-76t43-64l134-133 56 56-134 134q-17 17-25.5 38.5T200-318q0 49 34.5 83.5T318-200q23 0 45-8.5t39-25.5l133-134 57 57-134 133q-28 28-64 43t-76 15Zm79-220-57-57 223-223 57 57-223 223Zm251-28-56-57 134-133q17-17 25-38t8-44q0-50-34-85t-84-35q-23 0-44.5 8.5T558-726L425-592l-57-56 134-134q28-28 64-43t76-15q82 0 139.5 58T839-641q0 39-14.5 75T782-502L648-368Z"/></svg>`,
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

      button {
        padding: 0;
        width: ${ELEMENT_WIDTH};
        height: ${ELEMENT_WIDTH};
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

  function renderActions(anchorEl) {
    const linkText = anchorEl.textContent.trim();
    const linkHref = anchorEl.href;
    popoverEl.textContent = ''; // clear previous

    generateElements(
      `<button>${svgsObj['open-in-new']}</button>`,
      popoverEl,
    ).addEventListener('click', () => openInBackgroundTab(linkHref));
    generateElements(
      `<button>${svgsObj['copy-link']}</button>`,
      popoverEl,
    ).addEventListener('click', () => GM_setClipboard(linkHref));

    generateElements(`<div>${linkText}</div>`, popoverEl);
    generateElements(
      `<div style="font: 12px monospace; word-break: break-all;">${linkHref}</div>`,
      popoverEl,
    );
  }

  function openInBackgroundTab(url) {
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
