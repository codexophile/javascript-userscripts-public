'use strict';

const SEL_MAIN = `[href*="/Main/"]`;
const SEL_PMWIKI = `[href*="/pmwiki/pmwiki.php/"]`;
const SEL_MAIN_TROPE = `li>span>a:first-child`;
const SEL_TOOLBAR_LINKS = `:is(#main-article,.folder) > ul > li > [href*='/laconic/']:first-child`;
const SEL_MAIN_ARTICLE = 'article#main-article[data-tt-pencils="hover"]';
const SEL_MAIN_ARTICLE_alt = 'article#main-article';
const TROPE_RE = /\.php\/\w+\/(\w+)$/;
const COLOR_SEEN = '#690f08';
const COLOR_IMPORTANT = '#07540b';
const fetchSpinners = new WeakMap();

const specialWordsSet = new Set([
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

  'hint',
  'hints',
  'hinting',
  'hinted',

  'reveal',
  'reveals',
  'revealing',
  'revealed',
  'revelation',
  'revelations',

  'discover',
  'discovers',
  'discovering',
  'discovered',
  'discovery',
  'discoveries',

  'realize',
  'realizes',
  'realizing',
  'realized',
  'realization',
  'realizations',

  'notice',
  'notices',
  'noticing',
  'noticed',

  'confirm',
  'confirms',
  'confirming',
  'confirmed',
  'confirmation',
  'confirmations',

  'deny',
  'denies',
  'denying',
  'denied',
  'denial',
  'denials',

  'admit',
  'admits',
  'admitting',
  'admitted',
  'admission',
  'admissions',

  'confess',
  'confesses',
  'confessing',
  'confessed',
  'confession',
  'confessions',

  // 'claim',
  // 'claims',
  // 'claiming',
  // 'claimed',

  'prove',
  'proves',
  'proving',
  'proved',
  'proven',
  'proof',
  'proofs',

  'explain',
  'explains',
  'explaining',
  'explained',
  'explanation',
  'explanations',

  'evidence',
  'evidence',
  'evidences',
  'evidenced',
  'evidencing',
  'evidential',
  'evidentially',
  'evidentiary',
  'evident',
  'evidently',
  'self-evident',
  'self-evidently',

  'clue',
  'clues',
  'motive',
  'motives',
]);

//* marking items with important words
const specialWordsArr = [...specialWordsSet];
const wordsRegexStr = `\\b(${specialWordsArr.join('|')})\\b`;

