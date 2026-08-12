(function () {
  'use strict';

  const SELECTOR = '[href^="/video/"]';

  GM_addStyle(`
    ${SELECTOR} {
      text-overflow: unset;
      white-space: unset;
      overflow: unset;
    }
  `);

  waitForEach(SELECTOR, el => {
    const videoId = el.href.match(/\/video\/(.{11})/)[1];
    if (!videoId) return;
    const thumbSrc = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
    generateElements(
      `<img src="${thumbSrc}" style="width: 100%; margin-top: 5px;" />`,
      el,
    );
  });
})();
