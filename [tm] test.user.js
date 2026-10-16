// http://www.blankwebsite.com
// https://example.com

(async function () {
  'use strict';

  const targetUrl = 'https://status.d420.de/api/v1/instances';
  const result = await fetchJson(targetUrl);
  console.log(result);
  // GM_setClipboard(result);

  async function two() {
    const doc = await fetchDoc(targetUrl, null, true);
    return doc;
  }

  function three() {
    const iframe = document.createElement('iframe');
    iframe.style.cssText =
      'position:fixed; top:-9999px; left:-9999px; width:1px; height:1px;';
    iframe.src = targetUrl;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      const targetDoc = iframe.contentDocument;
      console.log(targetDoc);
      iframe.remove();
    };
  }
})();
