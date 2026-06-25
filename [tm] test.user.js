// http://www.blankwebsite.com
// https://example.com

(async function () {
  'use strict';

  const targetUrl = '';
  const result = await two();
  GM_setClipboard(result);

  function one() {
    GM_xmlhttpRequest({
      method: 'GET',
      url: targetUrl,
      responseType: 'json',
      onload: function (response) {
        return response;
      },
      onerror: function (error) {
        return error;
      },
    });
  }

  async function two() {
    const doc = await fetchDoc(targetUrl, null, true);
    return doc;
  }
})();