waitForEach('li', listEl => {
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

observeLoad(`${SEL_MAIN_ARTICLE} ${SEL_MAIN}`, async item => {
  const currentHref = item.getAttribute('href');

  if (!location.href.includes('/laconic/')) {
    item.setAttribute('href', currentHref.replace('/Main/', '/laconic/'));
    item.setAttribute('target', '_blank');
  }

  const tropeName = extractTropeName(currentHref);
  if (!tropeName) return; // 🛑

  addAnt('✖️', item, () => appendTrope('Seen', tropeName));
  addAnt('✔️', item, () => appendTrope('Important', tropeName));

  const laconicHref = item.href.replace('/Main/', '/laconic/');
  let fetchSucceeded = false;
  const indicatorObj = createStatusIndicator(item);
  try {
    const tempDoc = await fetchDoc(laconicHref);
    const pEl = tempDoc.querySelector(`${SEL_MAIN_ARTICLE_alt} p`);
    if (!pEl) {
      console.log('No p element found in laconic document');
      return;
    }
    const tooltipText = pEl.textContent.trim();
    console.log(item, tooltipText);
    if (!tooltipText) {
      console.log('No text content found in p element');
      return;
    }
    item.title = tooltipText;
    fetchSucceeded = true;
  } catch (error) {
    console.error('Error fetching laconic summary:', error);
  } finally {
    fetchSucceeded
      ? indicatorObj.setStatus_success()
      : indicatorObj.setStatus_error();
  }
});

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

function createStatusIndicator(parentEl) {
  const indicatorEl = generateElements(
    `<span class="tm-status-indicator"
      style="
        display:inline-block;
        margin-left:.35em;
        vertical-align:middle;
      ">
      </span>`,
    parentEl,
  );

  setStaus_spinning();

  function setStaus_spinning() {
    indicatorEl.replaceChildren();
    generateElements(
      `
      <svg width="40" height="40" viewBox="0 0 50 50" role="status" aria-label="Loading">
        <circle cx="25" cy="25" r="20" fill="none" stroke="#e0e0e0" stroke-width="5" />
        <circle cx="25" cy="25" r="20" fill="none" stroke="#3498db" stroke-width="5" stroke-dasharray="80" stroke-dashoffset="60" stroke-linecap="round">
          <animateTransform 
            attributeName="transform" 
            type="rotate" 
            from="0 25 25" 
            to="360 25 25" 
            dur="1s" 
            repeatCount="indefinite" />
        </circle>
      </svg>
    `,
      indicatorEl,
    );
  }

  function setStatus_success() {
    indicatorEl.replaceChildren();
    generateElements(
      `<span style="color:green;font-weight:bold;">✓</span>`,
      indicatorEl,
    );
  }

  function setStatus_error() {
    indicatorEl.replaceChildren();
    generateElements(
      `<span style="color:red;font-weight:bold;">✕</span>`,
      indicatorEl,
    );
  }

  return { indicatorEl, setStaus_spinning, setStatus_success, setStatus_error };
}

function showFetchSpinner(link) {
  let spinner = fetchSpinners.get(link);
  if (!spinner) {
    spinner = document.createElement('span');
    spinner.className = 'tm-fetch-spinner';
    link.appendChild(spinner);
    fetchSpinners.set(link, spinner);
  }
  spinner.title = 'Loading laconic summary...';
  spinner.style.cssText =
    'display:inline-block;width:.75em;height:.75em;margin-left:.35em;border:2px solid currentColor;border-top-color:transparent;border-radius:50%;vertical-align:middle;animation:tm-fetch-spin .7s linear infinite;';
  spinner.textContent = '';
  spinner.removeAttribute('aria-label');

  if (document.getElementById('tm-fetch-spinner-style')) return;
  const styleEl = document.createElement('style');
  styleEl.id = 'tm-fetch-spinner-style';
  styleEl.textContent =
    '@keyframes tm-fetch-spin{to{transform:rotate(360deg)}}';
  document.head.appendChild(styleEl);
}

/**
 * Replaces the loading spinner with an icon showing the fetch result.
 * @param {HTMLAnchorElement} link The link containing the spinner.
 * @param {boolean} succeeded Whether the summary was fetched successfully.
 * @returns {void}
 * @example
 * finishFetchSpinner(link, true);
 */
function finishFetchSpinner(link, succeeded) {
  const spinner = fetchSpinners.get(link);
  if (!spinner) return;
  spinner.textContent = succeeded ? '✓' : '✕';
  spinner.title = succeeded
    ? 'Laconic summary loaded'
    : 'Failed to load laconic summary';
  spinner.setAttribute('aria-label', spinner.title);
  spinner.style.cssText = `display:inline-block;margin-left:.35em;vertical-align:middle;font-weight:bold;color:${succeeded ? '#07540b' : '#b00020'};`;
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

  await waitFor(SEL_MAIN_ARTICLE);
  $(SEL_PMWIKI).each(function () {
    const tropeName = extractTropeName(this.href);
    if (!tropeName) return; // 🛑
    if (tropesSeen.includes(tropeName)) mark(this, COLOR_SEEN);
    if (tropesImportant.includes(tropeName)) mark(this, COLOR_IMPORTANT);
  });
}

function mark(el, color) {
  const isAMainTrope = el.matches(SEL_MAIN_TROPE);
  if (isAMainTrope) {
    const parentEl = el.closest('li');
    style(
      parentEl,
      `
      margin: 10px;
      padding: 5px;
      background-color: ${color};
      border-radius: 5px;
    `,
    );
  } else {
    el.style.outline = `solid ${color}`;
  }
}
