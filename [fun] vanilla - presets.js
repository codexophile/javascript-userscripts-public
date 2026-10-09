async function Collapsible(togglerText = 'Toggle', options = {}) {
  await waitFor('body');

  //* Methods for adding elements and handling popups
  function addButton(text, popoverEl = null, onclick) {
    const button = generateElements(`<button></button>`);
    button.className = 'collapsible-button button-like';
    button.textContent = text;
    collapsibleContent.appendChild(button);

    if (onclick) {
      button.addEventListener('click', onclick);
    }

    if (popoverEl) {
      if (!popoverEl.id) {
        console.log('Popover error: ', { button, popoverEl });
        alert(
          'Popover element must have an ID before being passed to addButton.',
        );
      }
      button.setAttribute('popovertarget', popoverEl.id);
    }

    return button;
  }

  function addPopup(id) {
    const popoverEl = generateElements(`<div></div>`, collapsibleContent);
    popoverEl.className = 'collapsible-popover';
    popoverEl.setAttribute('popover', '');
    popoverEl.id = id;
    popoverEl.style = `
    padding: 1rem;
    border-radius: 4px;
    position-area: top span-right;
    background-color: darkgray;
    `;

    if (document.querySelectorAll(`#cdx-collapsible-styles`).length === 0) {
      const styleEl = GM_addStyle(`
        .collapsible-container {
          .collapsible-popover > * {
            margin: 5px;
            }
            }
            `);
      styleEl.id = 'cdx-collapsible-styles';
    }

    return popoverEl;
  }

  function addElement(element) {
    collapsibleContent.appendChild(element);
    return element;
  }

  let collapsibleContent;

  //* check if it's already on the page
  const alreadyOnPage = document.querySelector(`.collapsible-container`);
  if (alreadyOnPage) {
    const collapsibleStructure = alreadyOnPage;
    const collapsibleToggler = alreadyOnPage.querySelector(
      '.collapsible-toggler',
    );
    collapsibleContent = alreadyOnPage.querySelector('.collapsible-content');
    return {
      collapsibleStructure,
      collapsibleToggler,
      collapsibleContent,
      addButton,
      addElement,
      addPopup,
    };
  }

  const {
    bottom = '0px',
    left = '0px',
    backgroundColor = '#1e1e1e', // Darker background
    hoverColor = '#2c2c2c', // Darker hover
    textColor = '#e0e0e0', // Light gray text
    contentBgColor = '#2d2d2d', // Dark gray content background
    fontSize = '14px',
    borderRadius = '5px',
    boxShadow = '0 2px 5px rgba(0,0,0,0.95)', // Darker shadow
    transition = 'all 0.3s ease-out',
    width = '300px',
    height = '',
    collapsedWidth = '30px',
    popupHeight = '150px',
    buttonSize = '30px',
  } = options;

  const css = `
        .collapsible-container {
            font-family: Arial, sans-serif;
            position: fixed;
            bottom: ${bottom};
            left: ${left};
            display: flex;
            border-radius: ${borderRadius};
            box-shadow: ${boxShadow};
            transition: ${transition};
            width: ${collapsedWidth};
            min-width: ${collapsedWidth};
            height: ${height};
            z-index: 10000;
            resize: both;
            border: 1px solid #404040; // Added border for better definition
        }
        .collapsible-container.expanded {
            width: ${width};
            overflow: visible;
        }
        .collapsible-container:not(.expanded) {
          width: ${collapsedWidth} !important;
          min-width: ${collapsedWidth};
          overflow: hidden;
        }
        .collapsible-toggler {
            writing-mode: vertical-rl;
            text-orientation: mixed;
            transform: rotate(180deg);
            background-color: ${backgroundColor};
            color: ${textColor};
            cursor: var(--dialog-header-cursor, move);
            padding: 15px 5px;
            border: none;
            outline: none;
            font-size: ${fontSize};
            transition: background-color 0.2s;
            display: flex;
            justify-content: center;
            align-items: center;
            min-width: ${collapsedWidth};
            user-select: none;
        }
        .collapsible-toggler:hover {
            background-color: ${hoverColor};
        }
        .collapsible-content {
            flex-grow: 1;
            overflow: auto;
            transition: ${transition};
            background-color: ${contentBgColor};
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            align-content: flex-start;
            padding: 3px;
            box-sizing: border-box;
        }
        .collapsible-container:not(.expanded) .collapsible-content,
        .collapsible-container:not(.expanded) .resize-handle {
          display: none;
        }
        .collapsible-content > * {
            margin: 3px;
        }
        .collapsible-content > .button-like {
            /* background-color: ${backgroundColor}; */
            color: ${textColor};
            width: ${buttonSize};
            height: ${buttonSize};
            border: none;
            cursor: pointer;
            border-radius: 3px;
            transition: background-color 0.2s;
            position: relative;
        }
        .button-like > * {
          width: inherit;
        }
        .collapsible-button:hover {
            /*background-color: ${hoverColor}; */
        }
        .collapsible-container .popup {
            display: none;
            position: absolute;
            left: 0px;
            min-width: 150px;
            height: ${popupHeight};
            top: -${popupHeight};
            background-color: ${backgroundColor};
            border: 1px solid #404040;
            border-radius: 4px;
            padding: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 1001;
            overflow: auto;
            text-wrap: nowrap;
            color: ${textColor};
        }
        .collapsible-container .popup.visible {
            display: block;
        }
        .collapsible-container .resize-handle {
            position: absolute;
            width: 10px;
            height: 10px;
            background-color: #404040;
            right: 0;
            bottom: 0;
            cursor: se-resize;
        }
        
        /* Scrollbar styling for dark mode */
        .collapsible-content::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        .collapsible-content::-webkit-scrollbar-track {
            background: ${backgroundColor};
        }
        .collapsible-content::-webkit-scrollbar-thumb {
            background: #505050;
            border-radius: 4px;
        }
        .collapsible-content::-webkit-scrollbar-thumb:hover {
            background: #606060;
        }
    `;

  if (GM_addStyle) {
    GM_addStyle(css);
  } else {
    alert(
      'GM_addStyle is not available. Please ensure you are using a compatible userscript manager.',
    );
  }

  const collapsibleStructure = generateElements(
    `
    <div>
      <button class="collapsible-toggler">${togglerText}</button>
      <div class="collapsible-content"></div>
      <div class="resize-handle"></div>
    </div>
  `,
    document.body,
  );
  collapsibleStructure.className = 'collapsible-container';

  collapsibleContent = collapsibleStructure.querySelector(
    '.collapsible-content',
  );
  const collapsibleToggler = collapsibleStructure.querySelector(
    '.collapsible-toggler',
  );
  const resizeHandle = collapsibleStructure.querySelector('.resize-handle');

  let isExpanded = false;
  let expandedWidth = width;

  collapsibleToggler.addEventListener('click', function (e) {
    e.stopPropagation();
    isExpanded = !isExpanded;
    if (isExpanded) {
      collapsibleStructure.style.width = expandedWidth;
      collapsibleStructure.classList.add('expanded');
    } else {
      expandedWidth = collapsibleStructure.style.width;
      collapsibleStructure.style.width = collapsedWidth;
      collapsibleStructure.classList.remove('expanded');
    }
  });

  // Draggable and resizable functionality
  let isDragging = false;
  let isResizing = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;

  collapsibleToggler.addEventListener('mousedown', dragStart);
  resizeHandle.addEventListener('mousedown', resizeStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);

  function dragStart(e) {
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
    isDragging = true;
  }

  function resizeStart(e) {
    e.stopPropagation();
    isResizing = true;
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
      xOffset = currentX;
      yOffset = currentY;
      setTranslate(currentX, currentY, collapsibleStructure);
    }

    if (isResizing) {
      e.preventDefault();
      const newWidth =
        e.clientX - collapsibleStructure.getBoundingClientRect().left;
      const newHeight =
        e.clientY - collapsibleStructure.getBoundingClientRect().top;
      collapsibleStructure.style.width = `${newWidth}px`;
      collapsibleStructure.style.height = `${newHeight}px`;
      if (isExpanded) {
        expandedWidth = `${newWidth}px`;
      }
    }
  }

  function dragEnd(e) {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
    isResizing = false;
  }

  function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
  }

  return {
    collapsibleStructure,
    collapsibleToggler,
    collapsibleContent,
    addButton,
    addElement,
    addPopup,
  };
}

