(async function () {
  'use strict';
  if (window.top !== window.self) return; // Don't run on frames or iframes

  const SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M627-520h133v-160H627v160Zm-214 0h133v-160H413v160Zm-213 0h133v-160H200v160Zm0 240h133v-160H200v160Zm213 0h133v-160H413v160Zm214 0h133v-160H627v160Zm-507 0v-400q0-33 23.5-56.5T200-760h560q33 0 56.5 23.5T840-680v400q0 33-23.5 56.5T760-200H200q-33 0-56.5-23.5T120-280Z"/></svg>';

  const collapsible = await Collapsible();
  const galleryPopoverEl = collapsible.addPopup('gallery-popover');
  const galleryBtnEl = collapsible.addButton('', galleryPopoverEl);
  generateElements(SVG, galleryBtnEl);
  console.log(galleryBtnEl);
  generateElements(
    `<button style="margin-left: 10px;">This tab</button>`,
    galleryPopoverEl,
  ).addEventListener('click', async () => {});
  generateElements(
    `<button style="margin-left: 10px;">New tab</button>`,
    galleryPopoverEl,
  ).addEventListener('click', async () => {
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

      newWindow.document.body.style.backgroundColor = 'black';

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
          const horizontal = storyboardObj.horizontal || 5;
          const vertical = storyboardObj.vertical || 5;
          await createStoryboardGalleryItem(
            storyboardObj,
            newWindow,
            horizontal,
            vertical,
          );

          loadedVideos++;
          updateProgress(loadedVideos, totalVideos);
          updateNewWindowProgress(loadedVideos, totalVideos, newWindowProgress);
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
  });

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

  async function createStoryboardGalleryItem(
    item,
    window,
    horizontal,
    vertical,
  ) {
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
      horizontal: horizontal,
      vertical: vertical,
      linkToVid: item.href,
      samplingFq: item.samplingFq,
      trueNoOfSlots: item.trueNoOfSlots,
      imgUrls: item.allUrls,
      // maxHeight: 'unset',
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
