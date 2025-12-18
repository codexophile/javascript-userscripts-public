(function () {
  'use strict';

  //* link fixes
  let observer = new MutationObserver(() => {
    $('a[href*="?ref"]').each(function () {
      this.href = this.href.replace(/\?ref.*$/, '');
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });

  //* External links
  addExternalLinks();

  const $moreFromSectionEl = $(`[data-testid="more-from-section"]`);
  $moreFromSectionEl.insertBefore('[data-testid="contribution"]');

  //*____________________
  if (location.href.includes('https://m.')) {
    location.replace(location.href.replace('https://m.', 'https://www.'));
  }

  async function addExternalLinks() {
    const titleMatch = location.href.match(/\/title\/(tt\d+)/);

    if (!titleMatch) return;

    const el = await waitFor(`[data-testid="hero__pageTitle"] ~ ul`);
    const titleEl = await waitFor(`[data-testid="hero__pageTitle"]`);
    const title = encodeURIComponent(titleEl.textContent);
    const yearEl = await waitFor(`[href*="/releaseinfo"]`);
    const year = yearEl.textContent;

    //* YTS
    const titleId = titleMatch[1];
    addExtLink('https://yts.lt/', 'browse-movies/' + titleId);

    //* Leet
    addExtLink('https://1337x.to/', `search/${title}+${year}/1/`);

    function addExtLink(
      urlBase,
      urlRest,
      imgSrc = `https://www.google.com/s2/favicons?sz=64&domain=${urlBase}`
    ) {
      generateElements(
        `
            <li class=ipc-inline-list__item>
                <a target=_blank href=${urlBase}${urlRest}>
                    <img style='width: 32px' src='${imgSrc}'>
                </a>
            </li>`,
        el
      );
    }
  }
})();
