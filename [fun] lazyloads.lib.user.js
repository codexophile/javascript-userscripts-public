/**
 * Viewport-aware loading helpers for userscripts.
 *
 * The selector-based API observes elements that already exist and elements
 * added later. `IntersectionObserver` does the visibility work without
 * repeatedly measuring every pending element on every scroll event.
 *
 * @example
 * ```js
 * observeLoad('.product-card', card => loadProduct(card), {
 *   mode: 'lazy',
 *   rootMargin: '300px',
 * });
 * ```
 *
 * @example
 * ```js
 * // Compatibility with the helper from vanilla.js:
 * eagerLoad('.product-card', card => preloadProduct(card));
 * ```
 */

/**
 * @typedef {'lazy' | 'eager' | 'scrollPast'} LoadMode
 */

/**
 * @typedef {object} LoadOptions
 * @property {LoadMode} [mode='lazy'] Load only in the viewport, or slightly
 *   before it when set to `eager`. In `scrollPast` mode, load after an
 *   element has been visible and then exits the viewport.
 * @property {'up' | 'down' | 'both'} [direction='both'] Scroll direction
 *   accepted by `scrollPast`. `up` and `down` refer to the scroll direction,
 *   not the side of the viewport that the element exits.
 * @property {Element | null} [root=null] Scroll container used as the
 *   viewport. `null` observes the browser viewport.
 * @property {string} [rootMargin] Margin around the viewport. The eager
 *   default is `500px 0px`; the lazy default is `0px`.
 * @property {number | number[]} [threshold=0] Intersection threshold.
 * @property {boolean} [observeAdded=true] Whether to observe matching nodes
 *   added to the document after setup.
 */

/**
 * @typedef {object} LoadHandle
 * @property {() => void} disconnect Stops observing and removes listeners.
 */

/**
 * Observe matching elements and invoke a loader once for each element when it
 * reaches the configured viewport.
 *
 * @param {string} selector CSS selector for elements to load.
 * @param {(element: Element) => (void | Promise<void>)} _load Callback invoked
 *   once per matching element.
 * @param {LoadOptions} [options] Observation configuration.
 * @returns {LoadHandle} Handle used to stop observation.
 * @throws {TypeError} If the selector, loader, or root is invalid.
 *
 * @example
 * ```js
 * const handle = observeLoad('img[data-src]', image => {
 *   image.src = image.dataset.src;
 * });
 * // handle.disconnect();
 * ```
 */
