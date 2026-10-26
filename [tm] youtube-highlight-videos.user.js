(async function () {
  'use strict';

  GM_addStyle(`
    .cdx-same-uploader { 
      border-radius: 12px; 
      outline: 4px solid #FF4D4D;
      outline-offset: 0;
      box-shadow: 0 8px 32px rgba(255, 0, 0, 0.15), 
                  0 4px 12px rgba(122, 34, 255, 0.1);
      background: rgba(15, 15, 15, 0.85);
      backdrop-filter: blur(8px);
  }`);

  let ownerChannelName_ = null;
  await onNewPage();
  window.addEventListener('urlchange', onNewPage);

  waitForEach('yt-lockup-view-model', async videoItemEl => {
    const sameUploader = [
      ...videoItemEl.querySelectorAll(
        '.ytContentMetadataViewModelMetadataRow > span',
      ),
    ].some(spanEl => {
      const match = spanEl.textContent.trim() === ownerChannelName_;

      return match;
    });
    if (!sameUploader) {
      return;
    }
    videoItemEl.classList.add('cdx-same-uploader');
  });

  async function onNewPage() {
    const { ownerChannelName } = await getCurrentVideoDetails();
    ownerChannelName_ = ownerChannelName;
  }
})();
