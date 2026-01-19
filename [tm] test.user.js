// http://www.blankwebsite.com
// https://example.com

(async function () {
  'use strict';

  const doc = await fetchDoc('https://dhcplay.com/e/58tlle6jmnr7', null, true);
  GM_setClipboard(doc);
})();
