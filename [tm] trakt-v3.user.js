(function () {
  'use strict';

  waitForEach('.trakt-user-rating', ratingEl => {
    const ratingOutOfFive = parseFloat(ratingEl.textContent.trim());
    const ratingOutOfTen = (Number(ratingOutOfFive) / 5) * 10;
    const ratingOutOfTenEl = generateElements(
      `<span class="trakt-user-rating-out-of-ten">${ratingOutOfTen}/10</span>`,
      ratingEl,
    );
    ratingOutOfTenEl.title = 'Out of 10';
  });
})();
