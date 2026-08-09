(function () {
  'use strict';

  //* average rating button for seasons pages
  (async function () {
    if (!location.href.includes('/episodes/')) return;
    const { addButton } = await Collapsible();
    addButton('⭐', null, () => {
      const ratingEls = document.querySelectorAll(
        '.episode-item-wrapper .ipc-rating-star--currentUser .ipc-rating-star--rating',
      );
      const noOfEpisodes = ratingEls.length;
      const valuesArr = Array.from(ratingEls).map(el =>
        parseFloat(el.textContent.trim()),
      );
      const average = valuesArr.reduce((sum, n) => sum + n, 0) / noOfEpisodes;
      alert(
        `Average rating for ${noOfEpisodes} episodes: ${average.toFixed(2)}`,
      );
    });
  })();

  //* bring review titles up
  (function () {
    const processedReviewsIds = new Set();

    const targetParentEl = document.querySelectorAll(
      '[data-testid="hero-parent"] > div > div:first-child',
    )[2];

    const contEl = generateElements(`<div></div>`, targetParentEl);
    style(
      contEl,
      `
      max-width: 500px;
      margin: 20px;
    `,
    );
    waitForEach(
      '[data-testid="user-reviews-summary-shoveler"] .ipc-list-card--span',
      reviewEl => {
        const reviewLinkEl = reviewEl.querySelector(
          '[href*="/reviews/?featured="]',
        );
        const urlObj = new URL(reviewLinkEl.href);
        const reviewId = urlObj.searchParams.get('featured');
        if (processedReviewsIds.has(reviewId)) return;
        const clonedEl = reviewEl.cloneNode(true);
        clonedEl.querySelector('.ipc-html-content').remove();
        style(
          clonedEl,
          `
            font-size: 1.2rem;
            display: block;
            margin-bottom: 10px;
          `,
        );
        console.log(clonedEl);
        contEl.appendChild(clonedEl);

        processedReviewsIds.add(reviewId);
      },
    );
  })();

  //* external links
  (async function () {
    'use strict';

    const titleMatch = location.href.match(/\/title\/(tt\d+)/);
    if (!titleMatch) return;
    const titleId = titleMatch[1];

    const el = await waitFor(`[data-testid="hero__pageTitle"] ~ ul`);
    const titleEl = await waitFor(`[data-testid="hero__pageTitle"]`);
    const title = encodeURIComponent(titleEl.textContent);
    const yearEl = await waitFor(`[href*="/releaseinfo"]`);
    const year = yearEl.textContent;

    //* YTS
    addExtLink('https://yts.gg/', 'browse-movies/' + titleId);
    //* Leet
    addExtLink('https://1337x.to/', `search/${title}+${year}/1/`);
    //* criticker
    addExtLink('https://www.criticker.com/', `?search=${titleId}`);
    function addExtLink(
      urlBase,
      urlRest,
      imgSrc = `https://www.google.com/s2/favicons?sz=64&domain=${urlBase}`,
    ) {
      generateElements(
        `
            <li class=ipc-inline-list__item>
                <a target=_blank href=${urlBase}${urlRest}>
                    <img style='width: 32px' src='${imgSrc}'>
                </a>
            </li>`,
        el,
      );
    }
  })();

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

  //* location.href/link fixes
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
