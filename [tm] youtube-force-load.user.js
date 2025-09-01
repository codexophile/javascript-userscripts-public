(function () {
  ('use strict');
  if (window.top != window.self) return;

  function handleLinkClick(event) {
    let target = event.target;
    while (target && target.tagName !== 'A') {
      target = target.parentNode;
    }

    if (target && target.href && target.href !== window.location.href) {
      event.preventDefault();
      event.stopImmediatePropagation();

      window.location.href = target.href;
    }
  }

  document.documentElement.addEventListener('click', handleLinkClick, true);
})();
