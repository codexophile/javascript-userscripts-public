(function () {
  'use strict';

  const dialogContentEl = generateElements(
    '<div class="dialog-content"></div>',
  );
  dialog('Outline', dialogContentEl);
  document
    .querySelectorAll(`.content-block-regular > :is(h2, h3)`)
    .forEach(headingEl => {
      //* outline
      (function () {
        const clonedEl = headingEl.cloneNode(true);
        const isH2 = headingEl.tagName === 'H2';
        style(
          clonedEl,
          `
          margin: ${isH2 ? '16px' : '12px'} 0 6px;
          padding: ${isH2 ? '6px 10px' : '4px 10px'};
          border-left: ${isH2 ? '3px' : '2px'} solid currentColor;
          font-size: ${isH2 ? '1.15rem' : '1rem'};
          line-height: 1.3;
          font-weight: ${isH2 ? '700' : '600'};
          opacity: ${isH2 ? '1' : '0.85'};
        `,
        );
        dialogContentEl.appendChild(clonedEl);

        clonedEl.addEventListener('click', () => {
          headingEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      })();

      //* imdb links
      (function () {
        const headerText = headingEl.textContent.trim();
        console.log(headerText);
        const matches = headerText.match(/(?:\d+\. )?(.+?) \((\d{4})\)/);
        if (!matches) return;
        const title = matches[1];
        const year = matches[2];
        const query = `${title} ${year}`;
        const imdbLinkEl = generateElements(`<a>Imdb</a>`, headingEl);
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
      })();
    });
})();
