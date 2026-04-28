(function () {
  'use strict';
  if (window.top != window.self) return; //don't run on frames or iframes

  setTitle();

  let observer = new MutationObserver(setTitle);
  observer.observe(document.head.querySelector('title'), {
    childList: true,
    subtree: true,
  });

  function setTitle() {
    if (document.title.includes(' - EE3')) return;
    document.title = document.title + ' - EE3';
  }
})();
