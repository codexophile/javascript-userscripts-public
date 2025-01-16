( async function () {
  'use strict';

  await waitFor( 'ytd-macro-markers-list-item-renderer.ytd-macro-markers-list-renderer[active]' );
  document.querySelector( `#container .ytp-chapter-title` ).click(); // clicking to automatically open the chapters panel

  document.querySelector( `video` ).addEventListener( 'timeupdate', async ( event ) => {

    const thisVideo = event.target;
    const currentTime = thisVideo.currentTime;
    const query = 'ytd-macro-markers-list-item-renderer.ytd-macro-markers-list-renderer';

    const currentChapter = document.querySelector( `${ query }[active]` );
    const nextChapter = next( currentChapter, query );

    const startTime = toSeconds( currentChapter.querySelector( '#time' ).textContent );

    const endTime = nextChapter
      ? toSeconds( nextChapter.querySelector( '#time' ).textContent )
      : thisVideo.duration;
    const chapterDuration = endTime - startTime;
    const chapterProgress = ( currentTime - startTime ) / chapterDuration * 100;

    // removes the progress bars in inactive chapter elements
    document.querySelector( `${ query }:not([active]) #chapterProgressBar` )?.remove();

    currentChapter.style.display = `flex`;
    currentChapter.style.flexWrap = `wrap`;
    if ( !currentChapter.querySelector( '#chapterProgressBar' ) ) {

      const progressbarEl = createProgressbar();

      const chapterTitleEl = currentChapter.querySelector( 'h4' );
      progressbarEl.after( chapterTitleEl );

      progressbarEl.addEventListener( 'input', ( e ) => {
        const seekTo = e.target.value * chapterDuration / 100 + startTime;
        thisVideo.currentTime = seekTo;
      } );

    }
    document.querySelector( `#chapterProgressBar` ).value = chapterProgress;

    function createProgressbar () {
      const html = `<input type="range" id="chapterProgressBar" min="0" max="100" step="1">`;
      const progressBar = generateElements( html, currentChapter );
      progressBar.style.width = '-webkit-fill-available';
      return progressBar;
    }

  } );

} )();