(function () {
  'use strict';
  document.querySelectorAll(`.urlextern`).forEach(externLinkEl => {
    externLinkEl.setAttribute('target', '_blank');
  });
  document.querySelectorAll(`div.li`).forEach(divLiEl => {
    console.log(divLiEl);
    if (!/(\[|\()v2(\]|\))/i.test(divLiEl.textContent)) return;
    style(
      divLiEl,
      `
      outline: 1px solid #0f722d;
      background-color: #121912;
      padding: 5px;
      margin: 5px;
    `,
    );
  });
})();
