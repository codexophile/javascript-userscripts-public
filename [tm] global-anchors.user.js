(async () => {
  //* press xbutton on anchor to save the link to browser history

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
    `<input type="checkbox" id="myUniqueCheckbox" class="my-custom-checkbox" checked>`,
  );
  collapsibleEl.addElement(checkboxEl);

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

  const setColor = (el, color) => {
    el.style.color = color;
    el.querySelectorAll('*').forEach(item => (item.style.color = color));
  };

  const handleDrag = e => {
    if (!isEnabled()) return;
    const color = e.offsetX <= 0 && e.offsetY <= 0 ? 'orange' : 'green';
    setColor(e.currentTarget, color);
  };

  const handleDragEnd = e => {
    if (!isEnabled()) return;
    const anchor = e.currentTarget;
    if (e.offsetX > 0 || e.offsetY > 0) {
      location.href = anchor.href;
    } else {
      setColor(anchor, '');
    }
  };

  const setupAnchor = anchor => {
    anchor.addEventListener('drag', handleDrag);
    anchor.addEventListener('dragend', handleDragEnd);
  };

  function isEnabled() {
    const checkboxEl = document.querySelector(`#myUniqueCheckbox`);
    return checkboxEl.checked;
  }

  waitForEach('a', setupAnchor);
})();