/**
 * @typedef {Object} DialogDimensions
 * @property {string} [width='min(360px, calc(100vw - 32px))'] Dialog width.
 * @property {string} [minWidth] Minimum dialog width.
 * @property {string} [maxWidth] Maximum dialog width.
 * @property {string} [height] Dialog height.
 * @property {string} [maxHeight='300px'] Maximum scrollable body height.
 */

/**
 * @typedef {Object} DialogPosition
 * @property {string} [top='100px'] Distance from the top of the viewport.
 * @property {string} [right='50px'] Distance from the right of the viewport.
 * @property {string} [bottom] Distance from the bottom of the viewport.
 * @property {string} [left] Distance from the left of the viewport.
 */

/**
 * @typedef {Object} DialogConfig
 * @property {'expanded'|'collapsed'} [initialState='expanded'] Initial body state.
 * @property {DialogDimensions} [dimensions] Dialog dimensions.
 * @property {DialogPosition} [position] Dialog position.
 * @property {string} [maxHeight='300px'] Legacy alias for dimensions.maxHeight.
 * @property {string} [width] Legacy alias for dimensions.width.
 * @property {string} [minWidth] Legacy alias for dimensions.minWidth.
 * @property {string} [maxWidth] Legacy alias for dimensions.maxWidth.
 * @property {string} [height] Legacy alias for dimensions.height.
 * @property {string} [top] Legacy alias for position.top.
 * @property {string} [right] Legacy alias for position.right.
 * @property {string} [bottom] Legacy alias for position.bottom.
 * @property {string} [left] Legacy alias for position.left.
 * @property {string} [borderRadius='16px'] Dialog corner radius.
 * @property {string} [headerPadding] Header padding.
 * @property {string} [bodyPadding] Body padding.
 * @property {number|string} [zIndex=9999] Dialog stacking order.
 * @property {boolean} [draggable=true] Whether the header moves the dialog.
 */

