(async function () {
  'use strict';

  window.close = () => {};

  const videoTitle = document.title.replace(' • [Browser:Private-profile]', '');
  if (location.href.includes('/e/'))
    setupYtDlpBtn(null, videoTitle, '#titleM3u8Link');
  if (location.href.includes('/f/')) {
    // const downloadUrl = document.querySelector(`.submit-btn`).href;
    setupYtDlpBtn(null, videoTitle, '.submit-btn');
  }

  (async function () {
    'use strict';
    let storyboardUrl;

    const thumbEl = await waitFor('.jw-time-thumb[style*="background-image"]');
    storyboardUrl = thumbEl.style.backgroundImage.match(/['"](.*)['"]/)[1];

    const $videoEl = $(`video[src]`);
    $videoEl.data('processed', true);
    $videoEl.prop('volume', 0.01);
    $('#vplayer').css(`height`, `70vh`);

    let parent;
    if ($('.videoplayer, #vplayer').length)
      parent = $(`<div></div>`).insertAfter(
        $('.videoplayer, #vplayer').first()
      );
    else parent = $(`<div></div>`).appendTo(document.body);

    const storyboardEl = await storyboard({
      storyboardParent: parent[0],
      horizontal: 10,
      vertical: 10,
      vidOnPage: $videoEl[0],
      trueNoOfSlots: 100,
      imgUrls: [storyboardUrl],
    });
  })();
})();
