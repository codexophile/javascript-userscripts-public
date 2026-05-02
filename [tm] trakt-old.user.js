(async function () {
  'use strict';

  waitForEach('#recommendations-wrapper [href^="/movies/"]', movieLinkEl => {
    movieLinkEl.href += '#redirectIMDb';
  });
  const urlHash = window.location.hash;
  if (urlHash === '#redirectIMDb') {
    const imdbLinkEl = await waitFor('#external-link-imdb');
    location.href = imdbLinkEl.href;
  }

  waitForEach('[href^="/people/"]', peopleLinkEl => {
    const url = new URL(peopleLinkEl.href);
    if (url.searchParams.get('hide') !== 'unwatched') {
      url.searchParams.set('hide', 'unwatched');
      peopleLinkEl.href = url.toString();
    }
  });
})();
