(function () {
  "use strict";
  if (window.top != window.self) return; //don't run on frames or iframes

  const cleanUrl = cleanTemuUrl(location.href);
  if (cleanUrl !== location.href) {
    window.history.pushState(null, "", cleanUrl);
  }

  function cleanTemuUrl(urlStr) {
    try {
      // 1. Create a URL object
      const url = new URL(urlStr);
      const origin = url.origin; // e.g., "https://www.temu.com"
      const pathname = url.pathname; // e.g., "/goods.html" or "/lk-en/...-g-123.html"

      // --- Strategy 1: Check for 'goods_id' query parameter ---
      const goodsIdParam = url.searchParams.get("goods_id");

      if (goodsIdParam) {
        // Found 'goods_id' parameter. Construct the clean URL using it.
        // We assume the relevant path is the original one in this case.
        const cleanUrl = `${origin}${pathname}?goods_id=${goodsIdParam}`;
        return cleanUrl;
      }

      // --- Strategy 2: Check for ID pattern in the pathname ---
      // Regex: Match '-g-', capture one or more digits (\d+), followed by '.html' at the end ($)
      const pathMatch = pathname.match(/-g-(\d+)\.html$/);

      if (pathMatch && pathMatch[1]) {
        // Found ID pattern in the path. The "clean" URL is just the origin + pathname,
        // as the ID is already part of the path and we want to remove query parameters.
        const idFromPath = pathMatch[1]; // We have the ID if needed, but the requirement is the clean URL
        const cleanUrl = `https://www.temu.com/goods.html?goods_id=${idFromPath}`;
        return cleanUrl;
      }

      // --- ID Not Found using either strategy ---
      console.warn(
        "Warning: Could not extract a known Temu product ID pattern from:",
        urlStr
      );
      // Fallback: Return the URL without any query parameters
      return `${origin}${pathname}`;
    } catch (error) {
      // Handle cases where the input string is not a valid URL
      console.error("Invalid URL provided:", urlStr, error);
      return urlStr; // Return original string or null/throw error
    }
  }
})();
