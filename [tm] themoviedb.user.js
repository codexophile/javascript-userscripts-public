(async function () {
  'use strict';

  const WHEN_TO_REDIRECT = /%3Flanguage%3Den-US/;
  const matches = location.href.match(WHEN_TO_REDIRECT);
  if (matches) {
    const newUrl = location.href.replace(WHEN_TO_REDIRECT, '');
    location.replace(newUrl);
  }
})();
