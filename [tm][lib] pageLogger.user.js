(function (window) {
  "use strict";

  // --- Configuration ---
  const DEFAULT_CONFIG = {
    position: "bottom-right", // 'top-left', 'top-right', 'bottom-left', 'bottom-right'
    maxMessages: 100, // Maximum number of messages to keep
    defaultVisible: true, // Should the logger be visible initially?
    logLevelStyles: {
      // CSS styles for different levels
      log: "color: #dadada;",
      info: "color: #64b5f6;", // Light blue
      warn: "color: #ffb74d; font-weight: bold;", // Orange
      error: "color: #e57373; font-weight: bold;", // Red
      debug: "color: #9575cd;", // Purple
    },
    containerId: "page-logger-container",
    baseZIndex: 9999,
    timestampFormat: "HH:mm:ss.ms", // 'HH:mm:ss' or 'HH:mm:ss.ms'
  };

  // --- Library Code ---
  const PageLogger = {
    config: { ...DEFAULT_CONFIG },
    elements: {
      container: null,
      messageArea: null,
      controls: null,
      toggleButton: null,
      clearButton: null,
      pauseButton: null,
    },
    initialized: false,
    visible: true,
    paused: false,
    messageCount: 0,

    _createElement: function (tag, props = {}, children = []) {
      const el = document.createElement(tag);
      Object.assign(el, props);
      if (props.style) {
        el.style.cssText = props.style;
      }
      children.forEach((child) => el.appendChild(child));
      return el;
    },

    _applyStyles: function () {
      if (document.getElementById("page-logger-styles")) return;

      const css = `
                #${this.config.containerId} {
                    position: fixed;
                    background-color: rgba(30, 30, 30, 0.85);
                    border: 1px solid #555;
                    border-radius: 5px;
                    font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
                    font-size: 12px;
                    line-height: 1.4;
                    color: #e0e0e0;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    max-width: 40%;
                    max-height: 35%;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.5);
                    z-index: ${this.config.baseZIndex};
                    transition: opacity 0.3s ease, transform 0.3s ease;
                    opacity: 1;
                    transform: scale(1);
                }
                #${this.config.containerId}.hidden {
                    opacity: 0;
                    transform: scale(0.9);
                    pointer-events: none;
                }
                #${this.config.containerId} .page-logger-messages {
                    flex-grow: 1;
                    overflow-y: auto;
                    padding: 5px 8px;
                    min-height: 50px; /* Ensure minimum height */
                }
                #${this.config.containerId} .page-logger-message {
                    border-bottom: 1px solid #444;
                    padding: 2px 0;
                    word-wrap: break-word;
                    white-space: pre-wrap; /* Preserve whitespace and wrap */
                }
                 #${this.config.containerId} .page-logger-message:last-child {
                    border-bottom: none;
                }
                 #${this.config.containerId} .page-logger-timestamp {
                    color: #888;
                    margin-right: 5px;
                    user-select: none; /* Prevent selecting timestamp */
                 }
                 #${this.config.containerId} .page-logger-controls {
                    background-color: rgba(50, 50, 50, 0.9);
                    padding: 3px 5px;
                    display: flex;
                    justify-content: flex-end;
                    gap: 5px; /* Spacing between buttons */
                    flex-shrink: 0; /* Prevent controls from shrinking */
                    border-top: 1px solid #555;
                    user-select: none;
                 }
                 #${this.config.containerId} .page-logger-button {
                    background-color: #666;
                    color: #eee;
                    border: none;
                    padding: 2px 6px;
                    cursor: pointer;
                    font-size: 10px;
                    border-radius: 3px;
                 }
                 #${this.config.containerId} .page-logger-button:hover {
                    background-color: #888;
                 }
                  #${this.config.containerId} .page-logger-button.paused {
                    background-color: #ffb74d; /* Orange when paused */
                    color: #111;
                 }
            `;
      const styleElement = this._createElement("style", {
        id: "page-logger-styles",
        textContent: css,
      });
      (document.head || document.documentElement).appendChild(styleElement);
    },

    _updateContainerPosition: function () {
      const containerStyle = this.elements.container.style;
      const margin = "10px";
      // Reset positions
      ["top", "bottom", "left", "right"].forEach(
        (prop) => (containerStyle[prop] = "auto")
      );

      switch (this.config.position) {
        case "top-left":
          containerStyle.top = margin;
          containerStyle.left = margin;
          break;
        case "top-right":
          containerStyle.top = margin;
          containerStyle.right = margin;
          break;
        case "bottom-left":
          containerStyle.bottom = margin;
          containerStyle.left = margin;
          break;
        case "bottom-right":
        default: // Default to bottom-right
          containerStyle.bottom = margin;
          containerStyle.right = margin;
          break;
      }
    },

    _createUI: function () {
      if (this.elements.container) return; // Already created

      this._applyStyles();

      this.elements.messageArea = this._createElement("div", {
        className: "page-logger-messages",
      });

      this.elements.toggleButton = this._createElement("button", {
        className: "page-logger-button",
        title: "Toggle Visibility",
        textContent: "−",
      });
      this.elements.toggleButton.onclick = () => this.toggle();

      this.elements.clearButton = this._createElement("button", {
        className: "page-logger-button",
        title: "Clear Logs",
        textContent: "Clear",
      });
      this.elements.clearButton.onclick = () => this.clear();

      this.elements.pauseButton = this._createElement("button", {
        className: "page-logger-button",
        title: "Pause Logging",
        textContent: "Pause",
      });
      this.elements.pauseButton.onclick = () => this.togglePause();

      this.elements.controls = this._createElement(
        "div",
        { className: "page-logger-controls" },
        [
          this.elements.pauseButton,
          this.elements.clearButton,
          this.elements.toggleButton,
        ]
      );

      this.elements.container = this._createElement(
        "div",
        { id: this.config.containerId },
        [this.elements.controls, this.elements.messageArea]
      );

      this._updateContainerPosition();
      this.visible = this.config.defaultVisible;
      if (!this.visible) {
        this.elements.container.classList.add("hidden");
        this.elements.toggleButton.textContent = "+";
      }

      // Append only when body is ready
      if (document.body) {
        document.body.appendChild(this.elements.container);
      } else {
        // Wait for DOM content if body isn't available yet (e.g., @run-at document-start)
        document.addEventListener(
          "DOMContentLoaded",
          () => {
            if (!document.getElementById(this.config.containerId)) {
              document.body.appendChild(this.elements.container);
            }
          },
          { once: true }
        );
        // Fallback if DOMContentLoaded already fired
        if (
          document.readyState === "interactive" ||
          document.readyState === "complete"
        ) {
          if (
            document.body &&
            !document.getElementById(this.config.containerId)
          ) {
            document.body.appendChild(this.elements.container);
          }
        }
      }
    },

    _getTimestamp: function () {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      if (this.config.timestampFormat === "HH:mm:ss.ms") {
        const ms = String(now.getMilliseconds()).padStart(3, "0");
        return `${hours}:${minutes}:${seconds}.${ms}`;
      }
      return `${hours}:${minutes}:${seconds}`;
    },

    _formatArg: function (arg) {
      if (arg === null) return "null";
      if (arg === undefined) return "undefined";
      if (typeof arg === "string") return arg;
      if (
        typeof arg === "number" ||
        typeof arg === "boolean" ||
        typeof arg === "symbol"
      )
        return String(arg);
      if (typeof arg === "function")
        return `[Function: ${arg.name || "anonymous"}]`;
      if (typeof arg === "object") {
        try {
          // Indent with 2 spaces, handle circular refs gracefully (returns '[Circular]')
          // Using a replacer to handle specific types if needed later
          return JSON.stringify(
            arg,
            (key, value) => {
              if (typeof value === "bigint") {
                return value.toString() + "n"; // Indicate BigInt
              }
              if (value instanceof Error) {
                return `[Error: ${value.message}${
                  value.stack ? `\n${value.stack}` : ""
                }]`;
              }
              // Add more handlers here if needed (e.g., Map, Set)
              return value;
            },
            2
          );
        } catch (e) {
          // Should ideally not happen with the replacer, but fallback
          if (
            e instanceof TypeError &&
            e.message.includes("circular structure")
          ) {
            return "[Circular Object]";
          }
          return "[Object Formatting Error]";
        }
      }
      return String(arg); // Fallback
    },

    _addMessage: function (level, args) {
      if (!this.initialized || this.paused) return;
      if (!this.elements.messageArea) {
        console.warn("PageLogger UI not ready yet.");
        // Optionally queue messages here until ready
        return;
      }

      // Format all arguments
      const messageText = args.map(this._formatArg.bind(this)).join(" ");
      const timestamp = this._getTimestamp();
      const levelStyle =
        this.config.logLevelStyles[level] || this.config.logLevelStyles.log;

      const timestampSpan = this._createElement("span", {
        className: "page-logger-timestamp",
        textContent: `[${timestamp}]`,
      });
      const messageSpan = this._createElement("span", {
        textContent: messageText,
      });
      const messageDiv = this._createElement(
        "div",
        { className: "page-logger-message", style: levelStyle },
        [timestampSpan, messageSpan]
      );

      this.elements.messageArea.appendChild(messageDiv);
      this.messageCount++;

      // Prune old messages if exceeding max count
      while (
        this.messageCount > this.config.maxMessages &&
        this.elements.messageArea.firstChild
      ) {
        this.elements.messageArea.removeChild(
          this.elements.messageArea.firstChild
        );
        this.messageCount--;
      }

      // Auto-scroll to bottom if visible
      if (this.visible) {
        this.elements.messageArea.scrollTop =
          this.elements.messageArea.scrollHeight;
      }
    },

    // --- Public API ---

    /**
     * Initializes the PageLogger UI and configuration.
     * @param {object} [userConfig] - Configuration options to override defaults.
     * @param {string} [userConfig.position] - 'top-left', 'top-right', 'bottom-left', 'bottom-right'.
     * @param {number} [userConfig.maxMessages] - Maximum messages to display.
     * @param {boolean} [userConfig.defaultVisible] - Initial visibility.
     * @param {object} [userConfig.logLevelStyles] - CSS styles for log levels.
     * @param {string} [userConfig.containerId] - ID for the main container element.
     * @param {number} [userConfig.baseZIndex] - Base z-index for the container.
     * @param {string} [userConfig.timestampFormat] - 'HH:mm:ss' or 'HH:mm:ss.ms'.
     */
    init: function (userConfig = {}) {
      if (this.initialized) {
        console.warn("PageLogger already initialized.");
        return;
      }
      // Deep merge might be better for logLevelStyles, but simple merge for now
      this.config = { ...DEFAULT_CONFIG, ...userConfig };
      this.config.logLevelStyles = {
        ...DEFAULT_CONFIG.logLevelStyles,
        ...(userConfig.logLevelStyles || {}),
      };

      this._createUI();
      this.initialized = true;
      console.log("PageLogger Initialized."); // Use native console for init message
    },

    log: function (...args) {
      this._addMessage("log", args);
    },
    info: function (...args) {
      this._addMessage("info", args);
    },
    warn: function (...args) {
      this._addMessage("warn", args);
    },
    error: function (...args) {
      this._addMessage("error", args);
    },
    debug: function (...args) {
      this._addMessage("debug", args);
    },

    clear: function () {
      if (!this.initialized || !this.elements.messageArea) return;
      this.elements.messageArea.innerHTML = "";
      this.messageCount = 0;
    },

    show: function () {
      if (!this.initialized || this.visible) return;
      this.elements.container.classList.remove("hidden");
      this.elements.toggleButton.textContent = "−";
      this.visible = true;
      // Scroll to bottom when shown
      this.elements.messageArea.scrollTop =
        this.elements.messageArea.scrollHeight;
    },

    hide: function () {
      if (!this.initialized || !this.visible) return;
      this.elements.container.classList.add("hidden");
      this.elements.toggleButton.textContent = "+";
      this.visible = false;
    },

    toggle: function () {
      if (!this.initialized) return;
      this.visible ? this.hide() : this.show();
    },

    togglePause: function () {
      if (!this.initialized) return;
      this.paused = !this.paused;
      this.elements.pauseButton.textContent = this.paused ? "Resume" : "Pause";
      this.elements.pauseButton.classList.toggle("paused", this.paused);
      this._addMessage("info", [
        this.paused ? "Logging paused" : "Logging resumed",
      ]);
    },

    setConfig: function (key, value) {
      if (!this.initialized) {
        console.error("PageLogger not initialized. Cannot set config.");
        return;
      }
      if (key in this.config) {
        // Special handling for some keys
        if (key === "logLevelStyles") {
          this.config.logLevelStyles = {
            ...this.config.logLevelStyles,
            ...value,
          };
          // Note: Existing messages won't update style, only new ones
        } else {
          this.config[key] = value;
        }

        // Update UI if necessary
        if (key === "position") {
          this._updateContainerPosition();
        }
        if (key === "maxMessages") {
          // Prune immediately if needed
          while (
            this.messageCount > this.config.maxMessages &&
            this.elements.messageArea.firstChild
          ) {
            this.elements.messageArea.removeChild(
              this.elements.messageArea.firstChild
            );
            this.messageCount--;
          }
        }
        if (key === "baseZIndex") {
          this.elements.container.style.zIndex = this.config.baseZIndex;
        }

        this.log(
          `[PageLogger] Config updated: ${key} = ${JSON.stringify(value)}`
        );
      } else {
        this.warn(`[PageLogger] Invalid config key: ${key}`);
      }
    },

    destroy: function () {
      if (!this.initialized) return;
      const styleElement = document.getElementById("page-logger-styles");
      if (styleElement) styleElement.remove();
      if (this.elements.container) this.elements.container.remove();

      // Reset state
      this.elements = {
        container: null,
        messageArea: null,
        controls: null,
        toggleButton: null,
        clearButton: null,
        pauseButton: null,
      };
      this.initialized = false;
      this.visible = true;
      this.paused = false;
      this.messageCount = 0;
      this.config = { ...DEFAULT_CONFIG }; // Reset config

      // Remove from global scope if it was added
      if (typeof unsafeWindow !== "undefined") {
        if (unsafeWindow.PageLogger === this) delete unsafeWindow.PageLogger;
      } else {
        if (window.PageLogger === this) delete window.PageLogger;
      }
      console.log("PageLogger Destroyed."); // Native console
    },
  };

  // --- Export ---
  // Make it available to the userscript's scope and potentially the page's global scope
  // Using unsafeWindow allows other scripts on the page OR your own script to access it easily.
  // If you only want YOUR userscript to access it, you don't need to expose it globally.
  if (typeof unsafeWindow !== "undefined") {
    unsafeWindow.PageLogger = PageLogger;
  } else {
    window.PageLogger = PageLogger; // Fallback for environments without unsafeWindow
  }

  // --- Optional: Auto-initialization ---
  // Uncomment the following line to automatically initialize PageLogger when the script runs.
  // Otherwise, you need to call PageLogger.init() manually in your userscript.
  PageLogger.init();

  //* Example usage
  function exampleUsage() {
    // Wait for PageLogger to be ready if it initializes asynchronously or later
    function waitForPageLogger(callback) {
      const checkInterval = setInterval(() => {
        // Access via unsafeWindow if needed, otherwise just PageLogger
        const logger =
          typeof unsafeWindow !== "undefined"
            ? unsafeWindow.PageLogger
            : window.PageLogger;
        if (logger && logger.init) {
          // Check if init exists (basic check)
          clearInterval(checkInterval);
          callback(logger);
        }
      }, 100); // Check every 100ms
      // Timeout safeguard
      setTimeout(() => {
        clearInterval(checkInterval);
        const logger =
          typeof unsafeWindow !== "undefined"
            ? unsafeWindow.PageLogger
            : window.PageLogger;
        if (!logger || !logger.init) {
          console.error("PageLogger did not become available in time.");
        }
      }, 5000); // Wait max 5 seconds
    }

    waitForPageLogger((PageLogger) => {
      // Initialize PageLogger (if not auto-initialized in the library)
      // You can override defaults here
      PageLogger.init({
        position: "bottom-left",
        maxMessages: 75,
        // defaultVisible: false
      });

      // Now you can use PageLogger instead of console
      PageLogger.log("PageLogger is ready!");
      PageLogger.info(
        "This is an informational message.",
        "Multiple arguments work.",
        123
      );
      PageLogger.warn("This is a warning.");
      PageLogger.error(
        "This is an error message.",
        new Error("Something went wrong")
      );

      const myObject = {
        name: "Test Object",
        value: 42,
        nested: { id: "A", data: [1, 2, 3] },
      };
      PageLogger.debug("Debugging an object:", myObject);

      PageLogger.log("Testing null and undefined:", null, undefined);
      PageLogger.log(
        "Testing boolean and function:",
        true,
        function testFunc() {}
      );
      PageLogger.log(
        "Testing BigInt:",
        1234567890123456789012345678901234567890n
      );

      // Example of changing config after init
      setTimeout(() => {
        PageLogger.setConfig("position", "top-right");
        PageLogger.log("Moved logger to top-right");
      }, 3000);

      // Example clear
      // setTimeout(() => {
      //     PageLogger.clear();
      // }, 5000);

      // Example toggle visibility
      setTimeout(() => {
        PageLogger.toggle(); // Hide
      }, 6000);
      setTimeout(() => {
        PageLogger.toggle(); // Show
      }, 8000);

      // Example pause/resume
      setTimeout(() => {
        PageLogger.togglePause(); // Pause
        PageLogger.log("This message won't appear"); // Won't show
      }, 9000);
      setTimeout(() => {
        PageLogger.togglePause(); // Resume
        PageLogger.log("Logging resumed, this should appear."); // Will show
      }, 11000);

      // Example destroy (if you need to clean up completely)
      // setTimeout(() => {
      //    PageLogger.destroy();
      // }, 15000);
    });
  }
})(window);
