(function () {
  'use strict';

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
        watchedItemEls.forEach(watchedItemEl => {
          if (isChecked) {
            fadeOut(watchedItemEl);
          } else {
            fadeIn(watchedItemEl);
          }
        });
      });
    });

    waitForEach('.trakt-user-rating', ratingEl => {
      const ratingOutOfFive = parseFloat(ratingEl.textContent.trim());
      if (Number.isNaN(ratingOutOfFive)) return;

      const ratingOutOfTen = ((ratingOutOfFive / 5) * 10).toFixed(1);
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

    // Reads season/episode independently via URLSearchParams instead of a
    // combined regex, so a season-only URL (no episode param) still updates
    // the stored season number.
    function setSeasonAndEpisode(url) {
      let params;
      try {
        params = new URL(url).searchParams;
      } catch {
        return;
      }

      const seasonParam = params.get('season');
      const episodeParam = params.get('episode');

      if (seasonParam !== null) {
        GM_setValue('seasonNumber', seasonParam);
      }
      if (episodeParam !== null) {
        GM_setValue('episodeNumber', episodeParam);
      }
    }
  } else {
    const getStoredSeasonEpisode = () => ({
      seasonNumber: Number(GM_getValue('seasonNumber')),
      episodeNumber: Number(GM_getValue('episodeNumber')),
    });

    let { seasonNumber, episodeNumber } = getStoredSeasonEpisode();

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
        ({ seasonNumber, episodeNumber } = getStoredSeasonEpisode());
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

    // Guard: bail out if we never got a usable season number, rather than
    // building a "/season-NaN" URL and redirecting to it.
    if (!seasonNumber || Number.isNaN(seasonNumber)) return;

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
        if (episodeNumber && !Number.isNaN(episodeNumber)) {
          metacriticGoToEpisode(episodeNumber);
        }
        return;
      }
      location.replace(location.href + seasonSegment);
    }

    if (location.href.startsWith('https://www.rottentomatoes.com/tv/')) {
      if (location.href.match(/\/s\d\d\/e\d\d/)) return;
      if (!episodeNumber || Number.isNaN(episodeNumber)) return;
      const segment = `/s${seasonNumber.toString().padStart(2, '0')}/e${episodeNumber.toString().padStart(2, '0')}`;
      location.replace(location.href + segment);
    }
  }

  async function metacriticGoToEpisode(episodeNumber) {
    await waitFor('a.tv-all-episodes_episode_card');
    const episodeLinkEls = document.querySelectorAll(
      'a.tv-all-episodes_episode_card',
    );
    episodeLinkEls[episodeNumber - 1]?.click();
  }
})();
