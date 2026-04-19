(function () {
  'use strict';

  //* link to gallery fix
  const photosLinkEl = document.querySelector(
    `[data-testid="Photos"] > [data-testid="photos-title"] a`,
  );
  if (photosLinkEl) {
    photosLinkEl.href = photosLinkEl.href.replace(
      /\/mediaviewer\/.+/,
      '/mediaindex/',
    );
  }

  //* link fixes
  let observer = new MutationObserver(() => {
    $('a[href*="?ref"]').each(function () {
      this.href = this.href.replace(/\?ref.*$/, '');
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });

  //? I'm not sure what this is 👇
  const $moreFromSectionEl = $(`[data-testid="more-from-section"]`);
  $moreFromSectionEl.insertBefore('[data-testid="contribution"]');

  //*____________________
  if (location.href.includes('https://m.')) {
    location.replace(location.href.replace('https://m.', 'https://www.'));
  }
})();
