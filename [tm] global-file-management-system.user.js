(async function () {
  'use strict';

  const collapsible = await Collapsible();
  const fmsPopoverEl = collapsible.addPopup('fms-popover');
  const fmsBtnEl = collapsible.addButton('', fmsPopoverEl);
  generateElements(
    `<img src="https://www.voidtools.com/favicon.ico" />`,
    fmsBtnEl,
  );
  const lookupUserIdBtnEl = generateElements(
    `<button id="lookupUserIdBtn">User</button>`,
    fmsPopoverEl,
  );
  const lookupPostIdBtnEl = generateElements(
    `<button id="lookupPostIdBtn">Post</button>`,
    fmsPopoverEl,
  );
})();
