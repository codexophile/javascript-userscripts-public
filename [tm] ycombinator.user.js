'use strict';
const linkEl = await waitFor(`.titleline > a`);
const link = linkEl.getAttribute(`href`);
window.open(link, '_blank');
