(function () {
  'use strict';
  if (window.top != window.self) return; //don't run on frames or iframes

  const TITLE_SUFFIX = ' • Spotify';
  setTitle();
  let observer = new MutationObserver(() => {
    setTitle();
  });
  observer.observe(document.querySelector('head > title'), {
    childList: true,
    subtree: true,
  });
  function setTitle() {
    const currentTitle = document.title;
    if (currentTitle.includes(TITLE_SUFFIX)) return;
    document.title = currentTitle + TITLE_SUFFIX;
  }
})();
