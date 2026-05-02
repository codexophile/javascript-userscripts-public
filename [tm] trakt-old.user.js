(function () {
  'use strict';

  waitForEach('[href^="/people/"]', peopleLinkEl => {
    const url = new URL(peopleLinkEl.href);
    if (url.searchParams.get('hide') !== 'unwatched') {
      url.searchParams.set('hide', 'unwatched');
      peopleLinkEl.href = url.toString();
    }
  });
})();
