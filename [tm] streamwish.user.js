(async function () {
  'use strict';

  const playerEl = await waitFor(`.jwplayer`);

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

    // GM_addStyle(`
    //   body {
    //     /* flex-direction: column; */
    //     overflow: auto;

    //     #media-player {
    //       height: 70vh !important;
    //       &, & * {
    //         overflow: auto !important;
    //         position: relative !important;
    //       }
    //     }

    //     div:has(>#media-player) {
    //       position: relative;
    //       overflow: auto !important;
    //     }
    //   }
    // `);

    const mediaPlayerElQuery = `#media-player, #vplayer`;

    GM_addStyle(`
      div:has(>${mediaPlayerElQuery}) {
        overflow: auto !important;
      }
      ${mediaPlayerElQuery} {
        height: 70vh !important; 
      }
    `);

    console.log('before');
    const thumbEl = await waitFor('.jw-time-thumb[style*="background-image"]');
    console.log('after', thumbEl);
    const storyboardUrl =
      thumbEl.style.backgroundImage.match(/['"](.*)['"]/)[1];

    const videoEl = document.querySelector(`video[src]`);
    videoEl.volume = 0.01;
    // playerEl.style.height = '70vh';

    const mediaPlayerEl = await waitFor(mediaPlayerElQuery);
    const storyboardParent = generateElements(
      `<div></div>`,
      mediaPlayerEl.parentElement,
    );

    await storyboard({
      storyboardParent,
      horizontal: 10,
      vertical: 10,
      vidOnPage: videoEl,
      trueNoOfSlots: 100,
      imgUrls: [storyboardUrl],
    });
  })();
})();
