(async function () {
  'use strict';

  const FAST_PLAYBACK_RATE = 3;

  //* auto speedup preview videos
  waitForEach('a video', previewVidEl => {
    previewVidEl.addEventListener('play', () => {
      setPlaybackRate(previewVidEl, FAST_PLAYBACK_RATE);
    });
    previewVidEl.addEventListener('ratechange', () => {
      setPlaybackRate(previewVidEl, FAST_PLAYBACK_RATE);
    });
  });

  function setPlaybackRate(vidEl, rate = 3) {
    if (vidEl.playbackRate === rate) return;
    vidEl.playbackRate = rate;
  }

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
      `initiate-ytdlp:${urlSegment}${destinationSegment}${modeSegment}`,
    );
  });
})();
