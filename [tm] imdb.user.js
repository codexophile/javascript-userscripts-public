(function () {
  'use strict';

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
  const subNavbarEl = document.querySelector(
    `[data-testid="hero-subnav-bar-topic-links"]`,
  );
  if (subNavbarEl) {
    const matches = location.href.match(/\/(tt.+?)\//);
    const titleId = matches ? matches[1] : null;
    if (!titleId) return;
    generateElements(
      `<li role="presentation" class="ipc-inline-list__item">
        <a href=/title/${titleId}/movieconnections/>Connections</a>
      </li>`,
      subNavbarEl,
    );
  }

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
})();