/**
 * Creates a draggable, collapsible dialog.
 *
 * @param {string} [title=''] Dialog title.
 * @param {Node|string} contentElement Content appended to the dialog body.
 * @param {DialogConfig|string} [configOrMaxHeight={}] Dialog options, or a
 *   legacy max-height string.
 * @returns {HTMLDivElement} The created dialog container.
 */
function dialog(title = '', contentElement, configOrMaxHeight = {}) {
  const config =
    typeof configOrMaxHeight === 'string'
      ? { maxHeight: configOrMaxHeight }
      : configOrMaxHeight || {};
  const dimensions = config.dimensions || {};
  const position = config.position || {};
  const maxHeight = dimensions.maxHeight ?? config.maxHeight ?? '300px';
  const initialState = config.initialState === 'collapsed' ? 'collapsed' : 'expanded';
  const isDraggable = config.draggable !== false;

  if (!document.querySelector('#vanilla-presets-dialog-styles')) {
    const style = document.createElement('style');
    style.id = 'vanilla-presets-dialog-styles';
    style.textContent = `
      .vanilla-presets-dialog {
        --dialog-surface: color-mix(in srgb, Canvas 94%, transparent);
        --dialog-border: color-mix(in srgb, CanvasText 16%, transparent);
        --dialog-text: CanvasText;
        --dialog-muted: color-mix(in srgb, CanvasText 64%, transparent);
        position: fixed;
        top: var(--dialog-top, 100px);
        right: var(--dialog-right, 50px);
        bottom: var(--dialog-bottom, auto);
        left: var(--dialog-left, auto);
        z-index: 9999;
        width: var(--dialog-width, min(360px, calc(100vw - 32px)));
        min-width: var(--dialog-min-width, 0);
        max-width: var(--dialog-max-width, none);
        height: var(--dialog-height, auto);
        overflow: hidden;
        border: 1px solid var(--dialog-border);
        border-radius: var(--dialog-border-radius, 16px);
        background: var(--dialog-surface);
        color: var(--dialog-text);
        box-shadow: 0 20px 50px rgb(0 0 0 / 22%), 0 2px 10px rgb(0 0 0 / 10%);
        backdrop-filter: blur(16px);
        font: 14px/1.5 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        animation: vanilla-presets-dialog-in 180ms ease-out;
      }
      .vanilla-presets-dialog__header {
        display: flex;
        align-items: center;
        gap: 8px;
        min-height: 48px;
        padding: var(--dialog-header-padding, 8px 10px 8px 16px);
        border-bottom: 1px solid var(--dialog-border);
        background: color-mix(in srgb, CanvasText 5%, transparent);
        cursor: var(--dialog-header-cursor, move);
        user-select: none;
      }
      .vanilla-presets-dialog__title {
        flex: 1;
        min-width: 0;
        margin: 0;
        color: var(--dialog-text);
        font-size: 15px;
        font-weight: 650;
        letter-spacing: .01em;
        overflow-wrap: anywhere;
      }
      .vanilla-presets-dialog__button {
        display: inline-grid;
        width: 30px;
        height: 30px;
        flex: 0 0 30px;
        place-items: center;
        padding: 0;
        border: 0;
        border-radius: 8px;
        background: transparent;
        color: var(--dialog-muted);
        cursor: pointer;
        font: inherit;
        font-size: 20px;
        line-height: 1;
        transition: background-color 120ms ease, color 120ms ease, transform 120ms ease;
      }
      .vanilla-presets-dialog__button:hover,
      .vanilla-presets-dialog__button:focus-visible {
        background: color-mix(in srgb, CanvasText 12%, transparent);
        color: var(--dialog-text);
        outline: none;
      }
      .vanilla-presets-dialog__button:active {
        transform: scale(.92);
      }
      .vanilla-presets-dialog__body {
        padding: var(--dialog-body-padding, 16px);
        background: color-mix(in srgb, Canvas 98%, transparent);
        max-height: var(--dialog-max-height);
        overflow: auto;
        overscroll-behavior: contain;
      }
      @keyframes vanilla-presets-dialog-in {
        from { opacity: 0; transform: translateY(-8px) scale(.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @media (prefers-reduced-motion: reduce) {
        .vanilla-presets-dialog { animation: none; }
        .vanilla-presets-dialog__button { transition: none; }
      }
    `;
    document.head.appendChild(style);
  }

  const guiContainer = document.createElement('div');
  guiContainer.className = 'vanilla-presets-dialog';
  guiContainer.style.setProperty('--dialog-max-height', maxHeight);
  const styleProperties = {
    '--dialog-width': dimensions.width ?? config.width,
    '--dialog-min-width': dimensions.minWidth ?? config.minWidth,
    '--dialog-max-width': dimensions.maxWidth ?? config.maxWidth,
    '--dialog-height': dimensions.height ?? config.height,
    '--dialog-border-radius': config.borderRadius,
    '--dialog-header-padding': config.headerPadding,
    '--dialog-body-padding': config.bodyPadding,
    '--dialog-header-cursor': isDraggable ? 'move' : 'default',
    '--dialog-top': position.top ?? config.top,
    '--dialog-right': position.right ?? config.right,
    '--dialog-bottom': position.bottom ?? config.bottom,
    '--dialog-left': position.left ?? config.left,
  };
  Object.entries(styleProperties).forEach(([property, value]) => {
    if (value !== undefined && value !== null) {
      guiContainer.style.setProperty(property, value);
    }
  });
  if (config.zIndex !== undefined) {
    guiContainer.style.zIndex = config.zIndex;
  }

  const header = document.createElement('div');
  header.className = 'vanilla-presets-dialog__header';

  const titleElement = document.createElement('h2');
  titleElement.className = 'vanilla-presets-dialog__title';
  titleElement.textContent = title;
  header.appendChild(titleElement);

  const collapseBtn = document.createElement('button');
  collapseBtn.id = 'expand-btn';
  collapseBtn.className = 'vanilla-presets-dialog__button';
  collapseBtn.type = 'button';
  collapseBtn.setAttribute(
    'aria-label',
    initialState === 'expanded' ? 'Collapse dialog' : 'Expand dialog',
  );
  collapseBtn.setAttribute(
    'aria-expanded',
    String(initialState === 'expanded'),
  );
  collapseBtn.textContent = initialState === 'expanded' ? '−' : '+';
  collapseBtn.onclick = () => {
    if (body.style.display === 'none') {
      body.style.display = 'block';
      collapseBtn.textContent = '−';
      collapseBtn.setAttribute('aria-label', 'Collapse dialog');
      collapseBtn.setAttribute('aria-expanded', 'true');
    } else {
      body.style.display = 'none';
      collapseBtn.textContent = '+';
      collapseBtn.setAttribute('aria-label', 'Expand dialog');
      collapseBtn.setAttribute('aria-expanded', 'false');
    }
  };
  collapseBtn.title = 'Expand or collapse dialog';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'vanilla-presets-dialog__button';
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close dialog');
  closeBtn.textContent = '×';
  closeBtn.title = 'Close dialog';
  closeBtn.onclick = () => {
    guiContainer.remove();
  };

  header.appendChild(collapseBtn);
  header.appendChild(closeBtn);

  const body = document.createElement('div');
  body.className = 'vanilla-presets-dialog__body';
  body.style.display = initialState === 'expanded' ? 'block' : 'none';
  body.append(contentElement);

  guiContainer.appendChild(header);
  guiContainer.appendChild(body);

  document.body.appendChild(guiContainer);

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  if (isDraggable) {
    header.onmousedown = e => {
      isDragging = true;
      offsetX = e.clientX - guiContainer.getBoundingClientRect().left;
      offsetY = e.clientY - guiContainer.getBoundingClientRect().top;
    };

    document.onmousemove = e => {
      if (isDragging) {
        guiContainer.style.left = `${e.clientX - offsetX}px`;
        guiContainer.style.top = `${e.clientY - offsetY}px`;
      }
    };

    document.onmouseup = () => {
      isDragging = false;
    };
  }

  return guiContainer;
}

