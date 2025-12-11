(async function () {
  'use strict';

  // markAndFilter('main div:has(>[href^="/p/"])', 'a', 'href', /\/p\/(.+?)\//);

  //* new yt-dlp button
  const { addButton } = await Collapsible();
  addButton('tiktok', null, () => {
    let postLink = '';

    if (location.href === 'https://www.instagram.com/') {
      const visiblePostEl = getVisibleElements('article')[0];
      if (!visiblePostEl) return;
      style(visiblePostEl, `outline: solid red;`);
      postLink = visiblePostEl.querySelector('[href*="/p/"]').href;
    } else if (
      location.href.includes('/p/') ||
      location.href.includes('/reel/')
    ) {
      postLink = location.href;
    }

    const urlSegment = `url:${postLink}::`;
    const destinationSegment = `dest:x:\\tiktok::`;
    const modeSegment = `mode:noprompt::`;
    GM_setClipboard(
      `initiate-ytdlp:${urlSegment}${destinationSegment}${modeSegment}`
    );
  });

  //* Shortcuts
  document.addEventListener(
    'keydown',
    async event => {
      if (!event.altKey) return; // 🛑
      switch (event.key) {
        case 'd': // next
          event.preventDefault();
          let nextUnreadItem = document.querySelector(
            'span[data-visualcompletion="ignore"]'
          );
          nextUnreadItem.scrollIntoView();
          nextUnreadItem.click();
          break;
      }
    },
    false
  );

  //* moving video control panel
  (async function () {
    'use strict';
    const videoControlPanel = await waitFor('#video-controlPanel');
    style(
      videoControlPanel,
      `
        left: unset;
        right: 500px;
        top: 50vh;
      `
    );
  })();

  let observer = new MutationObserver(() => {
    //* Suggested accounts on profile pages
    const $profilesLocators = $(`[style="width: 170px;"]`);
    if ($profilesLocators.length) {
      const $grandParent = $(grandParent($profilesLocators[0], 6));
      if ($grandParent.parent().find('#profilesWrapper').length) return; // 🛑

      const $profilesWrapper = $(`<div id=profilesWrapper></div>`).insertAfter(
        $grandParent.prev()
      );

      $profilesLocators.each(function () {
        const linkToProfile = this.querySelector('a').href;
        const profilePicSrc = this.querySelector('img').src;
        $profilesWrapper.append(`
                    <a href=${linkToProfile} style='display: inline-block; width: 33%'>
                        <img src=${profilePicSrc}>
                        <div>Link</div>
                    </a>
                `);
      });
    }

    //* click all 'see translation' button
    $(`[role=button]:contains('See translation')`).click();

    // const $imagesOpened = $( '[style*="padding-bottom:"] > img[src]:not(.imgProcessed)' )
    const queryForIGPosts =
      'img[crossorigin="anonymous"][style="object-fit: cover;"]:not(.imgProcessed)';
    const queryForIGAllImagesItems = '#igAllImages > * > img';
    const queryForOpenedImgs = 'article li img:not(.imgProcessed)';

    const $imagesOpened = $(
      `${queryForIGAllImagesItems}, ${queryForIGPosts}, ${queryForOpenedImgs}`
    );
    $imagesOpened.each(function () {
      this.classList.add('imgProcessed');
      const $this = $(this);
      const imgSrc = this.src;

      const $linksContainer = $(`<div></div>`).insertAfter($this);
      style(
        $linksContainer[0],
        `
                position: absolute;
                top:      5px;
                left:     5px;
                z-index:  1000;
            `
      );
      $linksContainer.append(`<a href='${imgSrc}' target=_blank> 🔗 </a>`);
      $(`<button>⬇️</button>`)
        .appendTo($linksContainer)
        .on('click', () => clickHandler(this));
      $(`<button>📄</button>`)
        .appendTo($linksContainer)
        .on('click', () => {
          copyImageToClipboard(imgSrc);
        });
    });

    const $videos = $(`video`);
    $videos.each(function (index, element) {
      // element.pause()
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });

  const clickHandler = image => {
    const tempImg = GM_addElement('img', {
      src: image.src,
      crossorigin: 'anonymous',
    });
    tempImg.addEventListener('load', () => {
      const c = generateElements(`<canvas></canvas>`);
      c.width = tempImg.naturalWidth;
      c.height = tempImg.naturalHeight;
      var ctx = c.getContext('2d');
      ctx.drawImage(tempImg, 0, 0);
      const uri = c.toDataURL();

      const link = $(`<a></a>`)[0];
      let fileName = `${getUserId(image)} - ${getPostId(image)} - instagram`;
      link.setAttribute('download', `${fileName}.png`);
      link.setAttribute('href', uri);
      link.click();
    });
  };

  function getUserId(image) {
    let $parent;
    if (location.href === 'https://www.instagram.com/')
      $parent = $(image).closest('article');
    if (location.href.includes('/p/')) $parent = $(`main`).first();
    const userId = $parent
      .find('[href^="/"]')
      .first()
      .attr('href')
      .match(/\/(.+?)\//)[1];
    console.log(userId);
    return userId;
  }

  function getPostId(image) {
    let href;
    if (location.href === 'https://www.instagram.com/')
      href = $(image).closest('article').find('[href*="/p/"]').attr('href');
    if (location.href.includes('/p/')) href = location.href;
    return href.match(/\/p\/(.+?)(\/|$)/)[1];
  }

  function copyImageToClipboard(imageUrl) {
    return new Promise((resolve, reject) => {
      // Create a new image element
      const img = new Image();

      // Set up error handling
      img.onerror = () => {
        console.error('Failed to load image from URL:', imageUrl);
        resolve(false);
      };

      // When the image loads
      img.onload = () => {
        // Create a canvas element
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw the image on the canvas
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        try {
          // Convert canvas to data URL
          const dataUrl = canvas.toDataURL('image/png');

          // Use GM_setClipboard to copy the image to clipboard as data URL
          GM_setClipboard(dataUrl, 'image');
          console.log('Image copied to clipboard successfully');
          resolve(true);
        } catch (error) {
          console.error('Failed to copy image to clipboard:', error);
          resolve(false);
        }
      };

      // Set the source of the image
      img.crossOrigin = 'anonymous'; // Attempt to handle CORS issues
      img.src = imageUrl;
    });
  }
})();
