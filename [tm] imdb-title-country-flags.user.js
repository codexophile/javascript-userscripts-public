(function () {
  'use strict';
  if (window.top != window.self) return; //don't run on frames or iframes

  displayCountryFlag();

  function displayCountryFlag() {
    const countries = getCountriesOfOrigin();
    if (!countries.length) return;

    const locatorEl = document.querySelector(`[data-testid="hero__pageTitle"]`);
    const newParent = generateElements(
      `<ul id=new-parent></ul>`,
      locatorEl.parentElement
    );

    countries.forEach(({ countryName, countryCode }, idx) => {
      const flagSrc = `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;
      const flagImg = document.createElement('img');
      flagImg.src = flagSrc;
      flagImg.alt = countryName;
      flagImg.title = countryName;
      flagImg.style.marginRight = '8px';
      newParent.appendChild(flagImg);
      if (idx < countries.length - 1) {
        generateElements(`<span> </span>`, newParent); // space between flags
      }
    });

    generateElements(`<span> • </span>`, newParent);

    const language = getLanguage();
    if (language) {
      const langSpan = document.createElement('span');
      langSpan.textContent = language;
      newParent.appendChild(langSpan);
    }
  }

  function getCountriesOfOrigin() {
    const countryEls = document.querySelectorAll(`[href*="country_of_origin"]`);
    if (!countryEls.length) return [];
    return Array.from(countryEls)
      .map(countryEl => {
        const countryName = countryEl.innerText.trim();
        const matches = countryEl.href.match(/country_of_origin=(..)/);
        const countryCode = matches ? matches[1] : null;
        return countryCode ? { countryName, countryCode } : null;
      })
      .filter(Boolean);
  }

  function getLanguage() {
    const languageEl = document.querySelector(`[href*="primary_language"]`);
    if (!languageEl) return;
    const language = languageEl.innerText.trim();
    return language;
  }
})();
