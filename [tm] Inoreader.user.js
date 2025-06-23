(function () {
  "use strict";

  //* filtering shorts
  const shortsFilterList = ["ExplosmEntertainment"];
  waitForEach(
    `.article_title_link[href*="https://www.youtube.com/shorts/"]`,
    (shortsLocatorEl) => {
      const rssItemEl = shortsLocatorEl.closest(".ar");
      const feedTitle = rssItemEl
        .querySelector(`.article_tile_footer_feed_title`)
        .textContent.trim();
      console.log(feedTitle);
    }
  );
  //*
  // waitFor(`#show_articles_menu`).then((unreadIndicator) => {
  //   document
  //     .querySelector(`.heading-wrapper > div > h2`)
  //     .prepend(unreadIndicator);
  // });

  //* auto advancing
  waitForEach(
    `#no_more_press_space[style="visibility: visible;"]`,
    (noMoreIndicatorEl) => {
      setTimeout(() => {
        if (
          document.querySelector(
            `#no_more_press_space[style="visibility: visible;"]`
          )
        ) {
          const kbEvent = new KeyboardEvent("keydown", {
            keyCode: 32,
            which: 32,
          });
          document.dispatchEvent(kbEvent);
        }
      }, 2000);
    }
  );
})();
