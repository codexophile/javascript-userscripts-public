(function () {
  "use strict";

  const videoEl = document.querySelector(`video`);
  videoSrc = videoEl.getAttribute(`src`);
  const videoTitle = document.querySelector(`.video-title`).textContent;
  setupYtDlpBtn(videoSrc, videoTitle);
})();
