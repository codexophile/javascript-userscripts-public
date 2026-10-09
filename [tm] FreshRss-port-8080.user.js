(function () {
  'use strict';
  if (location.host !== 'localhost:8080') return;

  const SVGs = {
    play: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M320-200v-560l440 280-440 280Zm80-280Zm0 134 210-134-210-134v268Z"/></svg>',
    peek: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-480H200v480Zm133.5-124.5Q269-369 240-440q29-71 93.5-115.5T480-600q82 0 146.5 44.5T720-440q-29 71-93.5 115.5T480-280q-82 0-146.5-44.5Zm248.5-42q46-26.5 72-73.5-26-47-72-73.5T480-540q-56 0-102 26.5T306-440q26 47 72 73.5T480-340q56 0 102-26.5ZM480-440Zm42.5 42.5Q540-415 540-440t-17.5-42.5Q505-500 480-500t-42.5 17.5Q420-465 420-440t17.5 42.5Q455-380 480-380t42.5-17.5Z"/></svg>',
    cycle:
      '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M314-115q-104-48-169-145T80-479q0-26 2.5-51t8.5-49l-46 27-40-69 191-110 110 190-70 40-54-94q-11 27-16.5 56t-5.5 60q0 97 53 176.5T354-185l-40 70Zm306-485v-80h109q-46-57-111-88.5T480-800q-55 0-104 17t-90 48l-40-70q50-35 109-55t125-20q79 0 151 29.5T760-765v-55h80v220H620ZM594 0 403-110l110-190 69 40-57 98q118-17 196.5-107T800-480q0-11-.5-20.5T797-520h81q1 10 1.5 19.5t.5 20.5q0 135-80.5 241.5T590-95l44 26-40 69Z"/></svg>',
  };

  const QUERY_FOR_LINK_BTN_ELS = 'li.item.link';

  async function markReadAndHide(rssItemEl) {
    const isUnread = rssItemEl.matches('.not_read');
    if (!isUnread) return;
    const markBtnEl = rssItemEl.querySelector(
      'li.item.manage:has(>[title="Toggle read"])',
    );
    if (!markBtnEl) return;
    markBtnEl.style.outline = '2px solid red';
    const linkEl = markBtnEl.querySelector('a.read > img');
    rssItemEl.style.setProperty('width', '5px', 'important');
    rssItemEl.style.setProperty('height', '5px', 'important');
    return;
    linkEl.dispatchEvent(
      new MouseEvent('click', {
        bubbles: false,
        cancelable: true,
        view: window,
      }),
    );
    await asyncTimeout(1000);
    return;
  }

  //* card items
  waitForEach('main#stream > div:has(article)', async feedItemEl => {
    const linkToContentLinkBtnEl = feedItemEl.querySelector(
      QUERY_FOR_LINK_BTN_ELS,
    );
    const linkEl = linkToContentLinkBtnEl.querySelector('a');
    const url = linkEl.href;
    const itemTitleLinkEl = feedItemEl.querySelector('a.item-element.title');
    const itemTitle = itemTitleLinkEl.textContent.trim();

    //* titles as tooltips
    grandParent(itemTitleLinkEl, 2).setAttribute('title', itemTitle);

    //* removing items with duplicate links
    const linkElsOnPage = document.querySelectorAll(
      `${QUERY_FOR_LINK_BTN_ELS}:has([href="${CSS.escape(url)}"])`,
    );
    if (
      linkElsOnPage.length > 1 &&
      linkElsOnPage[0] !== linkToContentLinkBtnEl
    ) {
      await markReadAndHide(feedItemEl);
    }

    //* youtube links
    if (url.startsWith('https://www.youtube.com/')) {
      if (url.includes('/shorts/')) {
        const newUrl = url.replace('/shorts/', '/watch?v=');
        linkEl.href = newUrl;
      }

      //* durations
      await asyncTimeout(1000);
      const matches = itemTitle.match(/^\[((?:\d{0,2}:)?\d{0,2}:\d{0,2})\]\s/);
      if (matches) {
        const duration = matches[1];
        const newTitle = itemTitle.replace(`[${duration}] `, '');
        itemTitleLinkEl.textContent = newTitle;
        const durationBadgeEl = generateElements(
          `<span class="duration-badge">${duration}</span>`,
          feedItemEl,
        );
        style(
          durationBadgeEl,
          `
          z-index: 9999;
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          font-size: 1rem;
          color: #e3e3e3;
          background-color: #512929;
          padding: 0 0.2rem;
          border-radius: 0.2rem;
        `,
        );
      }

      //* allow play
      const allowPlayEl = linkToContentLinkBtnEl.cloneNode(true);
      linkToContentLinkBtnEl.after(allowPlayEl);
      allowPlayEl.querySelector('img').replaceWith(generateElements(SVGs.play));

      const allowPlayLinkEl = allowPlayEl.querySelector('a');
      const originalUrl = allowPlayLinkEl.href;
      allowPlayLinkEl.href = originalUrl + '#allow-play';

      //* peek buttons
      const peekButton = linkToContentLinkBtnEl.cloneNode(true);
      allowPlayEl.after(peekButton);
      peekButton.querySelector('img').replaceWith(generateElements(SVGs.peek));
      peekButton.querySelector('a').removeAttribute('href');

      peekButton.addEventListener('click', async event => {
        event.stopPropagation();
        event.preventDefault();

        try {
          const ytHtml = await GMXmlHttpReqResponse(url);
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
            `<a href=${url} target=_blank> ${url.textContent} </a>`,
          );
          const modalBody = generateElements('<div></div>');

          const modal = new ModalBox({
            width: '95vw',
            backgroundColor: '#f0f0f0',
            headerColor: '#3498db',
            // animation: true,
            closeOnEscape: true,
            closeOnOutsideClick: true,
            lockPageScroll: false,
          });

          modal.setTitle(headerLink);
          modal.setContent(modalBody);

          await storyboard({
            storyboardParent: modalBody,
            horizontal: horizontal || 5,
            vertical: vertical || 5,
            linkToVid: url,
            samplingFq: samplingFq,
            trueNoOfSlots: trueNoOfSlots,
            imgUrls: [...allUrls],
          });

          // peekButton.textContent = '🫣';
          console.log(modal);
          modal.show();
        } catch (error) {
          console.error('[YT-Storyboard] Peek error:', error);
          peekButton.textContent = '❌';
          setTimeout(() => {
            peekButton.textContent = '🫣';
          }, 2000);
        }
      });
    }
  });

  //* opened list view items
  waitForEach('#ylArticleSplitPane > .content', async openPaneEl => {
    const titleEl = openPaneEl.querySelector('h1.title');
    const linkToArticle = titleEl.querySelector('a').href;
    const urlObj = new URL(linkToArticle);

    switch (urlObj.host) {
      case '':
        break;

      default:
        break;
    }
  });

  //* auto expanding of certain groups
  const GROUP_IDs_TO_AUTO_EXPAND = [
    '1', // uncategorized
    '19', // list view feeds
  ];
  const combinedSelector = GROUP_IDs_TO_AUTO_EXPAND.map(
    groupId => `#c_${groupId}`,
  ).join(', ');
  waitForEach(`${combinedSelector}:has(>ul:not(.active))`, async groupEl => {
    const toggleBtnEl = groupEl.querySelector('button.dropdown-toggle');
    await asyncTimeout(1000);
    if (groupEl.querySelector('ul:not(.active)')) toggleBtnEl.click();
  });

  //* auto advancing to the next sibling feed group
  waitForEach(
    '.markAllRead[style="visibility: hidden;"]',
    bigMarkAsReadWhenAllIsReadEl => {
      const urlParams = new URLSearchParams(location.search);
      if (!urlParams.get('get').match(/^[cf]_/)) return;
      const btnEl = bigMarkAsReadWhenAllIsReadEl.closest(
        'button#bigMarkAsRead',
      );
      if (isElementInViewport(btnEl)) btnEl.click();
    },
  );
})();
