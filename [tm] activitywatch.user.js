(async function () {
  'use strict';

  const SELECTOR = 'select.custom-select-sm';
  waitForEach(SELECTOR, listboxEl => {
    sortOptions(listboxEl);
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
