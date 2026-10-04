(function () {
  'use strict';

  const dialogContentEl = generateElements(
    '<div class="dialog-content"></div>',
  );
  dialog('Outline', dialogContentEl);
  document
    .querySelectorAll(`.content-block-regular > :is(h2, h3)`)
    .forEach(headingEl => {
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
        headingEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });
})();
