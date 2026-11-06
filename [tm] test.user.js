// http://www.blankwebsite.com
// https://example.com

(async function () {
  ('use strict');

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

  async function one() {
    const targetUrl =
      'https://pornone.com/young/young-studs-loves-his-daddies-cock-lucas-vara-e-cm/280784899/';
    const result = await two(targetUrl);
    // console.log(result);
    GM_setClipboard(result);
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
