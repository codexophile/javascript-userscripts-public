(function () {
  "use strict";
  if (window.top != window.self) return; //don't run on frames or iframes

  //* handling custom search
  const urlObj = new URL(location.href);
  if (urlObj.searchParams.has("search-query")) {
    const searchQuery = urlObj.searchParams.get("search-query");
    const searchQueryConverted = searchQuery.replaceAll(" ", "-");
    const newUrl = `https://www.aliexpress.com/w/wholesale-${searchQueryConverted}.html`;
    console.log("test");
    location.replace(newUrl);
  }

  waitForEach('[href*="/item/"]', (linkEl) => {
    linkEl.href = sanitizeLinksTraditional(linkEl.href);
  });

  if (location.href.includes("/item/")) {
    sanitizeLocationHref();
  }
})();
