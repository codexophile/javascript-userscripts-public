(function () {
  'use strict';

  waitForEach(`.article_title_link`, async articleLinkEl => {
    const rssItemEl = articleLinkEl.closest('.ar');

    //* load tags from valnet sources
    if (location.href.includes('/folder/Valnet')) {
      const doc = await fetchDoc(articleLinkEl.href);
      const tagEls = doc.querySelectorAll('.article-tags div');
      const tagsContainerEl = generateElements(
        `<div class="article-tags"></div>`,
      );
      tagsContainerEl.append(...tagEls);
      rssItemEl.append(tagsContainerEl);
    }

    //* removing items with duplicate links
    const link = articleLinkEl.href;
    const linkElsOnPage = document.querySelectorAll(
      `.article_title_link[href="${CSS.escape(link)}"]`,
    );
    if (linkElsOnPage.length > 1 && linkElsOnPage[0] !== articleLinkEl) {
      await markReadAndHide(rssItemEl);
    }
  });

  //* filtering shorts
  const shortsFilterList = [
    'Good Enough',
    "It's Okay To Be Smart",
    'WIRED',
    'ExplosmEntertainment',
    'TylerPath',
    'First We Feast',
    'Have You Been Paying Attention?',
    'Jimmy Kimmel Live',
    'Late Night with Seth Meyers',
    'Vsauce',
  ];
  waitForEach(
    `.article_title_link[href*="https://www.youtube.com/shorts/"]`,
    async shortsLocatorEl => {
      const rssItemEl = shortsLocatorEl.closest('.ar');
      const feedTitle = rssItemEl
        .querySelector(`.article_tile_footer_feed_title`)
        .textContent.trim();
      if (shortsFilterList.includes(feedTitle)) {
        await markReadAndHide(rssItemEl);
      }
    },
  );

  async function markReadAndHide(rssItemEl) {
    const markBtnEl = rssItemEl.querySelector(
      '.article_btns.btns_article_unread',
    );
    markBtnEl.click();
    await asyncTimeout(500);
    rssItemEl.style.display = 'none';
  }

  //*
  // waitFor(`#show_articles_menu`).then((unreadIndicator) => {
  //   document
  //     .querySelector(`.heading-wrapper > div > h2`)
  //     .prepend(unreadIndicator);
  // });

  //* auto advancing
  waitForEach(
    `#no_more_press_space[style="visibility: visible;"]`,
    noMoreIndicatorEl => {
      setTimeout(() => {
        if (
          document.querySelector(
            `#no_more_press_space[style="visibility: visible;"]`,
          )
        ) {
          const kbEvent = new KeyboardEvent('keydown', {
            keyCode: 32,
            which: 32,
          });
          document.dispatchEvent(kbEvent);
        }
      }, 1000);
    },
  );
})();
