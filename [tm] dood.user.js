(async function () {
  'use strict';
  if (window.top != window.self) return; //don't run on frames or iframes

  disableConsoleClear();
  window.console.clear = null;
  window.close = null;

  if (location.href.includes('/d/') && !location.href.includes('#noRedirect')) {
    window.stop();
    const iframeSrc = document.querySelector('iframe').src;
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

    // if (!document.querySelector(`[name="og:image"]`)) return; // 🛑
    // let imageUrl = document
    //   .querySelector(`[name="og:image"]`)
    //   .getAttribute('content');
    // imageUrl = imageUrl.replace('/splash/', '/slides/');
    // imageUrl = imageUrl.replace('/cover/', '/slides/');
    // imageUrl = imageUrl.replace(/-.+?\./, '.');

    const imageUrl = await getDoodStoryboardSrc(
      location.href.replace('/e/', '/d/'),
    );
    const vidOnPage = document.querySelector(`video`);

    storyboard({
      storyboardParent: document.body,
      horizontal: 6,
      vertical: 6,
      vidOnPage,
      imgUrls: [imageUrl],
      offset: 1,
    });
  }
})();
