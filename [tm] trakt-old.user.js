(async function () {
  'use strict';

  //*
  window.addEventListener('urlchange', urlChangeInfo => {
    const matches = urlChangeInfo.url.match(
      /\/seasons\/(\d+)\/episodes\/(\d+)/,
    );
    if (matches) {
      const seasonNumber = matches[1];
      const episodeNumber = matches[2];
      GM_setValue('seasonNumber', seasonNumber);
      GM_setValue('episodeNumber', episodeNumber);
    }
  });

  //*
  waitForEach(
    ':is([itemtype="http://schema.org/ItemList"], #recommendations-wrapper) [href^="/movies/"]',
    movieLinkEl => {
      movieLinkEl.href += '#redirectIMDb';
    },
  );
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
