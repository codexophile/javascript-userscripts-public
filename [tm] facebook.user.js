//* download images
waitForEach('div:has(>[data-visualcompletion][alt])', imgCntEl => {
  const toolsCntEl = generateElements(`<div class=toolsCnt></div>`, imgCntEl);
  style(
    toolsCntEl,
    `
    position: absolute;
    top: 10px;
    left: 10px;
  `,
  );
  const dlBtnEl = generateElements(
    `<button class=dlBtn>⬇️</button>`,
    toolsCntEl,
  );
  dlBtnEl.addEventListener('click', () => handleDownload(imgCntEl));
});

function handleDownload(parentEl) {
  const imgEl = parentEl.querySelector('[data-visualcompletion][alt]');
  const tempImg = GM_addElement('img', {
    src: imgEl.src,
    crossorigin: 'anonymous',
  });
  tempImg.addEventListener('load', () => {
    const c = generateElements(`<canvas></canvas>`);
    c.width = tempImg.naturalWidth;
    c.height = tempImg.naturalHeight;
    var ctx = c.getContext('2d');
    ctx.drawImage(tempImg, 0, 0);
    const uri = c.toDataURL();

    const linkEl = generateElements(`<a></a>`, document.body);
    let fileName = `${getUserId()} - (facebook)${getPostId()} - (${getTagged()})`;
    linkEl.setAttribute('download', `${fileName}.png`);
    linkEl.setAttribute('href', uri);
    linkEl.click();
  });
}

function getUserId() {
  try {
    const profileLinkEl = document.querySelector('a[href*="/profile.php?id="]');
    const userId = profileLinkEl.href.match(/\/profile.php\?id=(.+?)[$&]/)[1];
    return userId;
  } catch (error) {
    alert('Error getting user ID: ' + error.message);
    return null;
  }
}

function getPostId() {
  try {
    const postLink = getPostLink();
    const urlObject = new URL(postLink);
    const storyFbid = urlObject.searchParams.get('story_fbid');
    const id = urlObject.searchParams.get('id');
    return `story_fbid=${storyFbid}&id=${id}`;
  } catch (error) {
    alert('Error getting post ID: ' + error.message);
    return null;
  }
}

function getPostLink() {
  const scriptEl = contains(
    'script',
    '"CometFeedStoryLongerTimestampStrategy"',
  );
  if (!scriptEl.length) {
    alert('script element not found');
    return null;
  }
  const matches = scriptEl[0].textContent.match(
    /"url":"(https:\\\/\\\/www\.facebook\.com\\\/permalink\.php.+?)"/,
  );
  const postUrl = matches ? matches[1].replace(/\\\//g, '/') : null;
  return postUrl;
}

function getTagged() {
  return '';
}

//* new yt-dlp button
const { addButton } = await Collapsible();
addButton('tiktok', null, () => {
  let postLink = '';
  postLink = location.href;

  const urlSegment = `url:${postLink}::`;
  const destinationSegment = `dest:x:\\tiktok::`;
  const modeSegment = `mode:noprompt::`;
  GM_setClipboard(
    `initiate-ytdlp:${urlSegment}${destinationSegment}${modeSegment}`,
  );
});

//* follow button
addButton('➕', null, () => {
  const followBtn = document.querySelector(
    'div[aria-label="Follow"][role="button"]',
  );
  if (followBtn) followBtn.click();
});

//* auto scroll to important content
// urlChangeHandler();
// window.addEventListener('urlchange', urlChangeHandler);
// async function urlChangeHandler() {
//   console.log('xxxxxxxxxxx');
//   const locator = await waitFor(`[href$="/about"]`);
//   locator.scrollIntoView();
// }

waitForEach(`[aria-label="See Owner Profile"]`, locatorEl => {
  const targetEl = grandParent(locatorEl, 4);
  style(
    targetEl,
    `
    position: fixed;
    bottom: 100px;
  `,
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
        '[aria-label="stories tray"] > div > div',
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
