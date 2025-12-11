//* new yt-dlp button
const { addButton } = await Collapsible();
addButton('tiktok', null, () => {
  let postLink = '';
  postLink = location.href;

  const urlSegment = `url:${postLink}::`;
  const destinationSegment = `dest:x:\\tiktok::`;
  const modeSegment = `mode:noprompt::`;
  GM_setClipboard(
    `initiate-ytdlp:${urlSegment}${destinationSegment}${modeSegment}`
  );
});

//* auto scroll to important content
urlChangeHandler();
window.addEventListener('urlchange', urlChangeHandler);
async function urlChangeHandler() {
  const locator = await waitFor(`[href$="/about"]`);
  locator.scrollIntoView();
}

waitForEach(`[aria-label="See Owner Profile"]`, locatorEl => {
  const targetEl = grandParent(locatorEl, 4);
  style(
    targetEl,
    `
    position: fixed;
    bottom: 100px;
  `
  );
});

if (location.href === 'https://www.facebook.com/') {
  const $sidebarRight = $('[role="complementary"]');
  const $toggleBtn = $(`<button>↔️</button>`)
    .prependTo(document.body)
    .on('click', () => {
      $sidebarRight.toggle();
    });
  $toggleBtn.css(`z-index`, `10`);
  positionRelativeToElement($toggleBtn[0], $sidebarRight[0]);

  //* Stories wrap button
  const $storiesDiv = $('[aria-label="Stories"]');
  const $storiesWrapBtn = $(`<button>🌯</button>`)
    .prependTo(document.body)
    .on('click', () => {
      const $storiesParent = $storiesDiv.find(
        '[aria-label="stories tray"] > div > div'
      );
      if ($storiesParent.css(`flex-wrap`) === 'wrap')
        $storiesParent.css(`flex-wrap`, ``);
      else $storiesParent.css(`flex-wrap`, `wrap`);

      $storiesParent.parentsUntil('[role="main"]').css(`width`, `100%`);
      $('[role="complementary"]').toggle(); // sidebar right
      $(`[role="navigation"]`).eq(2).toggle(); // sidebar left
    });
  $storiesWrapBtn.css(`z-index`, `1`);
  positionRelativeToElement($storiesWrapBtn[0], $storiesDiv[0]);
}

//* sets volume to a low value
waitForEach('video,audio', mediaItem => {
  mediaItem.addEventListener('volumechange', () => {
    if (mediaItem.volume === 1) mediaItem.volume = 0.01;
  });
});

let observer = new MutationObserver(() => {
  //* close video popup
  document.querySelector('[aria-label="Close Video and scroll"]')?.click();
  //* click translate option
  $('[data-ad-preview="message"] + div')
    .find(':contains("See Translation")')
    .click();
});
observer.observe(document.body, { childList: true, subtree: true });
