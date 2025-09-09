(function () {
  'use strict';
  if (window.top != window.self) return; //don't run on frames or iframes

  displayCountryFlag();

  function displayCountryFlag() {
    const { countryName, countryCode } = getCountryOfOrigin();
  }

  function getCountryOfOrigin() {
    const countryEl = document.querySelector(`[href*="country_of_origin"]`);
    if (!countryEl) return;

    const countryName = countryEl.innerText.trim();

    const matches = countryEl.href.match(/country_of_origin=(..)/);
    const countryCode = matches ? matches[1] : null;

    return { countryName, countryCode };
  }
})();
