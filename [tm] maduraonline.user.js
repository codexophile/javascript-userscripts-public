(function () {
  'use strict';
  if (window.top != window.self) return; //don't run on frames or iframes

  const wordEls = document.querySelectorAll(`.td`);
  console.log(wordEls);
  wordEls.forEach(wordEl => {
    const word = wordEl.textContent.trim();
    wrap(`<a href="/?find=${word}"></a>`, wordEl);
  });
})();
