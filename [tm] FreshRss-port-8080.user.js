(function () {
  'use strict';
  if (location.host !== 'localhost:8080') return;

  const SVGs = {
    play: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M320-200v-560l440 280-440 280Zm80-280Zm0 134 210-134-210-134v268Z"/></svg>',
  };

  waitForEach('main#stream > div:has(article)', feedItemEl => {
    console.log(feedItemEl);
    const linkToContentLinkBtnEl = feedItemEl.querySelector('li.item.link');
    const linkEl = linkToContentLinkBtnEl.querySelector('a');
    const url = linkEl.href;

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
      const btnEl = bigMarkAsReadWhenAllIsReadEl.closest(
        'button#bigMarkAsRead',
      );
      btnEl.click();
    },
  );
})();
