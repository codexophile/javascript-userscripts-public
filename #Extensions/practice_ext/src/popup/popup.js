const title = document.getElementById("title");
const settingsBtn = document.querySelector("button");
const manifest = chrome.runtime.getManifest();

title.textContent = `${manifest.name} (${manifest.version})`;

settingsBtn.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});
