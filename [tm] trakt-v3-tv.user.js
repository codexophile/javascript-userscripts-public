(function () {
  'use strict';

  let lastUrl = '';
  main();
  window.addEventListener('urlchange', main);

  async function main(event) {
    if (event) {
      if (event.url === lastUrl) return;
      setSeasonAndEpisode(event.url);
    }
    lastUrl = location.href;

    if (location.host === 'app.trakt.tv') {
      return;
    } else {
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
          await waitFor(
            '#graph_show_episodes_average_rating .highcharts-series',
          );
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

      if (location.href.startsWith('https://www.criticker.com/tv/')) {
        const seasonOrEpisodeTabEl = await waitFor(
          '[data-section="seasons"], [data-section="episodes"]',
        );
        seasonOrEpisodeTabEl.click();

        await waitFor('#seasons_section, #episodes_section');
        const seasonsSectionEl = document.querySelector(`#seasons_section`);
        if (seasonsSectionEl) {
          const seasonLinkEls = seasonsSectionEl.querySelectorAll(
            '#seasons_section .titlerow_name_header a',
          );
          seasonLinkEls[seasonNumber - 1]?.click();
        } else {
          const episodesSectionEl = document.querySelector(`#episodes_section`);
          const episodeLinkEls = episodesSectionEl.querySelectorAll(
            '#episodes_section .titlerow_name_header a',
          );
          episodeLinkEls[episodeNumber - 1]?.click();
        }
      }

      if (
        location.href.match(/www\.justwatch\.com\/.+?\/tv-series\//) &&
        !location.href.includes(`/season-`)
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
        if (location.href.includes('/season-')) return;
        location.replace(location.href + seasonSegment);
      }

      if (location.href.startsWith('https://www.rottentomatoes.com/tv/')) {
        if (location.href.match(/\/s\d\d(\/e\d\d)?/)) return;
        if (!episodeNumber || Number.isNaN(episodeNumber)) return;
        const segment = `/s${seasonNumber.toString().padStart(2, '0')}/e${episodeNumber.toString().padStart(2, '0')}`;
        location.replace(location.href + segment);
      }
    }
  }

  function getStoredSeasonEpisode() {
    return {
      seasonNumber: Number(GM_getValue('seasonNumber')),
      episodeNumber: Number(GM_getValue('episodeNumber')),
    };
  }

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

  async function metacriticGoToEpisode(episodeNumber) {
    await waitFor('a.tv-all-episodes_episode_card');
    const episodeLinkEls = document.querySelectorAll(
      'a.tv-all-episodes_episode_card',
    );
    episodeLinkEls[episodeNumber - 1]?.click();
  }
})();
