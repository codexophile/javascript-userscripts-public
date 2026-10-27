//* new yt-dlp button
const ytdlpPopoverEl = await waitFor('#yt-dlp-popover');
generateElements(`<button>Instant</button>`, ytdlpPopoverEl).addEventListener(
  'click',
  () => {
    const postLink = getPostLink();
    invokeDownloader('ytdlp', {
      urlToDownload: postLink,
      destination: 'Y:\\@TOP\\tiktok',
      mode: 'noprompt',
    });
  },
);

//* follow button
addButton('➕', null, () => {
  const followBtn = document.querySelector(
    'div[aria-label="Follow"][role="button"]',
  );
  if (followBtn) followBtn.click();
});

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

//* sets volume to a low value
waitForEach('video,audio', mediaItem => {
  mediaItem.addEventListener('volumechange', () => {
    if (mediaItem.volume === 1) mediaItem.volume = 0.01;
  });
});

//  MARK: Previous helpers

function handleImgDownload(parentEl) {
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

function getPostLink() {
  const locationHref = location.href;
  if (locationHref.includes('/reel/')) {
    return locationHref;
  }
  if (locationHref.includes('/watch/')) {
    const visiblePostEl = getVisibleElements(
      '#watch_feed [data-virtualized="false"]:has(a[href*="/watch/?v="])',
      VisibilityMode.FULL,
    )[0];
    if (!visiblePostEl) {
      return locationHref;
    }
    style(visiblePostEl, `outline: 2px solid red;`);
    return visiblePostEl.querySelector('a[href*="/watch/?v="]').href;
  }
}

function getTagged() {
  return '';
}
