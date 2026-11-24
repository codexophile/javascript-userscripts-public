// http://www.blankwebsite.com
// https://example.com

(async function () {
  ('use strict');

  const targetUrl = 'https://38x.io/6tig';

  one();

  async function preact() {
    /** @type {{html: Function, render: Function, useState: Function, useEffect: Function}} */
    const { html, render, useState, useEffect } = window.htmPreact;

    /**
     * Floating counter widget that mirrors its count into the document title.
     *
     * @returns {import('preact').VNode} The rendered widget markup.
     */

    function Counter() {
      /** @type {[number, (next: number | ((prev: number) => number)) => void]} */
      const [count, setCount] = useState(0);

      // Runs after each change to `count`.
      useEffect(() => {
        document.title = `Clicks: ${count}`;
      }, [count]);

      return html`
        <button onClick=${() => setCount(c => c + 1)}>
          Clicked ${count} times
        </button>
      `;
    }

    // Shadow DOM keeps the host page's CSS from leaking into your UI.
    const host = document.createElement('div');
    const collapsibleContEl = await waitFor('.collapsible-content');
    collapsibleContEl.appendChild(host);
    console.log(host);
    render(html`<${Counter} />`, host.attachShadow({ mode: 'open' }));
  }

  async function one() {
    const doc = await fetchDoc(targetUrl, null, true);
    GM_setClipboard(doc);
    return;
  }

  async function two() {
    const doc = await fetchDoc(targetUrl, null, true);

    console.log(scriptTtext);
    const obj = JSON.parse(scriptTtext);
    console.log(obj);
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
