async function Collapsible(togglerText = 'Toggle', options = {}) {
  await waitFor('body');

  //* Methods for adding elements and handling popups
  function addButton(text, popupEl = null, onclick) {
    const button = generateElements(`<button></button>`);
    button.className = 'collapsible-button button-like';
    button.textContent = text;
    collapsibleContent.appendChild(button);

    if (onclick) {
      button.addEventListener('click', onclick);
    }

    if (popupEl) {
      button.addEventListener('click', e => {
        e.stopPropagation();
        popupEl.classList.toggle('visible');
      });

      document.addEventListener('click', e => {
        if (!button.contains(e.target)) {
          popupEl.classList.remove('visible');
        }
      });
    }

    return button;
  }

  function addPopup() {
    const popup = document.createElement('div');
    popup.className = 'popup';
    collapsibleContent.appendChild(popup);
    return popup;
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
            cursor: move;
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
            background-color: ${backgroundColor};
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
            background-color: ${hoverColor};
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

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

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

function dialog(title = '', contentElement, maxHeight = '300px') {
  // Create the GUI container
  const guiContainer = document.createElement('div');
  guiContainer.style.position = 'fixed';
  guiContainer.style.top = '100px';
  guiContainer.style.right = '50px';
  guiContainer.style.width = '300px';
  guiContainer.style.border = '1px solid #ccc';
  guiContainer.style.backgroundColor = '#f0f0f0';
  guiContainer.style.zIndex = '9999';
  guiContainer.style.boxShadow = '0px 0px 10px rgba(0, 0, 0, 0.1)';

  // Create the header
  const header = document.createElement('div');
  header.style.backgroundColor = '#e0e0e0';
  // header.style.padding = '10px';
  header.style.cursor = 'move';
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.innerText = title;

  // Create the collapse button
  const collapseBtn = document.createElement('button');
  collapseBtn.id = 'expand-btn';
  collapseBtn.innerHTML = '+';
  collapseBtn.style.marginLeft = 'auto';
  collapseBtn.style.marginRight = '5px';
  collapseBtn.onclick = () => {
    if (body.style.display === 'none') {
      body.style.display = 'block';
      collapseBtn.innerHTML = '-';
    } else {
      body.style.display = 'none';
      collapseBtn.innerHTML = '+';
    }
  };

  // Create the close button
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = 'x';
  closeBtn.onclick = () => {
    guiContainer.remove();
  };

  // Append buttons to the header
  header.appendChild(collapseBtn);
  header.appendChild(closeBtn);

  // Create the body
  const body = document.createElement('div');
  body.style.display = 'none';
  body.style.padding = '10px';
  body.style.backgroundColor = '#fff';
  body.style.maxHeight = maxHeight;
  body.style.overflow = 'auto';
  // adding the content element given by the function parameter
  body.append(contentElement);

  // Append header and body to the container
  guiContainer.appendChild(header);
  guiContainer.appendChild(body);

  // Append the container to the document body
  document.body.appendChild(guiContainer);

  // Make the GUI draggable
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

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
  const toolTip = generateElements('<span class=tooltip></span>', null, true);
  tooltipParent.after(toolTip);
  const wrapper = wrap('<div class=wrapper></div>', tooltipParent, toolTip);
  style(
    wrapper,
    `
        position: relative;
        width:    fit-content;
    `,
  );
  toolTip.append(tooltipContent);
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
                display: none; /* Hidden by default */
                position: fixed; /* Stay in place */
                z-index: 10000; /* Sit on top */
                padding-top: 10px; /* Location of the box */
                left: 0;
                top: 0;
                width: 100%; /* Full width */
                height: 100%; /* Full height */
                overflow: auto; /* Enable scroll if needed */
                background-color: rgb(0,0,0); /* Fallback color */
                background-color: rgba(0,0,0,0.4); /* Black w/ opacity */
            }

            #modal-content {
                position: relative;
                background-color: black;
                margin: auto;
                padding: 0;
                border: 1px solid #888;
                width: 95%;
                box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2),0 6px 20px 0 rgba(0,0,0,0.19);
                animation-name: animatetop;
                animation-duration: 0.4s
            }

            @keyframes animatetop {
                from {top:-300px; opacity:0}
                to {top:0; opacity:1}
            }

            #close:hover,
            #close:focus {
                color: #000;
                text-decoration: none;
                cursor: pointer;
            }

            #modal-header {

                display: flex;
                justify-content: space-between;
                align-items: center;
                
                position: sticky;
                top: 0px;
                padding: 2px 16px;
                background-color: #5cb85c;
                color: white;
                
            }

            #header-content {
                margin: auto;
            }

            #modal-body {padding: 2px 16px;}

        `);

    this.modal = generateElements(`
            <div id=vanilla-presets-modal class=modal>
                <div id=modal-content>
                    <div id=modal-header>
                        <h2 id=header-content></h2>
                        <div id=dismiss style='font-size: x-large'>❌</div>
                    </div>
                    <div id=modal-body></div>
                </div>
            </div>
            `);

    document.body.append(this.modal);
    this.header = this.modal.querySelector('#header-content');
    this.body = this.modal.querySelector('#modal-body');
    const dismiss = this.modal.querySelector('#dismiss');
    dismiss.addEventListener('click', () => {
      this.destroy();
    });
  }

  display() {
    this.modal.style.display = 'block';
  }
  headerAddContent(content) {
    this.header.append(content);
  }
  bodyAddContent(content) {
    this.body.append(content);
  }
  hide() {
    this.modal.style.display = 'none';
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
    };

    this.createStyles();
    this.createModal();
    this.setupEventListeners();
  }

  createStyles() {
    const styles = `
            .vanilla-modal {
                display: none;
                position: fixed;
                z-index: 10000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                overflow: auto;
                background-color: rgba(0,0,0,0.4);
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .vanilla-modal.show {
                opacity: 1;
            }

            .vanilla-modal-content {
                position: relative;
                background-color: ${this.options.backgroundColor};
                margin: 50px auto;
                padding: 0;
                border-radius: 8px;
                width: ${this.options.width};
                box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                transform: translateY(-50px);
                transition: transform 0.3s ease;
            }

            .vanilla-modal.show .vanilla-modal-content {
                transform: translateY(0);
            }

            .vanilla-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                background-color: ${this.options.headerColor};
                color: ${this.options.headerTextColor};
                border-top-left-radius: 8px;
                border-top-right-radius: 8px;
            }

            .vanilla-modal-title {
                margin: 0;
                font-size: 1.25rem;
                font-weight: 600;
            }

            .vanilla-modal-close {
                color: ${this.options.closeButtonColor};
                font-size: 28px;
                font-weight: bold;
                cursor: pointer;
                transition: color 0.2s ease;
            }

            .vanilla-modal-close:hover {
                color: #000;
            }

            .vanilla-modal-body {
                padding: 20px;
                max-height: 70vh;
                overflow-y: auto;
            }
        `;

    GM_addStyle(styles);
  }

  createModal() {
    this.modal = generateElements(`
            <div class="vanilla-modal-content">
                <div class="vanilla-modal-header">
                    <h2 class="vanilla-modal-title"></h2>
                    <span class="vanilla-modal-close">&times;</span>
                </div>
                <div class="vanilla-modal-body"></div>
            </div>
            `);
    this.modal.className = 'vanilla-modal';
    document.body.appendChild(this.modal);

    this.titleElement = this.modal.querySelector('.vanilla-modal-title');
    this.bodyElement = this.modal.querySelector('.vanilla-modal-body');
    this.closeButton = this.modal.querySelector('.vanilla-modal-close');
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

    if (this.options.closeOnEscape) {
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && this.isVisible()) this.hide();
      });
    }
  }

  setTitle(title) {
    if (typeof title === 'string') {
      this.titleElement.textContent = title;
    }
    // else {
    else if (content instanceof Node) {
      this.titleElement.appendChild(title);
    }
  }

  setContent(content) {
    if (typeof content === 'string') {
      this.bodyElement.innerHTML = content;
    } else if (content instanceof Node) {
      const uniqueString = generateUniqueString();
      let policy = trustedTypes.createPolicy(uniqueString, {
        createHTML: input => input,
      });
      this.bodyElement.innerHTML = policy.createHTML('');

      this.bodyElement.appendChild(content);
    }
  }

  show() {
    this.modal.style.display = 'block';
    setTimeout(() => this.modal.classList.add('show'), 10);
  }

  hide() {
    this.modal.classList.remove('show');
    setTimeout(() => {
      this.modal.style.display = 'none';
    }, 300);
  }

  isVisible() {
    return this.modal.style.display === 'block';
  }

  destroy() {
    document.body.removeChild(this.modal);
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
