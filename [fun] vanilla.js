//  MARK: Advanced

function reEnableConsole() {
  const tempIframeEl = document.createElement('iframe');
  tempIframeEl.style.display = 'none';
  document.body.appendChild(tempIframeEl);
  window.console = tempIframeEl.contentWindow.console;
  tempIframeEl.remove();
}

function disableConsoleClear() {
  const console = window.console;
  console.clear = () => {};
}

function repeat(times, repeatWhat) {
  for (let index = 0; index < times; index++) {
    repeatWhat(index);
  }
}

function throttle(func, limit) {
  let inThrottle = false;
  let lastArgs = null;
  let lastThis = null;
  let timeoutId = null;

  return function throttled(...args) {
    // Save the context and arguments for potential delayed execution
    lastArgs = args;
    lastThis = this;

    // If we're not currently throttled, execute the function immediately
    if (!inThrottle) {
      func.apply(lastThis, lastArgs);
      inThrottle = true;

      // Set up the throttle period
      setTimeout(() => {
        inThrottle = false;

        // If there were calls during the throttle period, execute one last time
        if (lastArgs) {
          throttled.apply(lastThis, lastArgs);
          lastArgs = null;
          lastThis = null;
        }
      }, limit);
    }
  };
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function pipeline(input, ...functions) {
  return functions.reduce((accumulator, currentFn) => {
    return currentFn(accumulator);
  }, input);
}

// MARK: Text functions

async function getTranslation(
  text,
  outputLanguage = 'en',
  inputLanguage = 'auto',
  alts = 3
) {
  return new Promise((resolve, reject) => {
    GM.xmlHttpRequest({
      method: 'POST',
      url: 'http://127.0.0.1:5000/translate',
      data: JSON.stringify({
        q: text,
        source: inputLanguage,
        target: outputLanguage,
        format: 'text',
        alternatives: alts,
        api_key: '',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      onload: function (response) {
        try {
          const jsonResponse = JSON.parse(response.responseText);
          resolve(jsonResponse);
        } catch (error) {
          reject(error);
        }
      },
      onerror: function (error) {
        reject(error);
      },
    });
  });
}

function generateUniqueString(length) {
  let result = '';
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

function downloadText(filename, text) {
  const dlLink = generateElements(`<a>down</a>`, document.body);
  const uriContent = `data:text/plain;charset=utf-8,${encodeURIComponent(
    text
  )}`;
  dlLink.href = uriContent;
  dlLink.setAttribute('download', filename);
  dlLink.click();
  // dlLink.remove();
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

//  MARK: Time Text functions

function timeSince(date, shortForm = false) {
  // Handle null or undefined input
  if (!date) {
    throw new Error('Date parameter is required');
  }

  // Convert input to Date object if it's a string
  const inputDate = typeof date === 'string' ? new Date(date) : date;

  // Check if the date is valid
  if (!(inputDate instanceof Date) || isNaN(inputDate.getTime())) {
    throw new Error('Invalid date format');
  }

  // Get time difference in milliseconds
  const diff = inputDate.getTime() - Date.now();
  const isPast = diff < 0;
  const absDiff = Math.abs(diff);

  // Convert to various time units
  const minutes = Math.floor(absDiff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  // Calculate remaining units
  const remainingHours = hours % 24;
  const remainingMinutes = minutes % 60;

  // Helper function to format parts
  const formatPart = (value, unit, shortUnit) => {
    if (value === 0) return '';
    if (shortForm) {
      return `${value}${shortUnit}`;
    }
    return `${value} ${unit}${value !== 1 ? 's' : ''}`;
  };

  // Handle "just now" / "right now" cases
  if (minutes === 0) {
    return isPast ? 'just now' : 'right now';
  }

  // Build the time string
  let result = '';

  if (days > 0) {
    result += formatPart(days, 'day', 'd');
  }

  if (remainingHours > 0) {
    result += result ? ' ' : '';
    result += formatPart(remainingHours, 'hour', 'h');
  }

  if (remainingMinutes > 0 || (days === 0 && remainingHours === 0)) {
    result += result ? ' ' : '';
    result += formatPart(remainingMinutes, 'minute', 'm');
  }

  return isPast ? result + ' ago' : 'in ' + result;
}

function convertTimeToTimezone(timeString, sourceTimezone, targetTimezone) {
  // Validate input
  if (!/^\d{2}:\d{2}$/.test(timeString)) {
    throw new Error('Invalid time format. Use HH:mm (24-hour format)');
  }

  // Parse the input time
  const [hours, minutes] = timeString.split(':').map(Number);

  // Create a Date object in the source timezone
  const sourceDate = new Date().toLocaleString('en-US', {
    timeZone: sourceTimezone,
  });
  const sourceDateObj = new Date(sourceDate);
  sourceDateObj.setHours(hours, minutes, 0, 0);

  // Convert to target timezone
  const targetTime = sourceDateObj.toLocaleString('en-US', {
    timeZone: targetTimezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  // Extract and format time
  const [targetTimeString] = targetTime.split(',').reverse();
  return targetTimeString.trim();
}

function getTimezoneDateTime(timeZone) {
  try {
    // Validate timezone input
    if (!timeZone || typeof timeZone !== 'string') {
      throw new Error('Invalid timezone provided');
    }

    // Create a date object in the specified time zone
    const fullDateTime = new Date().toLocaleString('en-US', {
      timeZone: timeZone,
      dateStyle: 'full',
      timeStyle: 'long',
    });

    // Get the current time in the specified time zone
    const time = new Date().toLocaleTimeString('en-US', {
      timeZone: timeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    // Get the current date in the specified time zone
    const date = new Date().toLocaleDateString('en-US', {
      timeZone: timeZone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return {
      fullDateTime,
      time,
      date,
      timeZone,
    };
  } catch (error) {
    throw new Error(
      `Unable to retrieve time for timezone ${timeZone}. Error: ${error.message}`
    );
  }
}

function toSeconds(timeString) {
  const a = timeString.split(':').reverse();
  let seconds = 0;

  if (+a[2]) seconds += +a[2] * 60 * 60;
  if (+a[1]) seconds += +a[1] * 60;
  if (+a[0]) seconds += +a[0];

  return seconds;
}

function toSecondsFromHMS(hours, minutes, seconds) {
  let outputSeconds = 0;
  if (hours) outputSeconds += +hours * 60 * 60;
  if (minutes) outputSeconds += +minutes * 60;
  if (seconds) outputSeconds += +seconds;
  return outputSeconds;
}

function forHumans(seconds) {
  if (seconds === 0) return '0s';
  if (!Number.isInteger(seconds) || seconds < 0) return 'Invalid input';

  const timeUnits = [
    { value: 31536000, label: 'year' },
    { value: 86400, label: 'day' },
    { value: 3600, label: 'h' },
    { value: 60, label: 'm' },
    { value: 1, label: 's' },
  ];

  let remainingSeconds = seconds;
  const parts = [];

  for (const unit of timeUnits) {
    const count = Math.floor(remainingSeconds / unit.value);
    if (count > 0) {
      parts.push(
        `${count}${unit.label}${
          count > 1 &&
          unit.label !== 'h' &&
          unit.label !== 'm' &&
          unit.label !== 's'
            ? 's'
            : ''
        }`
      );
      remainingSeconds %= unit.value;
    }
  }

  return parts.join(' ');
}

// MARK: - Style related

/**
 * Dims the content of the provided element by adding a semi-transparent overlay
 * @param {HTMLElement} element - The DOM element to dim
 * @param {Object} options - Optional configuration
 * @param {number} options.opacity - Opacity level (0 to 1, default: 0.5)
 * @param {string} options.color - Color of the dim overlay (default: 'black')
 * @param {boolean} options.animate - Whether to animate the dimming (default: false)
 * @param {number} options.duration - Animation duration in ms (default: 300)
 * @return {Function} A function that removes the dimming effect when called
 */
function dimElement(element, options = {}) {
  // Default options
  const config = {
    opacity: options.opacity !== undefined ? options.opacity : 0.8,
    color: options.color || 'black',
    animate: options.animate || false,
    duration: options.duration || 300,
  };

  // Store original position if not already positioned
  const originalPosition = window.getComputedStyle(element).position;
  if (originalPosition === 'static') {
    element.style.position = 'relative';
  }

  // Create overlay element
  const overlay = document.createElement('div');

  // Set overlay styles
  const overlayStyles = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: config.color,
    opacity: config.animate ? 0 : config.opacity,
    transition: config.animate ? `opacity ${config.duration}ms ease` : 'none',
    pointerEvents: 'none',
    zIndex: 1,
  };

  // Apply styles to overlay
  Object.assign(overlay.style, overlayStyles);

  // Add class for potential styling/selection
  overlay.classList.add('element-dim-overlay');

  // Append overlay to element
  element.appendChild(overlay);

  // Trigger animation if enabled
  if (config.animate) {
    // Force a reflow to ensure the transition works
    overlay.offsetHeight;
    overlay.style.opacity = config.opacity;
  }

  // Return function to remove the dimming effect
  return function undim() {
    if (config.animate) {
      overlay.style.opacity = 0;

      setTimeout(() => {
        element.removeChild(overlay);
        if (originalPosition === 'static') {
          element.style.position = originalPosition;
        }
      }, config.duration);
    } else {
      element.removeChild(overlay);
      if (originalPosition === 'static') {
        element.style.position = originalPosition;
      }
    }
  };
}

function getStyleOrComputedStyle(element, property) {
  return element.style[property]
    ? element.style[property]
    : getComputedStyle(element)[property];
}

function addStyle(css) {
  const allStyleEls = document.head.querySelectorAll(`style`);
  let alreadyExists;
  allStyleEls.forEach(styleEl => {
    if (styleEl.innerText === css) {
      alreadyExists = true;
    }
  });
  if (alreadyExists) return; // 🛑
  const newStyleEl = generateElements(
    `<style>${css}</style>`,
    document.head,
    true
  );
  return newStyleEl;
}

function style(targetEl, css, debug) {
  css
    .replaceAll(/\s{2,}/g, '') // gets rid of white spaces
    .split(';')
    .filter(line => line) // gets rid of empty lines
    .forEach(declaration => {
      if (debug) console.log(declaration);
      const [property, value] = declaration.split(':');
      const propertySplit = property.split('-');
      const propertyLhs = propertySplit[0].toLowerCase();
      const propertyRhs = propertySplit[1]
        ? capitalizeFirstLetter(propertySplit[1])
        : '';
      targetEl.style[`${propertyLhs}${propertyRhs}`] = value;
    });
}

function positionRelativeToElement(
  targetEl,
  staticEl,
  x = 0,
  y = 0,
  positionProperty = 'absolute'
) {
  var rect = staticEl.getBoundingClientRect();
  style(
    targetEl,
    `
        position: ${positionProperty};
        left: ${rect.left + x}px;
        top: ${rect.top + y}px;
        zIndex: 1
    `
  );
}

// MARK: Time related

function asyncTimeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function timer(interval = 1000, tick = null, done = null) {
  let timerInterval;
  let timeLeft;
  let isPaused = false;

  function startTimer(timerDuration) {
    timeLeft = timerDuration; // Set the initial time
    isPaused = false; // Reset paused state
    timerInterval = setInterval(() => {
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        done();
      } else {
        tick(timeLeft);
        timeLeft--; // Decrease time left
      }
    }, interval);
  }

  function pauseTimer() {
    if (!isPaused) {
      clearInterval(timerInterval); // Stop the timer
      isPaused = true; // Set paused state
      console.log('Timer paused');
    }
  }

  function resumeTimer() {
    if (isPaused) {
      startTimer(timeLeft); // Resume with remaining time
      console.log('Timer resumed');
    }
  }

  function updateTimer(newDuration) {
    clearInterval(timerInterval); // Clear existing interval
    startTimer(newDuration); // Start with new duration
  }

  return { startTimer, pauseTimer, resumeTimer, updateTimer };
}

//  MARK: Central mutation observer

// Central MutationObserver manager
const CentralObserverManager = (function () {
  // Private properties
  let mainObserver = null;
  const callbacks = new Map(); // Maps selectors to arrays of callback functions
  const processedElements = new Map(); // Maps selectors to Sets of processed elements

  // Process mutations for all registered callbacks
  function processMutations(mutations) {
    // Check for added nodes
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        // Process added nodes
        mutation.addedNodes.forEach(node => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;

          // Check this node against all registered selectors
          callbacks.forEach((callbackArray, selector) => {
            // Check if the node itself matches
            if (node.matches(selector)) {
              executeCallbacks(node, selector, callbackArray);
            }

            // Check if any of its children match
            if (node.querySelector(selector)) {
              node.querySelectorAll(selector).forEach(element => {
                executeCallbacks(element, selector, callbackArray);
              });
            }
          });
        });

        // Handle removed nodes (if needed)
        mutation.removedNodes.forEach(node => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;
          // Implementation for tracking removed nodes if needed
        });
      }
    });

    // Also check for all newly added elements that might match existing selectors
    // (this ensures we don't miss elements added through innerHTML or other means)
    callbacks.forEach((callbackArray, selector) => {
      document.querySelectorAll(selector).forEach(element => {
        executeCallbacks(element, selector, callbackArray);
      });
    });
  }

  // Execute callbacks for a matched element
  function executeCallbacks(element, selector, callbackArray) {
    // Get or create the Set of processed elements for this selector
    let processed = processedElements.get(selector);
    if (!processed) {
      processed = new Set();
      processedElements.set(selector, processed);
    }

    // Skip if already processed
    if (processed.has(element)) return;

    // Mark as processed and execute callbacks
    processed.add(element);
    callbackArray.forEach(callback => callback(element));
  }

  // Initialize the main observer
  function initializeObserver() {
    if (mainObserver) return; // Already initialized

    mainObserver = new MutationObserver(processMutations);
    mainObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Process existing elements on page
    callbacks.forEach((callbackArray, selector) => {
      document.querySelectorAll(selector).forEach(element => {
        executeCallbacks(element, selector, callbackArray);
      });
    });
  }

  return {
    // Register a callback for a specific selector
    observe: function (selector, callback, processExisting = true) {
      // Create or retrieve callback array for this selector
      if (!callbacks.has(selector)) {
        callbacks.set(selector, []);
        processedElements.set(selector, new Set());
      }

      callbacks.get(selector).push(callback);

      // Initialize observer if not already done
      initializeObserver();

      // Process existing elements if requested
      if (processExisting) {
        document.querySelectorAll(selector).forEach(element => {
          executeCallbacks(element, selector, callbacks.get(selector));
        });
      }

      // Return a function to remove this specific callback
      return function unobserve() {
        const callbackArray = callbacks.get(selector);
        if (callbackArray) {
          const index = callbackArray.indexOf(callback);
          if (index !== -1) {
            callbackArray.splice(index, 1);
          }

          // Remove the selector entry if no callbacks remain
          if (callbackArray.length === 0) {
            callbacks.delete(selector);
            processedElements.delete(selector);
          }
        }
      };
    },

    // Reset tracking for a specific selector
    resetSelector: function (selector) {
      if (processedElements.has(selector)) {
        processedElements.get(selector).clear();
      }
    },

    // Disconnect and clean up everything
    disconnect: function () {
      if (mainObserver) {
        mainObserver.disconnect();
        mainObserver = null;
      }
      callbacks.clear();
      processedElements.clear();
    },
  };
})();

// Modified version of waitFor using the consolidated observer
function waitFor(selector) {
  return new Promise(resolve => {
    // Check if element already exists
    const existing = document.querySelector(selector);
    if (existing) {
      resolve(existing);
      return;
    }

    // Set up observer to wait for element
    const unobserve = CentralObserverManager.observe(
      selector,
      element => {
        unobserve(); // Remove the observer once found
        resolve(element);
      },
      false
    ); // Don't process existing elements (we already checked)
  });
}

// Modified version of waitForEach using the consolidated observer
function waitForEach(selector, callback, options = {}) {
  const { once = false } = options;

  // Register with observer manager
  const unobserve = CentralObserverManager.observe(selector, callback);

  // If once is true, unobserve after processing existing elements
  if (once) {
    setTimeout(unobserve, 0);
  }

  return {
    unobserve,
    reload: () => {
      CentralObserverManager.resetSelector(selector);
    },
  };
}

// Example implementation of markAndFilter using the consolidated observer
function markAndFilterCOM(
  itemSelector,
  uidSelector = 'a',
  uidAttribute,
  uidRegex
) {
  // Initialize filter list from storage
  let filterList = GM_getValue('filterList', []);
  let filteredCountAllTime = GM_getValue('filteredCount', 0);

  createFilteredCountDiv();

  // Set up scroll detection using throttled scroll handler
  const scrollHandler = throttle(event => {
    document.querySelectorAll(itemSelector).forEach(item => {
      if (isScrolledPast(item)) {
        // Extract the unique ID from the element
        const uniqueId = getUid(item);
        if (!uniqueId) return;

        if (!filterList.includes(uniqueId)) {
          // Add the ID to the filter list
          filterList.push(uniqueId);
          // Ensure unique values
          filterList = [...new Set(filterList)];
          // Save to storage
          GM_setValue('filterList', filterList);
        }
      }
    });
  }, 200);

  window.addEventListener('scroll', scrollHandler);

  // Filter items as they appear in the page
  waitForEach(itemSelector, item => {
    // Extract the unique ID using the same method as above
    const uniqueId = getUid(item);

    if (uniqueId && filterList.includes(uniqueId)) {
      // Increase the filtered count
      filteredCountAllTime++;
      GM_setValue('filteredCount', filteredCountAllTime);

      // Update the counter display
      document.getElementById('filteredCountDiv').textContent =
        filteredCountAllTime;

      // Get information for the replacement div
      const title = item.querySelector('h2, h3, a')?.textContent || 'Link';
      const permalink =
        item.getAttribute('permalink') ||
        item.querySelector('a')?.getAttribute('href') ||
        '#';

      // Replace with filtered message
      const filterNoticeEl = replaceWith(
        item,
        `
        <div>
          <hr>
          <div>Filtered</div>
          <a target="_blank" href="${permalink}">${title}</a>
        </div>
      `
      );
      style(
        filterNoticeEl,
        `
        outline: 2px solid red;
      `
      );
    }
  });

  function getUid(itemEl) {
    const uidEl = itemEl.querySelector(uidSelector);
    if (!uidEl) return null;

    const uidAttrVal = uidAttribute
      ? uidEl.getAttribute(uidAttribute)
      : uidEl.textContent;

    if (!uidAttrVal) return null;

    const uid = uidRegex ? uidAttrVal.match(uidRegex)?.[1] : uidAttrVal;

    return uid;
  }

  function isScrolledPast(element) {
    const rect = element.getBoundingClientRect();
    return rect.bottom < 0; // Element has scrolled off the top of the viewport
  }

  // Helper throttle function
  function throttle(func, limit) {
    let inThrottle;
    return function () {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  // Create UI for filtered count if it doesn't exist
  function createFilteredCountDiv() {
    if (document.getElementById('filteredCountDiv')) return;

    const countDiv = document.createElement('div');
    countDiv.id = 'filteredCountDiv';
    countDiv.style.position = 'fixed';
    countDiv.style.top = '10px';
    countDiv.style.right = '10px';
    countDiv.style.padding = '5px';
    countDiv.style.backgroundColor = 'rgba(0,0,0,0.7)';
    countDiv.style.color = 'white';
    countDiv.style.borderRadius = '5px';
    countDiv.style.zIndex = '9999';
    countDiv.textContent = filteredCountAllTime;
    document.body.appendChild(countDiv);
  }

  // Return methods for manual control
  return {
    addToFilter: uniqueId => {
      if (!filterList.includes(uniqueId)) {
        filterList.push(uniqueId);
        GM_setValue('filterList', filterList);
      }
    },
    removeFromFilter: uniqueId => {
      filterList = filterList.filter(id => id !== uniqueId);
      GM_setValue('filterList', filterList);
    },
    clearFilters: () => {
      GM_setValue('filterList', []);
      GM_setValue('filteredCount', 0);
      document.getElementById('filteredCountDiv').textContent = '0';
    },
    cleanup: () => {
      window.removeEventListener('scroll', scrollHandler);
    },
  };
}

// convert this function so it accepts an object with options
function makeMarkable({
  mainSelector,
  uidElSelector = 'a',
  hrefElSelector = 'a',
  parentSelector = null,
  uidAttr = 'href',
  filter = null,
  filterParent = null,
}) {
  waitForEach(mainSelector, mainElement => {
    // check if the element's uid is already in storage
    const uidEl = mainElement.querySelector(uidElSelector);
    const uniqueId = uidEl ? uidEl.getAttribute(uidAttr) : null;
    const parentEl = mainElement.closest(parentSelector);

    if (uniqueId && GM_getValue(`marked-${uniqueId}`)) {
      if (filter) filter(mainElement);
      else {
        replaceMarkedElement(mainElement);
      }
    }
    const markBtnEl = generateElements(`<button>Mark</button>`, mainElement);
    style(mainElement, `position: relative`);
    style(
      markBtnEl,
      `
      position: absolute;
      top: 0;
      right: 0;
      z-index: 1000;
      background-color: red;
      color: white;
      border: none;
      padding: 5px;
      cursor: pointer;
    `
    );
    markBtnEl.addEventListener('click', () => {
      const uidEl = mainElement.querySelector(uidElSelector);
      const uniqueId = uidEl ? uidEl.getAttribute(uidAttr) : null;
      if (!uniqueId) {
        console.log('No unique ID found for marking');
        return;
      }
      GM_setValue(`marked-${uniqueId}`, true);
      if (filter) filter(mainElement);
      else {
        replaceMarkedElement(mainElement);
      }
    });

    if (parentSelector) {
      const mainEls = parentEl.querySelectorAll(mainSelector);
      const remainingMainEls = mainEls.length;
      if (remainingMainEls === 0) {
        parentEl.style.display = 'none';
      } else {
        parentEl.style.display = 'block';
      }
    }
  });

  function replaceMarkedElement(element) {
    const href =
      element.querySelector(hrefElSelector)?.getAttribute('href') || '#';
    const newEl = generateElements(
      `<a href="${href}">${element.textContent}</a>`
    );
    style(
      newEl,
      `
      margin: 5px;
      padding: 5px;
      border: 1px solid yellow;
      `
    );
    element.replaceWith(newEl);
    return newEl;
  }
}

// MARK: Mutation Observer

function markAndFilter(
  itemSelector,
  uidSelector = 'a',
  uidAttribute,
  uidRegex,
  locationHrefRegex,
  addOverlay = true,
  filterNoticeHtml = null
) {
  // Initialize filter list from storage
  let filterList = GM_getValue('filterList', []);
  let filteredCountAllTime = GM_getValue('filteredCount', 0);

  createFilteredCountDiv();

  // Set up scroll detection to mark items that are scrolled past
  lazyLoadScrollPast(itemSelector, item => {
    if (locationHrefRegex) {
      const locationHref = window.location.href;
      if (!locationHref.match(locationHrefRegex)) {
        console.log(
          'markAndFilter: locationHrefRegex does not match, exiting function.'
        );
        return;
      }
    }

    // Extract the unique ID from the element
    const uniqueId = getUid(item);
    if (!uniqueId) {
      console.log('Unique ID not found');
      return;
    }

    if (uniqueId && !filterList.includes(uniqueId)) {
      // Add the ID to the filter list
      filterList.push(uniqueId);
      // Ensure unique values
      filterList = [...new Set(filterList)];
      // Save to storage
      GM_setValue('filterList', filterList);
      if (addOverlay) dimElement(item);
    }
  });

  // Filter items as they appear in the page
  waitForEach(itemSelector, item => {
    if (locationHrefRegex) {
      const locationHref = window.location.href;
      if (!locationHref.match(locationHrefRegex)) {
        return;
      }
    }

    // Extract the unique ID using the same method as above
    const uniqueId = getUid(item);

    if (uniqueId && filterList.includes(uniqueId)) {
      // Increase the filtered count
      filteredCountAllTime++;
      GM_setValue('filteredCount', filteredCountAllTime);

      // Update the counter display
      document.getElementById('filteredCountDiv').textContent =
        filteredCountAllTime;

      if (filterNoticeHtml === ``) {
        item.style.display = 'none';
        return;
      }

      // Get information for the replacement div
      const title = item.querySelector('h2, h3, a')?.textContent || 'Link';
      const permalink =
        item.getAttribute('permalink') ||
        item.querySelector('a')?.getAttribute('href') ||
        '#';

      // Replace with filtered message
      if (filterNoticeHtml) {
        const customFilterNoticeEl = replaceWith(item, filterNoticeHtml);
        const filterNoticeContent = `
          <a target="_blank" href="${permalink}">${title}</a>
        `;
        customFilterNoticeEl.appendChild(generateElements(filterNoticeContent));
      } else {
        const filterNoticeEl = replaceWith(
          item,
          `
        <div>
          <hr>
          <div>Filtered</div>
          <a target="_blank" href="${permalink}">${title}</a>
        </div>
      `
        );
        style(
          filterNoticeEl,
          `
        outline: 2px solid red;
      `
        );
      }

      // Alternative: completely remove the item
      // item.remove();
    }
  });

  function getUid(itemEl) {
    const uidEl = itemEl.querySelector(uidSelector);
    const uidAttrVal = uidAttribute
      ? uidEl.getAttribute(uidAttribute)
      : uidEl.textContent;
    const uid = uidRegex ? uidAttrVal.match(uidRegex)?.[1] : uidAttrVal;
    return uid;
  }

  // Create UI for filtered count if it doesn't exist
  function createFilteredCountDiv() {
    if (document.getElementById('filteredCountDiv')) return;

    const countDiv = document.createElement('div');
    countDiv.id = 'filteredCountDiv';
    countDiv.style.position = 'fixed';
    countDiv.style.top = '10px';
    countDiv.style.right = '10px';
    countDiv.style.padding = '5px';
    countDiv.style.backgroundColor = 'rgba(0,0,0,0.7)';
    countDiv.style.color = 'white';
    countDiv.style.borderRadius = '5px';
    countDiv.style.zIndex = '9999';
    countDiv.textContent = filteredCountAllTime;
    document.body.appendChild(countDiv);
  }

  // Return methods for manual control
  return {
    addToFilter: uniqueId => {
      if (!filterList.includes(uniqueId)) {
        filterList.push(uniqueId);
        GM_setValue('filterList', filterList);
      }
    },
    removeFromFilter: uniqueId => {
      filterList = filterList.filter(id => id !== uniqueId);
      GM_setValue('filterList', filterList);
    },
    clearFilters: () => {
      GM_setValue('filterList', []);
      GM_setValue('filteredCount', 0);
      document.getElementById('filteredCountDiv').textContent = '0';
    },
  };
}

function waitNotExist(selector) {
  return new Promise(resolve => {
    if (!document.querySelector(selector)) {
      return resolve('at start');
    }

    const observer = new MutationObserver(() => {
      if (!document.querySelector(selector)) {
        observer.disconnect();
        return resolve('observer');
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  });
}
function waitForAll(selector) {
  // waitFor( '[role=main]' ).then( ( els ) => {} )

  return new Promise(resolve => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelectorAll(selector));
    }

    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        resolve(document.querySelectorAll(selector));
        observer.disconnect();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  });
}

function waitForNew(selector) {
  document.querySelectorAll(selector).forEach(item => {
    item.classList.add('waitForNewDone');
  });

  return new Promise(async resolve => {
    const newEl = await waitFor(`${selector}:not(.waitForNewDone)`);
    resolve(newEl);
  });
}

function eagerLoad(selector, load, scrollableEl = window) {
  let items = [];

  // for all the elements that exist at page load
  document.querySelectorAll(selector).forEach(item => {
    items.push(item);
  });
  // for the elements that appear after page load
  let observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(item => {
        if (item.nodeType === 1 && item.matches(selector)) items.push(item);
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });

  eventTrigger();
  scrollableEl.addEventListener('scroll', eventTrigger);
  'DOMContentLoaded load resize'.split(' ').forEach(event => {
    window.addEventListener(event, eventTrigger);
  });

  function eventTrigger() {
    items.forEach((item, index) => {
      if (item.getBoundingClientRect().top - window.innerHeight > 500) return; // 🛑
      items.splice(index, 1);
      load(item);
    });
  }
}
function lazyLoadWithObserver(selector, load, scrollableEl = window) {
  let items = [];

  // for all the elements that exist at page load
  document.querySelectorAll(selector).forEach(item => {
    items.push(item);
  });
  // for the elements that appear after page load
  let observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(item => {
        if (item.nodeType === 1 && item.matches(selector)) {
          items.push(item);
          lazy();
        }
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });

  lazy();
  scrollableEl.addEventListener('scroll', lazy);
  'DOMContentLoaded load resize'.split(' ').forEach(event => {
    window.addEventListener(event, lazy);
  });

  function lazy() {
    items.forEach((item, index) => {
      if (!isElementInViewport(item)) return; // 🛑
      items.splice(index, 1);
      load(item);
    });
  }
}
function lazyLoadScrollPast(
  selector,
  load,
  scrollableEl = window,
  direction = 'up'
) {
  let items = [];
  let enteredViewport = new WeakSet();
  let lastScrollPosition =
    window.pageYOffset || document.documentElement.scrollTop;

  // Validate direction parameter
  if (!['up', 'down', 'both'].includes(direction)) {
    throw new Error("Direction must be 'up', 'down', or 'both'");
  }

  // Initialize with existing elements
  document.querySelectorAll(selector).forEach(item => {
    items.push(item);
  });

  // Observer for dynamically added elements
  waitForEach(selector, item => {
    items.push(item);
    checkElements();
  });

  // Check if element has passed through viewport based on direction
  function hasPassedViewport(element) {
    const rect = element.getBoundingClientRect();
    const windowHeight =
      window.innerHeight || document.documentElement.clientHeight;
    const currentScrollPosition =
      window.pageYOffset || document.documentElement.scrollTop;
    const isScrollingUp = currentScrollPosition < lastScrollPosition;

    switch (direction) {
      case 'down':
        return isScrollingUp && rect.bottom > windowHeight;
      case 'up':
        return !isScrollingUp && rect.top < 0;
      case 'both':
        return rect.bottom < 0 || rect.top > windowHeight;
      default:
        return false;
    }
  }

  // Check if element is currently in viewport
  function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    const windowHeight =
      window.innerHeight || document.documentElement.clientHeight;
    return rect.top < windowHeight && rect.bottom > 0;
  }

  function checkElements() {
    const currentScrollPosition =
      window.pageYOffset || document.documentElement.scrollTop;

    items.forEach((item, index) => {
      // If element is in viewport, mark it
      if (isInViewport(item)) {
        enteredViewport.add(item);
      }
      // If element has been in viewport before and has passed through based on direction
      else if (enteredViewport.has(item) && hasPassedViewport(item)) {
        items.splice(index, 1);
        load(item);
      }
    });

    lastScrollPosition = currentScrollPosition;
  }

  // Add event listeners
  scrollableEl.addEventListener('scroll', checkElements);
  'DOMContentLoaded load resize'.split(' ').forEach(event => {
    window.addEventListener(event, checkElements);
  });

  // Initial check
  checkElements();
}
function lazyLoad(load, ...items) {
  lazy();
  'DOMContentLoaded load resize scroll'.split(' ').forEach(event => {
    window.addEventListener(event, lazy);
  });

  function lazy() {
    items.forEach((item, index) => {
      if (!isElementInViewport(item)) return; // 🛑
      items.splice(index, 1);
      load(item);
    });
  }
}

//  MARK: Page functionalities

async function setupYtDlpBtn(
  url,
  title,
  urlSelector,
  destinationPath,
  extraInfoFunc
) {
  const titleSegment = title ? `title:${title}::` : '';

  let ytDlpBtnEl = await waitFor('#yt-dlp-Btn');
  ytDlpBtnEl = removeListenersByCloning(ytDlpBtnEl);
  ytDlpBtnEl.addEventListener('click', () => {
    if (urlSelector) url = document.querySelector(urlSelector).href;
    const urlSegment = `url:${url}::`;

    const destinationSegment = destinationPath
      ? `destination:${destinationPath}::`
      : '';

    const extraInfoSegment = extraInfoFunc
      ? `extrainfo:${extraInfoFunc()}::`
      : '';

    GM_setClipboard(
      `initiate-ytdlp:${urlSegment}${titleSegment}${destinationSegment}${extraInfoSegment}`
    );
  });
  style(ytDlpBtnEl, `outline: solid red 2px;`);
}

function downloadImgWithTextFunctionality({
  siteName,
  imageElSelector,
  getDescription,
  locationHrefCondition,
  autofocus = false,
}) {
  waitForEach(imageElSelector, imgEl => {
    // if ( !location.href.includes( locationHrefCondition ) )
    //   return;

    const imgWrapperEl = imgEl.parentElement;
    if (imgWrapperEl.querySelector('#dlBtn')) return; // 🛑

    if (autofocus) GM_setClipboard(`global-document-ready-${document.title}`);

    const dlBtnEl = generateElements(
      `<button id=dlBtn>D</button>`,
      imgWrapperEl
    );
    style(
      dlBtnEl,
      `
            position: absolute;
            top: 0;
            right: 0;
            z-index: 1;
            background-color: black;
            color: white;
            border-radius: 5px;
            border: 5px;
        `
    );

    dlBtnEl.addEventListener('click', () => {
      const tempImg = GM_addElement('img', {
        src: imgEl.src,
        crossorigin: 'anonymous',
      });
      tempImg.addEventListener('load', async () => {
        let blob = await fetch(imgEl.src).then(r => r.blob());
        let uri = await new Promise(resolve => {
          let reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });

        // await waitFor( '#imagefx-seed-input' );

        const uniqueFileName = generateUniqueString(20);
        const descriptionText = getDescription(imgEl);
        const finalFileName = `${siteName} - ${uniqueFileName}`;

        if (!descriptionText) {
          alert('error');
          return;
        }

        downloadText(finalFileName, descriptionText);

        const link = generateElements(`<a></a>`, document.body);
        link.setAttribute('download', `${finalFileName}.png`);
        link.setAttribute('href', uri);
        link.click();
      });
    });
  });
}

function deepLoad({
  sourceSelector,
  loadFunction,
  targetEl = null,
  lazyLoad = true,
  deepLinkSelector = 'a',
}) {
  lazyLoadWithObserver(sourceSelector, async sourceEl => {
    const deepHref = sourceEl.querySelector(deepLinkSelector)?.href;
    if (!deepHref) return; // 🛑
    const doc = await fetchDoc(deepHref);
    if (!doc) return; // 🛑
    loadFunction(sourceEl, doc);
  });
}

//  MARK: Video related

function autoPip(videoEl) {
  // Check if PIP is supported
  if (!document.pictureInPictureEnabled) {
    console.warn('Picture-in-Picture is not supported in this browser');
    return;
  }

  let wasInViewport = isElementInViewport(videoEl);

  // Throttled scroll handler to check viewport status
  const checkViewportStatus = throttle(async () => {
    const isCurrentlyInViewport = isElementInViewport(videoEl);

    // Video left the viewport - enter PIP
    if (wasInViewport && !isCurrentlyInViewport) {
      try {
        // Only request PIP if not already in PIP mode
        if (document.pictureInPictureElement !== videoEl) {
          await videoEl.requestPictureInPicture();
        }
      } catch (error) {
        console.error('Failed to enter Picture-in-Picture mode:', error);
      }
    }

    // Video returned to viewport - exit PIP
    if (!wasInViewport && isCurrentlyInViewport) {
      try {
        // Only exit if this video is currently in PIP
        if (document.pictureInPictureElement === videoEl) {
          await document.exitPictureInPicture();
        }
      } catch (error) {
        console.error('Failed to exit Picture-in-Picture mode:', error);
      }
    }

    wasInViewport = isCurrentlyInViewport;
  }, 200);

  // Add scroll listener
  window.addEventListener('scroll', checkViewportStatus);

  // Also check on resize events
  window.addEventListener('resize', checkViewportStatus);

  // Initial check
  checkViewportStatus();

  // Return cleanup function
  return function cleanup() {
    window.removeEventListener('scroll', checkViewportStatus);
    window.removeEventListener('resize', checkViewportStatus);

    // Exit PIP if active
    if (document.pictureInPictureElement === videoEl) {
      document
        .exitPictureInPicture()
        .catch(err => console.error('Failed to exit PIP on cleanup:', err));
    }
  };
}

// MARK: Rest

function convertPlayerConfigStringToObject(configString) {
  try {
    // 1. Isolate the object literal part of the string.
    // We find the first '=' and take everything after it.
    const objectLiteralStartIndex = configString.indexOf('=');
    if (objectLiteralStartIndex === -1) {
      throw new Error('String does not appear to be an assignment.');
    }

    let objectLiteralString = configString
      .substring(objectLiteralStartIndex + 1)
      .trim();

    // Remove a potential trailing semicolon
    if (objectLiteralString.endsWith(';')) {
      objectLiteralString = objectLiteralString.slice(0, -1);
    }

    // 2. Use the Function constructor to "evaluate" the object literal string.
    // This will execute the JSON.parse() calls and the boolean comparisons.
    // The 'JSON' object needs to be available in the scope where this function runs.
    // (It is a standard built-in object in JavaScript environments).
    const func = new Function(`return ${objectLiteralString};`);
    const resultObject = func();

    return resultObject;
  } catch (error) {
    console.error('Failed to convert string to object:', error);
    // Depending on your needs, you might want to throw the error,
    // return null, or return a specific error object.
    return null;
  }
}

/**
 * Enum for visibility modes.
 * @readonly
 * @enum {string}
 */
const VisibilityMode = {
  /** Return elements that are at least partially visible */
  PARTIAL: 'partial',
  /** Return only elements that are fully visible */
  FULL: 'full',
  /** If none are fully visible, return the most visible one (area %); otherwise return fully visible */
  MAX_PERCENTAGE: 'maxPercentage',
};

/**
 * Finds elements within the current viewport based on the specified mode.
 *
 * @param {string} selector - A CSS selector string to identify the elements to check.
 * @param {VisibilityMode} [mode=VisibilityMode.PARTIAL] - The visibility mode to use. Defaults to PARTIAL.
 * @returns {Element[]} An array of elements matching the criteria.
 */
function getVisibleElements(selector, mode = VisibilityMode.MAX_PERCENTAGE) {
  const elements = document.querySelectorAll(selector);
  if (!elements.length) {
    return []; // No elements match the selector
  }

  const viewportHeight =
    window.innerHeight || document.documentElement.clientHeight;
  const viewportWidth =
    window.innerWidth || document.documentElement.clientWidth;

  const partiallyVisible = [];
  const fullyVisible = [];
  let elementWithMaxPercentage = null;
  let maxPercentage = -1; // Use -1 to ensure any visibility is greater

  elements.forEach(element => {
    const rect = element.getBoundingClientRect();

    // Basic check: Ignore elements with no dimensions or hidden via display:none
    // Note: This doesn't catch visibility:hidden or opacity:0
    if (rect.width === 0 || rect.height === 0) {
      return;
    }

    // --- Visibility Calculations ---

    // 1. Calculate Intersection Area (for percentage)
    const intersectTop = Math.max(rect.top, 0);
    const intersectBottom = Math.min(rect.bottom, viewportHeight);
    const intersectLeft = Math.max(rect.left, 0);
    const intersectRight = Math.min(rect.right, viewportWidth);

    const intersectWidth = intersectRight - intersectLeft;
    const intersectHeight = intersectBottom - intersectTop;

    const intersectionArea =
      intersectWidth > 0 && intersectHeight > 0
        ? intersectWidth * intersectHeight
        : 0;

    // 2. Check for Partial Visibility (any overlap)
    // An element is partially visible if its intersection area is greater than 0
    const isPartiallyVisible = intersectionArea > 0;
    // Alternative check (sometimes slightly faster if percentage isn't needed otherwise):
    // const isPartiallyVisible =
    //   rect.bottom > 0 &&
    //   rect.top < viewportHeight &&
    //   rect.right > 0 &&
    //   rect.left < viewportWidth;

    // 3. Check for Full Visibility
    const isFullyVisible =
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= viewportHeight &&
      rect.right <= viewportWidth;

    // --- Store Results Based on Calculations ---

    if (isPartiallyVisible) {
      partiallyVisible.push(element); // Collect all partially visible

      if (isFullyVisible) {
        fullyVisible.push(element); // Collect all fully visible
      }

      // Calculate percentage ONLY if needed for maxPercentage mode or potentially for sorting later
      if (mode === VisibilityMode.MAX_PERCENTAGE || intersectionArea > 0) {
        // Calculate if needed or valid
        const elementArea = rect.width * rect.height;
        // Avoid division by zero for safety, though we checked width/height earlier
        const currentPercentage =
          elementArea > 0 ? (intersectionArea / elementArea) * 100 : 0;

        if (currentPercentage > maxPercentage) {
          maxPercentage = currentPercentage;
          elementWithMaxPercentage = element;
        }
      }
    }
  }); // End forEach element

  // --- Return Results Based on Mode ---

  switch (mode) {
    case VisibilityMode.FULL:
      return fullyVisible;

    case VisibilityMode.MAX_PERCENTAGE:
      // If any elements are fully visible, return them per the requirement clarification.
      // Otherwise, return the single element with the maximum percentage of visibility.
      if (fullyVisible.length > 0) {
        return fullyVisible;
      } else if (elementWithMaxPercentage) {
        return [elementWithMaxPercentage]; // Return as an array
      } else {
        return []; // No elements were even partially visible
      }

    case VisibilityMode.PARTIAL: // Default case
    default:
      return partiallyVisible;
  }
}

function addFaviconToLink(linkEl, faviconUrl = null, position = 'before') {
  if (!faviconUrl) {
    const googleUserContHref = `https://s2.googleusercontent.com/s2/favicons?`;
    const domain = linkEl.href.match(/\/\/(.*)\..*\//);
    const completeDomain = `https://${domain[0].replaceAll('//', '')}`;
    faviconUrl = `${googleUserContHref}domain_url=${completeDomain}`;
  }
  const faviconImgEl = generateElements(`<img src=${faviconUrl}>`);
  style(faviconImgEl, `margin: 0 3px;`);
  if (position === 'before') {
    linkEl.prepend(faviconImgEl);
  } else {
    linkEl.append(faviconImgEl);
  }
}

function getSecret(valueKey = 'apiKey') {
  let secretValue = GM_getValue(valueKey, '');
  if (secretValue) return secretValue;

  secretValue = prompt(`Please enter your ${valueKey} value:`);
  if (!secretValue) return;

  GM_setValue(valueKey, secretValue);
  return secretValue;
}

function scrollElementToCursor(element, event = null, options = {}) {
  // Default options
  const settings = {
    behavior: options.behavior || 'smooth',
    offsetY: options.offsetY || 0,
  };

  // Store the last known mouse position
  if (!window._lastKnownMousePos) {
    window._lastKnownMousePos = { x: 0, y: 0 };

    // Set up a global mouse move listener to track cursor position
    document.addEventListener('mousemove', e => {
      window._lastKnownMousePos.x = e.clientX;
      window._lastKnownMousePos.y = e.clientY;
    });
  }

  // Get current mouse position
  const mousePos = event
    ? { x: event.clientX, y: event.clientY }
    : window._lastKnownMousePos;

  if (!element) {
    console.error('scrollElementToCursor: No element provided');
    return;
  }

  // Get element's position information
  const elementRect = element.getBoundingClientRect();

  // Calculate new scroll position
  // Current scroll position + element's top position + half element height - cursor Y position
  const elementCenter = elementRect.height / 2;
  const scrollY =
    window.scrollY +
    elementRect.top +
    elementCenter -
    mousePos.y +
    settings.offsetY;

  // Perform the scroll
  window.scrollTo({
    top: scrollY,
    behavior: settings.behavior,
  });

  return {
    element,
    scrollPosition: scrollY,
    mousePosition: { ...mousePos },
    elementHeight: elementRect.height,
    elementCenter: elementCenter,
  };
}

function getAccentColorFromFavicon() {
  return new Promise(resolve => {
    // Find the favicon
    const faviconElement =
      document.querySelector("link[rel*='icon']") ||
      document.createElement('link');

    const faviconUrl = faviconElement.href || '/favicon.ico';

    // Create an image element to load the favicon
    const img = new Image();
    img.crossOrigin = 'Anonymous'; // This allows us to work with images from other domains
    img.src = faviconUrl;

    img.onload = function () {
      // Create a canvas to draw the image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0, img.width, img.height);

      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Analyze colors
      const colors = [];
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        // Skip fully transparent pixels
        if (a === 0) continue;

        colors.push({ r, g, b });
      }

      // Find the most vibrant color
      let accentColor = { r: 0, g: 0, b: 0 };
      let maxSaturation = 0;

      for (let color of colors) {
        const [h, s, l] = rgbToHsl(color.r, color.g, color.b);

        // Choose the color with highest saturation, avoiding too dark or too light colors
        if (s > maxSaturation && l > 0.3 && l < 0.7) {
          maxSaturation = s;
          accentColor = color;
        }
      }

      resolve(`rgb(${accentColor.r}, ${accentColor.g}, ${accentColor.b})`);
    };

    img.onerror = function () {
      // If favicon couldn't be loaded, return a default color
      resolve('#000000');
    };
  });
}

function getAccentColor() {
  // Step 1: Extract colors from the page
  const elements = document.getElementsByTagName('*');
  const colors = [];

  for (let element of elements) {
    const style = window.getComputedStyle(element);
    const backgroundColor = style.getPropertyValue('background-color');
    const color = style.getPropertyValue('color');

    if (backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)') {
      colors.push(backgroundColor);
    }
    if (color) {
      colors.push(color);
    }
  }

  // Step 2: Analyze colors to find a suitable accent color
  const uniqueColors = [...new Set(colors)];
  let accentColor = '#000000'; // Default to black
  let maxSaturation = 0;

  for (let color of uniqueColors) {
    const [r, g, b] = color.match(/\d+/g).map(Number);

    const [h, s, l] = rgbToHsl(r, g, b);

    // Choose the color with highest saturation, avoiding too dark or too light colors
    if (s > maxSaturation && l > 0.3 && l < 0.7) {
      maxSaturation = s;
      accentColor = color;
    }
  }

  return accentColor;
}

// Helper function to convert RGB to HSL
function rgbToHsl(r, g, b) {
  (r /= 255), (g /= 255), (b /= 255);
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return [h, s, l];
}

function copyImageToClipboard(img) {
  if (navigator.clipboard && navigator.clipboard.write) {
    // Modern method using Clipboard API
    img.crossOrigin = 'anonymous';
    img.onload = function () {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d').drawImage(img, 0, 0);
      canvas.toBlob(blob => {
        navigator.clipboard
          .write([new ClipboardItem({ 'image/png': blob })])
          .then(() => {
            console.log('Image copied to clipboard successfully');
          })
          .catch(err => {
            console.error('Error copying image to clipboard:', err);
            fallbackCopyMethod(img);
          });
      }, 'image/png');
    };
    img.onerror = function () {
      console.error('Error loading image for clipboard');
      fallbackCopyMethod(img);
    };
    // Trigger a reload to ensure we have permission to read the image data
    img.src = img.src;
  } else {
    // Fallback for browsers without Clipboard API support
    fallbackCopyMethod(img);
  }
}

function fallbackCopyMethod(img) {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  canvas.getContext('2d').drawImage(img, 0, 0);
  const dataURL = canvas.toDataURL('image/png');

  GM_setClipboard(dataURL, 'text/html');
  console.log('Image copied to clipboard using fallback method');
}

function getFaviconUrl() {
  const links = document.querySelectorAll(
    'link[rel~="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]'
  );
  if (links.length > 0) {
    return links[0].href;
  } else {
    // Optionally return a default favicon if none is found
    return '/favicon.ico';
  }
}

function addAiImageDownloadButtons() {}

function isIterable(obj) {
  // checks for null and undefined
  if (obj == null) {
    return false;
  }
  return typeof obj[Symbol.iterator] === 'function';
}

function getTextNodes(el) {
  let textNodes = [];
  el.childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) textNodes.push(node);
  });
  return textNodes;
}

async function load(url, selector, parent) {
  const html = await fetchDoc(url, null, true);
  const doc = generateDoc(html);
  const selected = doc.querySelectorAll(selector);
  if (parent) {
    parent.append(selected);
  }
  return selected;
}

function fetchDoc(url, headers = '', returnHtml) {
  return new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      method: 'GET',
      url: url,
      headers: headers,
      responseType: 'document',
      onload: response => {
        const resText = response.responseText;
        if (!resText) {
          reject('no response text');
          return false;
        }
        if (returnHtml) resolve(resText);
        const tempDoc = generateDoc(resText, true);
        resolve(tempDoc);
      },
      onerror: obj => reject(obj.error),
      ontimeout: obj => reject(obj),
    });
  });
}
function GMXmlHttpRequestAsync(url) {
  return new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      url: url,
      onload: response => {
        resolve(response.response);
      },
      onerror: () => reject('onerror'),
      ontimeout: () => reject('ontimeout'),
    });
    // function errorFunction () { reject( 'error loading page' ) }
  });
}
async function GMXmlHttpReqResponse(url) {
  const promise = new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      method: 'GET',
      url: url,
      responseType: 'document',
      onload: function (response) {
        resolve(response.responseText);
      },
      onerror: () => {
        reject('error');
      },
    });
  });
  return await promise;
}
function sanitizeLocationHref() {
  const url = new URL(location.href);
  const cleanUrl = url.origin + url.pathname + url.hash;
  window.history.pushState(null, null, cleanUrl);
}
function sanitizeLinksTraditional(urlString) {
  try {
    const url = new URL(urlString);
    const cleanUrl = url.origin + url.pathname + url.hash;
    return cleanUrl;
  } catch (error) {
    console.error('Invalid URL provided:', error);
    return urlString;
  }
}
function sanitizeTrackingLinks(
  selector,
  mainTrackerRegex,
  secondaryTrackerRegex
) {
  document.querySelectorAll(selector).forEach(link => {
    link.removeAttribute('data-saferedirecturl');
    let newHref = link.href.replace(mainTrackerRegex, '');
    newHref = decodeURIComponent(newHref);
    if (!secondaryTrackerRegex) {
      link.href = newHref;
      return;
    }
    newHref = newHref.replace(secondaryTrackerRegex, '');
    link.href = newHref;
  });
}

