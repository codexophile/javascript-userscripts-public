(function () {
  'use strict';
  if (window.top != window.self) return; //don't run on frames or iframes

  waitForEach('video', videoEl => {
    videoEl.volume = 0.1;
  });
})();
