(async function () {
  "use strict";
  if (window.top != window.self) return; //don't run on frames or iframes

  //* Wishlist page
  if (location.href.includes("/wishlist.html")) {
    let totalPrice = 0;

    const locatorEls = document.querySelectorAll(
      `[data-tooltip-title="Find similar"]`
    );
    locatorEls.forEach((locatorEl) => {
      const productEl = grandParent(locatorEl, 2);
      const priceEl = productEl.querySelector("[aria-label*=LKR]");
      const price = priceEl
        .getAttribute("aria-label")
        .replace("LKR", "")
        .replace(" ", "")
        .replace(",", "")
        .trim();
      totalPrice += parseFloat(price);
    });

    const totalPricePresentable = totalPrice.toLocaleString("en-US", {
      style: "currency",
      currency: "LKR",
    });
    const { addElement } = await Collapsible();
    const totalPriceEl = generateElements(
      `<div>Rs. ${totalPricePresentable}</div>`
    );
    addElement(totalPriceEl);
  }

  const cleanUrl = cleanTemuUrl(location.href);
  if (cleanUrl !== location.href) {
    window.history.pushState(null, "", cleanUrl);
  }

  function cleanTemuUrl(urlStr) {
    try {
      const url = new URL(urlStr);
      const origin = url.origin;
      const pathname = url.pathname;

      const goodsIdParam = url.searchParams.get("goods_id");

      if (goodsIdParam) {
        const cleanUrl = `${origin}${pathname}?goods_id=${goodsIdParam}`;
        return cleanUrl;
      }

      const pathMatch = pathname.match(/-g-(\d+)\.html$/);

      if (pathMatch && pathMatch[1]) {
        const idFromPath = pathMatch[1];
        const cleanUrl = `https://www.temu.com/goods.html?goods_id=${idFromPath}`;
        return cleanUrl;
      }

      const parentOrderSN = url.searchParams.get("parent_order_sn");
      if (parentOrderSN) {
        const cleanUrl = `${origin}${pathname}?parent_order_sn=${parentOrderSN}`;
        return cleanUrl;
      }

      console.warn(
        "Warning: Could not extract a known Temu product ID pattern from:",
        urlStr
      );
      return `${origin}${pathname}`;
    } catch (error) {
      console.error("Invalid URL provided:", urlStr, error);
      return urlStr;
    }
  }
})();