function observeLoad(selector, _load, options = {}) {
  if (typeof selector !== 'string' || selector.length === 0) {
    throw new TypeError('observeLoad: selector must be a non-empty string');
  }

  if (typeof _load !== 'function') {
    throw new TypeError('observeLoad: load must be a function');
  }

  const {
    mode = 'lazy',
    root = null,
    rootMargin = mode === 'eager' ? '500px 0px' : '0px',
    threshold = 0,
    observeAdded = true,
  } = options;
  const direction = options.direction ?? 'both';

  if (!['lazy', 'eager', 'scrollPast'].includes(mode)) {
    throw new TypeError(
      "observeLoad: mode must be 'lazy', 'eager', or 'scrollPast'",
    );
  }
  if (!['up', 'down', 'both'].includes(options.direction ?? 'both')) {
    throw new TypeError(
      "observeLoad: direction must be 'up', 'down', or 'both'",
    );
  }
  if (root !== null && !(root instanceof Element)) {
    throw new TypeError('observeLoad: root must be an Element or null');
  }

  let stopped = false;
  const loaded = new WeakSet();
  const pending = new Set();
  let intersectionObserver;
  let mutationObserver;
  const enteredViewport = new WeakSet();
  let lastScrollPosition = getScrollPosition(root);
  let scrollDirection = 'both';

  /**
   * Get the current scroll offset for the configured scroll container.
   *
   * @param {Element | null} scrollRoot Scroll container or browser viewport.
   * @returns {number} Current vertical scroll offset.
   */
  function getScrollPosition(scrollRoot) {
    if (scrollRoot) return scrollRoot.scrollTop;
    return window.pageYOffset || document.documentElement.scrollTop;
  }

  /**
   * Record the direction of the latest scroll event.
   *
   * @returns {void}
   */
  function updateScrollDirection() {
    const currentPosition = getScrollPosition(root);
    if (currentPosition !== lastScrollPosition) {
      scrollDirection = currentPosition > lastScrollPosition ? 'down' : 'up';
      lastScrollPosition = currentPosition;
    }
  }

  /**
   * Check whether an element intersects the configured viewport.
   *
   * @param {Element} element Element to check.
   * @returns {boolean} Whether the element is currently visible.
   */
  function isInViewport(element) {
    const rectangle = element.getBoundingClientRect();
    const viewport = root?.getBoundingClientRect();
    const top = viewport?.top ?? 0;
    const bottom = viewport?.bottom ?? window.innerHeight;
    return rectangle.bottom > top && rectangle.top < bottom;
  }

  const loadElement = element => {
    if (stopped || loaded.has(element)) return;

    loaded.add(element);
    pending.delete(element);
    intersectionObserver?.unobserve(element);

    try {
      Promise.resolve(_load(element)).catch(error => {
        console.error('observeLoad: loader failed', { element, error });
      });
    } catch (error) {
      console.error('observeLoad: loader failed', { element, error });
    }
  };

  const observeElement = element => {
    if (stopped || loaded.has(element)) return;
    pending.add(element);
    if (mode === 'scrollPast' && isInViewport(element)) {
      enteredViewport.add(element);
    }
    intersectionObserver?.observe(element);
  };

  const findMatches = node => {
    if (!(node instanceof Element)) return [];

    const matches = [];
    if (node.matches(selector)) matches.push(node);
    matches.push(...node.querySelectorAll(selector));
    return matches;
  };

  const observeExisting = () => {
    document.querySelectorAll(selector).forEach(observeElement);
  };

  if ('IntersectionObserver' in window) {
    intersectionObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            enteredViewport.add(entry.target);
          } else if (
            mode === 'scrollPast' &&
            enteredViewport.has(entry.target) &&
            (direction === 'both' || direction === scrollDirection)
          ) {
            loadElement(entry.target);
          } else if (mode !== 'scrollPast' && entry.isIntersecting) {
            loadElement(entry.target);
          }
        });
      },
      { root, rootMargin, threshold },
    );
    observeExisting();
  } else {
    // Older browsers still get the same behavior, with a small fallback scan.
    const checkPending = () => {
      updateScrollDirection();
      pending.forEach(element => {
        const rectangle = element.getBoundingClientRect();
        const viewport = root?.getBoundingClientRect();
        const viewportTop = viewport?.top ?? 0;
        const viewportBottom = viewport?.bottom ?? window.innerHeight;
        const margin = parseInt(rootMargin, 10) || 0;
        const isVisible =
          rectangle.bottom > viewportTop && rectangle.top < viewportBottom;

        if (mode === 'scrollPast') {
          if (isVisible) {
            enteredViewport.add(element);
          } else if (
            enteredViewport.has(element) &&
            (direction === 'both' || direction === scrollDirection)
          ) {
            loadElement(element);
          }
        } else if (
          rectangle.bottom >= viewportTop - margin &&
          rectangle.top <= viewportBottom + margin
        ) {
          loadElement(element);
        }
      });
    };

    observeExisting();
    const scrollTarget = root ?? window;
    scrollTarget.addEventListener('scroll', checkPending, { passive: true });
    window.addEventListener('resize', checkPending, { passive: true });
    intersectionObserver = {
      unobserve: () => {},
      disconnect: () => {
        scrollTarget.removeEventListener('scroll', checkPending);
        window.removeEventListener('resize', checkPending);
      },
    };
    checkPending();
  }

  if (observeAdded) {
    mutationObserver = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          findMatches(node).forEach(observeElement);
        });
      });
    });
    mutationObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  if (mode === 'scrollPast') {
    const scrollTarget = root ?? window;
    scrollTarget.addEventListener('scroll', updateScrollDirection, {
      passive: true,
    });
  }

  return {
    disconnect() {
      if (stopped) return;
      stopped = true;
      mutationObserver?.disconnect();
      intersectionObserver?.disconnect();
      if (mode === 'scrollPast') {
        (root ?? window).removeEventListener('scroll', updateScrollDirection);
      }
      pending.clear();
    },
  };
}

