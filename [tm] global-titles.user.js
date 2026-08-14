(async function () {
  'use strict';

  const titleEl = await waitFor(`title`);
  let observer = new MutationObserver(main);
  observer.observe(titleEl, { childList: true, subtree: true });

  GM_addStyle(`
    #main-cnt {
      position: fixed;
      bottom: 0;
      right: 0;
    }
  `);

  const mainCntEl = generateElements(
    `
    <div id="main-cnt">
      <div id="btns-cnt">
        <button id="btn-copy-title" class="btn">T</button>
        <button id="btn-copy-url" class="btn">U</button>
      </div>
      <div id="content">
      </div>
    </div>
  `,
    document.body,
  );
  const titleCntEl = mainCntEl.querySelector('#content');

  function main() {
    const title = document.title;
    titleCntEl.innerHTML = title;
  }
})();