function addTooltip(tooltipParent, tooltipContent) {
  addStyle(/*css*/ `
        .tooltipParent {
            position: relative;
            display: inline-block;
            border-bottom: 1px dotted black;
        }

        .tooltipParent + .tooltip {
            visibility: hidden;
            width: 120px;
            background-color: #555;
            color: #fff;
            text-align: center;
            border-radius: 6px;
            padding: 5px 0;
            position: absolute;
            z-index: 1;
            bottom: 125%;
            left: 50%;
            margin-left: -60px;
            opacity: 0;
            transition: opacity 0.3s;
        }

        .tooltipParent + .tooltip::after {
            content: "";
            position: absolute;
            top: 100%;
            left: 50%;
            margin-left: -5px;
            border-width: 5px;
            border-style: solid;
            border-color: #555 transparent transparent transparent;
        }

        .tooltipParent:hover + .tooltip {
            visibility: visible;
            opacity: 1;
        }
    `);

  tooltipParent.classList.add('tooltipParent');
  const toolTipEl = generateElements('<span class=tooltip></span>', null, true);
  tooltipParent.after(toolTipEl);
  const wrapper = wrap('<div class=wrapper></div>', tooltipParent, toolTipEl);
  style(
    wrapper,
    `
        position: relative;
        width:    fit-content;
    `,
  );
  toolTipEl.append(tooltipContent);
  return toolTipEl;
}

