(function () {
  ('use strict');
  if (window.top != window.self) return; //don't run on frames or iframes

  // 1. helper to get URL params
  function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      prompt: params.get('prompt'),
      run: params.get('run'),
      model: params.get('model'), // experimental
    };
  }

  // 2. Function to simulate typing into the specific AI Studio text area
  function fillPrompt(text) {
    // AI Studio usually uses a standard textarea or a contenteditable div
    // We look for the main prompt input. This selector targets the main chat input area.
    const inputField =
      document.querySelector('textarea') ||
      document.querySelector('[contenteditable="true"]');

    if (inputField) {
      // Focus the field
      inputField.focus();

      // Set the value (for textarea)
      inputField.value = text;

      // For contenteditable (fallback)
      if (inputField.tagName !== 'TEXTAREA') {
        inputField.innerText = text;
      }

      // IMPORTANT: Trigger input events so React/Angular detects the change
      inputField.dispatchEvent(new Event('input', { bubbles: true }));
      inputField.dispatchEvent(new Event('change', { bubbles: true }));

      return true;
    }
    return false;
  }

  // 3. Function to click the "Run" button
  function triggerRun() {
    // Look for the run button based on common attributes or icon
    // Usually contains text "Run" or has a specific play icon
    const buttons = Array.from(document.querySelectorAll('button'));
    const runBtn = buttons.find(
      b =>
        b.innerText.includes('Run') ||
        b.getAttribute('aria-label')?.includes('Run') ||
        b.querySelector('.fa-play') // sometimes icons are used
    );

    if (runBtn) {
      runBtn.click();
    } else {
      // Fallback: Simulate Ctrl+Enter on the input field
      const inputField = document.querySelector('textarea');
      if (inputField) {
        inputField.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            ctrlKey: true,
            bubbles: true,
          })
        );
      }
    }
  }

  // 4. Main logic loop
  let retries = 0;
  const maxRetries = 20; // Try for ~10 seconds

  const init = setInterval(() => {
    const { prompt, run } = getUrlParams();

    // If no prompt param, stop script immediately
    if (!prompt) {
      clearInterval(init);
      return;
    }

    // Try to find and fill the input
    if (fillPrompt(prompt)) {
      console.log('AI Studio Prompter: Prompt filled.');

      // Clean the URL so it doesn't re-fill on refresh
      const newUrl =
        window.location.protocol +
        '//' +
        window.location.host +
        window.location.pathname;
      window.history.replaceState({ path: newUrl }, '', newUrl);

      // If auto-run is requested
      if (run === 'true') {
        setTimeout(() => {
          triggerRun();
          console.log('AI Studio Prompter: Run triggered.');
        }, 500); // Small delay to ensure text is registered
      }

      clearInterval(init);
    } else {
      retries++;
      if (retries > maxRetries) {
        console.log('AI Studio Prompter: Could not find input field.');
        clearInterval(init);
      }
    }
  }, 500); // Check every 500ms
})();
