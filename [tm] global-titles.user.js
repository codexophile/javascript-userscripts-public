(async function () {
  'use strict';

  const titleEl = await waitFor(`title`);

  GM_addStyle(`
    #main-cnt {
      display: flex;
      position: fixed;
      bottom: 0;
      right: 0;
    }
    #btns-cnt {
      display: flex;
    }
  `);

  await waitFor('body');
  const mainCntEl = generateElements(
    `
    <div id="main-cnt">
      <div id="btns-cnt">
        <button id="btn-toggle" class="btn">⇰</button>
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

  let observer = new MutationObserver(main);
  observer.observe(titleEl, { childList: true, subtree: true });

  function main() {
    const title = document.title;
    if (!titleCntEl) return;
    titleCntEl.innerHTML = title;
  }
})();
