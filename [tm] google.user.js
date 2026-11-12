(function () {
  'use strict';

  const SVGs = {
    copy: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="24px" width="24px" fill="#e3e3e3"><path d="M9,18q-0.82,0-1.41-0.59T7,16V4Q7,3.17 7.59,2.59T9,2h9q0.82,0 1.41,0.59T20,4V16q0,0.82-0.59,1.41T18,18H9Zm0-2h9V4H9V16ZM5,22q-0.83,0-1.41-0.59T3,20V6H5V20H16v2H5Zm4-6V4V16Z"/></svg>`,
  };

  if (location.href.includes('/url?q=')) {
    window.stop();
    let targetUrl = window.location.href.slice(
      window.location.href.indexOf('q=') + 2,
    );
    location.replace(targetUrl);
    return;
  }

  if (location.href.includes('/sorry/')) {
    const parentEl = document.querySelector('[style*="font-size:13px;"]');
    const params = new URLSearchParams(location.search);
    const targetUrl = params.get('continue');
    const paramsForYT = new URLSearchParams(targetUrl);
    const youtubeID = paramsForYT.get('https://www.youtube.com/watch?v');

    parentEl.append(generateElements('<hr>'));
    parentEl.append(
      generateElements(`
      <div>
          <span> Target: </span>
          <a href=${targetUrl}> ${targetUrl} </a>
      </div>
    `),
    );

    return;
  }

  if (location.href.includes('#newTab')) {
    let url = $('[data-async-context^="query:"]')
      .children()
      .first()
      .find('a[href]')
      .attr('href');
    window.open(url);
  }

  const query = '[data-hveid][data-complete]:not(a)';
  const copyBtnClass = 'cdx-google-copy-btn';
  GM_addStyle(`
    ${query}:has(>.${copyBtnClass}:hover) {
      background-color: #392d5d;
      outline: 1px solid #e3e3e3;
    }
    .${copyBtnClass} {
      width: 5px;
      height: 5px;
    }
  `);
  waitForEach(query, el => {
    const copyBtnEl = generateElements(`<button>${SVGs.copy}</button>`, el);
    copyBtnEl.classList.add(copyBtnClass);
    copyBtnEl.addEventListener('click', () => {
      // const text = el.textContent;
      copyElementWithFormatting(el);
    });
  });

  waitForEach(
    `[href^="https://stackoverflow.com/questions/"]`,
    async linkEl => {
      const mainContainerEl = linkEl.parentElement;
      const parentEl = generateElements(`<div></div>`, mainContainerEl);
      const tempDoc = await fetchDoc(linkEl.href, null);
      tempDoc
        .querySelectorAll('.post-layout  [href*="/questions/tagged/"]')
        .forEach(item => {
          parentEl.append(item);
          style(
            item,
            `
                font-size: large;
                margin: 3px;
                padding: 3px;
                background-color: #99c3ff;
                border-radius: 3px;
                color: black;
            `,
          );
        });
    },
  );
})();
