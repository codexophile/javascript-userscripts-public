(function () {
  'use strict';

  const dialogContentEl = generateElements(
    '<div class="dialog-content">This is a dialog content.</div>',
  );
  dialog('title', dialogContentEl);
})();
