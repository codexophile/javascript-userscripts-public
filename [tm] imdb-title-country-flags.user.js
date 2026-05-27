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
      locatorEl.parentElement,
    );

    countries.forEach(({ countryName, countryCode }, idx) => {
      const flagSrc = `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;
      const flagImg = document.createElement('img');
      flagImg.src = flagSrc;
      flagImg.alt = countryName;
      flagImg.title = countryName;
      flagImg.style.marginRight = '8px';

      const countryLink = document.createElement('a');
      countryLink.href = `/search/title/?country_of_origin=${countryCode}`;
      countryLink.appendChild(flagImg);
      newParent.appendChild(countryLink);

      if (idx < countries.length - 1) {
        generateElements(`<span> </span>`, newParent); // space between flags
      }
    });

    generateElements(`<span> • </span>`, newParent);

    const languages = getLanguages();
    if (languages.length) {
      languages.forEach((lang, idx) => {
        const langLink = document.createElement('a');
        langLink.className =
          'ipc-link ipc-link--baseAlt ipc-link--inherit-color';
        langLink.href = `/search/title/?primary_language=${lang.code}`;
        langLink.textContent = lang.name;
        newParent.appendChild(langLink);

        if (idx < languages.length - 1) {
          generateElements(`<span>, </span>`, newParent);
        }
      });
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

  function getLanguages() {
    const languageEls = document.querySelectorAll(`[href*="primary_language"]`);
    if (!languageEls.length) return [];
    return Array.from(languageEls)
      .map(el => {
        const name = el.innerText.trim();
        const matches = el.href.match(/primary_language=([a-z]+)/);
        const code = matches ? matches[1] : null;
        return code ? { name, code } : null;
      })
      .filter(Boolean);
  }
})();
