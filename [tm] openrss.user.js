(async function () {
  'use strict';
  if (window.top != window.self) return; //don't run on frames or iframes

  const feedEl = await waitFor('section.subscribe-panel > .url > .link');
  const feedUrl = feedEl.textContent.trim();
  location.replace(
    `http://localhost:8080/i/?c=feed&a=add&cat_id=1&url_rss=${encodeURIComponent(feedUrl)}`,
  );
})();
