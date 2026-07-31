// http://www.blankwebsite.com
// https://example.com

(async function () {
  'use strict';

  const targetUrl = 'https://www.temu.com/g-601101958890222.html';
  const result = await three();
  GM_setClipboard(result);

  function one() {
    GM_xmlhttpRequest({
      method: 'GET',
      url: targetUrl,
      // responseType: 'json',
      onload: function (response) {
        console.log(response);
        return response;
      },
      onerror: function (error) {
        console.log(error);
        return error;
      },
    });
  }

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
