(function () {
  'use strict';

  disableConsoleClear();

  //* ads
  waitForEach('iframe', iframeEl => {
    console.log('test');
    iframeEl.remove();
  });

  //* body overflow
  document.body.querySelector('style').remove();
  document.body.style.overflow = 'scroll !important';

  //* overlay
  (async function () {
    'use strict';
    const overlayEl = await waitFor('.navbar-brand');
    overlayEl.parentElement.parentElement.remove();
  })();

  //* video title
  const newTitleEl = generateElements(`<div>${document.title}</div>`);
  console.log(newTitleEl);
  document.body.prepend(newTitleEl);

  //* setting video height
  const videoContainerQuery =
    '[style="display: block;position:relative;width:100%;height:100%;max-height:100%;"]';
  const videoContainer = document.querySelector(videoContainerQuery);
  if (videoContainer) videoContainer.style.height = '75vh';

  //* fixing scroll
  document.body.style.overflow = 'scroll !important';

  //* auto play
  const posterEl = document.querySelector(`.plyr__poster`);
  posterEl?.click();
  posterEl?.click();
  posterEl?.click();

  //* storyboard
  let videoId;
  if (document.querySelector('input[name=fileCode]'))
    videoId = document.querySelector('input[name=fileCode]')?.value;
  else if (location.href.includes('/e/'))
    videoId = location.href.match(/\/e\/(.+?)(\/|$|#)/)[1];
  else
    videoId = document
      .querySelector('.html-embed-code')
      .value.match(/\/e\/(.+?)"/)[1];
  const imageUrl = `https://i.voe.sx/cache/${videoId}_storyboard_L0.jpg`;
  const vidOnPage = document.querySelector('video');
  const $sbParent = $(`<div id=sbParent></div>`);
  if (location.href.includes('/e/')) $sbParent.appendTo(document.body);
  else $sbParent.insertAfter('.stream');
  const storyboardParent = $sbParent[0];
  storyboard({
    storyboardParent,
    horizontal: 10,
    vertical: 10,
    vidOnPage,
    trueNoOfSlots: 100,
    imgUrls: [imageUrl],
    // offset: -1,
  });
})();
