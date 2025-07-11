(function () {
  "use strict";

  disableConsoleClear();

  //* ads
  waitForEach(`[data-element="close-button"]`, (closeAdBtnEl) => {
    // closeAdBtnEl.click();
  });

  //* ytdlp
  const videoEl = document.querySelector(`video`);
  const videoSrc = videoEl.getAttribute(`src`);
  const videoTitle = document.querySelector(`.video-title`).textContent;
  setupYtDlpBtn(videoSrc, videoTitle);
})();
