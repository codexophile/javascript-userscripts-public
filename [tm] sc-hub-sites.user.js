(function () {
  "use strict";
  if (window.top != window.self) return; //don't run on frames or iframes

  const itemEls = document.querySelectorAll(`.videos-list article`);
  itemEls.forEach(async (itemEl) => {
    const newContainerEl = generateElements(
      `<div class=new-container></div>`,
      itemEl
    );

    const itemUrl = itemEl.querySelector(`a`).href;
    const doc = await fetchDoc(itemUrl);
    const iframeEls = doc.querySelectorAll(`iframe`);
    iframeEls.forEach(async (iframeEl) => {
      const iframeSrc = iframeEl.src;
      const linkEl = generateElements(
        `<a target=_blank href="${iframeSrc}">${iframeSrc}</a>`,
        newContainerEl
      );
    });

    const newLinkEls = newContainerEl.querySelectorAll("a");
    newLinkEls.forEach(async (newLinkEl) => {
      const url = new URL(newLinkEl.href);
      const hostName = url.hostname;
      if (hostName.includes("listeamed")) {
        const doc = await fetchDoc(url);
        const videoParentEl = doc.querySelector("video").parentElement;
        const scriptEl = videoParentEl.querySelector("script");
        const PlayerConfigObj = convertPlayerConfigStringToObject(
          scriptEl.textContent
        );
        console.log(PlayerConfigObj);
      }
    });
  });
})();
