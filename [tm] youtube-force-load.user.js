(function () {
  ('use strict');
  if (window.top != window.self) return; //don't run on frames or iframes

  // Function to handle link clicks
  function handleLinkClick(event) {
    // Check if the clicked element is an anchor tag or a child within one
    let target = event.target;
    while (target && target.tagName !== 'A') {
      target = target.parentNode;
    }

    if (target && target.href && target.href !== window.location.href) {
      // Prevent the default SPA navigation
      event.preventDefault();
      event.stopImmediatePropagation();

      // Force a full page reload to the new destination
      window.location.href = target.href;
    }
  }

  // Add a click listener to the entire document
  // Using a capture phase listener to ensure it runs before most other click handlers
  document.documentElement.addEventListener('click', handleLinkClick, true);

  // Additionally, some SPAs use history.pushState or history.replaceState
  // to change the URL without a full reload. We can try to intercept these.
  // However, directly preventing pushState/replaceState from working is difficult
  // and can break the site. A more robust approach might involve
  // listening for URL changes and then forcing a reload.

  // A simpler, but more aggressive, approach for detecting URL changes
  // and forcing a reload is to observe the URL.
  // let lastUrl = window.location.href;
  // setInterval(() => {
  //   if (window.location.href !== lastUrl) {
  //     window.location.reload(true); // Force reload, bypassing cache [16]
  //     lastUrl = window.location.href; // Update lastUrl after reload
  //   }
  // }, 500); // Check every 500 milliseconds (adjust as needed)
})();
