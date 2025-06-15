(function () {
  ("use strict");
  if (window.top != window.self) return; //don't run on frames or iframes

  const queryForProductItems = '[data-tracking="product-card"]';

  const productItemEls = document.querySelectorAll(queryForProductItems);

  // 1. Add Tippy.js default styles
  GM_addStyle(`
    .tippy-box[data-theme~='light-border'] {
        border: 1px solid #dadada;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
  `);

  lazyLoad(async (productItemEl) => {
    const productLink = productItemEl.querySelector("a").href;
    const productDoc = await fetchDoc(productLink);
    const thumbImgEls = productDoc.querySelectorAll(
      ".item-gallery__thumbnail-image"
    );

    const imageContEl = generateElements(`<div class="img-cont"></div>`);
    style(
      imageContEl,
      `
      display: flex;
      flex-wrap: wrap;
      max-width: 1000px;`
    );
    imageContEl.append(...thumbImgEls);
    // productItemEl.append(imageContEl);

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

    //* tippy.js configurations

    // 2. Find the trigger and its content element
    const triggerElement = productItemEl;
    const contentElement = imageContEl;

    if (triggerElement && contentElement) {
      // 3. Initialize Tippy
      tippy(triggerElement, {
        content: contentElement, // Pass the DOM element directly
        allowHTML: true, // Necessary to render the HTML
        interactive: true, // Allows you to hover over the tippy itself
        placement: "right", // Preferred placement, will adjust automatically
        theme: "light-border", // Use a pre-defined or custom theme
        animation: "fade", // A little flair
        trigger: "mouseenter", // Show on hover
        arrow: false,
        // hideOnClick: false,  // Keep it open even if you click inside
      });
    }
  }, ...productItemEls);
})();
