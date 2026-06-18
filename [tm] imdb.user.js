(function () {
  'use strict';

  //* tooltips for genre/interests pill elements
  const genrePillEls = document.querySelectorAll(
    '[data-testid="interests"] .ipc-chip',
  );
  genrePillEls.forEach(async pillEl => {
    pillEl.addEventListener('click', async event => {
      event.preventDefault();
      const url = pillEl.href;
      const loaderEl = generateElements(`<div>🔃</div>`, pillEl);
      const doc = await fetchDoc(url);
      const descriptionSectionEl = doc.querySelector(
        '[data-testid="interest-description-and-chips"]',
      );
      const enrollDialog = new VanillaDialog({
        content: descriptionSectionEl,
        mode: 'modal',
        closeOnBackdrop: true,
      });
      enrollDialog.show();
      loaderEl.remove();
    });
    style(pillEl, `outline: 1px solid #ceb55d; `);
    return;
  });

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
          <a
            class="ipc-link ipc-link--baseAlt ipc-link--inherit-color"
            href=/title/${titleId}/movieconnections/>Connections
          </a>
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
  history.pushState({ state: 1 }, 'new state', sanitizeLink(location.href));
  waitForEach('a[href*="ref"]', linkEl => {
    const newUrl = sanitizeLink(linkEl.href);
    linkEl.href = newUrl ? newUrl : linkEl.href;
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
  function sanitizeLink(originalUrl) {
    try {
      const newUrl = new URL(originalUrl, location.href);
      let updated = false;

      [...newUrl.searchParams.keys()].forEach(paramName => {
        if (paramName === 'ref' || paramName.startsWith('ref_')) {
          newUrl.searchParams.delete(paramName);
          updated = true;
        }
      });

      if (updated) {
        return newUrl.toString();
      }
      return originalUrl;
    } catch (error) {
      console.warn('Failed to sanitize IMDb link:', originalUrl, error);
    }
  }
})();
