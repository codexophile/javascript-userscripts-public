(function () {
  'use strict';

  waitForEach('.trakt-filter-button', filterButtonEl => {
    const switchEl = generateElements(
      '<input type="checkbox" class="trakt-filter-switch">',
    );
    switchEl.title = 'Toggle watched items';
    filterButtonEl.before(switchEl);
  });

  waitForEach('.trakt-user-rating', ratingEl => {
    const ratingOutOfFive = parseFloat(ratingEl.textContent.trim());
    const ratingOutOfTen = (Number(ratingOutOfFive) / 5) * 10;
    const ratingOutOfTenEl = generateElements(
      `<span class="trakt-user-rating-out-of-ten">${ratingOutOfTen}/10</span>`,
      ratingEl,
    );
    ratingOutOfTenEl.title = 'Out of 10';
  });

  //* ratingraph stuff
  if (
    location.hostname === 'www.ratingraph.com' &&
    location.pathname.startsWith('/tv-shows/')
  ) {
    let highlightRunId = 0;

    GM_addValueChangeListener('seasonNumber', highlightEpisode);
    GM_addValueChangeListener('episodeNumber', highlightEpisode);
    highlightEpisode();
    return;

    async function highlightEpisode() {
      const runId = ++highlightRunId;
      const seasonNumber = Number(GM_getValue('seasonNumber'));
      const episodeNumber = Number(GM_getValue('episodeNumber'));
      if (!(seasonNumber && episodeNumber)) return;
      await waitFor('#graph_show_episodes_average_rating .highcharts-series');
      if (runId !== highlightRunId) return;

      document
        .querySelectorAll(
          '#graph_show_episodes_average_rating .highcharts-markers.highcharts-scatter-series [style*="outline"]',
        )
        .forEach(episodeEl => {
          episodeEl.style.outline = '';
        });

      const seasonEl = document.querySelectorAll(
        '#graph_show_episodes_average_rating .highcharts-markers.highcharts-scatter-series',
      )[seasonNumber - 1];
      const episodeEl = seasonEl?.children?.[episodeNumber - 1];
      if (!episodeEl) return;

      style(episodeEl, 'outline: 2px solid red;');
      return;
    }
  }

  setSeasonAndEpisode(location.href);
  window.addEventListener('urlchange', urlChangeInfo => {
    setSeasonAndEpisode(urlChangeInfo.url);
  });

  function setSeasonAndEpisode(url) {
    const matches = url.match(/[\?&]season=(\d+).*?[\?&]episode=(\d+)/);
    if (matches) {
      const seasonNumber = matches[1];
      const episodeNumber = matches[2];
      GM_setValue('seasonNumber', seasonNumber);
      GM_setValue('episodeNumber', episodeNumber);
    }
  }
})();