function beep(duration, frequency, volume, type, callback) {
  var audioCtx = new (window.AudioContext ||
    window.webkitAudioContext ||
    window.audioContext)();

  //All arguments are optional:

  //duration of the tone in milliseconds. Default is 500
  //frequency of the tone in hertz. default is 440
  //volume of the tone. Default is 1, off is 0.
  //type of tone. Possible values are sine, square, sawtooth, triangle, and custom. Default is sine.
  //callback to use on end of tone
  var oscillator = audioCtx.createOscillator();
  var gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  if (volume) {
    gainNode.gain.value = volume;
  }
  if (frequency) {
    oscillator.frequency.value = frequency;
  }
  if (type) {
    oscillator.type = type;
  }
  if (callback) {
    oscillator.onended = callback;
  }

  oscillator.start(audioCtx.currentTime);
  oscillator.stop(audioCtx.currentTime + (duration || 500) / 1000);
}

function markElAsProcessed(el, markedEls, execute) {
  if (markedEls.includes(el) === false) {
    markedEls.push(el);
    execute(el);
  }
}

function generateAllYouTubeSbUrls(fullYTHtml) {
  //# Based on:
  // https://github.com/hjk789/Userscripts/tree/master/YouTube-Clickbait-Buster
  // Enhanced with dynamic quality selection from iG8R/YouTube-Mouseover-Preview

  try {
    const resText = fullYTHtml;
    const fullStoryboardURL = resText.match(
      /"playerStoryboardSpecRenderer":.+?"spec":"(.+?)"/
    );

    if (!fullStoryboardURL) {
      console.warn('[YT-Storyboard] No storyboard spec found');
      return { allUrls: [], trueNoOfSlots: 0, samplingFq: 0 };
    }

    const rawSpecStr = fullStoryboardURL[1];

    // Check for ad storyboards
    if (rawSpecStr.includes('googleadservices')) {
      console.warn(
        '[YT-Storyboard] Ad storyboard detected, not video storyboard'
      );
      return { allUrls: [], trueNoOfSlots: 0, samplingFq: 0 };
    }

    // Parse storyboard spec format: URL|Level0Data|Level1Data|Level2Data|...
    const parts = rawSpecStr.split('|');
    const urlBase = parts[0]; // The URL template

    if (parts.length < 2) {
      console.warn('[YT-Storyboard] Invalid storyboard format');
      return { allUrls: [], trueNoOfSlots: 0, samplingFq: 0 };
    }

    // --- DYNAMIC QUALITY SELECTION: Find the highest resolution level ---
    let bestData = null;
    let bestRes = 0;
    let bestIndex = 0;

    // Iterate through all quality levels (parts[1] = Level 0, parts[2] = Level 1, etc.)
    for (let i = 1; i < parts.length; i++) {
      const levelStr = parts[i];
      // Format: Width#Height#Count#Cols#Rows#IntervalMs#Name#Signature#...
      const chunks = levelStr.split('#');

      // Need at least: width, height, count, cols, rows, and signature
      if (chunks.length < 5) continue;

      const w = parseInt(chunks[0], 10);
      const h = parseInt(chunks[1], 10);
      const count = parseInt(chunks[2], 10);
      const cols = parseInt(chunks[3], 10);
      const rows = parseInt(chunks[4], 10);
      const sig = chunks[chunks.length - 1]; // Signature is always last

      if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) continue;

      const res = w * h; // Calculate resolution

      // Select the highest resolution available
      if (res > bestRes) {
        bestRes = res;
        bestIndex = i - 1; // Level index for URL (parts[0] is URL, so subtract 1)
        bestData = {
          width: w,
          height: h,
          frameCount: count,
          cols: cols,
          rows: rows,
          signature: sig,
        };
      }
    }

    if (!bestData) {
      console.warn('[YT-Storyboard] No valid quality level found');
      return { allUrls: [], trueNoOfSlots: 0, samplingFq: 0 };
    }

    console.log(
      `[YT-Storyboard] Selected Level ${bestIndex}: ${bestData.width}x${bestData.height}px`
    );

    // Construct the URL with the best quality level
    let baseUrl = urlBase.replace(/\\/g, '').replace('$L', bestIndex);

    // Append signature parameter
    if (baseUrl.indexOf('?') === -1) {
      baseUrl += `?sigh=${bestData.signature}`;
    } else {
      baseUrl += `&sigh=${bestData.signature}`;
    }

    // Extract video length for sampling frequency calculation
    const lengthMatch = resText.match(/"lengthSeconds":"(\d+)"/);
    if (!lengthMatch) {
      console.warn('[YT-Storyboard] Could not determine video length');
      return { allUrls: [], trueNoOfSlots: 0, samplingFq: 0 };
    }

    const videoLength = parseInt(lengthMatch[1], 10);

    // Calculate sampling frequency based on video length
    const samplingFq =
      videoLength <= 120
        ? 1
        : videoLength <= 300
        ? 2
        : videoLength < 900
        ? 5
        : 10;

    const trueNoOfSlots = Math.round(videoLength / samplingFq);

    // Calculate number of storyboard sheets needed
    const framesPerSheet = bestData.cols * bestData.rows;
    const numSheets = Math.ceil(bestData.frameCount / framesPerSheet);

    // Generate all storyboard URLs
    let allUrls = [];
    for (let i = 0; i < numSheets; i++) {
      const url = baseUrl.replace('$N', `M${i}`);
      allUrls.push(url);
    }

    console.log(
      `[YT-Storyboard] Generated ${allUrls.length} URLs for ${trueNoOfSlots} slots`
    );

    return {
      allUrls,
      trueNoOfSlots,
      samplingFq,
      quality: { width: bestData.width, height: bestData.height },
      framesPerSheet,
    };
  } catch (error) {
    console.error('[YT-Storyboard] Error parsing storyboard:', error);
    return { allUrls: [], trueNoOfSlots: 0, samplingFq: 0 };
  }
}

