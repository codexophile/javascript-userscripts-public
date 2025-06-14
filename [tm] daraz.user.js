(function () {
  "use strict";
  if (window.top != window.self) return; //don't run on frames or iframes

  const queryForProductItems = '[data-tracking="product-card"]';

  const productItemEls = document.querySelectorAll(queryForProductItems);

  lazyLoad(async (productItemEl) => {
    const productLink = productItemEl.querySelector("a").href;
    const productDoc = await fetchDoc(productLink);
    const thumbImgEls = productDoc.querySelectorAll(
      ".item-gallery__thumbnail-image"
    );

    const imageContEl = generateElements(`<div class="img-cont"></div>`);
    imageContEl.append(...thumbImgEls);
    productItemEl.append(imageContEl);

    thumbImgEls.forEach((thumbImgEl) => {
      style(
        thumbImgEl,
        `
        margin: 3px;
        max-width: 300px;`
      );
    });
    style(productItemEl, `display: flex;`);
  }, ...productItemEls);
})();
