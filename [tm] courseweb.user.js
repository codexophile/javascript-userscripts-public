(function () {
  'use strict';
  if (window.top != window.self) return; //don't run on frames or iframes

  const loginBtnEl = document.querySelector(
    `.potentialidp > a[title="SLIIT Login"]`
  );
  loginBtnEl.click();
})();
