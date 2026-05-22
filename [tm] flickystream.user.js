(function () {
  'use strict';
  if (window.top != window.self) return; //don't run on frames or iframes

  //* currently active host
  // Select by the unique 'border-accent' class
  // const activeButton = document.querySelector('button.border-accent');

  //* set favicon
  let linkEl = document.querySelector("link[rel*='icon']");
  if (!linkEl) {
    linkEl = document.createElement('link');
    linkEl.rel = 'icon';
    document.head.appendChild(linkEl);
  }
  linkEl.href = 'https://cdn-icons-png.flaticon.com/512/18423/18423283.png';

  waitForEach('h1', headerEl => {
    if (!location.href.includes('/player/')) return;
    let observer = new MutationObserver(() => {
      console.log(headerEl, headerEl.textContent);
      document.title = headerEl.textContent.trim() + ' - FlickyStream';
    });
    observer.observe(headerEl, { childList: true, subtree: true });
  });

  // Move Previous/Next into the same action bar as AutoNext/Details/Watch Party/Shuffle.
  // This runs repeatedly via waitForEach so it also works for SPA route updates.
  waitForEach('button', () => {
    if (!location.href.includes('/player/')) return;
    movePrevNextToActionBar();
  });

  function movePrevNextToActionBar() {
    const navButtons = findNavButtons();
    if (!navButtons) return;

    const actionBar = findActionBarContainer();
    if (!actionBar) return;

    const { previousBtn, nextBtn } = navButtons;

    // Already moved.
    if (
      previousBtn.parentElement === actionBar &&
      nextBtn.parentElement === actionBar
    ) {
      return;
    }

    // Preserve original handlers/state by moving existing nodes (not cloning).
    actionBar.prepend(nextBtn);
    actionBar.prepend(previousBtn);
  }

  function findNavButtons() {
    const allButtons = Array.from(document.querySelectorAll('button'));
    const previousCandidates = allButtons.filter(
      btn => cleanText(btn.textContent) === 'Previous',
    );

    for (const previousBtn of previousCandidates) {
      const parent = previousBtn.parentElement;
      if (!parent) continue;

      const siblingButtons = Array.from(parent.children).filter(
        el => el.tagName === 'BUTTON',
      );
      const nextBtn = siblingButtons.find(
        btn => cleanText(btn.textContent) === 'Next',
      );

      if (nextBtn) {
        return { previousBtn, nextBtn };
      }
    }

    return null;
  }

  function findActionBarContainer() {
    const allButtons = Array.from(document.querySelectorAll('button'));
    const autoNextBtn = allButtons.find(
      btn => cleanText(btn.textContent) === 'AutoNext',
    );
    if (!autoNextBtn) return null;

    let current = autoNextBtn.parentElement;
    while (current && current !== document.body) {
      if (
        hasButton(current, 'AutoNext') &&
        hasButton(current, 'Details') &&
        hasButton(current, 'Watch Party') &&
        hasButton(current, 'Shuffle')
      ) {
        return current;
      }
      current = current.parentElement;
    }

    return null;
  }

  function hasButton(container, label) {
    const buttons = Array.from(container.querySelectorAll('button'));
    return buttons.some(btn => cleanText(btn.textContent) === label);
  }

  function cleanText(text) {
    return (text || '').replace(/\s+/g, ' ').trim();
  }
})();
