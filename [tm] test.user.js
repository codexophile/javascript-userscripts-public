// http://www.blankwebsite.com
// https://example.com

( async function () {
  'use strict';

  // Request a file handle
  const handle = await window.showSaveFilePicker();
  const writable = await handle.createWritable();
  await writable.write( 'Hello, world!' );
  await writable.close();

} )();
