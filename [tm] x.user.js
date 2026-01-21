(function () {
  'use strict';

  //* Automatically clicking 'New post notifications for ' item
  const notifQuery = '[data-testid="notification"]';
  waitForEach(notifQuery, notifEl => {
    if (!location.href.includes('#notif')) return;
    if (notifEl.textContent.includes('New post notifications for ')) {
      notifEl.click();
    }
  });

  //* video download buttons
  // Add this to your userscript (assuming handleDownload is defined elsewhere)

  waitForEach('div[data-testid="videoPlayer"]', playerContainer => {
    // 3. Create the Download Button
    const btn = document.createElement('div');
    btn.className = 'x-dl-btn';
    btn.title = 'Download Video';

    // Using an SVG icon for a cleaner look that matches Twitter's UI
    btn.innerHTML = `
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="color: white;">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
    `;

    // 4. Style the button to look like a native overlay
    Object.assign(btn.style, {
      position: 'absolute',
      top: '12px',
      left: '12px',
      zIndex: '9999',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '32px',
      height: '32px',
      borderRadius: '9999px',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(4px)', // Gives it that "glass" effect Twitter uses
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
    });

    // 5. Add Hover Effects
    btn.onmouseenter = () => (btn.style.backgroundColor = 'rgba(0, 0, 0, 0.8)');
    btn.onmouseleave = () => (btn.style.backgroundColor = 'rgba(0, 0, 0, 0.6)');

    // 6. Handle Click
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();

      const article = playerContainer.closest('article[data-testid="tweet"]');
      const linkAnchor = article?.querySelector('time')?.closest('a');

      if (linkAnchor) {
        const tweetUrl = linkAnchor.href;
        console.log('Downloading from:', tweetUrl);
      } else {
        alert('Could not find Tweet URL');
      }
    });

    // 7. Append to the player container
    playerContainer.appendChild(btn);
  });

  function handleDownload(videoElement) {}
})();
