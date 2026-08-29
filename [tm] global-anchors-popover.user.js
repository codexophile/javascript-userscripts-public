(function () {
  'use strict';

  const OPEN_DELAY = 100;
  const CLOSE_DELAY = 200;

  let openTimer = null;
  let closeTimer = null;
  let currentAnchor = null;

  const popoverEl = generateElements(`<div></div>`, document.body);
  popoverEl.id = 'main-popover';
  popoverEl.popover = 'manual';
  style(
    popoverEl,
    `
      margin: 0;
      padding: 0.75rem 1rem;
      border: 1px solid #ccc;
      border-radius: 8px;
      /* background: white; */
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `,
  );

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
    const href = anchorEl.href;
    // Replace with your real action buttons (foreground/background/new window/copy)
    popoverEl.textContent = ''; // clear previous
    const label = generateElements(
      `<div style="font: 12px monospace; word-break: break-all;">${href}</div>`,
      popoverEl,
    );
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
