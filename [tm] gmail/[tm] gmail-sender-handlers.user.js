function dailyDevHandler() {
  const itemsParentEl = document.querySelector('div[dir="ltr"] > table');
  itemsParentEl.classList.add("fixedCSS");
  style(
    itemsParentEl,
    `
    display: flex;
    flex-wrap: wrap;
  `
  );

  const locatorEls = document.querySelectorAll(
    '[href*="t.daily.de"][class*=button]'
  );
  locatorEls.forEach((locatorEl) => {
    const itemEl = grandParent(locatorEl, 12);
    itemsParentEl.prepend(itemEl);
    style(
      itemEl,
      `
      display: block;
      width: 45%;
    `
    );
  });
}

function simklHandler() {
  const simklParent = document.querySelector(
    '[class*="stack-column"]'
  ).parentElement;
  simklParent.classList.add("fixedCSS");
  simklParent.style.display = "flex";

  const query = document
    .querySelector("h2.hP")
    .textContent.replace(" is out", "");

  const newDiv = generateElements(`<div></div>`, simklParent);
  style(newDiv, `display: grid;`);
  generateElements(
    `<a href='https://1337x.to/search/${query}/1/'>leet</a>`,
    newDiv
  );
  generateElements(
    `<a href='https://torrentgalaxy.to/torrents.php?search=${query}'>tg</a>`,
    newDiv
  );
  generateElements(
    `<a href='https://ext.to/browse/?q=${query}&with_adult=1'>ext</a>`,
    newDiv
  );
  newDiv.style.fontSize = "large";
}

function mediumDailyDigestHandler() {
  //* sanitizing links
  const dirtyLinks = document.querySelectorAll(`[href*='?source=']`);
  dirtyLinks.forEach((link) => {
    link.href = link.href.replace(/\?source=.+/, "");
  });

  //*
  const mediumParent = generateElements(
    "<div id=mediumParent></div>",
    null,
    true
  );
  mediumParent.style = "display: flex; flex-wrap: wrap";
  document
    .querySelector("table[role=presentation]:not([class])")
    .parentElement.prepend(mediumParent);
  mediumParent.classList.add("fixedCSS");

  document.querySelectorAll(`img[alt=Claps]`).forEach((item) => {
    const mainItem = grandParent(item, 6);
    if (!mainItem.querySelector('[alt="Member-only content"]')) {
      mainItem.style.width = "48%";
      mediumParent.prepend(mainItem);
    }
  });
}

function muoHandler() {
  document.querySelector(`center`).classList.add("fixedCSS");

  const linksDiv = generateElements(`<div></div>`, null, true);
  linksDiv.style.display = "grid";
  document.querySelector("center").prepend(linksDiv);
  const linksToArticles = document.querySelectorAll(`h2 > a`);
  linksToArticles.forEach((link) => {
    if (link.href.includes(".tradepub.com")) return;
    // to avoid commercial links 👆🏻
    link.style.fontSize = "large";
    linksDiv.prepend(link);
  });

  sanitizeTrackingLinks(
    `[href*=".awstrack.me/"]`,
    /^.+?\.awstrack\.me\/.+?\//,
    /\?.*/
  );

  const ICYMILocator = contains("h3 > strong", "ICYMI")[0];
  if (!ICYMILocator) return; // 🛑
  const ICYMIHeader = grandParent(ICYMILocator, 5);
  const ICYMIContent = next(ICYMIHeader);
  linksDiv.append(ICYMIHeader, ICYMIContent);
}

function redditHandler() {
  // all links
  sanitizeTrackingLinks(
    `[href^="https://click.redditmail.com/"]`,
    "https://click.redditmail.com/CL0/",
    /\?%24deep_link=.*/
  );

  const tableEls = document.querySelectorAll(
    `[width="600px"], [style*="width:600px"]`
  );
  tableEls.forEach((tableEl) => {
    tableEl.classList.add("fixedCSS");
    style(tableEl, `width: unset !important;`);
  });

  const locatorEl = document.querySelector(`[href*="/comments/"]`);
  const flexParentEl = grandParent(locatorEl, 16);
  style(
    flexParentEl,
    `
      display: flex;
      flex-wrap: wrap;
    `
  );
  for (childEl of flexParentEl.children) {
    style(childEl, `width: 45%;`);
    if (!childEl.querySelector('[href*="/comments/"]')) {
      childEl.remove();
    }
  }
}

function recomendoHandler() {
  const rootEl = document.querySelector('div[class=""]>[jslog]');
  rootEl.classList.add("fixedCSS");

  const headersContainerEl = generateElements(`<div></div>`, rootEl);
  style(
    headersContainerEl,
    `
    position: fixed;
    top: 150px;
    max-width: 300px;
  `
  );

  rootEl.querySelectorAll(`h3`).forEach((headerEl) => {
    const duplicateHeaderEl = headerEl.cloneNode(true);
    duplicateHeaderEl.addEventListener("click", () => {
      headerEl.scrollIntoView({ behavior: "smooth" });
    });
    headersContainerEl.append(duplicateHeaderEl);
    console.log(duplicateHeaderEl);
  });
}

function webToolsWeeklyHandler() {
  const [locatorEl] = contains("strong", "Learn More →");
  console.log(locatorEl);
}
