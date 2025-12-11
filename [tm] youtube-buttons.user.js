(async function () {
  'use strict';

  window.addEventListener('urlchange', () => {
    main();
  });
  main();

  async function main() {
    // calculateWidthAndExpand( collapsibleContent );

    if (location.href.includes('/watch?v=')) {
      const btStop = generateElements('<button>⏹</button>', collapsibleContent);
      btStop.classList.add('videoPageControl');
      btStop.onclick = function () {
        document.getElementById('movie_player').pauseVideo();
        document.getElementById('movie_player').stopVideo();
      };
    }
  }
})();
