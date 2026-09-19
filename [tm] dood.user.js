(async function () {
  'use strict';
  if (window.top != window.self) return; //don't run on frames or iframes

  disableConsoleClear();
  window.console.clear = null;
  window.close = null;

  if (location.href.includes('/d/') && !location.href.includes('#noRedirect')) {
    const iframeSrc = document.querySelector('iframe').src;
    window.stop();
    location.href = iframeSrc;
    // location.href = location.href.replace( '/d/', '/e/' )
  }
  if (location.href.includes('/e/')) {
    GM_addStyle(`iframe { display: none !important; }`);

    document.querySelector(`#os_player`).style.height = '72vh';

    $(
      `<a href="${location.href.replace('/e/', '/d/')}#noRedirect"> ${
        document.title
      } </a>`,
    ).prependTo(document.body);

    waitForEach('script:not([src])', scriptEl => {
      if (!scriptEl.innerHTML.includes('thumbnails:')) return;
      const matchesForVtt = scriptEl.innerHTML.match(
        /thumbnails:\s*{\s*vtt:\s*(?:'|")\/\/(.+?)(?:'|")/,
      );
      if (!matchesForVtt) {
        alert('No matches found in script content.');
        return;
      }
      const matchesForBase = scriptEl.innerHTML.match(
        /basePath:\s*(?:'|"(.+?)(?:'|"))/,
      );
      if (!matchesForBase) {
        alert('No basePath matches found in script content.');
        return;
      }
      const webvttUrl = 'https://' + matchesForVtt[1];
      const baseUrlPath = matchesForBase[1];
      GM_xmlhttpRequest({
        method: 'GET',
        url: webvttUrl,
        responseType: 'document',
        onload: async function (response) {
          const webvttContent = response.responseText;
          if (!webvttContent) {
            alert('No response text received from the WebVTT request.');
            return;
          }
          const vidOnPage = document.querySelector(`video`);
          try {
            await storyboard({
              storyboardParent: document.body,
              vidOnPage,
              webvttContent,
              baseUrlPath,
            });
          } catch (error) {
            alert(error.message);
          }
        },
      });
      return false;
    });

    return;
  }
})();
