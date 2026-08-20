(async function () {
  ('use strict');

  //* category sidebar
  (async function () {
    const CATEGORY_LINK_SELECTOR = 'div:has(>[href*="/lk-en/"])';
    if (!location.href.includes('/sitemap.html')) return;
    waitForEach('#main h2', () => {
      const mainEl = document.querySelector('#main');
      style(mainEl, `display: flex;`);
      const iframeEl = generateElements(`<iframe></iframe>`, mainEl);
      mainEl.appendChild(iframeEl);
      iframeEl.src = 'about:blank';

      const categoryLinkEls = document.querySelectorAll(CATEGORY_LINK_SELECTOR);
      categoryLinkEls.forEach(categoryLinkEl => {
        const clonedEl = removeListenersByCloning(categoryLinkEl);
        clonedEl.addEventListener('click', event => {
          event.preventDefault();
          const categoryUrl = clonedEl.querySelector('a').href;
          iframeEl.src = categoryUrl + '#embed';
        });
      });
    });
  })();

  //* related searches
  waitForEach('.splide__slide > div', async relatedSearchEl => {
    if (!location.href.includes('/search_result.html')) return;
    const searchQuery = relatedSearchEl.textContent.trim();
    const searchUrl = `https://www.temu.com/search_result.html?search_key=${encodeURIComponent(
      searchQuery,
    )}`;
    wrap(`<a href="${searchUrl}" target="_blank"></a>`, relatedSearchEl);
  });

  //* focus search input
  const searchInputEl = document.querySelector(`#searchInput`);
  document.addEventListener('keyup', event => {
    if (event.key === '/') {
      window.scrollTo(0, 0);
      searchInputEl.focus();
    }
  });

  //* product previews
  (function () {
    return;

    const queryForProductItems = '[data-tooltip*=goodContainer]';
    const productItemEls = document.querySelectorAll(queryForProductItems);

    // 1. Add Tippy.js default styles
    GM_addStyle(`
    .tippy-box[data-theme~='light-border'] {
        border: 1px solid #dadada;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        max-width: unset !important;
    }
  `);

    lazyLoad(
      async productItemEl => {
        const productLink = productItemEl.querySelector('a').href;
        const productDoc = await fetchDoc(productLink);

        const imgContainerEl = generateElements(
          `<div class="img-container"></div>`,
        );

        const locatorImgEls = productDoc.querySelectorAll(
          '[aria-label="Goods image"] img',
        );
        locatorImgEls.forEach(locatorImgEl => {
          const locatorEl = locatorImgEl.parentElement;
          console.log(locatorEl.style.backgroundImage);
          const matches =
            locatorEl.style.backgroundImage.match(/url\(["'](.+?)["']\)/);
          if (!matches) {
            console.warn('No image found for locator element:', locatorEl);
            return;
          }
          const ImgSrc = matches[1].replace(/\?.+/, '');
          const newImgEl = generateElements(
            `<img src="${ImgSrc}" alt="Product Image" />`,
          );
          imgContainerEl.appendChild(newImgEl);
        });

        style(
          imgContainerEl,
          `
      display: flex;
      flex-wrap: wrap;
      width: 500px;`,
        );

        imgContainerEl.querySelectorAll('img').forEach(imgEl => {
          style(
            imgEl,
            `
        margin: 3px;
        max-width: 150px;`,
          );
        });

        // give productItemEl a card-like appearance
        // prettify the product item element
        style(
          productItemEl,
          `
      border: 1px solid #ccc;
      border-radius: 8px;
      background-color: #fff;`,
        );

        //* tippy.js configurations

        // 2. Find the trigger and its content element
        const triggerElement = productItemEl;
        const contentElement = imgContainerEl;

        if (triggerElement && contentElement) {
          // 3. Initialize Tippy
          tippy(triggerElement, {
            content: contentElement, // Pass the DOM element directly
            allowHTML: true, // Necessary to render the HTML
            interactive: true, // Allows you to hover over the tippy itself
            placement: 'right', // Preferred placement, will adjust automatically
            theme: 'light-border', // Use a pre-defined or custom theme
            animation: 'fade', // A little flair
            trigger: 'mouseenter', // Show on hover
            arrow: false,
            // hideOnClick: false,  // Keep it open even if you click inside
          });
        }
      },
      ...productItemEls,
    );
  })();

  //* Wishlist page
  if (location.href.includes('/wishlist.html')) {
    let totalPrice = 0;
    let totalPricePresentable = '';

    const { addElement } = await Collapsible();
    const totalPriceEl = generateElements(
      `<div>Rs. ${totalPricePresentable}</div>`,
    );
    addElement(totalPriceEl);

    waitForEach('span[aria-label^=LKR]', () => {
      totalPrice = calculateTotalPrice();
      totalPricePresentable = totalPrice.toLocaleString('en-US', {
        style: 'currency',
        currency: 'LKR',
      });
      totalPriceEl.textContent = `${totalPricePresentable}`;
    });
  }

  function calculateTotalPrice() {
    let totalPrice = 0;
    const locatorEls = document.querySelectorAll(`span[aria-label^=LKR]`);
    locatorEls.forEach(locatorEl => {
      const priceLabel = locatorEl.getAttribute('aria-label');
      const price = parsePrice(priceLabel);
      totalPrice += parseFloat(price);
    });
    return totalPrice;
  }

  function parsePrice(str) {
    const cleaned = str.replace(/[^0-9.-]/g, '');
    return parseFloat(cleaned);
  }

  //* clean goods links
  waitForEach(`[href*="-g-"]`, goodsLinkEl => {
    const cleanUrl = cleanTemuUrl(goodsLinkEl.href);
    goodsLinkEl.href = cleanUrl;
  });

  //*
  const cleanUrl = cleanTemuUrl(location.href);
  if (cleanUrl !== location.href) {
    window.history.pushState(null, '', cleanUrl);
  }

  function cleanTemuUrl(urlStr) {
    const url = new URL(urlStr);
    const origin = url.origin;
    const pathname = url.pathname;

    const goodsId = getGoodsId(urlStr);
    if (goodsId) {
      //https://www.temu.com/goods.html?goods_id=601100973787393
      const cleanUrl = `https://www.temu.com/goods.html?goods_id=${goodsId}`;
      return cleanUrl;
    }

    return null;
  }

  function getGoodsId(urlStr) {
    const url = new URL(urlStr);
    const goodsIdFromSearchparams = url.searchParams.get('goods_id');
    if (goodsIdFromSearchparams) {
      return goodsIdFromSearchparams;
    }
    const matches = url.pathname.match(/-g-(\d+)\.html$/);
    if (matches && matches[1]) {
      const goodsIdFromPathname = matches[1];
      return goodsIdFromPathname;
    }
    return null;
  }
})();
