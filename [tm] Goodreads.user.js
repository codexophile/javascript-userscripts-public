(function () {
  "use strict";

  //* Click ...more in the tags list
  // Only for https://www.goodreads.com/book/show/*
  const showMoreEls = document.querySelectorAll(
    `[aria-label="Show all items in the list"]`
  );
  showMoreEls.forEach(function (el) {
    el.click();
  });

  //* Estimating the number of words in the book
  const NoOfPagesEl = document.querySelector(`[data-testid="pagesFormat"]`);
  const numberOfPages = NoOfPagesEl.textContent.match(/\d+/);
  const lowerApproximation = numberOfPages * 250;
  const upperApproximation = numberOfPages * 350;
  const averageApproximation = (lowerApproximation + upperApproximation) / 2;
  const estEl = generateElements(
    `<div> Estimated number of words: ${lowerApproximation.toLocaleString()} - ${upperApproximation.toLocaleString()} (Avg. ${averageApproximation.toLocaleString()}) </div>`
  );
  NoOfPagesEl.after(estEl);

  //* Adding external links
  alert();
  (async function () {
    "use strict";
    if (!location.href.includes("/book/show/")) return;

    const { addButton, addPopup } = await Collapsible();

    const popupEl = addPopup();
    addButton("GR", popupEl);

    const bookTitle = encodeURI(
      document.querySelector(`.Text__title1`).innerText
    );
    const author = encodeURI(
      document.querySelector(`.ContributorLink__name`).innerText
    );
    const hrefZLib = `https://z-library.sk/s/?q=${bookTitle}+${author}&languages[]=english&extensions[]=EPUB`;
    const hrefAnnas = `https://annas-archive.org/search?index=&q=${bookTitle}+${author}&ext=epub`;
    const hrefReddit = `https://www.google.com/search?q=${bookTitle}+${author}+site:reddit.com`;
    const hrefBlog = `https://www.google.com/search?q=${bookTitle}+${author}+blog`;
    const hrefWiki = `https://www.google.com/search?q=${bookTitle}+${author}+wiki`;
    const hrefStorygraph = `https://app.thestorygraph.com/browse?search_term=${bookTitle}+${author}`;
    const hrefTVTropes = `https://tvtropes.org/pmwiki/search_result.php?q=${bookTitle}+${author}`;
    const hrefChatGPT = `https://chatgpt.com/?query=${bookTitle} by ${author}`;

    addExtLink("ChatGPT", hrefChatGPT);
    addExtLink("The StoryGraph", hrefStorygraph);
    addExtLink("Wiki", hrefWiki);
    addExtLink("Blog", hrefBlog);
    addExtLink("Reddit", hrefReddit);
    addExtLink("TV Tropes", hrefTVTropes);
    addExtLink("ZLib", hrefZLib);
    addExtLink("Anna's", hrefAnnas);

    function addExtLink(text, href) {
      const linkEl = generateElements(
        `<a href="${href}" target=_blank> ${text} </a>`
      );
      style(linkEl, `display: block`);
      popupEl.append(linkEl);
    }
  })();
})();
