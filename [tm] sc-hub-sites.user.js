(function () {
  "use strict";
  if (window.top != window.self) return; //don't run on frames or iframes

  const itemEls = document.querySelectorAll(`.videos-list article`);
  itemEls.forEach(async (itemEl) => {
    const itemUrl = itemEl.querySelector(`a`).href;
    const doc = await fetchDoc(itemUrl);
    const iframeEls = doc.querySelectorAll(`iframe`);
    iframeEls.forEach(async (iframeEl) => {
      const iframeSrc = iframeEl.src;
      const linkEl = generateElements(
        `<a target=_blank href="${iframeSrc}">${iframeSrc}</a>`,
        itemEl
      );
    });
  });
})();
