'use strict';
await waitFor('title');
await waitFor('video');
if (location.hash === '#allow-play') {
  addHistoryEntry(location.href.replace('#allow-play', ''));
  return;
}
if (location.hash === '#no-allow-play') {
  main();
  return;
}
const saidYes = confirm(
  `${document.title}\n'OK': start playing\n'Cancel': keep it paused.`,
);
if (saidYes) return;

main();

async function main() {
  const playBtnEl = await waitFor('.ytp-play-button');
  playBtnEl.click();
}
