(function () {
  'use strict';

  if (!location.href.includes('/v1/search?apex=')) return;
  const preEl = document.querySelector('pre');
  const preElText = preEl.textContent.trim();
  const match = preElText.match(
    /invalid apex: not an apex \(eTLD\+1 is (.+)\)/,
  );
  if (match) {
    location.replace(`https://crt.name/v1/search?apex=${match[1]}`);
  }
  preEl.innerHTML = preEl.textContent
    .trim()
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(url => `<a href="//${url}" target="_blank">${url}</a>`)
    .join('\n');
})();
