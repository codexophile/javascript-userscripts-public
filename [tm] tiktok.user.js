//* download button (yt-dlp)
const { addButton } = await Collapsible();
addButton('⬇️', null, () => {
  let postLink = '';

  if (location.href.includes('/video/')) {
    postLink = location.href;
  } else {
    return;
  }

  const urlSegment = `url:${postLink}::`;
  const destinationSegment = `dest:x:\\tiktok::`;
  const modeSegment = `mode:noprompt::`;
  GM_setClipboard(
    `initiate-ytdlp:${urlSegment}${destinationSegment}${modeSegment}`
  );
});

//*
// if (location.href.includes('#saved')) {
//   waitFor(`[class*=PFavorite]`).then(el => {
//     el.click();
//   });
// }

// waitFor('#collapsibleContent').then(el => {
//   generateToolbarButton('↔️', el, null, () => {
//     $(`#main-content-others_homepage`).css(`max-width`, `unset`);
//     $('[class*=DivSideNavContainer]').toggle();
//   });
// });

// let observer = new MutationObserver(() => {
//   $('[class*=SpanUniqueId]:not([data-e2e])').each(function () {
//     const $this = $(this);
//     if ($this.parent().prop('tagName') === 'A') return; // 🛑
//     $this.wrap(
//       `<a href="https://www.tiktok.com/@${$this.text()}/" target=_blank></a>`
//     );
//   });
// });

// observer.observe(document.body, { childList: true, subtree: true });
