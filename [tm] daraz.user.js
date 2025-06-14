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
      const src = thumbImgEl.src;
      const hiresSrc = src.replace(/_\d+x\d+/, "_720x720");
      if (src !== hiresSrc) {
        thumbImgEl.src = hiresSrc;
      }

      // if new scr fails loading, fallback to original src
      thumbImgEl.onerror = () => {
        thumbImgEl.src = src;
      };
    });

    thumbImgEls.forEach((thumbImgEl) => {
      style(
        thumbImgEl,
        `
        margin: 3px;
        max-width: 150px;`
      );
    });

    // give productItemEl a card-like appearance
    // prettify the product item element
    style(
      productItemEl,
      `
      display: flex;
      border: 1px solid #ccc;
      border-radius: 8px;
      padding: 10px;
      margin: 10px;
      background-color: #fff;`
    );
  }, ...productItemEls);
})();
