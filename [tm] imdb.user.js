(function () {
  'use strict';

  //* tmdb banner
  (function () {
    return;
    ('use strict');
    if (location.href.includes('/title/tt')) {
      const tmdbApiKey = getSecret('TMDB API key');
      if (!tmdbApiKey) return;
      fetchBackdrop();

      async function fetchBackdrop() {
        const imdbId = getImdbId();
        try {
          // Ask TMDB for media details using the IMDb ID
          const response = await fetch(
            `https://api.themoviedb.org/3/find/${imdbId}?api_key=${tmdbApiKey}&external_source=imdb_id`,
          );
          const data = await response.json();
          console.log('TMDB response:', data);

          let backdropPath = null;

          // TMDB organizes results by media type. We check movies, TV shows, and episodes.
          const categories = [
            'movie_results',
            'tv_results',
            'tv_episode_results',
          ];
          for (let category of categories) {
            if (
              data[category] &&
              data[category].length > 0 &&
              data[category][0].backdrop_path
            ) {
              backdropPath = data[category][0].backdrop_path;
              break;
            }
          }

          if (backdropPath) {
            // Construct the full URL for the highest quality image ('original')
            const imageUrl = `https://image.tmdb.org/t/p/original${backdropPath}`;
            console.log('Backdrop found on TMDB:', imageUrl);
            // injectBannerCSS(imageUrl);
            window.open(imageUrl, '_blank');
          } else {
            console.log('No backdrop found on TMDB for this title.');
          }
        } catch (error) {
          console.error('Failed to fetch backdrop from TMDB:', error);
        }
      }
    }
  })();

  //* watched filter for "more like this"
  const targetEl = document.querySelector(
    `[data-testid="MoreLikeThis"] .ipc-title__actions`,
  );
  if (targetEl) {
    const filterBtnEl = generateElements(`<button">👁️</button>`, targetEl);
    filterBtnEl.classList = 'ipc-btn ipc-btn--secondary ipc-btn--small';
    filterBtnEl.style = 'margin-left: 8px;';
    let toggled = false;
    filterBtnEl.addEventListener('click', () => {
      const locatorEls = document.querySelectorAll('.ipc-rate-button--rated');
      locatorEls.forEach(el => {
        const parentEl = el.closest('.ipc-poster-card');
        if (parentEl) {
          parentEl.style.display = toggled ? '' : 'none';
        }
      });
      toggled = !toggled;
    });
  }

  //* adding "connections" to the top nav
  (function () {
    const subNavbarEl = document.querySelector(
      `[data-testid="hero-subnav-bar-topic-links"]`,
    );
    if (subNavbarEl) {
      const titleId = getImdbId();
      if (!titleId) return;
      generateElements(
        `<li role="presentation" class="ipc-inline-list__item">
        <a href=/title/${titleId}/movieconnections/>Connections</a>
      </li>`,
        subNavbarEl,
      );
    }
  })();

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
  waitForEach('a[href*="ref"]', linkEl => {
    try {
      const url = new URL(linkEl.href, location.href);
      let updated = false;

      [...url.searchParams.keys()].forEach(paramName => {
        if (paramName === 'ref' || paramName.startsWith('ref_')) {
          url.searchParams.delete(paramName);
          updated = true;
        }
      });

      if (updated) {
        linkEl.href = url.toString();
      }
    } catch (error) {
      console.warn('Failed to sanitize IMDb link:', linkEl.href, error);
    }
  });

  //? I'm not sure what this is 👇
  const $moreFromSectionEl = $(`[data-testid="more-from-section"]`);
  $moreFromSectionEl.insertBefore('[data-testid="contribution"]');

  //*____________________
  if (location.href.includes('https://m.')) {
    location.replace(location.href.replace('https://m.', 'https://www.'));
  }

  //* Helpers
  function getImdbId() {
    const matches = location.href.match(/\/(tt.+?)(\/|$)/);
    return matches ? matches[1] : null;
  }
})();