function makeElementDraggableAndResizable(element) {
  let isDragging = false;
  let isResizing = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;

  // Create and append resize handle
  const resizeHandle = document.createElement('div');
  resizeHandle.style.cssText = `
        width: 10px;
        height: 10px;
        background-color: #666;
        position: absolute;
        right: 0;
        bottom: 0;
        cursor: se-resize;
    `;
  element.appendChild(resizeHandle);

  // Make sure the element is positioned relatively or absolutely
  if (getComputedStyle(element).position === 'static') {
    element.style.position = 'relative';
  }

  // Add necessary styles
  element.style.cursor = 'move';
  element.style.userSelect = 'none';

  // Drag functionality
  function dragStart(e) {
    if (e.target === resizeHandle) return;

    isDragging = true;

    if (e.type === 'touchstart') {
      initialX = e.touches[0].clientX - xOffset;
      initialY = e.touches[0].clientY - yOffset;
    } else {
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
    }
  }

  function dragEnd() {
    isDragging = false;
    isResizing = false;
    initialX = currentX;
    initialY = currentY;
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();

      if (e.type === 'touchmove') {
        currentX = e.touches[0].clientX - initialX;
        currentY = e.touches[0].clientY - initialY;
      } else {
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
      }

      xOffset = currentX;
      yOffset = currentY;

      element.style.transform = `translate(${currentX}px, ${currentY}px)`;
    }
  }

  // Resize functionality
  function resizeStart(e) {
    if (e.target === resizeHandle) {
      isResizing = true;
      e.stopPropagation();
    }
  }

  function resize(e) {
    if (isResizing) {
      e.preventDefault();

      const rect = element.getBoundingClientRect();
      let width, height;

      if (e.type === 'touchmove') {
        width = e.touches[0].clientX - rect.left;
        height = e.touches[0].clientY - rect.top;
      } else {
        width = e.clientX - rect.left;
        height = e.clientY - rect.top;
      }

      // Set minimum size
      width = Math.max(50, width);
      height = Math.max(50, height);

      element.style.width = width + 'px';
      element.style.height = height + 'px';
    }
  }

  // Add event listeners
  element.addEventListener('mousedown', dragStart);
  element.addEventListener('touchstart', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('touchmove', drag);
  document.addEventListener('mouseup', dragEnd);
  document.addEventListener('touchend', dragEnd);

  resizeHandle.addEventListener('mousedown', resizeStart);
  resizeHandle.addEventListener('touchstart', resizeStart);
  document.addEventListener('mousemove', resize);
  document.addEventListener('touchmove', resize);
}

