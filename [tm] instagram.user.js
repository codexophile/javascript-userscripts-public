(async function () {
  'use strict';

  markAndFilter(
    'main .html-div > div:has([href*="/p/"])',
    'a',
    'href',
    /\/p\/(.+?)\//,
    // /\/explore\//
    null,
    false,
    ``,
  );

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
      `initiate-ytdlp:${urlSegment}${destinationSegment}${modeSegment}`,
    );
  });

  //* get tags button
  addButton('🏷️');

  //* Shortcuts
  document.addEventListener(
    'keydown',
    async event => {
      if (!event.altKey) return; // 🛑
      switch (event.key) {
        case 'd': // next
          event.preventDefault();
          let nextUnreadItem = document.querySelector(
            'span[data-visualcompletion="ignore"]',
          );
          nextUnreadItem.scrollIntoView();
          nextUnreadItem.click();
          break;
      }
    },
    false,
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
      `,
    );
  })();

  waitFor('main > div').then(feedEl => {
    return;
    style(
      feedEl,
      `
        width: -webkit-fill-available;
        max-width: unset;
      `,
    );
  });
  waitForEach(`li [alt*="'s profile picture"]`, locatorEl => {
    //* Suggested accounts on profile pages
    const grandParentEl = grandParent(locatorEl, 12);
    let newContainerEl = document.querySelector('#new-profiles-cont');
    if (!newContainerEl) {
      newContainerEl = generateElements(`<div id=new-profiles-cont></div>`);
      style(
        newContainerEl,
        `
      display:        flex;
      flex-wrap:   wrap;
    `,
      );
      grandParentEl.before(newContainerEl);
    }
    const profilePicSrc = locatorEl.src;
    const profileLink = locatorEl.closest('a').href;
    const profileName = grandParent(locatorEl, 3).querySelector(
      'div > span > span',
    ).textContent;
    const newLinkEl = generateElements(
      `
        <a href='${profileLink}' target=_blank>
          <img id=profile-pic src='${profilePicSrc}' style='object-fit:contain;border-radius:50%;'>
          <div id=profile-name>${profileName}</div>
        </a>
      `,
    );
    newContainerEl.append(newLinkEl);
  });

  let observer = new MutationObserver(() => {
    //* click all 'see translation' button
    // $(`[role=button]:contains('See translation')`).click();

    // const $imagesOpened = $( '[style*="padding-bottom:"] > img[src]:not(.imgProcessed)' )
    const queryForIGPosts =
      'img[crossorigin="anonymous"][style="object-fit: cover;"]:not(.imgProcessed)';
    const queryForIGAllImagesItems = '#igAllImages > * > img';
    const queryForOpenedImgs = 'article li img:not(.imgProcessed)';

    const $imagesOpened = $(
      `${queryForIGAllImagesItems}, ${queryForIGPosts}, ${queryForOpenedImgs}`,
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
            `,
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
      let fileName = `${getUserId(image)} - (instagram)${getPostId(
        image,
      )} - (${getTagged(image)})`;
      link.setAttribute('download', `${fileName}.png`);
      link.setAttribute('href', uri);
      link.click();
    });
  };

  function getTagged(image) {
    const tagEls = document.querySelectorAll(
      '[style*="left: "][style*="margin-top: "]',
    );
    const tagsString = Array.from(tagEls)
      .map(tagEl => tagEl.textContent)
      .join(', ');
    return tagsString;
  }

  function getUserId(image) {
    let $parent, userId;

    if (location.href === 'https://www.instagram.com/') {
      $parent = $(image).closest('article');
      const userId = $parent
        .find('[href^="/"]')
        .first()
        .attr('href')
        .match(/\/(.+?)\//)[1];
    }

    if (location.href.includes('/p/')) {
      // when image is on an overlay
      const locatorId0 = document.querySelector('h2 [href^="/"][href$="/"]');

      // when image is on a dedicated page
      const locatorImgEl = document.querySelector(
        `main [alt*="'s profile picture"]`,
      );
      if (locatorImgEl) {
        const grandParentEl = grandParent(locatorImgEl, 7);
        return grandParentEl?.querySelector('a')?.textContent;
      }

      //
      const locatorId1 = document.querySelector(`header a`);
      console.log(locatorId1);
      //
      const locatorId2 = document.querySelector(`a span`);
      const matches1 = locatorId1.href.match(/\/(.+?)\/$/);
      if (locatorId0) {
        userId = locatorId0.href.match(/(\.com\/|^\/)(.+?)\//)[2];
      } else if (locatorId1 && matches1) {
        userId = matches1[1];
      } else if (locatorId2) {
        userId = locatorId2.textContent;
      }
    }

    return userId;
  }

  function getPostId(image) {
    let href;
    if (location.href === 'https://www.instagram.com/')
      href = $(image).closest('article').find('[href*="/p/"]').attr('href');
    if (location.href.includes('/p/')) href = location.href;
    return href.match(/\/p\/(.+?)(\/|$|\?)/)[1];
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
