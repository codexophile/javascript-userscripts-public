(function () {
  'use strict';

  const linkEls = document.querySelectorAll('.article p a');
  linkEls.forEach(linkEl => {
    const newImgEl = generateElements(`<img src="${linkEl.href}">`, linkEl);
    newImgEl.addEventListener('error', () => {
      newImgEl.remove();
    });
  });
})();
