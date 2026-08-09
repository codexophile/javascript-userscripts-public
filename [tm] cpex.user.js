(function () {
  'use strict';
  if (location.hash !== '#/track') return;
  const urlObj = new URL(location.href);
  const trackId = urlObj.searchParams.get('id');
  if (!trackId) return;
  const inputEl = document.querySelector('.tracking-input-track');
  const buttonEl = document.querySelector('.track-button-track');
  inputEl.value = trackId;
  buttonEl.click();
})();
