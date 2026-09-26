(function () {
  'use strict';
  waitForEach('.candidate-item', candidateItemEl => {
    const candidateName = candidateItemEl
      .querySelector('.candidate-name')
      ?.textContent.trim();
    if (!candidateName) return;
    generateElements(
      `<a href='https://manthri.lk/en/search?search=${candidateName}'>Here</a>`,
      candidateItemEl,
    ).target = '_blank';
    generateElements(
      `<a href='https://google.com/search?q=${candidateName}&udm=2'>Img</a>`,
      candidateItemEl,
    ).target = '_blank';
  });
})();
