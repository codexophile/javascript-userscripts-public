(function () {
  "use strict";
  if (window.top != window.self) return; //don't run on frames or iframes

  waitForEach('[href*="/item/"]', (linkEl) => {
    linkEl.href = sanitizeLinksTraditional(linkEl.href);
  });

  if (location.href.includes("/item/")) {
    sanitizeLocationHref();
  }
})();
