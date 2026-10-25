(async function () {
  'use strict';

  GM_addStyle(`.cdx-same-uploader { 
    border-radius: 12px; 
    border: 4px solid transparent;
    border-image: linear-gradient(135deg, #FF0000 0%, #FF4D4D 40%, #7A22FF 100%) 1;
    box-shadow: 0 8px 32px rgba(255, 0, 0, 0.15), 
                0 4px 12px rgba(122, 34, 255, 0.1);
    background: rgba(15, 15, 15, 0.85);
    backdrop-filter: blur(8px);
  }`);

  let ownerChannelName_ = null;
  onNewPage();
  window.addEventListener('urlchange', onNewPage);

  waitForEach('yt-lockup-view-model', async videoItemEl => {
    const sameUploader = [
      ...videoItemEl.querySelectorAll(
        '.ytContentMetadataViewModelMetadataRow > span',
      ),
    ].some(spanEl => spanEl.textContent.trim() === ownerChannelName_);
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
