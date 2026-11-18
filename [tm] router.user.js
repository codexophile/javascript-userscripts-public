'use strict';
return;

/**
 * Pages that should NOT be remembered as a "return target":
 * the login page and the post-login home page.
 * Adjust these to match your router's actual filenames.
 * @type {string[]}
 */
const IGNORED_PATHS = ['/', '/index.asp', '/login.asp', '/home.asp'];

/**
 * Key under which the requested path is stored between page loads.
 * @type {string}
 */
const STORE_KEY = 'returnTarget';

/**
 * Remembers the requested path when the user lands on a normal page,
 * and restores it when the user arrives at the home page after login.
 * @returns {void}
 */
function handleReturnTarget() {
  const path = location.pathname + location.search;
  const saved = GM_getValue(STORE_KEY, null);

  if (IGNORED_PATHS.includes(location.pathname)) {
    // Landed on login/home: if a target was saved, go there now (only once logged in).
    if (saved && location.pathname !== '/login.asp') {
      GM_deleteValue(STORE_KEY);
      location.replace(saved);
    }
    return;
  }

  GM_setValue(STORE_KEY, path);
}

handleReturnTarget();
