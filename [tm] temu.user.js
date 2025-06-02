(function () {
  "use strict";
  if (window.top != window.self) return; //don't run on frames or iframes

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