function slideshowGallery() {
  GM_addStyle(`

        #slideShowGallery { display: ; }

        #slideShowGallery {
            font-family: Arial;
            margin: 0;
        }

        #slideShowGallery * {
            box-sizing: border-box;
        }

        #slideShowGallery img {
            vertical-align: middle;
        }

        /* Position the image container (needed to position the left and right arrows) */
        #slideShowGallery .container {
            position: relative;
        }

        /* Hide the images by default */
        #slideShowGallery .mySlides {
            display: none;
        }

        /* Add a pointer when hovering over the thumbnail images */
        #slideShowGallery .cursor {
            cursor: pointer;
        }

        /* Next & previous buttons */
        #slideShowGallery :is(.prev, .next) {
            cursor: pointer;
            position: absolute;
            top: 40%;
            width: auto;
            padding: 16px;
            margin-top: -50px;
            color: white;
            font-weight: bold;
            font-size: 20px;
            border-radius: 0 3px 3px 0;
            user-select: none;
            -webkit-user-select: none;
        }

        /* Position the "next button" to the right */
        #slideShowGallery .next {
            right: 0;
            border-radius: 3px 0 0 3px;
        }
        #slideShowGallery .prev {
            left: 0;
            border-radius: 3px 0 0 3px;
        }

        /* On hover, add a black background color with a little bit see-through */
        #slideShowGallery :is(.prev:hover, .next:hover) {
            background-color: rgba(0, 0, 0, 0.8);
        }

        /* Number text (1/3 etc) */
        #slideShowGallery .numbertext {
            color: #f2f2f2;
            font-size: 12px;
            padding: 8px 12px;
            position: absolute;
            top: 0;
        }

        /* Container for image text */
        #slideShowGallery .caption-container {
            text-align: center;
            background-color: #222;
            padding: 2px 16px;
            color: white;
        }

        #slideShowGallery .row {
            display: flex;
            align-items: baseline;
        }

        #slideShowGallery .row:after {
            content: "";
            display: table;
            clear: both;
        }

        /* Six columns side by side */
        #slideShowGallery .column {
            float: left;
            width: 16.66%;
        }

        /* Add a transparency effect for thumnbail images */
        #slideShowGallery .demo {
            opacity: 0.6;
        }

        #slideShowGallery :is(.active, .demo:hover) {
            opacity: 1;
        }
    `);

  const sgContent = generateElements(/*html*/ `
            <div id=slideShowGallery>
                <h2 style="text-align:center">Slideshow Gallery</h2>
                <div class="container">
                    <div id=fullImgCont></div>
                    <a class="prev">❮</a>
                    <a class="next">❯</a>
                    <div class="caption-container">
                        <p id="caption"></p>
                    </div>
                    <div class="row"></div>
                </div>
            </div>
            `);
  document.body.append(sgContent);

  const fullImgContainer = document.querySelector(`#fullImgCont`);
  const row = document.querySelector(`.row`);
  for (const item in arguments) {
    fullImgContainer.append(
      generateElements(/*html*/ `
            <div class=mySlides>
                <div class=numbertext>${+item + 1} / ${arguments.length}</div>
                <img src=${arguments[item]} style='width:100%'>
            </div>
        `),
    );
    row.append(
      generateElements(/*html*/ `
            <div class=column>
                <img class='demo cursor' src=${arguments[item]} style='width:100%'>
            </div>
            `),
    );
  }

  document.querySelector(`.prev`).addEventListener('click', () => {
    plusSlides(-1);
  });
  document.querySelector(`.next`).addEventListener('click', () => {
    plusSlides(1);
  });
  document.querySelectorAll(`.demo`).forEach(item => {
    item.addEventListener('click', event => {
      const element = event.target.parentNode;
      const index =
        Array.from(element.parentNode.children).indexOf(element) + 1;
      currentSlide(index);
    });
  });

  let slideIndex = 1;
  showSlides(slideIndex);

  function plusSlides(n) {
    showSlides((slideIndex += n));
  }

  function currentSlide(n) {
    showSlides((slideIndex = n));
  }

  function showSlides(n) {
    let i;
    let slides = document.getElementsByClassName('mySlides');
    let dots = document.getElementsByClassName('demo');
    let captionText = document.getElementById('caption');
    if (n > slides.length) {
      slideIndex = 1;
    }
    if (n < 1) {
      slideIndex = slides.length;
    }
    for (i = 0; i < slides.length; i++) {
      slides[i].style.display = 'none';
    }
    for (i = 0; i < dots.length; i++) {
      dots[i].className = dots[i].className.replace(' active', '');
    }
    slides[slideIndex - 1].style.display = 'block';
    dots[slideIndex - 1].className += ' active';
    captionText.innerHTML = dots[slideIndex - 1].alt;
  }

  return sgContent;
}