function makeDraggable(element) {
  let pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;
  const header = document.getElementById('contPanelHeader');

  if (header) {
    header.onmousedown = dragMouseDown;
  } else {
    element.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    element.style.top = element.offsetTop - pos2 + 'px';
    element.style.left = element.offsetLeft - pos1 + 'px';
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

function dragElement(targetEl, dragHandleEl) {
  targetEl.style.position = 'fixed';
  var pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;

  if (dragHandleEl) dragHandleEl.onmousedown = dragMouseDown;
  else targetEl.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    targetEl.style.top = targetEl.offsetTop - pos2 + 'px';
    targetEl.style.left = targetEl.offsetLeft - pos1 + 'px';
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

function blink(element, interval, numberOfTimes) {
  return new Promise(async resolve => {
    element.style.transform = 'scale(1.3,1.3)';
    await asyncTimeout(interval);
    element.style.transform = '';
    await asyncTimeout(interval);
    element.style.transform = 'scale(1.3,1.3)';
    await asyncTimeout(interval);
    element.style.transform = '';
    resolve;
  });
}

function setHash(newHash) {
  // Get current hash without the '#'
  const currentHash = window.location.hash.slice(1);
  // Only update if the new hash is different from current
  if (currentHash !== newHash) {
    window.history.replaceState(null, null, '#' + newHash);
  }
}

function toggleHash(newHash) {
  window.history.replaceState(null, null, '#' + newHash);
}

function fauxHistoryPushState(url, timeout = 3000) {
  const backgroundTab = GM_openInTab(url, true);
  setTimeout(() => {
    backgroundTab.close();
  }, timeout);
}

function addHistoryEntry(newUrl) {
  const originalUrl = location.href;
  history.pushState({ state: 1 }, 'new state', newUrl);
  history.pushState({ state: 1 }, 'new state', originalUrl);
}

function removeEmptytextEls(parent) {
  const divsOrPs = parent.querySelectorAll('div, p');
  divsOrPs.forEach(el => {
    if (!el.textContent.trim()) {
      el.remove();
    }
  });
}

/**
 * Modern browsers can download files that aren't from same origin this is a workaround to download a remote file
 * @param `url` Remote URL for the file to be downloaded
 */

function Download({ url, filename }) {
  const [fetching, setFetching] = useState(false);

  const [error, setError] = useState(false);

  const download = (url, name) => {
    if (!url) {
      throw new Error('Resource URL not provided! You need to provide one');
    }
    setFetching(true);
    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        setFetching(false);
        const blobURL = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobURL;

        a.style = 'display: none';

        if (name && name.length) a.download = name;
        document.body.appendChild(a);
        a.click();
      })
      .catch(() => setError(true));
  };

  // return (
  //     <button
  //         disabled={ fetching }
  //         onClick={ () => download( url, filename ) }
  //         aria-label="download gif"
  //     >
  //         DOWNLOAD
  //     </button>
  // )
}

function isElementInViewport(el) {
  // Special bonus for those using jQuery

  if (typeof jQuery === 'function' && el instanceof jQuery) {
    el = el[0];
  }

  var rect = el.getBoundingClientRect();

  return (
    rect.top >= 0 &&
    // rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
    // && /* or $(window).height() */ rect.right <= ( window.innerWidth || document.documentElement.clientWidth ) /* or $(window).width() */
  );
}

const downloadFile = file => {
  const element = document.createElement('a');
  element.setAttribute('href', 'Download Btn');
  element.setAttribute('download', file);

  element.style.display = 'none';

  document.body.appendChild(element);

  element.click();
  document.body.removeChild(element);
};

// var saveData = ( function () {
//     var a = document.createElement( "a" );
//     document.body.appendChild( a );
//     a.style = "display: none";
//     return function ( data, fileName ) {
//         var json = JSON.stringify( data ),
//             blob = new Blob( [ json ], { type: "octet/stream" } ),
//             url = window.URL.createObjectURL( blob );
//         a.href = url;
//         a.download = fileName;
//         a.click();
//         window.URL.revokeObjectURL( url );
//     };
// }() );

function isInIframe() {
  return window !== window.parent;
}

function iframeRef(frameRef) {
  return frameRef.contentWindow
    ? frameRef.contentWindow.document
    : frameRef.contentDocument;
}

// MARK: Dom manipulations

function removeListenersByCloning(element) {
  if (!element || !(element instanceof Element)) {
    throw new Error('Please provide a valid DOM element');
  }
  const clone = element.cloneNode(true);
  element.parentNode.replaceChild(clone, element);
  return clone;
}

function empty(element) {
  element.childNodes.forEach(node => {
    node.remove();
  });
}

// MARK: JQ Alternatives
//# JQ Alternatives

function nextAll(element, selector, includeSelf = false) {
  const siblings = [];
  if (includeSelf) siblings.push(element);

  let currentElement = element.nextElementSibling;
  console.log(currentElement);
  while (currentElement) {
    if (!selector || currentElement.matches(selector)) {
      siblings.push(currentElement);
    }
    currentElement = currentElement.nextElementSibling;
  }
  return siblings;
}

function convertElementType(element, newType) {
  // Input validation
  if (!(element instanceof HTMLElement)) {
    throw new Error('First parameter must be an HTML element');
  }
  if (typeof newType !== 'string' || !newType.trim()) {
    throw new Error('Second parameter must be a valid element type string');
  }

  // Create the new element
  const newElement = document.createElement(newType.toLowerCase());

  // Copy all attributes
  Array.from(element.attributes).forEach(attr => {
    newElement.setAttribute(attr.name, attr.value);
  });

  // Copy all child nodes
  Array.from(element.childNodes).forEach(child => {
    newElement.appendChild(child.cloneNode(true));
  });

  // Copy event listeners if using jQuery
  if (window.jQuery) {
    const events = jQuery._data(element, 'events');
    if (events) {
      for (let type in events) {
        events[type].forEach(event => {
          jQuery(newElement).on(type, event.handler);
        });
      }
    }
  }

  // Replace the old element with the new one
  if (element.parentNode) {
    element.parentNode.replaceChild(newElement, element);
  }

  return newElement;
}

function elementsToArray(els) {
  return els instanceof Element ? [els] : els;
}

function contains(selector, text, parent = document) {
  const elsContaining = [...parent.querySelectorAll(selector)].filter(el =>
    el.textContent.includes(text)
  );
  return elsContaining;
}

/**
 * Returns the first element that matches the selector from the following siblings
 * @param {Element} element - The reference element
 * @param {string} [selector] - Optional CSS selector to match siblings against
 * @returns {Element|null} The first matching sibling element or null if none found
 */
function next(element, selector) {
  // Get the next sibling
  let sibling = element.nextElementSibling;

  // If no selector is provided, return the first sibling
  if (!selector) {
    return sibling;
  }

  // Loop through siblings until we find a match or run out of siblings
  while (sibling) {
    if (sibling.matches(selector)) {
      return sibling;
    }
    sibling = sibling.nextElementSibling;
  }

  // Return null if no matches were found
  return null;
}

/**
 * Returns the first element that matches the selector from the preceding siblings
 * @param {Element} element - The reference element
 * @param {string} [selector] - Optional CSS selector to match siblings against
 * @returns {Element|null} The first matching sibling element or null if none found
 */
function prev(element, selector) {
  // Get the previous sibling
  let sibling = element.previousElementSibling;

  // If no selector is provided, return the first sibling
  if (!selector) {
    return sibling;
  }

  // Loop through siblings until we find a match or run out of siblings
  while (sibling) {
    if (sibling.matches(selector)) {
      return sibling;
    }
    sibling = sibling.previousElementSibling;
  }

  // Return null if no matches were found
  return null;
}

async function fadeOut(targetEl, duration) {
  if (!duration) duration = 250;
  targetEl.style.transition = `opacity ${duration / 1000}s`;
  targetEl.style.opacity = 0;
  await asyncTimeout(duration);
  targetEl.style.display = 'none';
}

async function fadeIn(targetEl, duration) {
  if (!duration) duration = 250;
  targetEl.style.transition = `opacity ${duration / 1000}s`;
  targetEl.style.opacity = 0;
  targetEl.style.display = '';
  targetEl.style.opacity = 1;
}

function fadeToggle(targetEls, duration) {
  const elementsArray = elementsToArray(targetEls);
  elementsArray.forEach(item => {
    if (item.style.display == 'none') {
      fadeIn(item, duration);
    } else {
      fadeOut(item, duration);
    }
  });
}

function toggle(els) {
  const elementsArray = elementsToArray(els);
  elementsArray.forEach(el => {
    if (el.style.display == 'none') {
      el.style.display = '';
    } else {
      el.style.display = 'none';
    }
  });
}

function wrap(wrapperHtml, ...els) {
  const wrappingElement = generateElements(wrapperHtml, null, true);
  els[0].before(wrappingElement);

  wrappingElement.append(...els);
  return wrappingElement;
}

function unwrapItself(el) {
  el.replaceWith(...el.childNodes);
}

function unwrapOuter(el, levels = 1) {
  unwrapItself(el.parentElement);
}

/**
 * Find all ancestor elements of the given element up to (but not including) a specified element or selector
 *
 * @param {Element} element - The starting element to find parents from
 * @param {string|Element} until - Selector string or Element to stop at (not included in result)
 * @param {string} [filter] - Optional selector to filter the result set
 * @return {Element[]} Array of ancestor elements in order from closest to farthest
 */
function parentsUntil(element, until, filter) {
  // Validate element parameter
  if (!(element instanceof Element)) {
    throw new Error('First parameter must be a DOM Element');
  }

  const result = [];
  let current = element.parentElement;

  // If until is a selector string, prepare to match against it
  const isUntilSelector = typeof until === 'string';

  // Function to check if we've reached the "until" element/selector
  const isUntilElement = isUntilSelector
    ? el => el && el.matches(until)
    : el => el === until;

  // Walk up the DOM until we find the "until" element or reach the document
  while (current && !isUntilElement(current)) {
    // If a filter is provided, only add elements that match it
    if (!filter || current.matches(filter)) {
      result.push(current);
    }
    current = current.parentElement;
  }

  return result;
}

function parents(el, selector) {
  const parents = [];
  while ((el = el.parentNode) && el !== document) {
    if (!selector || el.matches(selector)) parents.push(el);
  }
  return parents;
}

function grandParent(child, iterations) {
  let currentIteration = iterations;
  let parent = child.parentNode;

  if (currentIteration === 1) return parent;

  return grandParent(parent, currentIteration - 1);
}

function generateDoc(html, returnTrusted) {
  let escapeHTMLPolicy;

  escapeHTMLPolicy = trustedTypes.createPolicy('forceInner', {
    createHTML: to_escape => to_escape,
  });

  const template = document.createElement('template');
  document.body.prepend(template);

  template.innerHTML = escapeHTMLPolicy.createHTML(html.trim());

  const templateContent = template.content;
  template.remove();
  return templateContent;
  // return template.content;
}

function generateElements(html, parent, returnTrusted) {
  const doc = generateDoc(html, returnTrusted);
  const children = doc.children;
  let returnChildren = [...children];
  if (parent) {
    returnChildren.length = 0;
    for (const child of children) {
      returnChildren.push(parent.appendChild(child));
    }
  }
  return returnChildren.length === 1 ? returnChildren[0] : returnChildren;
}

function replaceWith(toBeReplacedEl, html) {
  const newEl = generateElements(html);
  toBeReplacedEl.parentNode.replaceChild(newEl, toBeReplacedEl);
  return newEl;
}

// MARK: Functions for global script
//# Functions for global script

function generateToolbarButton(text, parent, popup, onclick) {
  const button = generateElements(`<button class=popupButton>${text}</button>`);

  const collapsibleContent = document.querySelector(`#collapsibleContent`);
  parent.append(button);
  // calculateWidthAndExpand( collapsibleContent );
  if (popup) {
    button.addEventListener('click', () => {
      togglePopup(popup);
    });
  }
  if (onclick) button.addEventListener('click', onclick);
  return button;
}

// function createToolbarPopup () {
//     const toolbarPopup = generateElements( '<div></div>' );
//     toolbarPopup.classList.add( 'toolbarPopup' );
//     toolbarPopup.style = `
//         font-size:  large;
//         max-height: 50vh;
//         position:   absolute;
//         overflow:   auto;
//         display:    none;
//         background-color: gray;
//     `;
//     collapsibleContent.append( toolbarPopup );
//     return toolbarPopup;
// }
function createToolbarPopup(collapsibleContent) {
  const toolbarPopup = generateElements('<div></div>');

  toolbarPopup.classList.add('toolbarPopup');

  toolbarPopup.style = `
        font-size:  large;
        max-height: 50vh;
        position:   absolute;
        overflow:   auto;
        display:    none;
        background-color: gray;
    `;
  collapsibleContent.append(toolbarPopup);
  return toolbarPopup;
}

function togglePopup(popup) {
  toggle(popup);
  const popupHeight = getComputedStyle(popup).height.replace(/px$/, '');
  popup.style.top = `-${+popupHeight + 5}px`;
}

function calculateWidthAndExpand(collapsibleContent) {
  let totalWidth = 0;
  for (const child of collapsibleContent.children) {
    let widthValue = +getStyleOrComputedStyle(child, 'width').replace('px', '');
    let marginValue = +getStyleOrComputedStyle(child, 'margin').replace(
      'px',
      ''
    );
    totalWidth += (widthValue ? widthValue : 0) + marginValue * 2;
  }
  collapsibleContent.style.width = `${totalWidth}px`;
}

// MARK: Site specific functions

function getStreamwishQuery() {
  const doodHosts = ['peytonepre'];
  const doodHostsQuery = doodHosts.map(host => `[href*="${host}"]`).join(',');
  return doodHostsQuery;
}

function getDoodHostsQuery() {
  const doodHosts = [
    'dsvplay',
    'd-s',
    'vidply',
    'dood',
    'do7go',
    'd000d',
    'ds2video',
    'do0od',
    'dooood',
    'ds2play',
    'd000d',
    'd000d',
    'doply',
    'vide0',
    'dooodster',
  ];
  const doodHostsQuery = doodHosts.map(host => `[href*="${host}"]`).join(',');
  return doodHostsQuery;
}

async function getDoodStoryboardSrc(url, linkEl = null) {
  const outdatedHostNames = ['ds2play.com', 'doodstream.com', 'd-s.io'];

  const urlObj = new URL(url);
  if (outdatedHostNames.includes(urlObj.hostname)) {
    // If the URL is from an outdated host, we need to update it to the new doodcdn.io format
    url = url.replace(urlObj.hostname, 'dsvplay.com');
    if (linkEl) {
      linkEl.href = url; // Update the link element's href if provided
    }
  }

  const doodDoc = await fetchDoc(url);
  const metaEl = doodDoc.querySelector('meta[name="og:image"]');
  const matches = metaEl.content.match(/(snaps|splash)\/(.+?)\./);
  if (!matches || matches.length < 2) {
    throw new Error('Could not find storyboard image ID in meta content');
  }
  const imgId = matches[2];
  const storyboardUrl = `https://imagecdn.co/slides/${imgId}.jpg`;
  return storyboardUrl;
}

async function getVoeStoryboardImg(voeUrl) {
  const levelOneHtml = await fetchDoc(voeUrl, null, true);
  const levelTwoUrl = levelOneHtml.match(/window\.location\.href = '(.+?)'/)[1];
  const levelTwoDoc = await fetchDoc(levelTwoUrl);
  const posterImgUrl = levelTwoDoc.querySelector('[name="og:image"]').content;
  const storyboardUrl = posterImgUrl.replace(
    /_storyboard_L\d+/,
    '_storyboard_L0'
  );
  return storyboardUrl;
}

async function bftStoryboardFromUrl(bftvUrl, sbGrandParent) {
  const bftvDoc = await fetchDoc(bftvUrl);
  const bftvScript = bftvDoc.querySelector(
    'script[type="application/ld+json"]'
  );

  const durationMatches = bftvScript.textContent.match(
    /"duration":"PT(.+?)H(.+?)M(.+?)S"/
  );
  const durationString = `${durationMatches[1]}:${durationMatches[2]}:${durationMatches[3]}`;
  const durationInSeconds = toSeconds(durationString);

  // const thumbnailSrc = bftvDoc.querySelector( 'meta[property="og:image"]' ).content;
  // const thumbEl = generateElements( `<img src=${ thumbnailSrc }>`, item );
  // thumbEl.style.maxHeight = '300px';
  // generateElements( `<div>${ durationString }</div>`, item );

  const otherScript = contains('script', 'initPlayer', bftvDoc)[0];
  const thumbBase = otherScript.textContent.match(/thumbBase: '(.+?)'/)[1];
  const thumbCount = otherScript.textContent.match(/thumbsCount: (\d+)/)[1];
  let imgUrls = [];
  for (let i = 1; i <= thumbCount; i++) {
    const thisUrl = thumbBase.replace('{THUMB_ID}', i);
    imgUrls.push(thisUrl);
  }

  const storyboardParent = generateElements('<div></div>', sbGrandParent);
  return await storyboard({
    storyboardParent,
    horizontal: 1,
    vertical: 1,
    linkToVid: bftvUrl,
    trueNoOfSlots: thumbCount,
    imgUrls: imgUrls,
  });
}
