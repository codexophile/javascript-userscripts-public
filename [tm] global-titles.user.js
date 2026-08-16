(async function () {
  'use strict';

  const titleEl = await waitFor(`title`);

  const LengthVal = '1px';
  const btnLengthVal = '1.5rem';
  GM_addStyle(`
    #main-cnt {
      z-index: 9999;
      display: flex;
      align-items: center;
      position: fixed;
      bottom: ${LengthVal};
      right: ${LengthVal};
      padding: 0.1rem;
      background: linear-gradient(135deg, rgba(20, 20, 30, 0.95) 0%, rgba(35, 35, 50, 0.95) 100%);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 1px rgba(255, 255, 255, 0.1) inset;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      
      #content {
        padding: 0 0.5rem;
        max-width: 35vw;
        line-clamp: 2;
        font-size: 20px;
        color: rgba(255, 255, 255, 0.9);
        font-weight: 500;
        letter-spacing: 0.3px;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      #btns-cnt {
        display: flex;
        gap: 0.2em;
        flex-shrink: 0;

        button {
          height: ${btnLengthVal};
          width: ${btnLengthVal};
          border: none;
          border-radius: 8px;
          background: linear-gradient(135deg, rgba(100, 150, 255, 0.8) 0%, rgba(80, 130, 255, 0.8) 100%);
          color: white;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.23, 1, 0.320, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(80, 130, 255, 0.3);
          
          &:hover {
            background: linear-gradient(135deg, rgba(120, 170, 255, 1) 0%, rgba(100, 150, 255, 1) 100%);
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(80, 130, 255, 0.4);
          }
          
          &:active {
            transform: translateY(0);
            box-shadow: 0 2px 8px rgba(80, 130, 255, 0.3);
          }
        }
        
        button#btn-toggle {
          background: linear-gradient(135deg, rgba(80, 100, 120, 0.8) 0%, rgba(60, 80, 100, 0.8) 100%);
          box-shadow: 0 4px 12px rgba(50, 70, 90, 0.3);
          
          &:hover {
            background: linear-gradient(135deg, rgba(100, 120, 140, 1) 0%, rgba(80, 100, 120, 1) 100%);
            box-shadow: 0 6px 20px rgba(50, 70, 90, 0.4);
          }
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
