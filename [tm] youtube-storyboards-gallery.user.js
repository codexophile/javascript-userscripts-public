(async function () {
  'use strict';
  if (window.top !== window.self) return; // Don't run on frames or iframes

  const collapsible = await Collapsible();

  const laterlistCollapsibleBtn = collapsible.addButton(
    'G',
    null,
    async event => {
      try {
        // Create progress indicator container
        const progressContainer = document.createElement('div');
        style(
          progressContainer,
          `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 15px;
        border-radius: 5px;
        z-index: 9999;
        font-size: 14px;
      `,
        );
        document.body.appendChild(progressContainer);

        const allVideoLinks = gatherAllVideoLinks();
        if (allVideoLinks.length === 0) {
          console.warn('No video links found.');
          progressContainer.remove();
          return;
        }

        // Initialize progress display
        const totalVideos = allVideoLinks.length;
        let loadedVideos = 0;
        updateProgress(loadedVideos, totalVideos);

        const newWindow = window.open('', '_blank');
        if (!newWindow) {
          console.log('Failed to open new window.');
          progressContainer.remove();
          return;
        }

        // Add progress indicator to new window
        const newWindowProgress = newWindow.document.createElement('div');
        style(
          newWindowProgress,
          `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 15px;
        border-radius: 5px;
        z-index: 9999;
        font-size: 14px;
      `,
        );
        newWindow.document.body.appendChild(newWindowProgress);

        // Fetch and process videos one by one to show accurate progress
        for (let i = 0; i < allVideoLinks.length; i++) {
          try {
            const response = await GMXmlHttpReqResponse(allVideoLinks[i]);
            const storyboardObj = generateAllYouTubeSbUrls(response);
            storyboardObj.href = allVideoLinks[i];
            await createStoryboardGalleryItem(storyboardObj, newWindow);

            loadedVideos++;
            updateProgress(loadedVideos, totalVideos);
            updateNewWindowProgress(
              loadedVideos,
              totalVideos,
              newWindowProgress,
            );
          } catch (error) {
            console.error(`Error processing video ${allVideoLinks[i]}:`, error);
          }
        }

        // Remove progress indicators after completion
        setTimeout(() => {
          progressContainer.remove();
          newWindowProgress.remove();
        }, 2000);
      } catch (error) {
        console.error('An error occurred:', error);
      }
    },
  );

  function updateProgress(current, total) {
    const progressContainer = document.querySelector(
      '[data-progress-container]',
    );
    if (progressContainer) {
      progressContainer.textContent = `Loading: ${current}/${total} storyboards`;
    }
  }

  function updateNewWindowProgress(current, total, progressElement) {
    progressElement.textContent = `Loaded: ${current}/${total} storyboards`;
  }

  async function createStoryboardGalleryItem(item, window) {
    const galleryItemEl = generateElements(`<div class="gallery-item"></div>`);
    style(
      galleryItemEl,
      `
      border: 1px solid black;
      border-radius: 5px;
      margin: 5px;
      padding: 10px;
    `,
    );
    const galleryItemHeader = generateElements(
      `<div style="margin-bottom: 10px;"><a href="${item.href}" target="_blank">${item.href}</a></div>`,
      galleryItemEl,
    );
    const storyboardContainer = generateElements(`<div></div>`, galleryItemEl);
    await storyboard({
      storyboardParent: storyboardContainer,
      horizontal: 5,
      vertical: 5,
      linkToVid: item.href,
      samplingFq: item.samplingFq,
      trueNoOfSlots: item.trueNoOfSlots,
      imgUrls: item.allUrls,
      maxHeight: 'unset',
    });
    window.document.body.append(galleryItemEl);
  }

  function gatherAllVideoLinks() {
    const query = `a[href*="watch?v="]:not(#slotsDiv a)`;
    const videoLinks = Array.from(
      document.querySelectorAll(query),
      el => el.href,
    );
    return [...new Set(videoLinks)];
  }
})();
