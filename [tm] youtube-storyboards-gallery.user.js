(async function () {
  'use strict';
  if (window.top !== window.self) return; // Don't run on frames or iframes

  const SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M627-520h133v-160H627v160Zm-214 0h133v-160H413v160Zm-213 0h133v-160H200v160Zm0 240h133v-160H200v160Zm213 0h133v-160H413v160Zm214 0h133v-160H627v160Zm-507 0v-400q0-33 23.5-56.5T200-760h560q33 0 56.5 23.5T840-680v400q0 33-23.5 56.5T760-200H200q-33 0-56.5-23.5T120-280Z"/></svg>';

  const collapsible = await Collapsible();
  const galleryPopoverEl = collapsible.addPopup('gallery-popover');
  const galleryBtnEl = collapsible.addButton('', galleryPopoverEl);
  generateElements(SVG, galleryBtnEl);
  const thisTabButton = generateElements(
    `<button style="margin-left: 10px;">This tab</button>`,
    galleryPopoverEl,
  );
  thisTabButton.addEventListener('click', async () => {
    const allVideoLinks = gatherAllVideoLinks();
    const modalBody = generateElements('<div></div>');
    const modal = new ModalBox({
      width: '95vw',
      backgroundColor: '#f0f0f0',
      headerColor: '#3498db',
      animation: true,
      closeOnEscape: true,
      closeOnOutsideClick: true,
    });
    modal.setTitle('YouTube storyboard gallery');
    modal.setContent(modalBody);
    modal.show();

    const progressElement = createProgressIndicator(document.body);
    modal.modal.addEventListener('close', () => progressElement.remove(), {
      once: true,
    });
    await processGalleryBatch(allVideoLinks, modalBody, progressElement);
  });

  const newTabButton = generateElements(
    `<button style="margin-left: 10px;">New tab</button>`,
    galleryPopoverEl,
  );
  newTabButton.addEventListener('click', async () => {
    try {
      const allVideoLinks = gatherAllVideoLinks();
      const progressElement = createProgressIndicator(document.body);
      if (allVideoLinks.length === 0) {
        console.warn('No video links found.');
        updateProgress(progressElement, 0, 0, { successful: 0, failed: 0 });
        return;
      }

      const newWindow = window.open('', '_blank');
      if (!newWindow) {
        console.log('Failed to open new window.');
        progressElement.textContent = 'Unable to open a new tab.';
        return;
      }

      newWindow.document.body.style.backgroundColor = 'black';
      const newWindowProgress = createProgressIndicator(
        newWindow.document.body,
      );
      await processGalleryBatch(
        allVideoLinks,
        newWindow.document.body,
        progressElement,
        newWindowProgress,
      );
    } catch (error) {
      console.error('An error occurred:', error);
    }
  });

  /**
   * Creates a progress indicator attached to the supplied document element.
   * @param {HTMLElement} parentElement Element that receives the indicator.
   * @returns {HTMLDivElement} The progress indicator element.
   */
  function createProgressIndicator(parentElement) {
    const progressElement = parentElement.ownerDocument.createElement('div');
    progressElement.dataset.progressContainer = 'true';
    style(
      progressElement,
      `
      position: fixed;
      top: 20px;
      right: 20px;
      max-width: min(90vw, 420px);
      background: rgba(0, 0, 0, 0.85);
      color: white;
      padding: 10px 15px;
      border-radius: 5px;
      z-index: 9999;
      font-size: 14px;
      line-height: 1.4;
    `,
    );
    parentElement.appendChild(progressElement);
    return progressElement;
  }

  /**
   * Processes each video link and updates all active progress indicators.
   * @param {string[]} videoLinks Video URLs to process.
   * @param {HTMLElement} targetElement Element that receives gallery items.
   * @param {HTMLElement} progressElement Primary progress indicator.
   * @param {HTMLElement|null} secondaryProgressElement Optional second indicator.
   * @returns {Promise<void>} Resolves after every requested item is processed.
   */
  async function processGalleryBatch(
    videoLinks,
    targetElement,
    progressElement,
    secondaryProgressElement = null,
  ) {
    const results = { successful: 0, failed: 0 };
    updateProgress(
      progressElement,
      0,
      videoLinks.length,
      results,
      secondaryProgressElement,
    );

    for (const videoLink of videoLinks) {
      try {
        const response = await GMXmlHttpReqResponse(videoLink);
        const storyboardObj = generateAllYouTubeSbUrls(response);
        storyboardObj.href = videoLink;
        if (!storyboardObj.allUrls?.length) {
          throw new Error('No storyboard URLs generated');
        }

        await createStoryboardGalleryItem(storyboardObj, targetElement);
        results.successful++;
      } catch (error) {
        results.failed++;
        createFailedGalleryItem(videoLink, error, targetElement);
        console.error(`Error processing video ${videoLink}:`, error);
      }

      updateProgress(
        progressElement,
        results.successful + results.failed,
        videoLinks.length,
        results,
        secondaryProgressElement,
      );
    }
  }

  /**
   * Updates one or two progress indicators with the current batch result.
   * @param {HTMLElement} progressElement Primary progress indicator.
   * @param {number} completed Number of processed items.
   * @param {number} total Number of requested items.
   * @param {{successful: number, failed: number}} results Batch result counts.
   * @param {HTMLElement|null} secondaryProgressElement Optional second indicator.
   * @returns {void}
   */
  function updateProgress(
    progressElement,
    completed,
    total,
    results,
    secondaryProgressElement = null,
  ) {
    const message =
      completed === total
        ? `Completed: ${completed}/${total} | Successful: ${results.successful} | Failed: ${results.failed}`
        : `Loading: ${completed}/${total} | Successful: ${results.successful} | Failed: ${results.failed}`;
    progressElement.textContent = message;
    if (secondaryProgressElement)
      secondaryProgressElement.textContent = message;
  }

  /**
   * Renders one storyboard gallery item into the requested target element.
   * @param {Object} item Parsed storyboard data with its source URL.
   * @param {HTMLElement} targetElement Element that receives the gallery item.
   * @returns {Promise<void>} Resolves after the storyboard has rendered.
   */
  async function createStoryboardGalleryItem(item, targetElement) {
    const galleryItemEl = generateElements(`<div class="gallery-item"></div>`);
    style(
      galleryItemEl,
      `
      background: #ffffff;
      border: 1px solid #b8d8f0;
      border-left: 5px solid #3498db;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(31, 78, 121, 0.12);
      margin: 10px 0;
      padding: 14px 16px;
    `,
    );
    const galleryItemHeader = generateElements('<div></div>', galleryItemEl);
    style(galleryItemHeader, 'margin-bottom: 10px;');
    const statusLabel = generateElements(
      '<strong>Successful</strong> ',
      galleryItemHeader,
    );
    style(statusLabel, 'color: #18794e; margin-right: 8px;');
    const galleryLink = generateElements('<a></a>', galleryItemHeader);
    galleryLink.href = item.href;
    galleryLink.target = '_blank';
    galleryLink.rel = 'noopener noreferrer';
    galleryLink.textContent = item.href;
    const storyboardContainer = generateElements(`<div></div>`, galleryItemEl);
    await storyboard({
      storyboardParent: storyboardContainer,
      horizontal: item.horizontal || 5,
      vertical: item.vertical || 5,
      linkToVid: item.href,
      samplingFq: item.samplingFq,
      trueNoOfSlots: item.trueNoOfSlots,
      imgUrls: item.allUrls,
      // maxHeight: 'unset',
    });
    targetElement.append(galleryItemEl);
  }

  /**
   * Renders a failed URL with its failure reason beside successful items.
   * @param {string} videoLink URL that failed to render.
   * @param {unknown} error Error thrown while processing the URL.
   * @param {HTMLElement} targetElement Element that receives the failure card.
   * @returns {HTMLDivElement} The rendered failure card.
   */
  function createFailedGalleryItem(videoLink, error, targetElement) {
    const galleryItemEl = generateElements('<div class="gallery-item"></div>');
    style(
      galleryItemEl,
      `
      background: #fff5f5;
      border: 1px solid #f0b8b8;
      border-left: 5px solid #d64545;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(130, 31, 31, 0.1);
      margin: 10px 0;
      padding: 14px 16px;
    `,
    );

    const header = generateElements('<div></div>', galleryItemEl);
    style(header, 'margin-bottom: 8px;');
    const statusLabel = generateElements('<strong>Failed</strong> ', header);
    style(statusLabel, 'color: #b42318; margin-right: 8px;');
    const link = generateElements('<a></a>', header);
    link.href = videoLink;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = videoLink;

    const reason = generateElements('<div></div>', galleryItemEl);
    reason.textContent = `Reason: ${getErrorMessage(error)}`;
    style(reason, 'color: #7a271a; white-space: pre-wrap;');

    targetElement.append(galleryItemEl);
    return galleryItemEl;
  }

  /**
   * Converts an unknown thrown value into a useful display message.
   * @param {unknown} error Thrown value from the failed operation.
   * @returns {string} Human-readable failure reason.
   */
  function getErrorMessage(error) {
    if (error instanceof Error && error.message) return error.message;
    if (typeof error === 'string' && error) return error;
    try {
      return JSON.stringify(error) || 'Unknown error';
    } catch {
      return 'Unknown error';
    }
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
