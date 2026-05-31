(function () {
  'use strict';

  //* code section toggle
  waitForEach('[data-hpc=true]:not([class])', codeSectionEl => {
    codeSectionEl.style.display = 'none';
    const toggleBtnEl = generateElements(`<button>toggle</button>`);
    codeSectionEl.before(toggleBtnEl);
    toggleBtnEl.addEventListener('click', () => {
      toggle(codeSectionEl);
    });
  });

  window.navigation.addEventListener('navigate', () => {
    $(`article a`).not('[href*="#"]').attr('target', '_blank');
    $(`article`).parent().parent()[0]?.scrollIntoView(); //* scrolls post content into view
  });
})();
