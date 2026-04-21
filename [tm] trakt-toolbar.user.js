(function () {
  'use strict';

  console.log(
    'Turn off ad blocker when this script fails to function properly',
  );

  let lastUrl = location.href;
  let initTimer;

  function cleanupExistingToolbar() {
    document
      .querySelectorAll('[data-trakt-toolbar-root="true"]')
      .forEach(el => el.remove());
  }

  function scheduleToolbarInit() {
    clearTimeout(initTimer);
    initTimer = setTimeout(() => {
      if (location.href === lastUrl) return;
      lastUrl = location.href;
      initToolbar();
    }, 250);
  }

  function installUrlChangeListeners() {
    if (window.__traktToolbarUrlChangeInstalled) return;
    window.__traktToolbarUrlChangeInstalled = true;

    const notifyUrlChange = () => {
      window.dispatchEvent(new Event('tm:urlchange'));
    };

    const wrapHistoryMethod = methodName => {
      const originalMethod = history[methodName];
      history[methodName] = function (...args) {
        const result = originalMethod.apply(this, args);
        notifyUrlChange();
        return result;
      };
    };

    wrapHistoryMethod('pushState');
    wrapHistoryMethod('replaceState');

    window.addEventListener('popstate', notifyUrlChange);
    window.addEventListener('hashchange', notifyUrlChange);
    window.addEventListener('tm:urlchange', scheduleToolbarInit);
  }

  function initToolbar() {
    let query = '';
    let queryClean = '';
    let episode = false;
    let season = false;
    let showAll = false;
    let shows = false;
    let seasons = false;

    const url = location.href;

    let movieShowTitle = url.match(/(shows|movies)\/([^\/]+)/)?.[2];
    if (movieShowTitle) {
      movieShowTitle = movieShowTitle.replaceAll('(', '').replaceAll(')', '');
    }

    if (url.includes('/seasons/all')) {
      query = movieShowTitle;
      showAll = true;
    } else if (url.includes('/shows/')) {
      const seasonNumber = url.match(/seasons\/(\d+)/)?.[1]?.padStart(2, '0');
      if (seasonNumber) {
        query = `${movieShowTitle} (s|season) ${seasonNumber}`;
        queryClean = `${movieShowTitle}%20s${seasonNumber}`;
      }
      if (url.includes('/episodes')) {
        episode = true;
        const episodeNumber = url
          .match(/episodes\/(\d+)$/)?.[1]
          ?.padStart(2, '0');
        const episodeTitle = $('.main-title').text();
        query += ` (e|episode) ${episodeNumber} ${episodeTitle}`;
        queryClean += `e${episodeNumber}`;
      }
    } else if (url.includes('/movies')) {
      query = movieShowTitle;
    }

    if (url.includes('shows')) shows = true;
    if (url.includes('seasons')) seasons = true;
    if (url.includes('episode')) episode = true;

    cleanupExistingToolbar();

    const toolbarEl = generateElements(`<div></div>`);
    const dialogEl = dialog('', toolbarEl);
    dialogEl.setAttribute('data-trakt-toolbar-root', 'true');
    dialogEl.querySelector('#expand-btn').click();
    style(
      toolbarEl,
      `
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
    `,
    );

    if (seasons && !episode) {
      const $ratingButton = $('<button> ⭐ </button>').appendTo(toolbarEl);
      $ratingButton.on('click', function () {
        let sum = 0;
        let text = '';
        let $ratings = $('.fanart > .corner-rating');
        let ratingIndex = 0;
        $ratings.each(function () {
          ratingIndex++;
          const $this = $(this);
          let ratingText = $this.text();
          text += ` + ${ratingText}`;
          sum += Number($this.text());
        });
        alert(`( ${text} ) / ${ratingIndex} = ${sum / $ratings.length}`);
      });
    }

    function createToolbarItem(
      targetUrl,
      iconUrl,
      displayText = '█  ',
      toolTip = '',
    ) {
      const toolbarItem = generateElements(
        `<a href=${targetUrl} target=_blank title="${toolTip}" class=toolbar-item> ${displayText} </a>`,
      );
      style(
        toolbarItem,
        `
      text-wrap: nowrap;
      overflow: hidden;
    `,
      );
      toolbarEl.append(toolbarItem);
      style(
        toolbarItem,
        `
      width: 60px;
      padding: 3px;
      display: flex;
      flex-direction: column;
      align-items: center;
      font-size: small;
    `,
      );
      if (iconUrl) {
        //! Ublock removes the entire element when this part is added
        //! disable Ublock in order for this to work
        const iconEl = generateElements(
          `<img class=toolbarIcon src=${iconUrl}>`,
        );
        iconEl.style.width = '30px';
        toolbarItem.prepend(iconEl);
      }
    }

    query = query.replaceAll(' ', '+');
    const ppxQuery = encodeURI(`
    I just watched ${movieShowTitle}, and I want to fully understand it. Please provide me with a detailed breakdown, including:
    A summary of the plot with key events, making sure to highlight any important details that might be easy to miss.
    An analysis of hidden themes, allegories, and deeper meanings.
    Explanations of any symbolism, foreshadowing, or subtle references.
    A character analysis, including motivations, arcs, and hidden complexities.
    Any connections to real-world events, literature, mythology, or philosophical ideas.
    A discussion of the director's style, choices, and possible intentions.
    Any fan theories or debates that add depth to the movie’s interpretation.
    Other interesting details, like Easter eggs, hidden clues, or references to other works.
  `);

    createToolbarItem(
      // wikipedia
      `https://www.google.com/search?btnI=1&q=${query}%20site:wikipedia.org`,
      'https://cdn-icons-png.flaticon.com/512/49/49360.png',
      'Wikipedia',
    );
    createToolbarItem(
      // AI - perplexity
      `https://www.perplexity.ai/search?q=${ppxQuery}&copilot=false&s=d`,
      'https://www.perplexity.ai/favicon.ico',
      'ppx',
    );
    createToolbarItem(
      // plot
      `https://www.google.com/search?q=${query}%20plot`,
      'https://cdn-icons-png.flaticon.com/512/3336/3336640.png',
      'Plot',
    );
    createToolbarItem(
      // wikis
      `https://www.google.com/search?q=${query}%20wiki`,
      null,
      'Wikis',
    );
    createToolbarItem(
      // tvtropes
      `https://www.google.com/search?btnI=1&q=${query}%20site:tvtropes.org`,
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAohJREFUWEdjNHBN/s8wgIBx1AGkhMDJquPgyJp6QZVh0TYRqkQcUVEAsxhkI7MWP9jik1e4GbI75Cl2BF4H5Ds/YIgyfw63BGY5TODvXwYG83gtihyB0wHIvmZgY2JgVuHFaZFJDPmOwHAAIwMDwwloXCMHOSFvkusIFAdoSX1hmJ9wGWeQE3LEip2CDD2LJQkpQ5GHO0BX+jPDnPgrKJLocU6syaSEBtwBKHGOZBO5jvj/j4HBNI5w2qCZA4gNBbgD7FTfM3SH3sAayqSGgm2iGsP33yxExRhKIqRGNPjnKjI8fc9JlOUgRUQ5gNjsSGywI7sOoxwgNxTIsRwjBMBlPFIhhOxSJnEOBkZhdqxBS67lJDkAWzR0TxNiWHlMguj4xqYQa11ATDS8/Lcer8W/fv9hCEyuR1GzdVErnO8dVw1mk+QARhF2hi9c+QzfuTywWg4yFJslIMUrplUz8PJwgfUtWbuHYfnG/aQ7oPFEPkN2gj/c8sAUVB/++vUHpwNwOYyoEDBvs2TYsrCFoX3Kcoaq3CiMYEQODmSLdh88yzBh7jqwNEkOEOf7xcDI+J/hxUdEqkc2AGYhLB7R4wPdsrayJAZ9HWWwssa+xQynLiBKXKKaZCCNoBBYu/UwQ4iPHd4QwOZbXL7HmQixpbANcxsZ6nsXMbRVJBF0gJaqPEN3bRpY3Y79pxk8HE1x6iE6BLBFwerNBxkWrN6FNUcQG2VEO2DLwlaGY2euMpy/cpshJzEAZzaESVDdAatm1DJUts9huPvwOUqKRnYJeqJEdkRgcgPDr9+/MRxOdAig69TVUGToqEqBC5c0z2S4fvsRirK6ghg4v2nCEqyhRrYDsJpGhuCoAwD+1w0QP8dOSgAAAABJRU5ErkJggg==',
      'TVTropes',
    );
    createToolbarItem(
      // imdb
      `https://www.google.com/search?btnI=1&q=${query}%20site:imdb.com/title`,
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAA7AAAAOwBeShxvQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAJBSURBVFiF7ZXNS1RhFMZ/733fOzPOR8ykM5PN+JEtwkVRTAuNgmyh4EZbSSgErY3+AlduwlWL3LQoIQsSWkREuYoIcRF9SbSxRSUoLrJmdOI6Xu/b4pZjXWcaJKag+a0u5zyc57nnHrhQo0aN/x2x+KjpFMIYBR2urrNeRYgRhWASdHNVzQG0AJg0QFTffCsELerX2tx8gelZC8PQnOsJM3F/DYBIUDA8sIfLE1m0drUX+sJcv7eGYUA0IohFJCeP+kklFONTObJrmp7OAJl2f8kMngBv3hW4cjuLqQRdx+sYn8q5QglnzwS5eie3pe07Xez/IBoxmL3RyM0HeRaWbVIJWTaAUW5D27E3YebVesn+2KUYphJ8WXWYmy/81FtYtvmUdXYfQH5XPXlhAWAq4dHEo5KAz61/tfRW/drdVTrOL5EZXGTmtbW7AMl6iakET19axGMSv+kNsB3bKQbo7qwjnVBs2JrnbwsebUUBTCVIJyUrWYeWRs/ZlKV1vyIec202NrWnX1EAAbSlTICyAbR3/m+p+AgPpFzjln1yx37ecshb7qGFAsWxjqOxN91nuYNbZfsU0NroGjeX2MDFsRW0BiGgKVnU3HqY58OSDUByrze8Z9rBJpOB7hBKChqiBkO9YRqiko7DAYZ6wxw75GOgJ8R6QRMLS4Z6i78Qv09w4oiftrSivyvI55xDpt3H42cWyXpJf1fI+26L0827+HJ/DgP0x7/o/15hiEG0HkWLSJXNc1owUmXPGjVq/IN8A/EMm7iAAlAEAAAAAElFTkSuQmCC',
      'IMDB',
    );
    createToolbarItem(
      // tmdb
      `https://www.google.com/search?btnI=1&q=${query}%20site:themoviedb.org`,
      'https://www.themoviedb.org/favicon.ico',
      'TMDB',
    );
    createToolbarItem(
      // simkl
      `https://simkl.com/search/?type=movies&q=${query}`,
      'https://play-lh.googleusercontent.com/DliaDatmrt_M8drBtsafddTyhcxN5W3UAcpQRjoq7MViP3iwHBMegVmKIxDAjHrFACQ=w240-h480-rw',
      'Simkl',
    );
    createToolbarItem(
      // letterboxd
      `https://www.google.com/search?btnI=1&q=${query}%20site:letterboxd.com`,
      'https://play-lh.googleusercontent.com/PFcm5Ne2otuXxkCNgql_XtpHjYrlhIGGQRFaz9XLFg2wikmMP5YCv_OsvFe1PLDAvGg',
      'Letterboxd',
    );
    createToolbarItem(
      // reddit discussions
      `https://www.google.com/search?&q=${query}+discussion%20site:reddit.com`,
      'https://cdn-icons-png.flaticon.com/512/4053/4053291.png',
      'Disc',
    );
    createToolbarItem(
      // reddit
      `https://www.google.com/search?&q=${query}%20site:reddit.com`,
      'https://cdn-icons-png.flaticon.com/512/725/725298.png',
      'Reddit',
    );
    createToolbarItem(
      // youtube
      `https://www.youtube.com/results?search_query=${query}%20-reaction%20-trailer%20-review%20-"movie%20clip"`,
      'https://cdn-icons-png.flaticon.com/512/1383/1383260.png',
      'Youtube',
    );
    createToolbarItem(
      // youtube
      `https://www.youtube.com/results?search_query=${query}+cast`,
      'https://cdn-icons-png.flaticon.com/512/1383/1383260.png',
      'Cast',
    );
    createToolbarItem(
      // ext.to
      `https://ext.to/browse/?q=${queryClean}&with_adult=1`,
      'https://cdn-icons-png.flaticon.com/512/3097/3097023.png',
      '',
    );
    createToolbarItem(
      // leet
      `https://1337x.to/search/${queryClean}/1/`,
      'https://www.wizcase.com/wp-content/uploads/2022/10/en-1337x-logo.jpg',
      'Leet',
    );
    createToolbarItem(
      // piratebay
      `https://thepiratebay.org/search.php?q=${queryClean}`,
      'https://cdn-icons-png.flaticon.com/512/1119/1119638.png',
      'Piratebay',
    );
    createToolbarItem(
      // ratingraph
      `https://www.google.com/search?btnI=1&q=${movieShowTitle}%20site:ratingraph.com#${query}`,
      'https://cdn.ratingraph.com/assets/images/icon-180.png',
      'Ratingraph',
    );
  }

  installUrlChangeListeners();
  initToolbar();
})();
