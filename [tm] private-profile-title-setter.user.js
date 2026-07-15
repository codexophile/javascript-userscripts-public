(function () {
  'use strict';

  const string = '[Browser:Private-profile]';
  let titleObserver = new MutationObserver(() => {
    if (document.title.includes(string)) return; // 🛑
    document.title = `${document.title} • ${string}`;
  });
  titleObserver.observe(document.head, { childList: true, subtree: true });

  waitForEach('video', videoEl => {
    videoEl.volume = 0.01;
  });
})();
