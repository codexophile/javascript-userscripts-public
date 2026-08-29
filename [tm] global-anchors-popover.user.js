(function () {
  ('use strict');

  const OPEN_DELAY = 100; // optional: avoid opening on accidental brush-bys
  const CLOSE_DELAY = 200; // grace period to move mouse into the popover
  let closeTimer = null;

  waitForEach('a', setupAnchor);

  const mainPopoverEl = generateElements(`<div></div>`, document.body);
  mainPopoverEl.id = 'main-popover';
  mainPopoverEl.popover = 'manual';
  style(
    mainPopoverEl,
    `
      margin: 0;
      padding: 0.75rem 1rem;
      border: 1px solid #ccc;
      border-radius: 8px;
      background: white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `,
  );

  mainPopoverEl.addEventListener('mouseenter', () => clearTimeout(closeTimer));
  mainPopoverEl.addEventListener('mouseleave', scheduleClose);

  function setupAnchor(anchorEl) {
    anchorEl.addEventListener('mouseenter', e => openPopover(e.target));
    anchorEl.addEventListener('mouseleave', scheduleClose);
  }

  function openPopover(triggerEl) {
    clearTimeout(closeTimer);
    // if (!mainPopoverEl.matches(':popover-open')) {
    mainPopoverEl.showPopover();
    positionPopover(triggerEl);
    // }
  }

  function scheduleClose() {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      mainPopoverEl.hidePopover();
    }, CLOSE_DELAY);
  }

  function positionPopover(triggerEl) {
    const rect = triggerEl.getBoundingClientRect();
    mainPopoverEl.style.left = `${rect.left}px`;
    mainPopoverEl.style.top = `${rect.bottom + 6}px`;
  }
})();
