(function () {
  'use strict';

  const ROOT_ATTR = 'data-trakt-toolbar-root';
  const STYLE_ID = 'trakt-toolbar-style';

  const ICONS = {
    wikipedia: 'https://cdn-icons-png.flaticon.com/512/49/49360.png',
    perplexity: 'https://www.perplexity.ai/favicon.ico',
    plot: 'https://cdn-icons-png.flaticon.com/512/3336/3336640.png',
    tvtropes: 'https://assets.tvtropes.org/img/icons/favicon.ico',
    imdb: 'https://cdn-icons-png.flaticon.com/512/889/889118.png',
    tmdb: 'https://www.themoviedb.org/favicon.ico',
    simkl:
      'https://play-lh.googleusercontent.com/DliaDatmrt_M8drBtsafddTyhcxN5W3UAcpQRjoq7MViP3iwHBMegVmKIxDAjHrFACQ=w240-h480-rw',
    letterboxd:
      'https://play-lh.googleusercontent.com/PFcm5Ne2otuXxkCNgql_XtpHjYrlhIGGQRFaz9XLFg2wikmMP5YCv_OsvFe1PLDAvGg',
    redditDiscussions:
      'https://cdn-icons-png.flaticon.com/512/4053/4053291.png',
    reddit: 'https://cdn-icons-png.flaticon.com/512/725/725298.png',
    youtube: 'https://cdn-icons-png.flaticon.com/512/1383/1383260.png',
    extTo: 'https://cdn-icons-png.flaticon.com/512/3097/3097023.png',
    leet: 'https://www.wizcase.com/wp-content/uploads/2022/10/en-1337x-logo.jpg',
    piratebay: 'https://cdn-icons-png.flaticon.com/512/1119/1119638.png',
    ratingraph: 'https://cdn.ratingraph.com/assets/images/icon-180.png',
  };

  console.log(
    'Turn off ad blocker when this script fails to function properly',
  );

  window.addEventListener('urlchange', event => {
    renderForUrl(event?.url ?? location.href);
  });

  renderForUrl(location.href);

  function renderForUrl(url) {
    cleanupExistingToolbar();

    const context = parseTraktPageV3(url);
    if (context.type === 'unknown') return;

    ensureToolbarStyles();

    const toolbarRoot = createToolbarRoot();
    const items = buildToolbarItems(context);

    if (!items.length) return;

    for (const item of items) {
      if (item.kind === 'button') {
        toolbarRoot.appendChild(
          createToolbarButton(item.label, item.onClick, item.title),
        );
        continue;
      }

      toolbarRoot.appendChild(
        createToolbarLink(item.href, item.icon, item.label, item.title),
      );
    }

    (document.body ?? document.documentElement).appendChild(toolbarRoot);
  }

  function parseTraktPageV3(url = location.href) {
    const u = new URL(url);

    if (u.hostname !== 'app.trakt.tv') {
      return { type: 'unknown' };
    }

    const [section, slug] = u.pathname.split('/').filter(Boolean);
    if (!section || !slug) return { type: 'unknown' };

    if (section === 'movies') {
      const matches = slug.match(/(.+?)-(\d{4})$/);
      if (!matches) {
        return { type: 'unknown' };
      }

      return {
        type: 'movie',
        slug,
        title: slugToTitle(matches[1]),
        year: matches[2],
      };
    }

    if (section === 'shows') {
      const season = u.searchParams.get('season');
      const episode = u.searchParams.get('episode');
      const view = u.searchParams.get('view');

      const context = {
        slug,
        title: slugToTitle(slug),
        season,
        episode,
        episodeTitle: getEpisodeTitle(),
      };

      if (view === 'episode') {
        return {
          type: 'episode',
          ...context,
        };
      }

      if (view === 'seasons') {
        return {
          type: 'season',
          ...context,
        };
      }

      return {
        type: 'show',
        ...context,
      };
    }

    return { type: 'unknown' };
  }

  function buildToolbarItems(context) {
    const searchQuery = buildSearchQuery(context);
    const torrentQuery = buildTorrentQuery(context);
    const ppxQuery = buildGeneralPpxPrompt(context);
    const ppxEpisodeQuery = buildEpisodePpxPrompt(context);

    const items = [
      {
        kind: 'link',
        href: buildGoogleLuckySearchUrl(`${searchQuery} site:wikipedia.org`),
        icon: ICONS.wikipedia,
        label: 'Wikipedia',
        title: 'Search Wikipedia',
      },
    ];

    if (context.type === 'episode') {
      items.push({
        kind: 'link',
        href: buildPerplexityUrl(ppxEpisodeQuery),
        icon: ICONS.perplexity,
        label: 'PPX Ep',
        title: 'Perplexity episode breakdown',
      });
    }

    if (
      context.type === 'movie' ||
      context.type === 'show' ||
      context.type === 'season'
    ) {
      items.push({
        kind: 'link',
        href: buildPerplexityUrl(ppxQuery),
        icon: ICONS.perplexity,
        label: 'PPX',
        title: 'Perplexity breakdown',
      });
    }

    items.push(
      {
        kind: 'link',
        href: buildGoogleSearchUrl(`${searchQuery} plot`),
        icon: ICONS.plot,
        label: 'Plot',
        title: 'Search plot discussions',
      },
      {
        kind: 'link',
        href: buildGoogleSearchUrl(`${searchQuery} wiki`),
        icon: null,
        label: 'Wikis',
        title: 'Search wiki pages',
      },
      {
        kind: 'link',
        href: buildGoogleLuckySearchUrl(`${searchQuery} site:tvtropes.org`),
        icon: ICONS.tvtropes,
        label: 'TVTropes',
        title: 'Search TVTropes',
      },
      {
        kind: 'link',
        href: buildImdbUrl(searchQuery),
        icon: ICONS.imdb,
        label: 'IMDB',
        title: 'Open IMDb',
      },
      {
        kind: 'link',
        href: buildTmdbUrl(searchQuery),
        icon: ICONS.tmdb,
        label: 'TMDB',
        title: 'Open TMDB',
      },
      {
        kind: 'link',
        href: buildSimklUrl(searchQuery),
        icon: ICONS.simkl,
        label: 'Simkl',
        title: 'Search Simkl',
      },
      {
        kind: 'link',
        href: buildGoogleLuckySearchUrl(`${searchQuery} site:letterboxd.com`),
        icon: ICONS.letterboxd,
        label: 'Letterboxd',
        title: 'Search Letterboxd',
      },
      {
        kind: 'link',
        href: buildGoogleSearchUrl(`${searchQuery} discussion site:reddit.com`),
        icon: ICONS.redditDiscussions,
        label: 'Disc',
        title: 'Search Reddit discussions',
      },
      {
        kind: 'link',
        href: buildGoogleSearchUrl(`${searchQuery} site:reddit.com`),
        icon: ICONS.reddit,
        label: 'Reddit',
        title: 'Search Reddit',
      },
      {
        kind: 'link',
        href: buildYouTubeSearchUrl(
          `${searchQuery} -reaction -trailer -review -\"movie clip\"`,
        ),
        icon: ICONS.youtube,
        label: 'YouTube',
        title: 'Search YouTube',
      },
      {
        kind: 'link',
        href: buildYouTubeSearchUrl(`${searchQuery} cast`),
        icon: ICONS.youtube,
        label: 'Cast',
        title: 'Search cast videos',
      },
      {
        kind: 'link',
        href: buildExtToUrl(torrentQuery),
        icon: ICONS.extTo,
        label: '',
        title: 'Search Ext.to',
      },
      {
        kind: 'link',
        href: build1337xUrl(torrentQuery),
        icon: ICONS.leet,
        label: 'Leet',
        title: 'Search 1337x',
      },
      {
        kind: 'link',
        href: buildPirateBayUrl(torrentQuery),
        icon: ICONS.piratebay,
        label: 'Piratebay',
        title: 'Search Pirate Bay',
      },
      {
        kind: 'link',
        href: buildGoogleLuckySearchUrl(
          `${context.title} site:ratingraph.com#${searchQuery}`,
        ),
        icon: ICONS.ratingraph,
        label: 'Ratingraph',
        title: 'Search Ratingraph',
      },
    );

    if (context.type === 'season') {
      items.push({
        kind: 'button',
        label: 'Avg',
        title: 'Average season rating',
        onClick: () => showSeasonAverageRating(),
      });
    }

    return items;
  }

  function buildSearchQuery(context) {
    const title = getDisplayTitle(context);
    const season = padTwo(context.season);
    const episode = padTwo(context.episode);

    switch (context.type) {
      case 'movie':
        return [title, context.year].filter(Boolean).join(' ');
      case 'show':
        return title;
      case 'season':
        return [title, `season ${season}`].filter(Boolean).join(' ').trim();
      case 'episode':
        return [
          title,
          `season ${season}`,
          `episode ${episode}`,
          context.episodeTitle,
        ]
          .filter(Boolean)
          .join(' ')
          .trim();
      default:
        return title;
    }
  }

  function buildTorrentQuery(context) {
    const title = getDisplayTitle(context);
    const season = padTwo(context.season);
    const episode = padTwo(context.episode);

    switch (context.type) {
      case 'movie':
        return [title, context.year].filter(Boolean).join(' ');
      case 'show':
        return title;
      case 'season':
        return [title, `s${season}`].filter(Boolean).join(' ').trim();
      case 'episode':
        return [title, `s${season}e${episode}`]
          .filter(Boolean)
          .join(' ')
          .trim();
      default:
        return title;
    }
  }

  function buildGeneralPpxPrompt(context) {
    return `I just watched ${getDisplayTitle(context)}, and I want to fully understand it. Please provide me with a detailed breakdown, including:\nA summary of the plot with key events, making sure to highlight any important details that might be easy to miss.\nAn analysis of hidden themes, allegories, and deeper meanings.\nExplanations of any symbolism, foreshadowing, or subtle references.\nA character analysis, including motivations, arcs, and hidden complexities.\nAny connections to real-world events, literature, mythology, or philosophical ideas.\nA discussion of the director's style, choices, and possible intentions.\nAny fan theories or debates that add depth to the movie's interpretation.\nOther interesting details, like Easter eggs, hidden clues, or references to other works.`;
  }

  function buildEpisodePpxPrompt(context) {
    const season = padTwo(context.season);
    const episode = padTwo(context.episode);
    const episodeCode = season && episode ? ` S${season}E${episode}` : '';
    const subject = context.type === 'episode' ? 'episode' : 'season';

    return `I just watched the ${subject} of ${getDisplayTitle(context)}${episodeCode}, and I want to fully understand it. Please provide me with a detailed breakdown, including:\nA summary of the plot with key events, making sure to highlight any important details that might be easy to miss.\nDon't spoil future episodes, but feel free to include relevant information from previous episodes or seasons.`;
  }

  function buildGoogleSearchUrl(query) {
    return `https://www.google.com/search?${new URLSearchParams({ q: query }).toString()}`;
  }

  function buildGoogleLuckySearchUrl(query) {
    return `https://www.google.com/search?${new URLSearchParams({ btnI: '1', q: query }).toString()}`;
  }

  function buildPerplexityUrl(query) {
    return `https://www.perplexity.ai/search?${new URLSearchParams({
      q: query,
      copilot: 'false',
      s: 'd',
    }).toString()}`;
  }

  function buildYouTubeSearchUrl(query) {
    return `https://www.youtube.com/results?${new URLSearchParams({
      search_query: query,
    }).toString()}`;
  }

  function buildSimklUrl(query) {
    return `https://simkl.com/search/?${new URLSearchParams({
      type: 'movies',
      q: query,
    }).toString()}`;
  }

  function buildExtToUrl(query) {
    return `https://ext.to/browse/?${new URLSearchParams({
      q: query,
      with_adult: '1',
    }).toString()}`;
  }

  function build1337xUrl(query) {
    return `https://1337x.to/search/${encodeURIComponent(query)}/1/`;
  }

  function buildPirateBayUrl(query) {
    return `https://thepiratebay.org/search.php?${new URLSearchParams({
      q: query,
    }).toString()}`;
  }

  function buildImdbUrl(query) {
    const directLink = document.querySelector('#external-link-imdb');

    if (directLink?.href && directLink.href.includes('/title/')) {
      return directLink.href;
    }

    return buildGoogleLuckySearchUrl(`${query} site:imdb.com/title`);
  }

  function buildTmdbUrl(query) {
    const directLink = document.querySelector('#external-link-tmdb');

    if (
      directLink?.href &&
      (directLink.href.includes('/movie/') || directLink.href.includes('/tv/'))
    ) {
      return directLink.href;
    }

    return buildGoogleLuckySearchUrl(`${query} site:themoviedb.org`);
  }

  function createToolbarRoot() {
    const root = document.createElement('div');
    root.setAttribute(ROOT_ATTR, 'true');
    root.className = 'trakt-toolbar-root';
    return root;
  }

  function createToolbarLink(href, iconUrl, label, title = '') {
    const link = document.createElement('a');
    link.href = href;
    link.target = '_blank';
    link.rel = 'noreferrer noopener';
    link.className = 'trakt-toolbar-item trakt-toolbar-link';
    link.title = title || label || href;

    if (iconUrl) {
      const img = GM_addElement('img', { src: iconUrl });
      img.alt = label || '';
      img.className = 'trakt-toolbar-icon';
      link.appendChild(img);
    }

    const text = document.createElement('span');
    text.className = 'trakt-toolbar-label';
    text.textContent = label;
    link.appendChild(text);

    return link;
  }

  function createToolbarButton(label, onClick, title = '') {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'trakt-toolbar-item trakt-toolbar-button';
    button.title = title || label;
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
  }

  function showSeasonAverageRating() {
    const ratingNodes = Array.from(
      document.querySelectorAll('.fanart > .corner-rating'),
    );

    if (!ratingNodes.length) {
      alert('No season ratings found on this page.');
      return;
    }

    const ratings = ratingNodes
      .map(node => Number(node.textContent?.trim()))
      .filter(Number.isFinite);

    if (!ratings.length) {
      alert('No numeric season ratings found on this page.');
      return;
    }

    const sum = ratings.reduce((total, value) => total + value, 0);
    alert(`Average season rating: ${(sum / ratings.length).toFixed(2)}`);
  }

  function cleanupExistingToolbar() {
    document
      .querySelectorAll(`[${ROOT_ATTR}="true"]`)
      .forEach(element => element.remove());
  }

  function ensureToolbarStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      [${ROOT_ATTR}="true"] {
        position: fixed;
        top: 12px;
        right: 12px;
        z-index: 2147483647;
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        max-width: min(92vw, 760px);
        padding: 8px;
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-radius: 14px;
        background: rgba(15, 17, 22, 0.92);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
        backdrop-filter: blur(10px);
      }

      .trakt-toolbar-item {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 34px;
        padding: 7px 10px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.04);
        color: #f2f2f2 !important;
        font: 600 12px/1.1 system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        text-decoration: none !important;
        cursor: pointer;
        transition: transform 120ms ease, background 120ms ease, border-color 120ms ease;
      }

      .trakt-toolbar-item:hover {
        transform: translateY(-1px);
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.2);
      }

      .trakt-toolbar-button {
        color: #fff;
      }

      .trakt-toolbar-icon {
        width: 18px;
        height: 18px;
        object-fit: contain;
        flex: 0 0 auto;
      }

      .trakt-toolbar-label {
        white-space: nowrap;
      }
    `;

    (document.head ?? document.documentElement).appendChild(style);
  }

  function getEpisodeTitle() {
    return document.querySelector('.main-title')?.textContent?.trim() ?? '';
  }

  function getDisplayTitle(context) {
    return context.type === 'movie' && context.year
      ? `${context.title} (${context.year})`
      : context.title;
  }

  function slugToTitle(slug) {
    return decodeURIComponent(slug)
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .map(word => {
        if (!word) return word;
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  }

  function padTwo(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return '';
    return String(numeric).padStart(2, '0');
  }
})();
