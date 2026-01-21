// Adding append to search query buttons
const parentEl = document.querySelector(`.search-box`);

let button720p = jQuery(`<button> 720p     </button>`).on(
  'click',
  appendToSearchQuery,
);
let button1080p = jQuery(`<button>1080p</button>`).on(
  'click',
  appendToSearchQuery,
);
let buttonComplete = jQuery(`<button> Complete </button>`).on(
  'click',
  appendToSearchQuery,
);
let buttons01e01 = jQuery(`<button> s01e01   </button>`).on(
  'click',
  appendToSearchQuery,
);
parentEl.append(
  button720p[0],
  button1080p[0],
  buttonComplete[0],
  buttons01e01[0],
);

if (location.href.match(/s\d+?e\d+?/)) {
  const btnPrevEpisode = generateElements(`<button>⏮️</button>`, parentEl);
  const btnNextEpisode = generateElements(`<button>⏭️</button>`, parentEl);

  btnPrevEpisode.addEventListener('click', event => {
    switchEpisode(-1);
  });

  btnNextEpisode.addEventListener('click', event => {
    switchEpisode(1);
  });

  function switchEpisode(direction) {
    const matches = location.href.match(/s(\d+)e(\d+)/);
    if (!matches) return;

    let seasonNumber = parseInt(matches[1], 10);
    let episodeNumber = parseInt(matches[2], 10);

    episodeNumber += direction;

    // Ensure episode number does not go below 1
    if (episodeNumber < 1) {
      episodeNumber = 1;
    }

    const newSeasonNumber = seasonNumber.toString().padStart(2, '0');
    const newEpisodeNumber = episodeNumber.toString().padStart(2, '0');

    const newUrl = location.href.replace(
      /s\d+e\d+/,
      `s${newSeasonNumber}e${newEpisodeNumber}`,
    );
    location.href = newUrl;
    console.log({ newSeasonNumber, newEpisodeNumber });
  }
}

function appendToSearchQuery(event) {
  let currentUrl = location.href;
  const regex = /search\/(.*?)\//;
  let result = currentUrl.match(regex);
  let newQuery = `${result[1]} ${event.target.innerText}`;
  location.href = location.href.replace(regex, `search/${newQuery}/`);
}

// Rest
let href = location.href;

if (href.includes('/torrent/')) {
  $magnetLink = jQuery('ul:not(.dropdown-menu) > li > [href*=magnet]');
  createSeedrLink($magnetLink);
}

let $torrentLinks = jQuery(`[href*='/torrent/']`).each(function () {
  let $this = jQuery(this);
  let $newDiv = jQuery(`<div class='newDiv' style="width: 10%"></div>`)
    .appendTo($this.parent())
    .load(`${this.href} ul:not(.dropdown-menu) > li > [href*=magnet]`, () => {
      let magnet = $newDiv.find('a');
      magnet.text('🧲');
      magnet.children().remove();
      magnet.css(`padding`, `unset`);
      magnet.css(`width`, `50%`);
      createSeedrLink(magnet);
    });

  let parentCell = $this.parent();
  parentCell
    .css(`display`, `flex`)
    .css(`width`, `unset`)
    .css(`justify-content`, `space-between`);
});

function createSeedrLink($originalMagnet) {
  link = $originalMagnet.attr('href');
  $originalMagnet.after(`
        <a id=seedrLink href=https://www.seedr.cc/files?link=${link} target=_blank>
            <img src="https://static.seedr.cc/images/seed_v2.png">
        </a>`);
  $seedrLink = jQuery('#seedrLink');
  $seedrLink.addClass($originalMagnet.attr('class'));

  $originalMagnet.parent().css(`display`, `flex`);
  $seedrLink.css(`width`, `50%`).css(`margin`, `6px`);
  $seedrLink.css('box-sizing', 'border-box');
  $seedrLink.css('padding', 'unset');
}
