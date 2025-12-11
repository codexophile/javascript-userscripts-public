(async function () {
  'use strict';
  if (window.top != window.self) return; //don't run on frames or iframes

  const modalObj = new ModalBox();
  const modalContentEl = generateElements(`<div id=modal-content></div>`);
  const queryForNewImgsEls = '.image-container > [alt^="Generated Image"]';
  const queryForImgElsInHistory = '#modal-content img';
  let continuousGenerating = false;
  const generationLimit = 20;
  let generatedCount = 0;

  modalObj.setContent(modalContentEl);
  const cleanHistoryBtnEl = generateElements(`<button>Clear History</button>`);
  modalContentEl.appendChild(cleanHistoryBtnEl);
  cleanHistoryBtnEl.addEventListener('click', () => {
    clearImgHistory();
  });

  const { addButton } = await Collapsible();

  addButton('🧹', null, async () => {
    const clearChatBtnEl = document.querySelector(
      `button[aria-label="Clear chat"]`
    );
    clearChatBtnEl.click();
    const continueBtn = await waitFor('mat-dialog-actions > [color="primary"]');
    continueBtn.click();

    clearImgHistory();
  });

  addButton('🔁', null, async () => {
    if (continuousGenerating) {
      continuousGenerating = false;
      return;
    }

    continuousGenerating = true;
    generatedCount = 0;
    regenerate();
    modalObj.show();
  });

  addButton('🖼️', null, () => {
    modalObj.show();
  });

  waitForEach(queryForNewImgsEls, imgEl => {
    const clonedImgEl = imgEl.cloneNode(true);
    style(clonedImgEl, `max-width: 200px; max-height: 200px;`);
    const wrapperEl = generateElements(`<div></div>`);
    style(
      wrapperEl,
      `
      display: inline-block;
      position: relative;
      margin: 5px;
    `
    );
    wrapperEl.appendChild(clonedImgEl);
    modalContentEl.appendChild(wrapperEl);
    generatedCount++;
  });

  downloadImgWithTextFunctionality({
    siteName: 'AiStudio',
    imageElSelector: `${queryForNewImgsEls}, ${queryForImgElsInHistory}`,
    getDescription(imgEl) {
      const promptEl = document.querySelector('.text-chunk');
      return promptEl ? promptEl.innerText : '';
    },
  });

  waitForEach(
    `${queryForImgElsInHistory}, [mattooltip="Safety Ratings"], ms-prompt-feedback > [aria-label="Safety Ratings"]`,
    () => {
      if (continuousGenerating) {
        regenerate();
        return;
      }
      GM_setClipboard(`global-document-ready-${document.title}`);
      GM_notification({
        title: 'AiStudio',
        highlight: true,
        text: 'Ready',
        timeout: 1000,
      });
    }
  );

  function clearImgHistory() {
    modalContentEl.querySelectorAll(`div`).forEach(item => {
      item.remove();
    });
  }

  function regenerate() {
    document.title = `Generated: ${generatedCount}/${generationLimit}`;
    if (continuousGenerating && generatedCount >= generationLimit) {
      continuousGenerating = false;
      beep(250, 250, 0.1);
      return;
    }
    const rerunBtnEls = document.querySelectorAll('[name="rerun-button"]');
    const lastRerunBtnEl = rerunBtnEls[rerunBtnEls.length - 1];
    lastRerunBtnEl.click();
  }

  hotkeys('alt+r', (event, handler) => {
    regenerate();
  });

  hotkeys('alt+e', (event, handler) => {
    const editBtnEls = document.querySelectorAll('.toggle-edit-button');
    const lastEditBtnEl = editBtnEls[editBtnEls.length - 1];
    lastEditBtnEl.click();
  });

  hotkeys.filter = function (event) {
    return true;
  };

  hotkeys('enter', (event, handler) => {
    document.querySelector('.run-button').click();
  });
})();
