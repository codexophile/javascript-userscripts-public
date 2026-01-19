(function () {
  'use strict';
  if (window.top != window.self) return; //don't run on frames or iframes

  const doodHostsQuery = getDoodHostsQuery();
  const itemEls = document.querySelectorAll(`.videos-list article`);
  itemEls.forEach(async itemEl => {
    const newContainerEl = generateElements(
      `<div class=new-container></div>`,
      itemEl,
    );

    const itemUrl = itemEl.querySelector(`a`).href;
    const doc = await fetchDoc(itemUrl);
    const iframeEls = doc.querySelectorAll(`iframe`);
    if (iframeEls.length === 0)
      console.log('No iframe elements found in the video page.');

    iframeEls.forEach(async iframeEl => {
      const iframeSrc = iframeEl.src;
      const linkEl = generateElements(
        `<a target=_blank href="${iframeSrc}">${iframeSrc}</a>`,
        newContainerEl,
      );
    });

    itemEl.querySelectorAll(doodHostsQuery).forEach(async doodLinkEl => {
      const doodSBUrl = await getDoodStoryboardSrc(doodLinkEl.href);
      generateElements(
        `<img src="${doodSBUrl}" alt="Dood storyboard" style="max-width: 100px; margin-right: 10px;">`,
        newContainerEl,
      );
    });

    const newLinkEls = newContainerEl.querySelectorAll('a');
    newLinkEls.forEach(async newLinkEl => {
      const url = new URL(newLinkEl.href);
      const hostName = url.hostname;

      if (hostName)
        if (hostName.includes('listeamed')) {
          const doc = await fetchDoc(url);
          const videoParentEl = doc.querySelector('video').parentElement;
          const scriptEl = videoParentEl.querySelector('script');
          const PlayerConfigObj = convertPlayerConfigStringToObject(
            scriptEl.textContent,
          );
          console.log(PlayerConfigObj);
        }
    });
  });
})();
