(function () {
  'use strict';

  if (!location.href.includes('/v1/search?apex=')) return;
  const preEl = document.querySelector('pre');
  preEl.innerHTML = preEl.textContent
    .trim()
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(url => `<a href="//${url}" target="_blank">${url}</a>`)
    .join('\n');
})();
