'use strict';

let permissionGranted = false;

document.addEventListener('keydown', event => {
  if (event.key === 'k') {
    console.log('Allowing play');
    permissionGranted = true;
    // mainVidEl.play();
  }
});

await waitFor('title');
const mainVidEl = await waitFor('video');

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
  mainVidEl.addEventListener('play', event => {
    pause();
  });
  mainVidEl.addEventListener('playing', event => {
    pause();
  });
  waitForEach('.sb-tile', tileEl => {
    tileEl.addEventListener('click', event => {
      permissionGranted = true;
    });
  });
}

function pause() {
  if (permissionGranted) return;
  console.log('Play attempt blocked');
  mainVidEl.pause();
}
