(async function () {
  ('use strict');

  waitForEach('.inline-rating', ratingEl => {
    const titleEl = ratingEl.querySelector('title');
    if (!titleEl) return;
    const starString = titleEl.textContent.trim();
    const ratingOutOfTen = parseRatingOutOfTen(starString);
    const ratingOutOfTenEl = generateElements(
      `<a class=inline-rating>${ratingOutOfTen}/10</a>`,
      ratingEl,
    );
    style(
      ratingOutOfTenEl,
      `
      margin-left: 10px;
    `,
    );
  });

  function parseRatingOutOfTen(str) {
    const fullStars = (str.match(/★/g) || []).length;
    const halfStars = (str.match(/½/g) || []).length;
    const rating = fullStars * 2 + halfStars * 1;
    return Math.min(rating, 10);
  }

  (async function () {
    'use strict';
    const ratingEl = await waitFor('.averagerating');
    const parentEl = ratingEl.parentElement;
    const ratingOutOfFive = parseFloat(ratingEl.textContent.trim());
    const ratingOutOfTen = ratingOutOfFive * 2;
    const ratingOutOfTenEl = generateElements(
      `<a class=averagerating>${ratingOutOfTen}</a>`,
      parentEl,
    );
    ratingOutOfTenEl.title = 'Out of 10';
  })();

  GM_addStyle(`
  /* 1. Modify the existing grid to add a 4th column */
.rating-histogram > .layout {
    display: grid;
    align-items: end;
    /* Add 'new-average' to the top row, and make 'stars-end' stretch across both bottom columns */
    grid-template-areas: 
        "stars-start chart average new-average" 
        "stars-start chart stars-end stars-end";
    /* Add one more 'auto' at the end for the new column */
    grid-template-columns: [rating-start] auto 1fr auto auto;
    grid-template-rows: [rating-start] 1fr [average-end] auto [rating-end];
}

/* 2. Assign the newly added 7.6 element to the 'new-average' grid area */
.rating-histogram > .layout > .averagerating:last-child {
    grid-area: new-average;
    margin-left: 8px; /* Adds a little breathing room between the two numbers */
    color: #9ab; /* Example: adjust the color to fit your theme */
}

/* Optional: Add a subtle slash "/" between the numbers for a cleaner look */
.rating-histogram > .layout > .averagerating:last-child::before {
    content: "/ ";
    opacity: 0.5;
    margin-right: 4px;
}
  `);
})();
