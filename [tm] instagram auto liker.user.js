(function () {
  "use strict";
  if (window.top != window.self) return; //don't run on frames or iframes

  waitForEach("[aria-label='Like']", (locatorEl) => {
    if (location.href !== "https://www.instagram.com/") return;
    if (
      locatorEl
        .closest("article")
        .querySelector("div")
        .textContent.includes("Suggested for you")
    )
      return;
    const likeBtnEl = locatorEl.parentElement;
    likeBtnEl.click();
  });
})();
