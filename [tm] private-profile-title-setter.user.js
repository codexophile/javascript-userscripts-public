(function () {
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

  const string = '[Browser:Private-profile]';
  let titleObserver = new MutationObserver(() => {
    if (document.title.includes(string)) return; // 🛑
    document.title = `${document.title} • ${string}`;
  });
  titleObserver.observe(document.head, { childList: true, subtree: true });

  waitForEach('video', videoEl => {
    videoEl.volume = 0.01;
  });
})();
