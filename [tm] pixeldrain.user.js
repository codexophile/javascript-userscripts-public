(function () {
  "use strict";
  if (window.top != window.self) return; //don't run on frames or iframes

  let videoTitle = document.title.replace(
    / ~ pixeldrain • \[Browser:Private-profile\]/,
    ""
  );
  videoTitle = videoTitle.replaceAll(".", "_");
  setupYtDlpBtn(location.href, videoTitle);
})();
