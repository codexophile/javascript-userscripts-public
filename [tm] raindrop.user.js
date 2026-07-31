(function () {
  'use strict';
  if (window.top != window.self) return; //don't run on frames or iframes

  const shoppingSites = ['https://www.temu.com', 'https://www.aliexpress.com'];

  waitForEach('main:not([class])>div', async bookmarkEl => {
    await waitFor('a[class*=permalink]');
    const link = bookmarkEl.querySelector('a[class*=permalink]').href;
    const isShoppingSite = shoppingSites.some(site => link.includes(site));
    const aboutSectionEl = bookmarkEl.querySelector('div[class*=about]');
    if (!isShoppingSite) return;
    if (link.includes('temu.com')) {
      handleTemu(link, aboutSectionEl);
    }
    if (link.includes('aliexpress.com')) {
      handleAliExpress();
    }
  });

  async function handleTemu(link, parentEl) {
    console.log(link);
    const html = await fetchDoc(link, null, true);

    const discountedPriceMatches = html.match(/Only LKR (.+?) with extra/);
    const discountedPrice = discountedPriceMatches
      ? discountedPriceMatches[1]
      : null;
    if (discountedPrice) {
      generateElements(`<div>Disc. Price: ${discountedPrice}</div>`, parentEl);
      return;
    }

    const originalPriceMatches = html.match(/"minOnSalePriceStr": ?"?(.+?)"/);
    const originalPrice = originalPriceMatches ? originalPriceMatches[1] : null;
    if (originalPrice) {
      generateElements(`<div>Original Price: ${originalPrice}</div>`, parentEl);
      return;
    }

    generateElements(`<div>Price not found</div>`, parentEl);
  }
  function handleAliExpress() {}
})();
