(async function () {
  'use strict';

  const SEL_MAIN = `[href*="/Main/"]`;
  const SEL_PMWIKI = `[href*="/pmwiki/pmwiki.php/"]`;
  const SEL_TOOLBAR_LINKS = `:is(#main-article,.folder) > ul > li > [href*='/laconic/']:first-child`;
  const SEL_MAIN_ARTICLE = '#main-article';
  const TROPE_RE = /\.php\/\w+\/(\w+)$/;
  const COLOR_SEEN = '#690f08';
  const COLOR_IMPORTANT = '#07540b';

  let unsavedChanges = false;
  ['tropesSeen', 'tropesImportant'].forEach(key => {
    GM_addValueChangeListener(key, () => {
      unsavedChanges = true;
    });
  });

  window.addEventListener('beforeunload', event => {
    if (!unsavedChanges) return; // 🛑
    event.returnValue = '🤷🏻‍♂️';
    saveBackup();
  });

  lazyLoad(
    async item => {
      const laconicHref = item.href.replace('/Main/', '/laconic/');
      const tempDoc = await fetchDoc(laconicHref);
      const tooltipText = getArticleText(tempDoc).replace(/\.(\w)/, '.\n\n$1');
      item.title = tooltipText;
    },
    ...$(SEL_MAIN),
  );

  markAndRefresh();

  waitFor('.collapsible-content').then(el => {
    [
      [
        '🕳️',
        () => {
          document.querySelectorAll(SEL_TOOLBAR_LINKS).forEach(link => {
            if (!getComputedStyle(link).outline.includes('solid')) {
              toggle(link.parentElement);
            }
          });
        },
      ],
      ['📤', saveBackup],
      ['Test', test],
    ].forEach(([text, onClick]) =>
      generateToolbarButton(text, el, null, onClick),
    );
  });

  async function test() {
    const tropesIm = (await GM.getValue('tropesImportant')) || [];
    const tropesSeen = (await GM.getValue('tropesSeen')) || [];
    console.log(findDuplicates(tropesIm));
    console.log(findDuplicates(tropesSeen));
  }

  async function saveBackup() {
    const tropesSeen = (await GM.getValue('tropesSeen')) || [];
    const tropesImportant = (await GM.getValue('tropesImportant')) || [];
    downloadText(
      'browser - tvtropes.txt',
      JSON.stringify({ tropesSeen, tropesImportant }),
    );
    unsavedChanges = false;
  }

  $(SEL_MAIN).each(function () {
    const $tropeLink = $(this);
    const currentHref = $tropeLink.attr('href') || '';

    if (!location.href.includes('/laconic/')) {
      $tropeLink.attr('href', currentHref.replace('/Main/', '/laconic/'));
      $tropeLink.attr('target', '_blank');
    }

    const tropeName = extractTropeName($tropeLink.attr('href'));
    if (!tropeName) return; // 🛑

    addAnt('🐜', $tropeLink, function () {
      let allToCopy = `\n[href*=${tropeName}],`;
      GM_setClipboard(allToCopy);
    });
    addAnt('✖️', $tropeLink, () => appendTrope('Seen', tropeName));
    addAnt('✔️', $tropeLink, () => appendTrope('Important', tropeName));

    $tropeLink.on('mouseenter', event => {
      const currentTitle = event.target.title || '';
      if (currentTitle && !currentTitle.match(/^\/pmwiki\/pmwiki.php\//)) {
        return; // 🛑
      }
      GM_xmlhttpRequest({
        method: 'GET',
        url: event.target.href,
        responseType: 'document',
        onload: function (response) {
          event.target.title = getArticleText(
            generateDoc(response.responseText),
          );
        },
      });
    });
  });

  function getArticleText(doc) {
    return doc.querySelector(SEL_MAIN_ARTICLE)?.textContent || '';
  }

  function extractTropeName(href) {
    return href?.match(TROPE_RE)?.[1] || null;
  }

  function addAnt(text, $target, onClick) {
    return $(`<span class=ant>${text}</span>`)
      .insertAfter($target)
      .on('click', onClick);
  }

  function findDuplicates(array) {
    return array.filter(
      (currentVal, index, arr) => arr.indexOf(currentVal) !== index,
    );
  }

  async function appendTrope(which, tropeName) {
    const tropesImportant = (await GM.getValue('tropesImportant')) || [];
    const tropesSeen = (await GM.getValue('tropesSeen')) || [];
    let currentTropes = (await GM.getValue(`tropes${which}`)) || [];

    if (tropesSeen.includes(tropeName)) {
      GM_notification({
        text: 'Already exists in Seen',
        silent: true,
        timeout: 4000,
      });
      tropesSeen.splice(tropesSeen.indexOf(tropeName), 1);
      GM_setValue('tropesSeen', tropesSeen);
    }
    if (tropesImportant.includes(tropeName)) {
      GM_notification({
        text: 'Already exists in Important',
        silent: true,
        timeout: 4000,
      });
      tropesImportant.splice(tropesImportant.indexOf(tropeName), 1);
      GM_setValue('tropesImportant', tropesImportant);
    }

    currentTropes.push(tropeName);
    await GM.setValue(`tropes${which}`, [...new Set(currentTropes)]);
    markAndRefresh();
  }

  async function markAndRefresh() {
    const tropesSeen = (await GM.getValue('tropesSeen')) || [];
    const tropesImportant = (await GM.getValue('tropesImportant')) || [];

    $(SEL_PMWIKI).each(function () {
      const tropeName = extractTropeName(this.href);
      if (!tropeName) return; // 🛑
      if (tropesSeen.includes(tropeName)) mark(this, COLOR_SEEN);
      if (tropesImportant.includes(tropeName)) mark(this, COLOR_IMPORTANT);
    });
  }

  function mark(el, color) {
    if (el.matches('div>ul>li>a:first-child')) {
      style(
        $(el).parent('li')[0],
        `
                    background-color: ${color};
                    border-radius: 4px;
                `,
      );
    } else {
      el.style.outline = `solid ${color}`;
    }
  }
})();
