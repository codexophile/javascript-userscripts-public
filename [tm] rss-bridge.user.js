(async function () {
  'use strict';

  waitForEach('*:not(h2) > [href*="format="]', feedLinkEl => {
    const feedUrl = feedLinkEl.href;
    const urlObj = new URL(feedUrl);
    feedLinkEl.href = feedUrl.replace(urlObj.host, 'rss-bridge');
  });

  (async function () {
    const searchParaObj = new URLSearchParams(location.search);
    const inputUrl = searchParaObj.get('input-url');
    if (!inputUrl) return;
    const inputUrlDecoded = decodeURIComponent(inputUrl);
    const mainInputEl = document.querySelector(
      `section.searchbar > input[type="text"]`,
    );
    if (!mainInputEl) {
      alert('Main input element not found');
      return;
    }
    mainInputEl.value = inputUrlDecoded;
    const searchBtnEl = document.querySelector('button#findfeed');
    if (!searchBtnEl) {
      alert('Search button element not found');
      return;
    }
    await asyncTimeout(1000);
    searchBtnEl.click();
  })();
})();
