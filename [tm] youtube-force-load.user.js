(function () {
  ('use strict');
  if (window.top != window.self) return;

  // Clicks occurring inside any of these selectors should NOT be force-navigated;
  // allow YouTube's normal SPA handling instead.
  const allowListSelectors = ['ytd-macro-markers-list-item-renderer'];

  function handleLinkClick(event) {
    const originalTarget = event.target;

    // If the click originated within an allow‑listed container, let it proceed normally.
    for (const sel of allowListSelectors) {
      if (
        originalTarget &&
        typeof originalTarget.closest === 'function' &&
        originalTarget.closest(sel)
      ) {
        return; // Allow default SPA behavior.
      }
    }

    let link = originalTarget;
    while (link && link.tagName !== 'A') {
      link = link.parentNode;
    }

    if (link && link.href && link.href !== window.location.href) {
      event.preventDefault();
      event.stopImmediatePropagation();
      window.location.href = link.href;
    }
  }

  document.documentElement.addEventListener('click', handleLinkClick, true);
})();
