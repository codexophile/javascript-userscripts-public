(function () {
  ('use strict');

  if (location.host === 'app.trakt.tv') {
    waitForEach('.trakt-filter-button', filterButtonEl => {
      const switchEl = generateElements(
        '<input type="checkbox" class="trakt-filter-switch">',
      );
      switchEl.title = 'Toggle watched items';
      filterButtonEl.before(switchEl);

      switchEl.addEventListener('change', () => {
        const isChecked = switchEl.checked;
        const watchedItemEls = document.querySelectorAll(
          'svelte-css-wrapper:has(>.trakt-gesture-container):has([data-variant="full"])',
        );
        if (isChecked) {
          watchedItemEls.forEach(watchedItemEl => {
            fadeOut(watchedItemEl);
          });
        } else {
          watchedItemEls.forEach(watchedItemEl => {
            fadeIn(watchedItemEl);
          });
        }
      });
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
  } else {
    const seasonNumber = Number(GM_getValue('seasonNumber'));
    const episodeNumber = Number(GM_getValue('episodeNumber'));

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
        seasonNumber = Number(GM_getValue('seasonNumber'));
        episodeNumber = Number(GM_getValue('episodeNumber'));
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

    if (
      location.href.match(/www\.justwatch\.com\/.+?\/tv-series\//) &&
      !location.href.includes(`/season-${seasonNumber}`)
    ) {
      const seasonSegment = `/season-${seasonNumber}`;
      location.replace(location.href + seasonSegment);
    }

    if (location.href.startsWith('https://www.metacritic.com/tv/')) {
      const seasonSegment = `/season-${seasonNumber}`;
      if (location.href.includes(seasonSegment)) {
        if (location.href.includes('/episode-')) return;
        metacriticGoToEpisode(episodeNumber);
        return;
      }
      location.replace(location.href + seasonSegment);
    }

    if (location.href.startsWith('https://www.rottentomatoes.com/tv/')) {
      if (location.href.match(/\/s\d\d\/e\d\d/)) return;
      const segment = `/s${seasonNumber.toString().padStart(2, '0')}/e${episodeNumber.toString().padStart(2, '0')}`;
      location.replace(location.href + segment);
    }
  }

  async function metacriticGoToEpisode(episodeNumber) {
    await waitFor('a.tv-all-episodes_episode_card');
    const episodeLinkEls = document.querySelectorAll(
      'a.tv-all-episodes_episode_card',
    );
    console.log(episodeLinkEls);
    episodeLinkEls[episodeNumber - 1]?.click();
  }
})();
