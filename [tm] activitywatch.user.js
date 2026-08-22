(async function () {
  'use strict';

  //* sort listbox
  const LIST_BOX_SELECTOR = 'select.custom-select-sm';
  waitForEach(LIST_BOX_SELECTOR, listboxEl => {
    sortOptions(listboxEl);
  });

  //* category copy
  waitForEach('[id^="summary_"]', categoryEl => {
    categoryEl.addEventListener('click', () => {
      const titleEl = categoryEl.querySelector('title');
      GM_setClipboard(titleEl.textContent);
    });
  });

  function sortOptions(selectEl) {
    const optionsArr = Array.from(selectEl.options);
    optionsArr.sort((a, b) => a.text.localeCompare(b.text));
    // Remove existing options
    while (selectEl.firstChild) {
      selectEl.removeChild(selectEl.firstChild);
    }
    // Append sorted options back to the select
    optionsArr.forEach(option => selectEl.appendChild(option));
  }
})();
