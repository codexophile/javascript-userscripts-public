function playVideo(videoEl, total, index) {
  videoEl.scrollIntoView();
  const duration = videoEl.duration;
  videoEl.currentTime = (duration / total) * index;
  videoEl.play();
}

function setSlotScale(sbParent, scaleFactor) {
  const originalWidth = sbParent.querySelector('canvas').width;
  const originalHeight = sbParent.querySelector('canvas').height;

  sbParent
    .querySelectorAll('canvas, .storyboardItem')
    .forEach(function (canvas) {
      canvas.style.width = originalWidth * scaleFactor + 'px';
      canvas.style.height = originalHeight * scaleFactor + 'px';
    });
}

function setSlotSize(sbParent, newWidth) {
  const originalWidth = sbParent.querySelector('canvas').width;
  const originalHeight = sbParent.querySelector('canvas').height;
  const scale = newWidth / originalWidth;
  const newHeight = originalHeight * scale;

  sbParent.querySelectorAll('canvas, .storyboardItem').forEach(function (el) {
    el.style.width = newWidth + 'px';
    el.style.height = newHeight + 'px';
    // el.style.width = ( originalWidth * scaleFactor ) + 'px';
    // el.style.height = ( originalHeight * scaleFactor ) + 'px';
  });
}

async function sbControls(
  video,
  trueNoOfSlots,
  sbParent,
  imgUrls,
  setSbHash = true,
) {
  const collapsible = await Collapsible();
  const getTotalSlots = () => {
    const slotCount = sbParent.querySelectorAll('.storyboardItem').length;
    if (!Number.isFinite(trueNoOfSlots) || trueNoOfSlots <= 0) return slotCount;
    return Math.min(trueNoOfSlots, slotCount);
  };

  if (video) {
    collapsible.collapsibleContent
      .querySelectorAll('.storyboardControl')
      .forEach(item => item.remove());

    collapsible
      .addButton('🔙', null, async () => {
        const targetEl = [...sbParent.querySelectorAll('.wentPast')].pop();
        targetEl.scrollIntoView({ behavior: 'instant', block: 'center' });
        await asyncTimeout(250);
        await blink(targetEl, 250, 2);
        // @ts-ignore
      })
      .classList.add('storyboardControl');

    collapsible
      .addButton('💠', null, () => {
        const isHidden = sbParent.style.display === 'none';
        sbParent.style.display = isHidden ? 'block' : 'none';
        sbParent.scrollIntoView({ block: isHidden ? 'start' : 'center' });
        // @ts-ignore
      })
      .classList.add('storyboardControl');

    const imgUrlsPopupEl = collapsible.addPopup();
    const imgUrlsListEl = generateElements(`<ol></ol>`, imgUrlsPopupEl);
    imgUrls.forEach((url, index) => {
      generateElements(
        `
                <li>
                    <a href="${url}" target="_blank">${index}</a>
                </li>
            `,
        imgUrlsListEl,
      );
    });
    collapsible
      .addButton('🌆', imgUrlsPopupEl)
      .classList.add('storyboardControl');
    const totalSlots = getTotalSlots();
    const slotsLabel =
      Number.isFinite(trueNoOfSlots) &&
      trueNoOfSlots > 0 &&
      trueNoOfSlots !== totalSlots
        ? `Slots shown: ${totalSlots} (limit: ${trueNoOfSlots})`
        : `Slots shown: ${totalSlots}`;
    generateElements(`<div>${slotsLabel}</div>`, imgUrlsPopupEl);

    console.log('xxx', video.duration);
    if (video.readyState > 0) jumpToSlot();
    video.addEventListener('loadeddata', jumpToSlot);

    if (+video.duration > 0) {
      addTimeStrings();
    } else video.addEventListener('loadeddata', addTimeStrings);

    video.removeEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('timeupdate', handleTimeUpdate);
    function handleTimeUpdate() {
      const duration = video.duration;
      const totalSlots = getTotalSlots();
      if (!totalSlots) return;
      const currentSlotNo = Math.min(
        totalSlots - 1,
        Math.round((video.currentTime * totalSlots) / duration),
      );
      const storyboardItems = sbParent.querySelectorAll('.storyboardItem');
      if (setSbHash) {
        setHash(`slot=${currentSlotNo}`);
      }

      storyboardItems.forEach((item, index) => {
        if (index <= currentSlotNo) {
          item.classList.add('wentPast');
          item.style.border = '3px solid red';
        } else {
          item.classList.remove('wentPast');
          item.style.border = '3px solid white';
        }
      });
    }

    function addTimeStrings() {
      console.log(video, video.duration);
      const slotEls = sbParent.querySelectorAll('.storyboardItem');
      const totalSlots = getTotalSlots();
      repeat(totalSlots, index => {
        if (!slotEls[index]) return;
        const timeStringEl = generateElements(`<div></div>`, slotEls[index]);
        timeStringEl.classList.add('timeString');
        const timeString = Math.round((index * video.duration) / totalSlots);
        const timeStringReadable = forHumans(timeString);
        timeStringEl.textContent = timeStringReadable;
        style(
          timeStringEl,
          `
            color: white;
            background-color: black;
            width: fit-content;
            position: relative;
            top: -15%;
            left: 5%;
        `,
        );
      });
    }
  } else {
  }

  // calculateWidthAndExpand( collapsibleEl );

  function jumpToSlot() {
    const matches = location.hash.match(/#slot=(\d+?)($|#)/);
    if (!matches) return;

    addHistoryEntry(location.href.replace(location.hash, ''));
    const slotNo = matches[1];
    const totalSlots = getTotalSlots();
    if (slotNo && totalSlots) playVideo(video, totalSlots, slotNo);
  }
}

/**
 * Renders storyboard tiles for a video.
 * @param {number} trueNoOfSlots - Max slots to render (clamped to available).
 */
async function storyboard({
  storyboardParent,
  horizontal,
  vertical,
  linkToVid = null,
  vidOnPage,
  samplingFq = null,
  trueNoOfSlots,
  imgUrls = [],
  offset = 0,
  slotWidth = null,
  setSbHash = true,
}) {
  const slotsDiv = document.createElement('div');
  storyboardParent.append(slotsDiv);
  slotsDiv.id = 'slotsDiv';
  slotsDiv.style.display = 'flex';
  slotsDiv.style.flexWrap = 'wrap';
  slotsDiv.style.justifyContent = 'space-evenly';

  if (!imgUrls.length) console.error('imgUrls: Error!');

  const promises = imgUrls.map((url, index) =>
    storyboardFlex(horizontal, vertical, url, index, trueNoOfSlots),
  );

  // @ts-ignore
  const results = await Promise.allSettled(promises);
  let index = 0;
  let totalSlots = 0;

  results.forEach(result => {
    if (result.status !== 'fulfilled' || !result.value) return;
    result.value.forEach(slot => {
      slotsDiv.append(slot);
      slot.index = index;
      if (linkToVid) {
        console.log(slot, slot.querySelector('.storyboard-canvas'));
        const link = wrap(`<a></a>`, slot.querySelector('.storyboard-canvas'));
        // @ts-ignore
        link.href = `${linkToVid}#slot=${index}`;
        // @ts-ignore
        link.target = '_blank';
        // @ts-ignore
        Object.assign(link.style, {
          display: 'block',
          width: '100%',
          height: '100%',
          top: '0px',
          left: '0px',
        });
      }

      slot.addEventListener('click', ev => {
        const samplingFreq =
          samplingFq ||
          vidOnPage.duration / totalSlots ||
          vidOnPage.duration / (horizontal * vertical);
        // const samplingFreq = samplingFq || ( vidOnPage.duration / ( horizontal * vertical ) );
        const newTime =
          (ev.target.closest('div').index + offset) * samplingFreq;
        vidOnPage.currentTime = newTime;
        vidOnPage.play();
        vidOnPage.scrollIntoView({ behavior: 'instant', block: 'center' });
      });
      index++;
    });
  });

  totalSlots =
    Number.isFinite(trueNoOfSlots) && trueNoOfSlots > 0
      ? Math.min(trueNoOfSlots, index)
      : index;

  if (slotWidth) setSlotSize(storyboardParent, slotWidth);
  else if (storyboardParent.querySelector('canvas').width < 200)
    setSlotSize(storyboardParent, 200);
  sbControls(vidOnPage, totalSlots, storyboardParent, imgUrls, setSbHash);
  return slotsDiv;
}

async function storyboardToggleable({
  storyboardParent,
  horizontal,
  vertical,
  linkToVid = null,
  vidOnPage,
  samplingFq = null,
  trueNoOfSlots,
  imgUrls = [],
  maxHeight = '80vh', // Added default value for maxHeight
}) {
  const slotsDiv = await storyboard({
    storyboardParent,
    horizontal,
    vertical,
    linkToVid,
    vidOnPage,
    samplingFq,
    trueNoOfSlots,
    imgUrls,
  });

  Object.assign(slotsDiv.style, {
    maxWidth: '90vw',
    maxHeight, // Using the optional maxHeight parameter
    overflow: 'auto',
  });

  return slotsDiv;
}

/**
 * Builds a storyboard grid from one image, respecting the overall slot limit.
 * @param {number} trueNoOfSlots - Max slots to render (clamped to available).
 */
async function storyboardFlex(
  horizontal,
  vertical,
  imgSrc,
  index,
  trueNoOfSlots,
) {
  let imgElement;
  try {
    imgElement = GM_addElement(document.body, 'img', { src: imgSrc });
  } catch (error) {
    console.log(error);
    imgElement = generateElements(`<img>`, document.body);
    imgElement.src = imgSrc;
  }

  imgElement.style.display = 'none';
  document.body.appendChild(imgElement);

  // @ts-ignore
  const promise = new Promise((resolve, reject) => {
    imgElement.onload = () => {
      const allSlots = [];
      const gridHorizontal = horizontal;
      const gridVertical = vertical;
      const normalTotal = gridHorizontal * gridVertical;
      const hasSlotLimit = Number.isFinite(trueNoOfSlots) && trueNoOfSlots > 0;
      const noOfSlotsRemaining = hasSlotLimit
        ? trueNoOfSlots - index * normalTotal
        : normalTotal;

      if (hasSlotLimit && noOfSlotsRemaining <= 0) {
        resolve([]);
        imgElement.remove();
        return;
      }

      const total = hasSlotLimit
        ? Math.min(normalTotal, noOfSlotsRemaining)
        : normalTotal;

      const itemWidth = imgElement.naturalWidth / gridHorizontal;
      const itemHeight = imgElement.naturalHeight / gridVertical;

      for (let i = 0; i < total; i++) {
        const storyboardItem = document.createElement('div');
        storyboardItem.classList.add(imgSrc.slice(-7), 'storyboardItem');
        allSlots.push(storyboardItem);

        const x = i % gridHorizontal;
        const y = Math.floor(i / gridHorizontal);

        const canvas = document.createElement('canvas');
        canvas.classList.add('storyboard-canvas');
        const ctx = canvas.getContext('2d');
        // Set canvas dimensions
        canvas.width = itemWidth;
        canvas.height = itemHeight;
        // Draw the part of the image into the canvas
        ctx.drawImage(
          imgElement,
          x * itemWidth,
          y * itemHeight, // Source x, y
          itemWidth,
          itemHeight, // Source width, height
          0,
          0, // Destination x, y
          canvas.width,
          canvas.height, // Destination width, height
        );
        storyboardItem.append(canvas);

        Object.assign(storyboardItem.style, {
          backgroundColor: 'black',
          textShadow: 'white 0px 0px 10px',
          // backgroundImage: `url('${ imgElement.src }')`,
          // backgroundPosition: `${ -x * itemWidth }px ${ -y * itemHeight }px`,
          width: `${itemWidth}px`,
          // minWidth: `${ itemWidth }px`,
          height: `${itemHeight}px`,
          margin: '1px',
          border: 'solid white',
        });
      }

      resolve(allSlots);
      imgElement.remove();
    };

    imgElement.onerror = () => {
      const storyboardItem = document.createElement('div');
      storyboardItem.classList.add(imgSrc.slice(-7), 'storyboardItem');
      console.log(`Storyboard image load error!: ${imgSrc}`);
      const errorEl = document.createElement('div');
      errorEl.classList.add('storyboard-canvas');
      errorEl.textContent = 'Image load error';
      Object.assign(errorEl.style, {
        color: 'red',
        fontSize: '20px',
      });
      storyboardItem.append(errorEl);
      resolve([storyboardItem]);
      imgElement.remove();
    };
  });

  return await promise;
}
