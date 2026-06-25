(function () {
  'use strict';
  if (window.top != window.self) return; //don't run on frames or iframes

  const linkEls = document.querySelectorAll('.article p a');
  linkEls.forEach(linkEl => {
    const newImgEl = generateElements(`<img src="${linkEl.href}">`, linkEl);
  });
})();
