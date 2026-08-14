(async function () {
  'use strict';

  const titleEl = await waitFor(`title`);

  GM_addStyle(`
    #main-cnt {
    
      z-index: 9999;
      display: flex;
      align-items: center;
      position: fixed;
      bottom: 0;
      right: 0;
      padding: 0.5rem;
      
      #content {
        padding: 0.5rem;
        max-width: 40vw;
        line-clamp: 2;
      }
      
      #btns-cnt {
        display: flex;

        button {
          margin-right: 0.1rem;
          max-height: 2rem;
        }
      }

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
        <button id="btn-open-in-new" class="btn">↗</button>
      </div>
      <div id="content">
      </div>
    </div>
  `,
    document.body,
  );
  const titleCntEl = mainCntEl.querySelector('#content');

  mainCntEl.querySelector('#btn-open-in-new').addEventListener('click', () => {
    window.open(window.location.href, '_blank');
  });

  let observer = new MutationObserver(main);
  observer.observe(titleEl, { childList: true, subtree: true });

  function main() {
    const title = document.title;
    if (!titleCntEl) return;
    titleCntEl.innerHTML = title;
  }
})();
