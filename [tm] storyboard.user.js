(async function () {
  'use strict';

  $('a[title]').attr('title', '');

  if (location.href.includes('/videos/')) {
    const fpplay = await waitFor('a.fp-play');
    fpplay.click();
    const videoElement = await waitFor('video');
    videoElement.addEventListener('loadedmetadata', async event => {
      event.target.pause();
      if (!!document.querySelector(`#slotsDiv`)?.children.length) return;
      const storyboard = await prepareStoryboard(
        $storyBoard[0],
        document,
        null,
        videoElement,
        'flex',
      );
      storyboard.scrollIntoView();

      loadRelatedVideos();
    });

    let $storyBoard = $(`<div></div>`);
    $('.block-video').after($storyBoard);

    //* Related videos
    function loadRelatedVideos() {
      document.querySelectorAll(`.list-videos .item`).forEach(async item => {
        const itemLink = item.querySelector('a').href;
        const $relatedItemSbParent = $(`<div id=relItemSbP></div>`).insertAfter(
          item,
        );
        const tempDoc = await fetchDoc(itemLink);
        try {
          prepareStoryboard(
            $relatedItemSbParent[0],
            tempDoc,
            itemLink,
            null,
            'toggleable',
            item,
          );
        } catch (error) {
          console.log(error);
        }
      });
    }
  } else {
    document.querySelectorAll(`.list-videos .item`).forEach(async item => {
      const itemLink = item.querySelector('a').href;
      const $relatedItemSbParent = $(`<div id=relItemSbP></div>`).insertAfter(
        item,
      );
      const tempDoc = await fetchDoc(itemLink);
      prepareStoryboard(
        $relatedItemSbParent[0],
        tempDoc,
        itemLink,
        null,
        'toggleable',
        item,
      );
    });
  }

  async function prepareStoryboard(
    storyboardParent,
    scriptSource,
    linkToVid,
    vidOnPage,
    sbFunction,
    thisEl,
  ) {
    let correctScriptEl;
    const allScriptEls = scriptSource.querySelectorAll(
      'script[type="text/javascript"]',
    );
    allScriptEls.forEach(scriptEl => {
      if (scriptEl.innerHTML.match(/timeline_screens_interval: '(\d+)'/)) {
        correctScriptEl = scriptEl;
      }
    });

    let samplingFq = correctScriptEl.innerHTML.match(
      /timeline_screens_interval: '(\d+)'/,
    )[1];

    const nOfSlotMatch = correctScriptEl.innerHTML.match(
      /timeline_screens_count: '(\d+)'/,
    );
    let trueNoOfSlots;
    if (nOfSlotMatch) trueNoOfSlots = nOfSlotMatch[1];
    else if (vidOnPage) trueNoOfSlots = vidOnPage.duration / samplingFq;
    else {
      const durationString = thisEl.querySelector('.duration').textContent;
      const duration = toSeconds(durationString);
      trueNoOfSlots = duration / samplingFq;
    }
    const urlTemplate = correctScriptEl.innerHTML.match(
      /timeline_screens_url: '(.+?)'/,
    )[1];

    let imgUrls = [];
    await repeat(+trueNoOfSlots, j => {
      const thisUrl = urlTemplate.replace('{time}', +j + 1);
      imgUrls.push(thisUrl);
    });

    if (sbFunction === 'flex') {
      // if ( !videoElement.duration ) return null
      return storyboard({
        storyboardParent,
        horizontal: 1,
        vertical: 1,
        linkToVid,
        vidOnPage,
        samplingFq,
        trueNoOfSlots,
        imgUrls,
      });
    }
    if (sbFunction === 'toggleable')
      return storyboardToggleable({
        storyboardParent,
        horizontal: 1,
        vertical: 1,
        linkToVid,
        vidOnPage,
        samplingFq,
        trueNoOfSlots,
        imgUrls,
      });
  }
})();
