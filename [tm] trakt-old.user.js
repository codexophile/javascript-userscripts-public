(async function () {
  'use strict';

  if (location.href.includes('https://www.ratingraph.com/tv-shows/')) {
    GM_addValueChangeListener('seasonNumber', highlightEpisode);
    GM_addValueChangeListener('episodeNumber', highlightEpisode);
    highlightEpisode();

    async function highlightEpisode() {
      const seasonNumber = +GM_getValue('seasonNumber');
      const episodeNumber = +GM_getValue('episodeNumber');
      if (!(seasonNumber && episodeNumber)) return;
      await waitFor('#graph_show_episodes_average_rating .highcharts-series');
      const seasonEl = document.querySelectorAll(
        '#graph_show_episodes_average_rating .highcharts-markers.highcharts-scatter-series',
      )[seasonNumber - 1];
      const episodeEl = seasonEl.children[episodeNumber - 1];
      style(episodeEl, `outline: 2px solid red;`);
      return;
    }
  }

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
