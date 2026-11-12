'use strict';
const linkEl = await waitFor(`.titleline > a`);
const link = linkEl.getAttribute(`href`);
if (getId(location.href) === getId(link)) return;
window.open(link, '_blank');

function getId(url) {
  const search = new URL(url).searchParams;
  return search.get(`id`) || search.get(`item`);
}
