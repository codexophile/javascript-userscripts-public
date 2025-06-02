(async function () {
  "use strict";
  if (window.top != window.self) return; //don't run on frames or iframes

  disableConsoleClear();

  if (location.href.includes("/e/")) {
    const linkToDPage = location.href.replace("/e/", "/d/");
    const linkToDPageEl = generateElements(`<a href="${linkToDPage}">D</a>`);
    const { addElement } = await Collapsible();
    addElement(linkToDPageEl);
  }
})();
