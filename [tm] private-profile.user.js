'use strict';

const enabled = GM_getValue('enabled', 'unset');
if (enabled === false) return;

if (enabled === 'unset') {
  const response = confirm('🚨 Enable browser private mode?');
  if (!response) {
    GM_setValue('enabled', false);
    return;
  }
  GM_setValue('enabled', true);
}

//* Meida actions on inactivity

function handleUserPresence(isAway) {
  if (isAway) {
    const mediaEls = document.querySelectorAll('video, audio');
    mediaEls.forEach(mediaEl => {
      if (!mediaEl.paused) {
        mediaEl.pause();
        console.log('User is away. Pausing media.');
      }
    });
  } else {
    console.log('User is back.');
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    handleUserPresence(true);
  } else {
    handleUserPresence(false);
  }
});

window.addEventListener('blur', () => {
  handleUserPresence(true);
});

window.addEventListener('focus', () => {
  handleUserPresence(false);
});

//* Tab mute

GM_audio.setMute({ isMuted: true }, function (err) {
  if (!err) return;
  alert('Failed to mute tab audio. See console for details.');
  console.error('[Tab Audio Toggle] setMute failed:', err);
});

//  MARK: Tab title
const string = '[Browser:Private-profile]';
let titleObserver = new MutationObserver(() => {
  if (document.title.includes(string)) return; // 🛑
  document.title = `${document.title} • ${string}`;
});
titleObserver.observe(document.head, { childList: true, subtree: true });

waitForEach('video', videoEl => {
  videoEl.volume = 0.01;
});
