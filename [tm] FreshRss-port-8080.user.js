(function () {
  'use strict';
  if (location.host !== 'localhost:8080') return;

  const SVGs = {
    play: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M320-200v-560l440 280-440 280Zm80-280Zm0 134 210-134-210-134v268Z"/></svg>',
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
    // const linkEl = markBtnEl.querySelector('a.read');
    return;
  }

  waitForEach('main#stream > div:has(article)', async feedItemEl => {
    const linkToContentLinkBtnEl = feedItemEl.querySelector(
      QUERY_FOR_LINK_BTN_ELS,
    );
    const linkEl = linkToContentLinkBtnEl.querySelector('a');
    const url = linkEl.href;
    const itemTitleLinkEl = feedItemEl.querySelector('a.item-element.title');

    //* titles as tooltips
    const title = itemTitleLinkEl.textContent.trim();
    grandParent(itemTitleLinkEl, 2).setAttribute('title', title);

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

      const allowPlayEl = linkToContentLinkBtnEl.cloneNode(true);
      linkToContentLinkBtnEl.after(allowPlayEl);
      allowPlayEl.querySelector('img').replaceWith(generateElements(SVGs.play));

      const allowPlayLinkEl = allowPlayEl.querySelector('a');
      const originalUrl = allowPlayLinkEl.href;
      allowPlayLinkEl.href = originalUrl + '#allow-play';
    }
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
      btnEl.click();
    },
  );
})();
