(async function () {
  'use strict';
  if (window.top != window.self) return; //don't run on frames or iframes

  await setSuffix();
  let observer = new MutationObserver(setSuffix);
  observer.observe(document.querySelector(`title`), {
    childList: true,
    subtree: true,
  });

  async function setSuffix() {
    const suffix = ` - [${await getCategoriesString()}]`;
    if (document.title.includes(suffix)) return;
    document.title += suffix;
  }

  async function getCategoriesString() {
    const catlinksEl = await waitFor(`#catlinks`);
    const categoriesEls = catlinksEl.querySelectorAll('li');
    const categoriesText = [...categoriesEls]
      .map(li => li.textContent.trim())
      .join(', ');
    const categoriesString = `{categories: ${categoriesText}}`;
    return categoriesString;
  }
})();
