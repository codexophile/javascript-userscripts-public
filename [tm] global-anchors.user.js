(async () => {
  //* press xbutton on anchor to save the link to browser history

  /**
   * Runtime settings for anchor dragging.
   *
   * @type {{enabled: boolean, radialMenuEnabled: boolean, menuRadius: number}}
   */
  const settings = {
    enabled: true,
    radialMenuEnabled: true,
    menuRadius: 88,
  };

  /**
   * Tracks the anchor and cursor position for the current drag operation.
   *
   * @type {{anchor: HTMLAnchorElement, x: number, y: number, startX: number, startY: number, action: string}|null}
   */
  let activeDrag = null;
  let radialMenuEl = null;

  document.addEventListener('auxclick', function (event) {
    // SETTINGS:
    // Set this to 3 for the "Back" button
    // Set this to 4 for the "Forward" button
    const triggerButton = 4;

    if (event.button === triggerButton) {
      const link = event.target.closest('a');
      if (link && link.href) {
        event.preventDefault();
        history.pushState(null, '', link.href);
      }
    }
  });

  //*
  ('use strict');

  const collapsibleEl = await Collapsible();
  const checkboxEl = generateElements(
    `<label>Enable anchor dragging <input type="checkbox" id="myUniqueCheckbox" class="my-custom-checkbox"></label>`,
  );
  const enabledInputEl = checkboxEl.querySelector('input');
  enabledInputEl.checked = settings.enabled;
  collapsibleEl.addElement(checkboxEl);
  const radialMenuCheckboxEl = generateElements(
    `<label>Show radial drag menu <input type="checkbox" id="anchorRadialMenuCheckbox" class="my-custom-checkbox"></label>`,
  );
  const radialMenuInputEl = radialMenuCheckboxEl.querySelector('input');
  radialMenuInputEl.checked = settings.radialMenuEnabled;
  collapsibleEl.addElement(radialMenuCheckboxEl);
  const radiusEl = generateElements(
    `<label>Menu radius <input type="range" id="anchorRadialMenuRadius" min="60" max="140" step="4"></label>`,
  );
  const radiusInputEl = radiusEl.querySelector('input');
  radiusInputEl.value = String(settings.menuRadius);
  collapsibleEl.addElement(radiusEl);
  const temp = generateElements(
    `<span id="anchorRadialMenuRadiusValue">${settings.menuRadius}px</span>`,
    collapsibleEl.collapsibleContent,
  );

  enabledInputEl.addEventListener('change', () => {
    settings.enabled = enabledInputEl.checked;
    if (!settings.enabled) hideRadialMenu();
  });
  radialMenuInputEl.addEventListener('change', () => {
    settings.radialMenuEnabled = radialMenuInputEl.checked;
    if (!settings.radialMenuEnabled) hideRadialMenu();
  });
  radiusInputEl.addEventListener('input', () => {
    settings.menuRadius = Number(radiusInputEl.value);
    document.querySelector('#anchorRadialMenuRadiusValue').textContent =
      `${settings.menuRadius}px`;
    if (radialMenuEl)
      updateRadialMenuPosition(activeDrag?.startX, activeDrag?.startY);
  });

  GM_addStyle(`
  /* Apply to a specific class to avoid affecting all checkboxes */
.my-custom-checkbox {
  -webkit-appearance: none; /* For Chrome, Safari, Opera */
  appearance: none;         /* Standard property */

  /* Set the base size for the input itself, which will act as the container */
  /* This should be slightly larger than your ::before box to contain its border */
  width: 19px;   /* 15px (box) + 2*2px (border) */
  height: 19px;  /* 15px (box) + 2*2px (border) */

  position: relative; /* Crucial for positioning ::before and ::after */
  cursor: pointer;    /* Indicate it's clickable */
  margin: 0;          /* Remove default input margins if any */
  display: inline-block; /* Allows width/height to be set */
  vertical-align: middle; /* Helps align with surrounding text if any */
  box-sizing: border-box; /* Ensure padding/border are included in width/height */
}

/* Custom Box (::before pseudo-element) */
.my-custom-checkbox::before {
  content: ""; /* Required for pseudo-elements */
  display: block; /* Make it a block element to have dimensions */
  width: 15px;
  height: 15px;
  border-radius: 5px;
  border: 2px solid #8cad2d;
  background-color: #fff;

  position: absolute; /* Position within the checkbox input */
  top: 0;
  left: 0;
  box-sizing: border-box; /* Include border in its dimensions */
  transition: background-color 0.2s, border-color 0.2s, box-shadow 0.2s;
}

/* Checkmark (::after pseudo-element) */
.my-custom-checkbox::after {
  content: ""; /* Required for pseudo-elements */
  display: block;
  width: 5px;   /* Width of the checkmark */
  height: 10px; /* Height of the checkmark */
  border: solid #fff; /* Solid white border for the checkmark lines */
  border-width: 0 2px 2px 0; /* Only right and bottom borders for the checkmark shape */

  position: absolute; /* Position within the checkbox input */
  top: 2px;   /* Adjust top/left to center the checkmark */
  left: 6px; /* Adjust top/left to center the checkmark */

  transform: rotate(45deg) scale(0); /* Rotate for checkmark shape, scale 0 to hide initially */
  opacity: 0; /* Hide initially */
  transition: transform 0.2s ease-out, opacity 0.2s ease-out; /* Smooth animation */
}

/* Checked State Styles */
.my-custom-checkbox:checked::before {
  box-shadow: inset 0px 0px 0px 3px #fff; /* White inner shadow */
  background-color: #8cad2d;             /* Filled background */
  border-color: #8cad2d;                 /* Border color matches background */
}

.my-custom-checkbox:checked::after {
  transform: rotate(45deg) scale(1); /* Show and scale up the checkmark */
  opacity: 1; /* Make checkmark visible */
}

/* Optional: Focus Styles for Accessibility */
.my-custom-checkbox:focus::before {
  outline: 2px solid #8cad2d; /* Or a different focus indicator */
  outline-offset: 2px;
}
    `);

  GM_addStyle(`
    .anchor-radial-menu {
      position: fixed;
      z-index: 2147483647;
      width: 0;
      height: 0;
      pointer-events: none;
      user-select: none;
      font: 600 12px/1.2 system-ui, sans-serif;
    }

    .anchor-radial-menu__section {
      position: absolute;
      width: 112px;
      min-height: 42px;
      padding: 8px;
      box-sizing: border-box;
      transform: translate(-50%, -50%);
      border: 1px solid #fff8;
      border-radius: 999px;
      color: #fff;
      background: #222e;
      text-align: center;
      box-shadow: 0 2px 12px #0008;
      transition: background-color .12s, transform .12s;
    }

    .anchor-radial-menu__section[data-action="new-tab"] {
      transform: translate(-50%, -50%) translateY(calc(var(--menu-radius) * -1));
    }

    .anchor-radial-menu__section[data-action="same-tab"] {
      transform: translate(-50%, -50%) translateY(var(--menu-radius));
    }

    .anchor-radial-menu__section[data-action="cancel"] {
      background: #532e;
    }

    .anchor-radial-menu__section.is-active {
      transform: translate(-50%, -50%) scale(1.12);
      background: #1677dacc;
    }

    .anchor-radial-menu__section[data-action="new-tab"].is-active {
      transform: translate(-50%, -50%) translateY(calc(var(--menu-radius) * -1)) scale(1.12);
    }

    .anchor-radial-menu__section[data-action="same-tab"].is-active {
      transform: translate(-50%, -50%) translateY(var(--menu-radius)) scale(1.12);
    }
  `);

  /**
   * Creates the radial menu used while dragging an anchor.
   *
   * @returns {HTMLElement} The menu element.
   * @example
   * ```js
   * const menu = createRadialMenu();
   * ```
   */
  function createRadialMenu() {
    console.log('444');
    const menu = generateElements(
      `<div class="anchor-radial-menu" role="menu" aria-label="Link drag actions">
        <div class="anchor-radial-menu__section" data-action="new-tab" role="menuitem">Open in new tab<br>(up)</div>
        <div class="anchor-radial-menu__section" data-action="same-tab" role="menuitem">Open on same tab<br>(down)</div>
        <div class="anchor-radial-menu__section" data-action="cancel" role="menuitem">Cancel</div>
      </div>`,
      document.body,
    );
    console.log('444', menu);
    menu.style.setProperty('--menu-radius', `${settings.menuRadius}px`);
    return menu;
  }

  /**
   * Positions the radial menu at the cursor while keeping it in the viewport.
   *
   * @param {number} x - Cursor X coordinate.
   * @param {number} y - Cursor Y coordinate.
   * @returns {void}
   * @example
   * ```js
   * updateRadialMenuPosition(event.clientX, event.clientY);
   * ```
   */
  function updateRadialMenuPosition(x, y) {
    if (!radialMenuEl || !Number.isFinite(x) || !Number.isFinite(y)) return;
    radialMenuEl.style.left = `${Math.max(settings.menuRadius + 64, Math.min(x, innerWidth - settings.menuRadius - 64))}px`;
    radialMenuEl.style.top = `${Math.max(settings.menuRadius + 32, Math.min(y, innerHeight - settings.menuRadius - 32))}px`;
    radialMenuEl.style.setProperty('--menu-radius', `${settings.menuRadius}px`);
  }

  /**
   * Updates the highlighted section based on the cursor's vertical position.
   *
   * @param {number} x - Cursor X coordinate.
   * @param {number} y - Cursor Y coordinate.
   * @returns {void}
   */
  function updateRadialMenuSelection(x, y) {
    if (!radialMenuEl || !activeDrag) return;
    const deltaY = y - activeDrag.startY;
    const deltaX = x - activeDrag.startX;
    let action =
      Math.abs(deltaY) < settings.menuRadius / 2
        ? 'cancel'
        : deltaY < 0
          ? 'new-tab'
          : 'same-tab';
    if (Math.abs(deltaX) > settings.menuRadius * 1.5) action = 'cancel';
    activeDrag.action = action;
    radialMenuEl.querySelectorAll('[data-action]').forEach(section => {
      section.classList.toggle('is-active', section.dataset.action === action);
    });
    activeDrag.x = x;
    activeDrag.y = y;
  }

  /**
   * Removes the radial menu and clears the active drag state.
   *
   * @returns {void}
   */
  function hideRadialMenu() {
    radialMenuEl?.remove();
    radialMenuEl = null;
    activeDrag = null;
  }

  /**
   * Shows the menu when an anchor drag begins.
   *
   * @param {DragEvent} event - The drag-start event.
   * @returns {void}
   */
  function handleDragStart(event) {
    if (!isEnabled() || !settings.radialMenuEnabled) return;
    const anchor =
      event.target instanceof Element ? event.target.closest('a') : null;
    if (!anchor || !anchor.href) return;
    const rect = anchor.getBoundingClientRect();
    activeDrag = {
      anchor,
      x: event.clientX || rect.left + rect.width / 2,
      y: event.clientY || rect.top + rect.height / 2,
      startX: event.clientX || rect.left + rect.width / 2,
      startY: event.clientY || rect.top + rect.height / 2,
      action: 'cancel',
    };
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'link';
    radialMenuEl = createRadialMenu();
    updateRadialMenuPosition(activeDrag.x, activeDrag.y);
    updateRadialMenuSelection(activeDrag.x, activeDrag.y);
  }

  /**
   * Refreshes the menu selection while the browser reports drag movement.
   *
   * @param {DragEvent} event - The drag event.
   * @returns {void}
   */
  function handleDrag(event) {
    if (!activeDrag || !radialMenuEl) return;
    const x = event.clientX || activeDrag.x;
    const y = event.clientY || activeDrag.y;
    updateRadialMenuSelection(x, y);
  }

  /**
   * Opens the dragged anchor according to the selected radial-menu section.
   *
   * @param {DragEvent} event - The drag-end event.
   * @returns {void}
   */
  function handleDragEnd(event) {
    if (!activeDrag || !radialMenuEl) return;
    if (event.clientX || event.clientY) {
      updateRadialMenuSelection(event.clientX, event.clientY);
    }
    const { anchor } = activeDrag;
    const action = activeDrag.action;
    hideRadialMenu();
    if (action === 'new-tab') window.open(anchor.href, '_blank', 'noopener');
    if (action === 'same-tab') location.href = anchor.href;
  }

  /**
   * Registers radial-menu drag handlers for one anchor.
   *
   * @param {HTMLAnchorElement} anchor - Anchor to enhance.
   * @returns {void}
   */
  function setupAnchor(anchor) {
    anchor.draggable = true;
  }

  /**
   * Returns whether the script's main setting is enabled.
   *
   * @returns {boolean} Whether anchor drag actions are enabled.
   */
  function isEnabled() {
    const checkboxEl = document.querySelector(`#myUniqueCheckbox`);
    return checkboxEl?.checked === true;
  }

  document.addEventListener('dragstart', handleDragStart, true);
  document.addEventListener('drag', handleDrag, true);
  document.addEventListener('dragend', handleDragEnd, true);
  waitForEach('a', setupAnchor);
})();
