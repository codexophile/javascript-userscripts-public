(function () {
  'use strict';

  if (location.host === 'tvtime.trakt.tv') {
    const newUrl = location.href.replace('tvtime.trakt.tv', 'app.trakt.tv');
    location.replace(newUrl);
    return;
  }

  waitForEach('.trakt-summary-card-bottom-bar', bottomBarEl => {
    const parentEl = bottomBarEl.closest('trakt-default-media-item');
    const titlePartOne = parentEl
      .querySelector('.trakt-card-title')
      ?.textContent.trim();
    const titlePartTwo = parentEl
      .querySelector('.secondary')
      ?.textContent.trim();
    const title = [titlePartOne, titlePartTwo].filter(Boolean).join(' - ');
    const year = parentEl
      .querySelector('.trakt-summary-card-tags')
      ?.textContent.trim()
      .match(/\d{4}/)?.[0];
    const query = [title, year].filter(Boolean).join(' ');
    const searchUrl = `https://www.google.com/search?btnI=1&q=${encodeURIComponent(
      query,
    )}+site:imdb.com`;
    generateElements(
      `<a href="${searchUrl}" target="_blank" class="trakt-search-link">IMDb</a>`,
      bottomBarEl,
    );
  });

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
    const alreadyAddedEl = ratingEl.querySelector(
      '.trakt-user-rating-out-of-ten',
    );
    if (alreadyAddedEl) return;

    const ratingOutOfFive = parseFloat(ratingEl.textContent.trim());
    if (Number.isNaN(ratingOutOfFive)) return;

    const ratingOutOfTen = ((ratingOutOfFive / 5) * 10).toFixed(1);
    const ratingOutOfTenEl = generateElements(
      `<span class="trakt-user-rating-out-of-ten">${ratingOutOfTen}/10</span>`,
      ratingEl,
    );
    ratingOutOfTenEl.title = 'Out of 10';
  });
})();
