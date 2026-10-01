(async function () {
  'use strict';

  const SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M120-200q-33 0-56.5-23.5T40-280v-400q0-33 23.5-56.5T120-760h400q33 0 56.5 23.5T600-680v400q0 33-23.5 56.5T520-200H120Zm600-320q-17 0-28.5-11.5T680-560v-160q0-17 11.5-28.5T720-760h160q17 0 28.5 11.5T920-720v160q0 17-11.5 28.5T880-520H720Zm40-80h80v-80h-80v80ZM120-280h400v-400H120v400Zm40-80h320L375-500l-75 100-55-73-85 113Zm560 160q-17 0-28.5-11.5T680-240v-160q0-17 11.5-28.5T720-440h160q17 0 28.5 11.5T920-400v160q0 17-11.5 28.5T880-200H720Zm40-80h80v-80h-80v80Zm-640 0v-400 400Zm640-320v-80 80Zm0 320v-80 80Z"/></svg>';

  window.addEventListener('yt-navigate-finish', addStoryboard);
  const collapsible = await Collapsible();
  const storyboardBtnEl = collapsible.addButton('', null, addStoryboard);
  generateElements(SVG, storyboardBtnEl);

  //* adding the main storyboard for the video page
  let storyboardBuildToken = 0;

  async function addStoryboard() {
    if (!location.href.includes('/watch?v=')) return; // 🛑

    const storyboardUrl = new URL(location.href);
    storyboardUrl.hash = '';
    const storyboardHref = storyboardUrl.href;
    const existingStoryboard = document.querySelector(`#storyboardParent`);
    if (existingStoryboard?.dataset.storyboardUrl === storyboardHref) return;
    existingStoryboard?.remove();
    document
      .querySelectorAll(`#collapsibleContent > .storyboardControl`)
      .forEach(item => {
        item.remove();
      });

    const buildToken = ++storyboardBuildToken;

    const sbLocator = await waitFor('#above-the-fold > #top-row');
    if (
      buildToken !== storyboardBuildToken ||
      location.href.replace(location.hash, '') !== storyboardHref
    )
      return;
    const sbParent = generateElements(`<div id=storyboardParent></div>`);
    sbParent.dataset.storyboardUrl = storyboardHref;
    sbLocator.after(sbParent);
    const ytHtml = await GMXmlHttpReqResponse(storyboardHref);
    if (
      buildToken !== storyboardBuildToken ||
      location.href.replace(location.hash, '') !== storyboardHref
    ) {
      sbParent.remove();
      return;
    }
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

    await storyboard({
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
