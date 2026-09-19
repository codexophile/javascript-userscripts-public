(function () {
  'use strict';

  let autoPauseDone = false;
  let videoEl = null;

  const origPlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function (...args) {
    if (this.tagName === 'VIDEO' && !autoPauseDone) {
      mute(this);
      const result = origPlay.apply(this, args);
      this.pause();
      return result;
    }
    return origPlay.apply(this, args);
  };

  // Capture phase on document fires before ANY listener on the target itself,
  // regardless of when YouTube registered theirs.
  document.addEventListener('click', maybeRestore, true);
  document.addEventListener('auxclick', maybeRestore, true);

  function maybeRestore(event) {
    if (!videoEl) return;
    if (event.type === 'auxclick' && event.button !== 1) return;
    const isVideo = event.target === videoEl;
    const isPlayBtn =
      event.target.closest && event.target.closest('.ytp-play-button');
    if (isVideo || isPlayBtn) ((autoPauseDone = true), (videoEl.muted = false));
  }

  waitFor('video').then(el => {
    videoEl = el;
    if (!autoPauseDone) {
      mute(videoEl);
      if (!videoEl.paused) videoEl.pause();
    }
  });

  function mute(videoEl) {
    // videoEl.muted = true;
  }
})();