/**
 * Load selector matches shortly before they enter the viewport.
 *
 * @param {string} selector CSS selector for elements to load.
 * @param {(element: Element) => (void | Promise<void>)} load Loader callback.
 * @param {Window | Element} [scrollableEl=window] Scroll container.
 * @returns {LoadHandle} Handle used to stop observation.
 *
 * @example
 * ```js
 * eagerLoad('.result', result => hydrateResult(result));
 * ```
 */
function eagerLoad(selector, load, scrollableEl = window) {
  return observeLoad(selector, load, {
    mode: 'eager',
    root: scrollableEl === window ? null : scrollableEl,
  });
}

/**
 * Load selector matches after they have entered and then exited the viewport.
 *
 * An element that starts outside the viewport is ignored until it becomes
 * visible. An element that starts inside the viewport is eligible as soon as
 * it exits. The callback runs once per element.
 *
 * @param {string} selector CSS selector for elements to load.
 * @param {(element: Element) => (void | Promise<void>)} load_ Loader callback.
 * @param {Window | Element} [scrollableEl=window] Scroll container.
 * @param {'up' | 'down' | 'both'} [direction='both'] Required scroll direction.
 * @returns {LoadHandle} Handle used to stop observation.
 *
 * @example
 * ```js
 * lazyLoadScrollPast(
 *   '.feed-item',
 *   item => markAsRead(item),
 *   window,
 *   'down',
 * );
 * ```
 */
function lazyLoadScrollPast(
  selector,
  load_,
  scrollableEl = window,
  direction = 'both',
) {
  return observeLoad(selector, load_, {
    mode: 'scrollPast',
    root: scrollableEl === window ? null : scrollableEl,
    direction,
  });
}

/**
 * Load explicit elements as they enter the viewport.
 *
 * @param {(element: Element) => (void | Promise<void>)} load Loader callback.
 * @param {...Element} items Elements to observe.
 * @returns {LoadHandle} Handle used to stop observation.
 *
 * @example
 * ```js
 * lazyLoad(loadImage, ...document.querySelectorAll('img[data-src]'));
 * ```
 */
function lazyLoad(load, ...items) {
  if (typeof load !== 'function') {
    throw new TypeError('lazyLoad: load must be a function');
  }

  const elements = items.filter(item => item instanceof Element);
  let stopped = false;
  const loaded = new WeakSet();

  const loadElement = element => {
    if (stopped || loaded.has(element)) return;
    loaded.add(element);
    observer?.unobserve(element);

    try {
      Promise.resolve(load(element)).catch(error => {
        console.error('lazyLoad: loader failed', { element, error });
      });
    } catch (error) {
      console.error('lazyLoad: loader failed', { element, error });
    }
  };

  let observer;
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) loadElement(entry.target);
      });
    });
    elements.forEach(element => observer.observe(element));
  } else {
    const checkElements = () => {
      elements.forEach(element => {
        const rectangle = element.getBoundingClientRect();
        if (rectangle.top < window.innerHeight && rectangle.bottom > 0) {
          loadElement(element);
        }
      });
    };

    window.addEventListener('scroll', checkElements, { passive: true });
    window.addEventListener('resize', checkElements, { passive: true });
    observer = {
      unobserve: () => {},
      disconnect: () => {
        window.removeEventListener('scroll', checkElements);
        window.removeEventListener('resize', checkElements);
      },
    };
    checkElements();
  }

  return {
    disconnect() {
      if (stopped) return;
      stopped = true;
      observer.disconnect();
    },
  };
}
