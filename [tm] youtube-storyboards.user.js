(function () {
  'use strict';

  //? events in order they occur
  // window.addEventListener( 'yt-navigate', findStuff )
  // window.addEventListener( 'urlchange', findStuff )
  //
  window.addEventListener('yt-navigate-finish', addStoryboard);
  // window.addEventListener( 'yt-page-data-updated', addStoryboard )
  //# window.addEventListener( 'yt-player-updated', addStoryboard )
  //? these didn't fire
  // window.addEventListener( 'yt-page-type-changed', findStuff )
  //* adding the main storyboard for the video page
  async function addStoryboard() {
    if (!location.href.includes('/watch?v=')) return; // 🛑

    document.querySelector(`#storyboardParent`)?.remove();
    document
      .querySelectorAll(`#collapsibleContent > .storyboardControl`)
      .forEach(item => {
        item.remove();
      });

    const sbLocator = await waitFor('#above-the-fold > #top-row');
    const sbParent = generateElements(`<div id=storyboardParent></div>`);
    sbLocator.after(sbParent);
    const ytHtml = await GMXmlHttpReqResponse(location.href);
    const { allUrls, trueNoOfSlots, samplingFq, horizontal, vertical } =
      generateAllYouTubeSbUrls(ytHtml);

    // Validate storyboard data
    if (!allUrls || allUrls.length === 0) {
      sbParent.innerHTML =
        '<div style="padding: 10px; color: #ff6b6b;">⚠️ Storyboard not available for this video</div>';
      console.warn('[YT-Storyboard] No storyboard URLs generated');
      return;
    }

    const video = document.querySelector(`video`);
    if (!video) {
      console.warn('[YT-Storyboard] Video element not found');
      return;
    }

    storyboard({
      storyboardParent: sbParent,
      horizontal: horizontal || 5,
      vertical: vertical || 5,
      vidOnPage: video,
      samplingFq: samplingFq,
      trueNoOfSlots: trueNoOfSlots,
      imgUrls: [...allUrls],
    });
  }

  waitForEach(
    '#buttonsContainer, #menuActionsContainer',
    async btnsContainerEl => {
      const peekButton = generateElements(`<a class=peekButton>🫣</a>`);
      btnsContainerEl.append(peekButton);

      peekButton.addEventListener('click', async event => {
        event.preventDefault();

        peekButton.textContent = '🔄';

        try {
          const videoLinkEl =
            btnsContainerEl.parentElement.querySelector("a[href*='/watch']");
          const videoUrl = videoLinkEl.href;

          const ytHtml = await GMXmlHttpReqResponse(videoUrl);
          const { allUrls, trueNoOfSlots, samplingFq, horizontal, vertical } =
            generateAllYouTubeSbUrls(ytHtml);

          // Validate storyboard data
          if (!allUrls || allUrls.length === 0) {
            peekButton.textContent = '❌';
            alert('Storyboard not available for this video');
            setTimeout(() => {
              peekButton.textContent = '🫣';
            }, 2000);
            return;
          }

          const headerLink = generateElements(
            `<a href=${videoUrl} target=_blank> ${videoLinkEl.textContent} </a>`,
          );
          const modalBody = generateElements('<div></div>');

          const modal = new ModalBox({
            width: '95vw',
            backgroundColor: '#f0f0f0',
            headerColor: '#3498db',
            animation: true,
            closeOnEscape: true,
            closeOnOutsideClick: true,
          });

          modal.setTitle(headerLink);
          modal.setContent(modalBody);

          await storyboard({
            storyboardParent: modalBody,
            horizontal: horizontal || 5,
            vertical: vertical || 5,
            linkToVid: videoUrl,
            samplingFq: samplingFq,
            trueNoOfSlots: trueNoOfSlots,
            imgUrls: [...allUrls],
          });

          peekButton.textContent = '🫣';
          modal.show();
        } catch (error) {
          console.error('[YT-Storyboard] Peek error:', error);
          peekButton.textContent = '❌';
          setTimeout(() => {
            peekButton.textContent = '🫣';
          }, 2000);
        }
      });
    },
  );
})();
