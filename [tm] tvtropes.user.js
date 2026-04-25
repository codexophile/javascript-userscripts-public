(async function () {
  'use strict';

  const SEL_MAIN = `[href*="/Main/"]`;
  const SEL_PMWIKI = `[href*="/pmwiki/pmwiki.php/"]`;
  const SEL_TOOLBAR_LINKS = `:is(#main-article,.folder) > ul > li > [href*='/laconic/']:first-child`;
  const SEL_MAIN_ARTICLE = '#main-article';
  const TROPE_RE = /\.php\/\w+\/(\w+)$/;
  const COLOR_SEEN = '#690f08';
  const COLOR_IMPORTANT = '#07540b';
  const fetchSpinners = new WeakMap();

  const specialWords = [
    'imply',
    'implies',
    'implying',
    'implied',
    'implication',
    'implications',
    'implicative',
    'implicatively',
    'implicational',
    'implicit',
    'implicitly',
    'implicitness',
    'implicate',
    'implicated',
    'implicates',
    'implicating',
    'implicative',
    'implicatively',

    'suggest',
    'suggests',
    'suggesting',
    'suggested',
  ];

  //* marking items with important words
  const listEls = document.querySelectorAll(`li`);
  const uniqueSpecialWords = [...new Set(specialWords)];
  const wordsRegexStr = `\\b(${uniqueSpecialWords.join('|')})\\b`;

  listEls.forEach(listEl => {
    const walker = document.createTreeWalker(
      listEl,
      NodeFilter.SHOW_TEXT,
      null,
      false,
    );
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);

    let hasSpecialWord = false;
    nodes.forEach(textNode => {
      const content = textNode.nodeValue;
      const execRegex = new RegExp(wordsRegexStr, 'gi');
      let match;
      let hasMatch = false;
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;

      while ((match = execRegex.exec(content)) !== null) {
        hasMatch = true;
        fragment.appendChild(
          document.createTextNode(content.substring(lastIndex, match.index)),
        );
        const mark = document.createElement('mark');
        mark.style.backgroundColor = 'yellow';
        mark.style.color = 'black';
        mark.textContent = match[0];
        fragment.appendChild(mark);
        lastIndex = execRegex.lastIndex;
      }

      if (hasMatch) {
        hasSpecialWord = true;
        fragment.appendChild(
          document.createTextNode(content.substring(lastIndex)),
        );
        const parent = textNode.parentNode;
        if (parent) {
          parent.insertBefore(fragment, textNode);
          parent.removeChild(textNode);
        }
      }
    });

    if (hasSpecialWord) {
      listEl.style.border = '2px solid orange';
      listEl.style.padding = '0.5em';
    }
  });

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
      showFetchSpinner(item);
      const laconicHref = item.href.replace('/Main/', '/laconic/');
      try {
        const tempDoc = await fetchDoc(laconicHref);
        const tooltipText = getArticleText(tempDoc).replace(
          /\.(\w)/,
          '.\n\n$1',
        );
        item.title = tooltipText;
      } finally {
        hideFetchSpinner(item);
      }
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

  function showFetchSpinner(link) {
    if (fetchSpinners.has(link)) return;

    const spinner = document.createElement('span');
    spinner.className = 'tm-fetch-spinner';
    spinner.title = 'Loading laconic summary...';
    spinner.style.cssText =
      'display:inline-block;width:.75em;height:.75em;margin-left:.35em;border:2px solid currentColor;border-top-color:transparent;border-radius:50%;vertical-align:middle;animation:tm-fetch-spin .7s linear infinite;';

    link.appendChild(spinner);
    fetchSpinners.set(link, spinner);

    if (document.getElementById('tm-fetch-spinner-style')) return;
    const styleEl = document.createElement('style');
    styleEl.id = 'tm-fetch-spinner-style';
    styleEl.textContent =
      '@keyframes tm-fetch-spin{to{transform:rotate(360deg)}}';
    document.head.appendChild(styleEl);
  }

  function hideFetchSpinner(link) {
    const spinner = fetchSpinners.get(link);
    if (!spinner) return;
    spinner.remove();
    fetchSpinners.delete(link);
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
