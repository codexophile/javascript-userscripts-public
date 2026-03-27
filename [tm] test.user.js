// http://www.blankwebsite.com
// https://example.com

(async function () {
  'use strict';

  const doc = await fetchDoc(
    'https://www.fullboys.com/video/watch/dash-02-hack-my-heart-sathaporn',
    null,
    true,
  );
  GM_setClipboard(doc);
})();