class modalBox {
  constructor() {
    GM_addStyle(`

      #vanilla-presets-modal {
        width: 95%;
        max-width: 95vw;
        padding: 0;
        border: 1px solid #888;
        background: black;
        color: white;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      }

      #vanilla-presets-modal::backdrop { background: rgba(0, 0, 0, 0.4); }
      #modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        position: sticky;
        top: 0;
        padding: 2px 16px;
        background: #5cb85c;
        color: white;
      }
      #header-content { margin: auto; }
      #modal-body {
        padding: 2px 16px;
        max-height: 80vh;
        overflow: auto;
        overscroll-behavior: contain;
      }
      #dismiss { font-size: x-large; }
      #dismiss:hover, #dismiss:focus { color: #000; cursor: pointer; }
    `);

    this.modal = generateElements(`
      <dialog id="vanilla-presets-modal">
        <div id="modal-header">
          <h2 id="header-content"></h2>
          <button id="dismiss" type="button" aria-label="Close dialog">&times;</button>
        </div>
        <div id="modal-body"></div>
      </dialog>
    `);

    document.body.append(this.modal);
    this.header = this.modal.querySelector('#header-content');
    this.body = this.modal.querySelector('#modal-body');
    const dismiss = this.modal.querySelector('#dismiss');
    this.closeButton = dismiss;
    this.boundKeydown = event => this.trapFocus(event);
    dismiss.addEventListener('click', () => this.hide());
    this.modal.addEventListener('close', () => {
      this.restorePageScroll();
      this.modal.removeEventListener('keydown', this.boundKeydown);
    });
  }

  display() {
    if (this.modal.open) return;
    this.previousActiveElement = document.activeElement;
    this.lockPageScroll();
    this.modal.showModal();
    this.modal.addEventListener('keydown', this.boundKeydown);
    this.closeButton.focus();
  }
  show() {
    this.display();
  }
  headerAddContent(content) {
    this.header.append(content);
  }
  bodyAddContent(content) {
    this.body.append(content);
  }
  hide() {
    if (this.modal.open) this.modal.close();
    if (this.previousActiveElement instanceof HTMLElement) {
      this.previousActiveElement.focus();
    }
  }

