(async function () {
  'use strict';

  const collapsible = await Collapsible();
  const fileManagementSystemPopupEl = collapsible.addPopup();
  const fileManagementSystemBtnEl = collapsible.addButton(
    '',
    fileManagementSystemPopupEl,
  );
  generateElements(
    `<img src="https://www.voidtools.com/favicon.ico" />`,
    fileManagementSystemBtnEl,
  );
  const lookupUserIdBtnEl = generateElements(
    `<button id="lookupUserIdBtn">User</button>`,
    fileManagementSystemPopupEl,
  );
  const lookupPostIdBtnEl = generateElements(
    `<button id="lookupPostIdBtn">Post</button>`,
    fileManagementSystemPopupEl,
  );
})();
