(function () {
  "use strict";
  if (window.top != window.self) return; //don't run on frames or iframes

  //* Add-ons page
  const addOnLinkEls = document.querySelectorAll('[href^="/shared/info/"]');
  addOnLinkEls.forEach((el) => {
    el.target = "_blank";
  });
})();
