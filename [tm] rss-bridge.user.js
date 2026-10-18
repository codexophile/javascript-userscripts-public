(async function () {
  'use strict';
  const searchParaObj = new URLSearchParams(location.search);
  const inputUrl = searchParaObj.get('input-url');
  if (!inputUrl) return;
  const inputUrlDecoded = decodeURIComponent(inputUrl);
  const mainInputEl = document.querySelector(
    `section.searchbar > input[type="text"]`,
  );
  if (!mainInputEl) {
    alert('Main input element not found');
    return;
  }
  mainInputEl.value = inputUrlDecoded;
  const searchBtnEl = document.querySelector('button#findfeed');
  if (!searchBtnEl) {
    alert('Search button element not found');
    return;
  }
  await asyncTimeout(1000);
  searchBtnEl.click();
})();