  lockPageScroll() {
    this.previousDocumentOverflow = document.documentElement.style.overflow;
    this.previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  restorePageScroll() {
    document.documentElement.style.overflow =
      this.previousDocumentOverflow || '';
    document.body.style.overflow = this.previousBodyOverflow || '';
  }
  flushHeader() {
    this.modal.querySelector('#header-content').replaceChildren();
  }
  flushBody() {
    this.modal.querySelector('#modal-body').replaceChildren();
  }
  destroy() {
    this.flushHeader();
    this.flushBody();
    this.hide();
  }

  trapFocus(event) {
    if (event.key === 'PageDown' || event.key === 'PageUp') {
      const direction = event.key === 'PageDown' ? 1 : -1;
      this.body.scrollBy({
        top: direction * this.body.clientHeight * 0.9,
        behavior: 'auto',
      });
      event.preventDefault();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = this.modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}

class ModalBox {
  constructor(options = {}) {
    this.options = {
      width: options.width || '95%',
      backgroundColor: options.backgroundColor || '#ffffff',
      headerColor: options.headerColor || '#5cb85c',
      headerTextColor: options.headerTextColor || '#ffffff',
      closeButtonColor: options.closeButtonColor || '#ffffff',
      animation: options.animation !== undefined ? options.animation : true,
      destroyOnClose:
        options.destroyOnClose !== undefined ? options.destroyOnClose : false,
      closeOnEscape:
        options.closeOnEscape !== undefined ? options.closeOnEscape : true,
      closeOnOutsideClick:
        options.closeOnOutsideClick !== undefined
          ? options.closeOnOutsideClick
          : true,
      lockPageScroll:
        options.lockPageScroll !== undefined ? options.lockPageScroll : true,
    };

    this.createStyles();
    this.createModal();
    this.setupEventListeners();
  }

  createStyles() {
    const styles = `
      .vanilla-modal {
        width: ${this.options.width};
        max-width: 95vw;
        padding: 0;
        border: 0;
        border-radius: 8px;
        background: ${this.options.backgroundColor};
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
      }
      .vanilla-modal::backdrop { background: rgba(0, 0, 0, 0.4); }
      .vanilla-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 20px;
        background: ${this.options.headerColor};
        color: ${this.options.headerTextColor};
        border-radius: 8px 8px 0 0;
      }
      .vanilla-modal-title { margin: 0; font-size: 1.25rem; font-weight: 600; }
      .vanilla-modal-close {
        color: ${this.options.closeButtonColor};
        font-size: 28px;
        font-weight: bold;
        cursor: pointer;
        border: 0;
        background: transparent;
      }
      .vanilla-modal-close:hover, .vanilla-modal-close:focus { color: #000; }
      .vanilla-modal-body {
        padding: 20px;
        max-height: 70vh;
        overflow-y: auto;
        overscroll-behavior: contain;
      }
      ${
        this.options.animation
          ? `
        .vanilla-modal[open] { animation: vanilla-modal-in 0.3s ease; }
        @keyframes vanilla-modal-in {
          from { opacity: 0; transform: translateY(-50px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `
          : ''
      }
    `;

    GM_addStyle(styles);
  }

  createModal() {
    this.modal = generateElements(`
      <dialog class="vanilla-modal">
        <div class="vanilla-modal-header">
          <h2 class="vanilla-modal-title"></h2>
          <button class="vanilla-modal-close" type="button" aria-label="Close dialog">&times;</button>
        </div>
        <div class="vanilla-modal-body"></div>
      </dialog>
    `);
    document.body.appendChild(this.modal);

    this.titleElement = this.modal.querySelector('.vanilla-modal-title');
    this.bodyElement = this.modal.querySelector('.vanilla-modal-body');
    this.closeButton = this.modal.querySelector('.vanilla-modal-close');
    this.boundKeydown = event => this.trapFocus(event);
    this.modal.addEventListener('cancel', event => {
      if (!this.options.closeOnEscape) event.preventDefault();
    });
    this.modal.addEventListener('close', () => {
      this.modal.removeEventListener('keydown', this.boundKeydown);
      if (this.previousActiveElement instanceof HTMLElement) {
        this.previousActiveElement.focus();
      }
      if (this.options.lockPageScroll) this.restorePageScroll();
    });
  }

  setupEventListeners() {
    this.closeButton.addEventListener('click', () => {
      if (this.options.destroyOnClose) this.destroy();
      else this.hide();
    });

    if (this.options.closeOnOutsideClick) {
      this.modal.addEventListener('click', e => {
        if (e.target === this.modal) this.hide();
      });
    }
  }

  setTitle(title) {
    if (typeof title === 'string') {
      this.titleElement.textContent = title;
    } else if (title instanceof Node) {
      this.titleElement.replaceChildren(title);
    }
  }

  setContent(content) {
    if (typeof content === 'string') {
      this.bodyElement.innerHTML = content;
    } else if (content instanceof Node) {
      this.bodyElement.replaceChildren(content);
    }
  }

  show() {
    if (this.modal.open) return;
    this.previousActiveElement = document.activeElement;
    if (this.options.lockPageScroll) this.lockPageScroll();
    this.modal.showModal();
    this.modal.addEventListener('keydown', this.boundKeydown);
    this.closeButton.focus();
  }

  hide() {
    if (this.modal.open) this.modal.close();
  }

  isVisible() {
    return this.modal.open;
  }

  lockPageScroll() {
    this.previousDocumentOverflow = document.documentElement.style.overflow;
    this.previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  restorePageScroll() {
    document.documentElement.style.overflow =
      this.previousDocumentOverflow || '';
    document.body.style.overflow = this.previousBodyOverflow || '';
  }

  trapFocus(event) {
    if (event.key === 'PageDown' || event.key === 'PageUp') {
      const direction = event.key === 'PageDown' ? 1 : -1;
      this.bodyElement.scrollBy({
        top: direction * this.bodyElement.clientHeight * 0.9,
        behavior: 'auto',
      });
      event.preventDefault();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = this.modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  destroy() {
    if (this.modal.open) this.modal.close();
    this.modal.remove();
  }
}

/**
 * Lightweight helper around the native dialog element.
 * Mirrors the demo from index.html/script.js with modal and non-modal support.
 *
 * Example:
 * const enrollDialog = new VanillaDialog({
 *   title: "Enroll in my awesome course!",
 *   content: enrollFormEl,
 *   mode: "modal",
 *   trigger: "#enroll-btn",
 *   closeOnBackdrop: true,
 * });
 *
 * const chatDialog = new VanillaDialog({
 *   title: "Chat Support",
 *   content: chatContentEl,
 *   mode: "non-modal",
 *   trigger: document.querySelector("#chat-toggle"),
 * });
 */
class VanillaDialog {
  constructor(options = {}) {
    const {
      title = '',
      content = '',
      mode = 'modal', // modal uses showModal(); non-modal uses show()
      trigger = null,
      closeOnBackdrop = true,
      closeButton = true,
      id = '',
      className = '',
    } = options;

    this.mode = mode === 'modal' ? 'modal' : 'non-modal';

    this.dialog = document.createElement('dialog');
    if (id) this.dialog.id = id;
    if (className) this.dialog.className = className;

    this.header = document.createElement('div');
    this.header.className = 'dialog-header';

    this.titleEl = document.createElement('h2');
    this.titleEl.textContent = title;
    this.header.appendChild(this.titleEl);

    if (closeButton) {
      this.closeBtn = document.createElement('button');
      this.closeBtn.type = 'button';
      this.closeBtn.className = 'btn-icon';
      this.closeBtn.setAttribute('aria-label', 'Close dialog');
      this.closeBtn.innerHTML =
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>';
      this.header.appendChild(this.closeBtn);
    }

    this.body = document.createElement('div');
    this.body.className = 'dialog-body';
    this.setContent(content);

    this.dialog.appendChild(this.header);
    this.dialog.appendChild(this.body);

    document.body.appendChild(this.dialog);

    this.boundTriggerHandler = this.show.bind(this);
    this.boundBackdropHandler = e => {
      const rect = this.dialog.getBoundingClientRect();
      const outside =
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom;
      if (outside) this.close();
    };

    if (trigger) this.attachTrigger(trigger);
    if (this.closeBtn)
      this.closeBtn.addEventListener('click', () => this.close());
    if (closeOnBackdrop)
      this.dialog.addEventListener('click', this.boundBackdropHandler);
  }

  attachTrigger(trigger) {
    const el =
      typeof trigger === 'string' ? document.querySelector(trigger) : trigger;
    if (!el) return;
    this.trigger = el;
    this.trigger.addEventListener('click', this.boundTriggerHandler);
  }

  setTitle(title) {
    if (typeof title === 'string') {
      this.titleEl.textContent = title;
    } else if (title instanceof Node) {
      this.titleEl.replaceChildren(title);
    }
  }

  setContent(content) {
    if (typeof content === 'string') {
      this.body.innerHTML = content;
    } else if (content instanceof Node) {
      this.body.replaceChildren(content);
    }
  }

  show() {
    if (this.mode === 'modal') {
      this.dialog.showModal();
    } else {
      this.dialog.show();
    }
  }

  close() {
    this.dialog.close();
  }

  toggle() {
    if (this.dialog.open) {
      this.close();
    } else {
      this.show();
    }
  }

  destroy() {
    if (this.trigger)
      this.trigger.removeEventListener('click', this.boundTriggerHandler);
    this.dialog.removeEventListener('click', this.boundBackdropHandler);
    this.dialog.remove();
  }
}
