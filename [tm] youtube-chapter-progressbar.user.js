(async function () {
  'use strict';

  await waitFor(
    'ytd-macro-markers-list-item-renderer.ytd-macro-markers-list-renderer[active]',
  );
  document.querySelector(`#container .ytp-chapter-title`).click(); // clicking to automatically open the chapters panel

  const video = document.querySelector(`video`);
  let activeChapter = null;
  let chapterStartTime = 0;
  let chapterDuration = 0;
  let progressbarEl = null;

  video.addEventListener('timeupdate', event => {
      const thisVideo = event.target;
      const currentTime = thisVideo.currentTime;
      const query =
        'ytd-macro-markers-list-item-renderer.ytd-macro-markers-list-renderer';

      const currentChapter = document.querySelector(`${query}[active]`);
      if (!currentChapter) return;

      if (currentChapter !== activeChapter) {
        const nextChapter = next(currentChapter, query);
        const startTime = toSeconds(
          currentChapter.querySelector('#time').textContent,
        );
        const endTime = nextChapter
          ? toSeconds(nextChapter.querySelector('#time').textContent)
          : thisVideo.duration;

        activeChapter = currentChapter;
        chapterStartTime = startTime;
        chapterDuration = endTime - startTime;
        progressbarEl?.remove();

        currentChapter.style.display = `flex`;
        currentChapter.style.flexWrap = `wrap`;
        progressbarEl = createProgressbar(currentChapter);

        progressbarEl.addEventListener('input', e => {
          const seekTo =
            (e.target.value * chapterDuration) / 100 + chapterStartTime;
          thisVideo.currentTime = seekTo;
        });
      }

      const chapterProgress =
        ((currentTime - chapterStartTime) / chapterDuration) * 100;
      progressbarEl.value = chapterProgress;

      /**
       * Creates the progress control for the active chapter.
       * @param {Element} chapter - Chapter element that owns the control.
       * @returns {HTMLInputElement} The chapter progress control.
       * @example
       * const progressBar = createProgressbar(chapter);
       */
      function createProgressbar(chapter) {
        const html = `<input type="range" id="chapterProgressBar" min="0" max="100" step="1">`;
        const progressBar = generateElements(html, chapter);
        progressBar.style.width = '-webkit-fill-available';
        return progressBar;
      }
    });
})();
