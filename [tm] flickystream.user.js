(function () {
  'use strict';
  if (window.top != window.self) return; //don't run on frames or iframes

  // 1. Inject the CSS for the dropdown first
  const style = document.createElement('style');
  style.innerHTML = `
    .us-source-dropdown-container { margin-bottom: 15px; }
    .us-source-select {
        width: 100%;
        padding: 8px 12px;
        background-color: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        color: white;
        font-size: 14px;
        outline: none;
        cursor: pointer;
    }
    .us-source-select:hover { background-color: rgba(255, 255, 255, 0.1); }
    .us-source-select option { background-color: #1a1a1a; color: white; }
    .us-hidden-grid { display: none !important; }
`;
  document.head.appendChild(style);

  // 2. Define the conversion logic
  const convertToDropdown = gridElement => {
    // SECURITY CHECK: Ensure this grid belongs to "Video Sources"
    // We check the previous sibling for the header text "Video Sources"
    const headerSection = gridElement.previousElementSibling;
    const isVideoSourceSection =
      headerSection && headerSection.textContent.includes('Video Sources');

    // If this isn't the video sources grid, or if we already processed it, stop.
    if (!isVideoSourceSection || gridElement.classList.contains('us-processed'))
      return;

    // Create the Dropdown Wrapper
    const selectContainer = document.createElement('div');
    selectContainer.className = 'us-source-dropdown-container';

    const select = document.createElement('select');
    select.className = 'us-source-select';

    // Get all buttons within the grid
    const buttons = gridElement.querySelectorAll('button');

    buttons.forEach((btn, index) => {
      const option = document.createElement('option');
      option.value = index;

      // Extract name: The text usually lives in a span inside the button
      const labelSpan = btn.querySelector('span.font-medium');
      option.text = labelSpan
        ? labelSpan.textContent.trim()
        : btn.textContent.trim();

      // Check active state: Look for "Active" text or checkmark SVG
      const isActive =
        btn.innerHTML.includes('Active') ||
        (labelSpan &&
          getComputedStyle(labelSpan).color !== 'rgb(255, 255, 255)'); // Heuristic for accent color

      if (isActive) option.selected = true;

      select.appendChild(option);
    });

    // Add Change Listener
    select.addEventListener('change', e => {
      const btnIndex = e.target.value;
      if (buttons[btnIndex]) {
        buttons[btnIndex].click();
      }
    });

    // Insert Dropdown and Hide Grid
    selectContainer.appendChild(select);
    gridElement.parentNode.insertBefore(selectContainer, gridElement);

    gridElement.classList.add('us-hidden-grid', 'us-processed');
  };

  // 3. Call your function
  // We target '.grid' because it's a structural class, not a random hash.
  // We add 'grid-cols-2' to be more specific.
  waitForEach('.grid.grid-cols-2', convertToDropdown);
})();
