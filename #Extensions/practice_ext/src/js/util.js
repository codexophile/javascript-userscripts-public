const i18n = document.querySelectorAll("[data-intl]");
i18n.forEach(msg => {
  msg.innerHTML = chrome.i18n.getMessage(msg.dataset.intl);
});

chrome.i18n.getAcceptLanguages(languages => {
  document.documentElement.lang = languages[0];
});