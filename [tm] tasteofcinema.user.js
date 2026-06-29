(function () {
  'use strict';
  if (window.top != window.self) return; //don't run on frames or iframes

  const headerEls = document.querySelectorAll(
    '.entry-content span[style*="font-size: 20px;"]',
  );
  console.log(headerEls);
  headerEls.forEach(headerEl => {
    const headerText = headerEl.textContent.trim();
    const matches = headerText.match(/\d+\. (.+?) \((\d{4})\)/);
    if (!matches) return;
    const title = matches[1];
    const year = matches[2];
    const query = `${title} ${year}`;
    const imdbLinkEl = generateElements(`<a>Imdb</a>`, headerEl);
    imdbLinkEl.setAttribute(
      'href',
      `https://www.google.com/search?btnI=1&q=${query}%20site:imdb.com/title`,
    );
    imdbLinkEl.setAttribute('target', '_blank');
    style(
      imdbLinkEl,
      `
      margin-left: 10px;
      color: #fff;
    `,
    );
  });
})();
