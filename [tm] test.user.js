// http://www.blankwebsite.com
// https://example.com

(async function () {
  'use strict';

  const doc = await fetchDoc(
    'https://mydaddy.cc/video/cb6b4bc0dc8ccf45ca',
    null,
    true
  );
  GM_setClipboard(doc);
})();
