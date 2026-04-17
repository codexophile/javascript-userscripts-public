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

  //* peeking tags
  waitForEach('div:has(>button title)', mediaItemBtnContainer => {
    const peekTagsBtnEl = generateElements(
      `<button title="Peek tags">🏷️</button>`,
      mediaItemBtnContainer,
    );
    peekTagsBtnEl.type = 'button';
    peekTagsBtnEl.addEventListener('click', async () => {
      try {
        const profileLinkEls = Array.from(
          mediaItemBtnContainer.parentElement.querySelectorAll('a'),
        );

        peekTagsBtnEl.textContent = '⏳';
        const taggedProfiles = await buildTaggedProfileList(profileLinkEls);
        showTaggedProfilesPopup(taggedProfiles);
        peekTagsBtnEl.textContent = '🏷️';
      } catch (error) {
        peekTagsBtnEl.textContent = '⚠️';
        alert('Failed to open tagged profiles popup:', error);
      }
    });
  });

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
    if (location.href === 'https://www.instagram.com/') return;
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

  async function buildTaggedProfileList(profileLinkEls) {
    const seenProfiles = new Set();
    const taggedProfiles = [];

    for (const profileLinkEl of profileLinkEls) {
      const profileData = await extractTaggedProfileData(profileLinkEl);
      if (!profileData) continue;

      const uniqueKey = profileData.profileUrl || profileData.profileId;
      if (!uniqueKey || seenProfiles.has(uniqueKey)) continue;

      seenProfiles.add(uniqueKey);
      taggedProfiles.push(profileData);
    }

    return taggedProfiles;
  }

  let taggedProfilesModal = null;

  function extractProfileIdFromUrl(profileUrl) {
    if (!profileUrl) return '';

    try {
      const normalizedUrl = new URL(profileUrl, location.origin);
      const match = normalizedUrl.pathname.match(/^\/([^/]+)\/?$/);
      return match ? match[1] : normalizedUrl.pathname.replaceAll('/', '');
    } catch (error) {
      const match = profileUrl.match(/\/([^/?#]+)\/?(?:[?#].*)?$/);
      return match ? match[1] : profileUrl.replaceAll('/', '');
    }
  }

  function getLinkProfileDataFromDom(profileLinkEl) {
    const profileUrl =
      profileLinkEl?.href || profileLinkEl?.getAttribute('href');
    const profileId = extractProfileIdFromUrl(profileUrl);
    const profileImageEl = profileLinkEl?.querySelector('img');
    const profileImageUrl =
      profileImageEl?.src || profileImageEl?.getAttribute('src') || '';
    const userName =
      profileLinkEl?.getAttribute('title') ||
      profileImageEl?.alt ||
      profileLinkEl?.textContent?.trim() ||
      profileId;

    return {
      profileUrl,
      profileId,
      userName,
      profileImageUrl,
    };
  }

  async function extractTaggedProfileData(profileLinkEl) {
    if (!profileLinkEl) return null;

    const domProfileData = getLinkProfileDataFromDom(profileLinkEl);
    if (!domProfileData.profileUrl && !domProfileData.profileId) return null;

    if (domProfileData.profileImageUrl && domProfileData.userName) {
      return domProfileData;
    }

    const fallbackProfileData = await fetchProfileData(
      domProfileData.profileUrl,
    );
    return {
      ...domProfileData,
      ...fallbackProfileData,
      profileId: domProfileData.profileId || fallbackProfileData.profileId,
      profileUrl: domProfileData.profileUrl || fallbackProfileData.profileUrl,
    };
  }

  async function fetchProfileData(profileUrl) {
    if (!profileUrl) return {};

    try {
      const profileDoc = await fetchDoc(profileUrl);
      const imageUrl =
        profileDoc.querySelector('meta[property="og:image"]')?.content || '';
      const userName =
        profileDoc.querySelector('meta[property="og:title"]')?.content ||
        profileDoc.querySelector('header h2')?.textContent?.trim() ||
        profileDoc.querySelector('main h2')?.textContent?.trim() ||
        '';

      return {
        profileUrl,
        profileId: extractProfileIdFromUrl(profileUrl),
        userName,
        profileImageUrl: imageUrl,
      };
    } catch (error) {
      console.error('Failed to fetch tagged profile data:', error);
      return {
        profileUrl,
        profileId: extractProfileIdFromUrl(profileUrl),
      };
    }
  }

  function showTaggedProfilesPopup(taggedProfiles) {
    if (!taggedProfilesModal) {
      taggedProfilesModal = new ModalBox({
        width: '420px',
        backgroundColor: '#111111',
        headerColor: '#1f1f1f',
        headerTextColor: '#f5f5f5',
        closeButtonColor: '#f5f5f5',
        closeOnOutsideClick: true,
        destroyOnClose: false,
      });
    }

    taggedProfilesModal.setTitle('Tagged profiles');
    taggedProfilesModal.setContent(buildTaggedProfilesMarkup(taggedProfiles));
    taggedProfilesModal.show();
  }

  function buildTaggedProfilesMarkup(taggedProfiles) {
    const escapeHtml = text =>
      String(text ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');

    const profileRows = taggedProfiles.length
      ? taggedProfiles
          .map(profileData => {
            const profileUrl = escapeHtml(profileData.profileUrl || '#');
            const profileId = escapeHtml(profileData.profileId || 'unknown');
            const userName = escapeHtml(
              profileData.userName || profileData.profileId || '',
            );
            const profileImageUrl = escapeHtml(
              profileData.profileImageUrl || '',
            );

            const avatarMarkup = profileImageUrl
              ? `<img src="${profileImageUrl}" alt="${userName || profileId}">`
              : `<div></div>`;

            return `
              <a class="tagged-profile-row" href="${profileUrl}" target="_blank" rel="noopener noreferrer">
                ${avatarMarkup}
                <div class="tagged-profile-text">
                  <div class="tagged-profile-id">${profileId}</div>
                  <div class="tagged-profile-name">${userName}</div>
                </div>
              </a>
            `;
          })
          .join('')
      : `<div class="tagged-profiles-empty">No tagged profiles found for this post.</div>`;

    return `
      <div class="tagged-profiles-popup-body">
        ${profileRows}
      </div>
      <style>
        .tagged-profiles-popup-body {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 65vh;
          overflow: auto;
          color: #f5f5f5;
        }
        .tagged-profile-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          border-radius: 10px;
          background: #1c1c1c;
          color: inherit;
          text-decoration: none;
        }
        .tagged-profile-row img,
        .tagged-profile-row > div:first-child {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          object-fit: cover;
          background: #2a2a2a;
          flex: 0 0 auto;
        }
        .tagged-profile-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .tagged-profile-id {
          font-weight: 700;
          font-size: 14px;
          word-break: break-word;
        }
        .tagged-profile-name {
          font-size: 12px;
          opacity: 0.8;
          word-break: break-word;
        }
        .tagged-profiles-empty {
          color: #f5f5f5;
        }
      </style>
    `;
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
