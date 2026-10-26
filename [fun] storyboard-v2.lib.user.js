/* global GM_addStyle, GM_getValue, GM_setValue, GM_setClipboard, GM_xmlhttpRequest */

/**
 * @file Storyboard helper for userscripts.
 *
 * Turns video storyboard data (sprite sheets or WebVTT `#xywh` cues) into a
 * clickable grid of thumbnail tiles that seek a `<video>` element.
 *
 * Usage (userscript metadata for the consuming script):
 *
 * ```js
 * // @require     file:///C:/path/to/storyboard.lib.js
 * // @grant       GM_addStyle
 * // @grant       GM_getValue
 * // @grant       GM_setValue
 * // @grant       GM_setClipboard
 * // @grant       GM_xmlhttpRequest
 * // @connect     *
 * ```
 *
 * Every GM function is optional: with `@grant none` the helper falls back to
 * plain DOM APIs (image loading then goes through `<img>` instead of
 * `GM_xmlhttpRequest`, so hotlink/CSP-restricted sheets may fail).
 *
 * Public API (top-level, visible to the consuming script):
 * `storyboard`, `parseWebvtt`, `resolveStoryboardLayout`,
 * `formatStoryboardTime`. Everything prefixed `_sb` is private.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Options accepted by {@link storyboard}.
 *
 * @typedef {object} StoryboardOptions
 * @property {Element} parent Element that receives the generated storyboard root.
 * @property {HTMLVideoElement | null} [video] Video controlled by the storyboard.
 *   Without it tiles are not seekable and the "locate" button is omitted.
 * @property {readonly string[]} [imageUrls] Sprite-sheet URLs (relative URLs are
 *   resolved against `baseUrl`). Ignored when `webvtt` is given.
 * @property {string | null} [webvtt] WebVTT storyboard text. Each cue payload must
 *   look like `sheet.jpg#xywh=x,y,w,h`. Takes precedence over `imageUrls`.
 * @property {string | null} [baseUrl] Base for relative image URLs. Ideally the
 *   URL the WebVTT file was fetched from. Defaults to `document.baseURI`.
 * @property {number | null} [columns] Columns per sprite sheet (inferred when possible).
 * @property {number | null} [rows] Rows per sprite sheet (inferred when possible).
 * @property {number | null} [interval] Seconds between samples (sprite mode).
 *   Inferred from `totalSlots` and the video duration when omitted.
 * @property {number | null} [totalSlots] Maximum number of tiles to render.
 *   Also used to infer `interval`, `columns` and `rows`.
 * @property {number} [indexOffset=0] Added to a sprite tile's index when computing
 *   its time (`(index + indexOffset) * interval`). Not applied to WebVTT cues.
 * @property {number | null} [tileWidth] Forces the tile width in CSS pixels
 *   (aspect ratio preserved). Default: native width, at least `minTileWidth`.
 * @property {number} [minTileWidth=200] Smallest default tile width in CSS pixels.
 * @property {string | null} [linkUrl] When set, each tile is an `<a>` pointing at
 *   `linkUrl#slot=<index>`. A plain click still seeks the local video (if any);
 *   Ctrl/Shift/Alt/Meta/middle clicks use the link natively.
 * @property {boolean} [controls=true] Render the collapsible control panel.
 * @property {boolean} [hashSeek=true] Seek to `#slot=<n>` from `location.hash`
 *   once the video metadata is available.
 */

/**
 * A single rendered storyboard tile.
 *
 * @typedef {object} StoryboardTile
 * @property {number} index Global slot index (stable even if an earlier sheet failed).
 * @property {number | null} time Explicit start time in seconds (WebVTT), else `null`.
 * @property {HTMLDivElement} element The `.sb-tile` element.
 * @property {HTMLCanvasElement | null} canvas The thumbnail canvas (`null` for error tiles).
 * @property {HTMLDivElement} label The timestamp label element.
 * @property {boolean} failed `true` when the tile is an "Image load error" placeholder.
 */

/**
 * Handle returned by {@link storyboard}.
 *
 * @typedef {object} StoryboardHandle
 * @property {HTMLDivElement} root Container holding the panel and the grid.
 * @property {HTMLDivElement} grid The tile grid.
 * @property {readonly StoryboardTile[]} tiles All tiles in slot order.
 * @property {(width: number) => void} setTileWidth Resize all tiles to a CSS pixel width.
 * @property {(factor: number) => void} setScale Resize all tiles to a factor of their native width.
 * @property {(index: number) => void} seekToSlot Seek the video to a slot and play.
 * @property {() => StoryboardTile | null} locateCurrent Scroll to and flash the tile at the current playback time.
 * @property {() => void} destroy Remove the storyboard and its listeners.
 */

/**
 * A parsed WebVTT storyboard cue.
 *
 * @typedef {object} WebvttCue
 * @property {number} startTime Cue start in seconds.
 * @property {number} endTime Cue end in seconds (informational).
 * @property {string} imageUrl Absolute sprite-sheet URL without the fragment.
 * @property {number} x Crop left edge in image pixels.
 * @property {number} y Crop top edge in image pixels.
 * @property {number} width Crop width in image pixels.
 * @property {number} height Crop height in image pixels.
 */

/**
 * Normalized grid layout produced by {@link resolveStoryboardLayout}.
 *
 * @typedef {object} StoryboardLayout
 * @property {number} columns Columns per sprite sheet.
 * @property {number} rows Rows per sprite sheet.
 * @property {number | null} interval Seconds between samples, if known.
 * @property {number | null} totalSlots Total slot count, if known.
 */

/**
 * Raw (unnormalized) inputs for {@link resolveStoryboardLayout}.
 *
 * @typedef {object} StoryboardLayoutInput
 * @property {number | null} [columns] Columns per sheet.
 * @property {number | null} [rows] Rows per sheet.
 * @property {number | null} [interval] Seconds between samples.
 * @property {number | null} [totalSlots] Total slot count.
 * @property {number | null} [imageCount] Number of sprite sheets.
 * @property {number | null} [duration] Video duration in seconds.
 */

/**
 * A rectangle to crop out of a loaded image, plus the slot it represents.
 *
 * @typedef {object} StoryboardCrop
 * @property {number} index Global slot index.
 * @property {number | null} time Explicit time in seconds, or `null`.
 * @property {number} sx Source x.
 * @property {number} sy Source y.
 * @property {number} sw Source width.
 * @property {number} sh Source height.
 */

/**
 * One image to load and the tiles it produces.
 *
 * @typedef {object} StoryboardJob
 * @property {string} url Absolute image URL.
 * @property {Pick<StoryboardCrop, 'index' | 'time'>} fallback Slot used for the error tile.
 * @property {(image: StoryboardImage) => StoryboardCrop[]} crops Produces the crops for a loaded image.
 */

/**
 * A decoded image ready for `drawImage`.
 *
 * @typedef {object} StoryboardImage
 * @property {CanvasImageSource} source Drawable image.
 * @property {number} width Intrinsic width in pixels.
 * @property {number} height Intrinsic height in pixels.
 * @property {() => void} dispose Releases decoded pixel memory.
 */

/**
 * Control panel returned by {@link _sbCreatePanel}.
 *
 * @typedef {object} StoryboardPanel
 * @property {HTMLDetailsElement} element The panel element.
 * @property {(hidden: boolean) => void} setGridHidden Syncs the toggle button label.
 * @property {(stats: {tiles: number, ms: number, urls: readonly string[]}) => void} setStats Fills the info popup.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Default minimum tile width in CSS pixels.
 * @type {number}
 */
const STORYBOARD_MIN_TILE_WIDTH = 200;

/**
 * Maximum number of images downloaded in parallel.
 * @type {number}
 */
const STORYBOARD_MAX_CONCURRENT_LOADS = 4;

/**
 * Timeout for a single image download in milliseconds.
 * @type {number}
 */
const STORYBOARD_LOAD_TIMEOUT_MS = 30000;

/**
 * Keys used with `GM_getValue` / `GM_setValue` to persist UI state.
 * @type {Readonly<{panelOpen: string, gridHidden: string}>}
 */
const STORYBOARD_STORAGE_KEYS = Object.freeze({
  panelOpen: 'storyboard.panelOpen',
  gridHidden: 'storyboard.gridHidden',
});

/**
 * Stylesheet injected once per page. All selectors are prefixed with `sb-`.
 * Tile size is driven by the `--sb-w` / `--sb-h` custom properties on the grid.
 * @type {string}
 */
const STORYBOARD_CSS = `
.sb-root {
  position: relative;
  font: 13px/1.4 system-ui, sans-serif;
  color: #fff
}

.sb-panel {
  display: inline-block;
  margin: 4px;
  padding: 4px 8px;
  background: #111;
  border: 1px solid #444;
  border-radius: 6px
}

.sb-panel>summary {
  cursor: pointer;
  user-select: none
}

.sb-buttons {
  display: flex;
  gap: 4px;
  margin-top: 4px
}

.sb-buttons button {
  cursor: pointer;
  color: #fff;
  background: #222;
  border: 1px solid #555;
  border-radius: 4px;
  padding: 2px 8px;
  font: inherit
}

.sb-buttons button:hover {
  background: #333
}

.sb-info {
  position: absolute;
  z-index: 10;
  max-width: min(90vw, 520px);
  max-height: 50vh;
  overflow: auto;
  margin-top: 4px;
  padding: 8px;
  background: #111;
  border: 1px solid #555;
  border-radius: 6px
}

.sb-info a {
  display: block;
  color: #8cf;
  word-break: break-all
}

.sb-info[hidden],
.sb-grid[hidden] {
  display: none
}

.sb-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  gap: 2px;
  padding: 2px
}

.sb-tile {
  position: relative;
  flex: none;
  box-sizing: content-box;
  width: var(--sb-w, 200px);
  height: var(--sb-h, 113px);
  background: #000;
  border: 1px solid #fff;
  cursor: pointer;
  content-visibility: auto
}

.sb-tile.sb-played {
  border-color: #777;
  filter: saturate(.55);
  opacity: .62
}

.sb-tile.sb-current {
  border-color: #0ff;
  box-shadow: 0 0 0 2px #0ff, 0 0 12px #0ff;
  filter: none;
  opacity: 1;
  z-index: 1
}

.sb-tile canvas,
.sb-tile a {
  display: block;
  width: 100%;
  height: 100%
}

.sb-time {
  position: absolute;
  top: 2px;
  left: 2px;
  padding: 0 4px;
  background: #000;
  color: #fff;
  font: 11px/1.4 system-ui, sans-serif;
  pointer-events: none
}

.sb-time:empty {
  display: none
}

.sb-error {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f44;
  text-align: center
}

.sb-blink {
  animation: sb-blink .3s ease-in-out 6
}

@keyframes sb-blink {
  50% {
    outline: 4px solid #f5a623;
    outline-offset: -4px
  }
}
`;

/**
 * Whether {@link STORYBOARD_CSS} has already been injected in this page.
 * @type {boolean}
 */
let _sbStylesInjected = false;

/**
 * Thin wrappers around the optional GM APIs with plain-DOM fallbacks.
 * Each member works whether or not the matching `@grant` is present.
 */
const _sbGM = Object.freeze({
  /**
   * Injects a stylesheet.
   * @param {string} css Stylesheet text.
   * @returns {void}
   */
  addStyle(css) {
    if (typeof GM_addStyle === 'function') {
      GM_addStyle(css);
      return;
    }
    const style = document.createElement('style');
    style.textContent = css;
    (document.head || document.documentElement).append(style);
  },

  /**
   * Reads a persisted value.
   * @template T
   * @param {string} key Storage key.
   * @param {T} fallback Value returned when the key is unset or GM is unavailable.
   * @returns {T} The stored value or `fallback`.
   */
  getValue(key, fallback) {
    try {
      return typeof GM_getValue === 'function'
        ? GM_getValue(key, fallback)
        : fallback;
    } catch {
      return fallback;
    }
  },

  /**
   * Persists a value (no-op without `GM_setValue`).
   * @param {string} key Storage key.
   * @param {unknown} value JSON-serializable value.
   * @returns {void}
   */
  setValue(key, value) {
    try {
      if (typeof GM_setValue === 'function') GM_setValue(key, value);
    } catch {
      /* storage is best-effort */
    }
  },

  /**
   * Copies text to the clipboard.
   * @param {string} text Text to copy.
   * @returns {Promise<void>} Resolves once the copy was attempted.
   */
  async copy(text) {
    if (typeof GM_setClipboard === 'function') {
      GM_setClipboard(text, 'text');
      return;
    }
    await navigator.clipboard.writeText(text);
  },

  /**
   * Downloads a URL as a Blob, bypassing CORS/CSP/hotlink restrictions.
   * @param {string} url Absolute URL.
   * @returns {Promise<Blob>} The response body.
   * @throws {Error} When `GM_xmlhttpRequest` is unavailable, the request fails, times out or returns a non-2xx status.
   */
  fetchBlob(url) {
    return new Promise((resolve, reject) => {
      if (typeof GM_xmlhttpRequest !== 'function') {
        reject(new Error('GM_xmlhttpRequest is not granted'));
        return;
      }
      GM_xmlhttpRequest({
        method: 'GET',
        url,
        responseType: 'blob',
        timeout: STORYBOARD_LOAD_TIMEOUT_MS,
        onload: res =>
          res.status >= 200 && res.status < 300
            ? resolve(res.response)
            : reject(new Error(`HTTP ${res.status} for ${url}`)),
        onerror: () => reject(new Error(`Network error for ${url}`)),
        ontimeout: () => reject(new Error(`Timeout for ${url}`)),
      });
    });
  },
});

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/**
 * Coerces a value to a positive finite number.
 *
 * @param {unknown} value Candidate value (number or numeric string).
 * @returns {number | null} The number, or `null` when missing, zero, negative or non-finite.
 */
function _sbPositive(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Formats seconds as `M:SS` or `H:MM:SS` (fractions are floored).
 *
 * @param {number} seconds Time in seconds.
 * @returns {string} Human-readable timestamp.
 */
function formatStoryboardTime(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

/**
 * Parses a WebVTT timestamp (`MM:SS.mmm` or `HH:MM:SS.mmm`, comma allowed).
 *
 * @param {string} text Timestamp text.
 * @returns {number | null} Seconds, or `null` when malformed.
 */
function _sbParseTimestamp(text) {
  const parts = text.trim().replace(',', '.').split(':');
  if (parts.length < 2 || parts.length > 3) return null;
  const nums = parts.map(p => (/^\d+(\.\d+)?$/.test(p) ? Number(p) : NaN));
  if (nums.some(n => !Number.isFinite(n))) return null;
  return nums.reduce((acc, n) => acc * 60 + n, 0);
}

/**
 * Parses WebVTT storyboard cues of the form
 * `00:00:00.000 --> 00:00:05.000` followed by `sheet.jpg#xywh=x,y,w,h`.
 *
 * Tolerates a BOM, CRLF line endings, cue identifiers and cue settings.
 * Malformed cues and cues without a pixel `xywh` fragment are skipped.
 *
 * @param {string} text Raw WebVTT content.
 * @param {string} [baseUrl] Base for relative image URLs. Defaults to `document.baseURI`.
 * @returns {WebvttCue[]} Parsed cues in source order.
 * @throws {Error} `No valid WebVTT storyboard cues found.` when nothing usable remains.
 */
function parseWebvtt(text, baseUrl = document.baseURI) {
  const lines = String(text)
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/);
  /** @type {WebvttCue[]} */
  const cues = [];

  for (let i = 0; i < lines.length - 1; i++) {
    const timing = /^\s*(\S+)\s+-->\s+(\S+)/.exec(lines[i]);
    if (!timing) continue;

    const startTime = _sbParseTimestamp(timing[1]);
    const endTime = _sbParseTimestamp(timing[2]);
    const payload = lines[i + 1].trim();
    const hash = payload.indexOf('#');
    if (startTime === null || endTime === null || hash < 1) continue;

    const xywh = new URLSearchParams(payload.slice(hash + 1)).get('xywh');
    const [x, y, width, height] = (xywh ?? '')
      .replace(/^pixel:/, '')
      .split(',')
      .map(Number);
    if (
      ![x, y, width, height].every(Number.isFinite) ||
      x < 0 ||
      y < 0 ||
      width <= 0 ||
      height <= 0
    )
      continue;

    try {
      cues.push({
        startTime,
        endTime,
        imageUrl: new URL(payload.slice(0, hash), baseUrl).href,
        x,
        y,
        width,
        height,
      });
    } catch {
      /* unresolvable URL: skip the cue */
    }
  }

  if (!cues.length) throw new Error('No valid WebVTT storyboard cues found.');
  return cues;
}

/**
 * Normalizes and completes sprite-sheet layout information.
 *
 * Invalid, zero, negative or non-finite inputs are treated as missing.
 * Derivations: `totalSlots = ceil(duration / interval)`,
 * `interval = duration / totalSlots`, and the missing grid dimension from
 * `ceil(totalSlots / imageCount / otherDimension)`.
 *
 * @param {StoryboardLayoutInput} input Known layout facts.
 * @returns {StoryboardLayout} Completed layout.
 * @throws {Error} When the grid dimensions cannot be determined.
 */
function resolveStoryboardLayout(input) {
  let columns = _sbPositive(input.columns);
  let rows = _sbPositive(input.rows);
  let interval = _sbPositive(input.interval);
  let totalSlots = _sbPositive(input.totalSlots);
  const duration = _sbPositive(input.duration);
  const imageCount = _sbPositive(input.imageCount);

  if (!totalSlots && interval && duration)
    totalSlots = Math.ceil(duration / interval);
  if (!interval && totalSlots && duration) interval = duration / totalSlots;

  const perSheet =
    totalSlots && imageCount ? Math.ceil(totalSlots / imageCount) : null;

  if (!columns && !rows)
    throw new Error('Storyboard needs `columns` and/or `rows`.');
  if (!columns) {
    if (!perSheet)
      throw new Error('Cannot infer `columns`: total slot count is unknown.');
    columns = Math.ceil(perSheet / /** @type {number} */ (rows));
  } else if (!rows) {
    if (!perSheet)
      throw new Error('Cannot infer `rows`: total slot count is unknown.');
    rows = Math.ceil(perSheet / columns);
  }

  return { columns, rows: /** @type {number} */ (rows), interval, totalSlots };
}

/**
 * Splits a loaded sprite sheet into grid cells.
 *
 * @param {StoryboardImage} image Loaded sprite sheet.
 * @param {StoryboardLayout} layout Grid layout.
 * @param {number} firstIndex Global slot index of the sheet's first cell.
 * @param {number | null} limit Exclusive upper bound for slot indexes (`null` = unlimited).
 * @returns {StoryboardCrop[]} Crops in row-major order.
 */
function _sbGridCrops(image, layout, firstIndex, limit) {
  const cw = image.width / layout.columns;
  const ch = image.height / layout.rows;
  /** @type {StoryboardCrop[]} */
  const crops = [];
  for (let r = 0; r < layout.rows; r++) {
    for (let c = 0; c < layout.columns; c++) {
      const index = firstIndex + r * layout.columns + c;
      if (limit && index >= limit) return crops;
      crops.push({ index, time: null, sx: c * cw, sy: r * ch, sw: cw, sh: ch });
    }
  }
  return crops;
}

/**
 * Extracts the slot number from a `#slot=<digits>` URL hash.
 *
 * @param {string} [hash] Hash string. Defaults to `location.hash`.
 * @returns {number | null} Slot index, or `null` when absent/invalid.
 */
function _sbSlotFromHash(hash = location.hash) {
  const value = new URLSearchParams(hash.replace(/^#/, '')).get('slot');
  return value && /^\d+$/.test(value) ? Number(value) : null;
}

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

/**
 * Creates a concurrency limiter for async tasks.
 *
 * @param {number} max Maximum simultaneously running tasks.
 * @returns {<T>(task: () => Promise<T>) => Promise<T>} Function that schedules a task.
 */
function _sbCreateLimiter(max) {
  let active = 0;
  /** @type {Array<() => void>} */
  const queue = [];

  /**
   * Starts queued tasks while capacity remains.
   * @returns {void}
   */
  const pump = () => {
    while (active < max && queue.length) {
      active++;
      /** @type {() => void} */ (queue.shift())();
    }
  };

  return task =>
    new Promise((resolve, reject) => {
      queue.push(() => {
        task()
          .then(resolve, reject)
          .finally(() => {
            active--;
            pump();
          });
      });
      pump();
    });
}

/**
 * Loads an image. Prefers `GM_xmlhttpRequest` + `createImageBitmap` (works across
 * origins, ignores page CSP and hotlink checks) and falls back to `<img>`.
 *
 * @param {string} url Absolute image URL.
 * @returns {Promise<StoryboardImage>} Decoded image.
 * @throws {Error} When both strategies fail.
 */
async function _sbLoadImage(url) {
  if (typeof GM_xmlhttpRequest === 'function') {
    try {
      const bitmap = await createImageBitmap(await _sbGM.fetchBlob(url));
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        dispose: () => bitmap.close(),
      };
    } catch {
      /* fall through to <img> */
    }
  }
  const img = await new Promise((resolve, reject) => {
    const el = new Image();
    el.decoding = 'async';
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error(`Image load error: ${url}`));
    el.src = url;
  });
  return {
    source: img,
    width: img.naturalWidth,
    height: img.naturalHeight,
    dispose() {},
  };
}

/**
 * Resolves once the video has metadata (duration), immediately if it already does.
 * Never rejects; stays pending if the video never loads.
 *
 * @param {HTMLVideoElement} video Video element.
 * @returns {Promise<void>} Resolves when `readyState >= 1`.
 */
function _sbWhenMetadata(video) {
  return video.readyState >= 1
    ? Promise.resolve()
    : new Promise(resolve =>
        video.addEventListener('loadedmetadata', () => resolve(), {
          once: true,
        }),
      );
}

// ---------------------------------------------------------------------------
// DOM
// ---------------------------------------------------------------------------

/**
 * Creates an element with an optional class and text.
 *
 * @template {keyof HTMLElementTagNameMap} K
 * @param {K} tag Tag name.
 * @param {string} [className] Space-separated class names.
 * @param {string} [text] Text content (never parsed as HTML).
 * @returns {HTMLElementTagNameMap[K]} The new element.
 */
function _sbEl(tag, className = '', text = '') {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}

/**
 * Builds one tile from a crop of a loaded image.
 *
 * @param {StoryboardCrop} crop Region and slot.
 * @param {StoryboardImage} image Loaded source image.
 * @param {string | null} linkUrl Optional link target base.
 * @returns {StoryboardTile} The tile.
 * @throws {Error} When no 2D context is available or drawing fails.
 */
function _sbCreateTile(crop, image, linkUrl) {
  const canvas = _sbEl('canvas');
  canvas.width = Math.round(crop.sw);
  canvas.height = Math.round(crop.sh);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  ctx.drawImage(
    image.source,
    crop.sx,
    crop.sy,
    crop.sw,
    crop.sh,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  const element = _sbEl('div', 'sb-tile');
  element.dataset.sbIndex = String(crop.index);

  if (linkUrl) {
    const url = new URL(linkUrl, document.baseURI);
    url.hash = `slot=${crop.index}`;
    const a = _sbEl('a');
    a.href = url.href;
    a.target = '_blank';
    a.rel = 'noopener';
    a.append(canvas);
    element.append(a);
  } else {
    element.append(canvas);
  }

  const label = _sbEl('div', 'sb-time');
  element.append(label);
  return {
    index: crop.index,
    time: crop.time,
    element,
    canvas,
    label,
    failed: false,
  };
}

/**
 * Builds a red "Image load error" placeholder tile.
 *
 * @param {Pick<StoryboardCrop, 'index' | 'time'>} slot Slot the tile stands in for.
 * @returns {StoryboardTile} The placeholder tile.
 */
function _sbCreateErrorTile(slot) {
  const element = _sbEl('div', 'sb-tile sb-error', 'Image load error');
  element.dataset.sbIndex = String(slot.index);
  const label = _sbEl('div', 'sb-time');
  element.append(label);
  return {
    index: slot.index,
    time: slot.time,
    element,
    canvas: null,
    label,
    failed: true,
  };
}

/**
 * Builds the collapsible control panel. UI state is persisted via GM storage.
 *
 * @param {object} config Panel configuration.
 * @param {(() => void) | null} config.onLocate Locate handler, or `null` to omit the button.
 * @param {() => void} config.onToggleGrid Called when the grid toggle is pressed.
 * @param {boolean} config.gridHidden Initial grid visibility state.
 * @returns {StoryboardPanel} The panel and its update hooks.
 */
function _sbCreatePanel({ onLocate, onToggleGrid, gridHidden }) {
  const element = _sbEl('details', 'sb-panel');
  element.open = Boolean(
    _sbGM.getValue(STORYBOARD_STORAGE_KEYS.panelOpen, true),
  );
  element.addEventListener('toggle', () =>
    _sbGM.setValue(STORYBOARD_STORAGE_KEYS.panelOpen, element.open),
  );
  element.append(_sbEl('summary', '', 'Storyboard'));

  const buttons = _sbEl('div', 'sb-buttons');
  const info = _sbEl('div', 'sb-info');
  info.hidden = true;

  /**
   * Adds a button to the panel.
   * @param {string} text Button label.
   * @param {string} title Tooltip.
   * @param {() => void} handler Click handler.
   * @returns {HTMLButtonElement} The button.
   */
  const addButton = (text, title, handler) => {
    const b = _sbEl('button', '', text);
    b.type = 'button';
    b.title = title;
    b.addEventListener('click', handler);
    buttons.append(b);
    return b;
  };

  if (onLocate)
    addButton(
      '◎ Locate',
      'Jump to the tile at the current playback time',
      onLocate,
    );
  const toggle = addButton('', 'Show or hide the thumbnails', onToggleGrid);
  addButton('ⓘ Info', 'Source images and render stats', () => {
    info.hidden = !info.hidden;
  });
  element.append(buttons, info);

  /**
   * Syncs the toggle button label with the grid state.
   * @param {boolean} hidden Whether the grid is hidden.
   * @returns {void}
   */
  const setGridHidden = hidden => {
    toggle.textContent = hidden ? '▦ Show' : '▦ Hide';
  };
  setGridHidden(gridHidden);

  /**
   * Fills the info popup.
   * @param {{tiles: number, ms: number, urls: readonly string[]}} stats Render statistics.
   * @returns {void}
   */
  const setStats = ({ tiles, ms, urls }) => {
    info.replaceChildren(
      _sbEl(
        'div',
        '',
        `${tiles} tiles · ${urls.length} image(s) · ${Math.round(ms)} ms`,
      ),
    );
    const copy = _sbEl('button', '', 'Copy URLs');
    copy.type = 'button';
    copy.addEventListener('click', () => {
      _sbGM.copy(urls.join('\n')).then(
        () => (copy.textContent = 'Copied ✓'),
        () => (copy.textContent = 'Copy failed'),
      );
    });
    info.append(copy);
    for (const url of urls) {
      const a = _sbEl('a', '', url);
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
      info.append(a);
    }
  };

  return { element, setGridHidden, setStats };
}

/**
 * Injects {@link STORYBOARD_CSS} once per page.
 *
 * @returns {void}
 */
function _sbEnsureStyles() {
  if (_sbStylesInjected) return;
  _sbGM.addStyle(STORYBOARD_CSS);
  _sbStylesInjected = true;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Renders a storyboard grid into `options.parent` and resolves once all
 * tiles have loaded. The grid appears immediately and fills progressively, in
 * source order.
 *
 * Both input modes (sprite sheets, WebVTT cues) go through the same pipeline:
 * build jobs, load each image once (shared sheets are cached and released after
 * their last use), crop tiles, append. Image failures never reject; they
 * produce red placeholder tiles that keep their slot index so later tiles still
 * seek correctly.
 *
 * If a sprite-sheet layout cannot be resolved without the duration, this waits
 * for the video's `loadedmetadata` event before building tiles.
 *
 * @param {StoryboardOptions} options Storyboard configuration.
 * @returns {Promise<StoryboardHandle>} Handle for resizing, seeking and cleanup.
 * @throws {TypeError} When `options.parent` is not an Element.
 * @throws {Error} For unresolvable layouts, missing sources or malformed WebVTT.
 *
 * @example
 * const sb = await storyboard({
 *   parent: document.querySelector('#below-player'),
 *   video: document.querySelector('video'),
 *   imageUrls: ['https://cdn.example/sb0.jpg', 'https://cdn.example/sb1.jpg'],
 *   columns: 5,
 *   rows: 5,
 *   interval: 10,
 * });
 * sb.setScale(1.5);
 */
async function storyboard(options) {
  const startedAt = performance.now();
  const {
    parent,
    video = null,
    imageUrls = [],
    webvtt = null,
    baseUrl = null,
    columns = null,
    rows = null,
    interval: intervalOption = null,
    totalSlots = null,
    indexOffset = 0,
    tileWidth = null,
    minTileWidth = STORYBOARD_MIN_TILE_WIDTH,
    linkUrl = null,
    controls = true,
    hashSeek = true,
  } = options ?? {};
  console.log(parent);
  if (!(parent instanceof Element))
    throw new TypeError('storyboard: `parent` must be an Element');

  _sbEnsureStyles();
  const abort = new AbortController();
  const { signal } = abort;
  const offset = Number(indexOffset) || 0;
  const base = baseUrl || document.baseURI;

  const root = _sbEl('div', 'sb-root');
  const grid = _sbEl('div', 'sb-grid');
  root.append(grid);
  parent.append(root);

  try {
    // ---- 1. Build jobs from whichever source was supplied ----------------
    /** @type {StoryboardJob[]} */
    let jobs;
    /** @type {StoryboardLayout | null} */
    let layout = null;

    if (webvtt) {
      jobs = parseWebvtt(webvtt, base).map((cue, index) => {
        /** @type {StoryboardCrop} */
        const crop = {
          index,
          time: cue.startTime,
          sx: cue.x,
          sy: cue.y,
          sw: cue.width,
          sh: cue.height,
        };
        return { url: cue.imageUrl, fallback: crop, crops: () => [crop] };
      });
    } else {
      const urls = imageUrls.map(u => new URL(u, base).href);
      if (!urls.length)
        throw new Error('storyboard: provide `webvtt` or `imageUrls`');

      /**
       * Resolves the layout from current inputs and the video duration.
       * @returns {StoryboardLayout} Completed layout.
       */
      const resolve = () =>
        resolveStoryboardLayout({
          columns,
          rows,
          interval: intervalOption,
          totalSlots,
          imageCount: urls.length,
          duration: video?.duration,
        });

      try {
        layout = resolve();
      } catch (error) {
        if (!video || video.readyState > 0) throw error;
        await _sbWhenMetadata(video);
        layout = resolve();
      }

      const resolved = layout;
      const perSheet = resolved.columns * resolved.rows;
      jobs = urls.map((url, sheet) => ({
        url,
        fallback: { index: sheet * perSheet, time: null },
        crops: image =>
          _sbGridCrops(image, resolved, sheet * perSheet, limit()),
      }));
    }

    /**
     * Exclusive upper bound for slot indexes.
     * @returns {number | null} The limit, or `null` when unlimited.
     */
    function limit() {
      return layout?.totalSlots ?? _sbPositive(totalSlots);
    }

    const max = limit();
    if (max) jobs = jobs.filter(job => job.fallback.index < max);

    // ---- 2. Image cache with reference counting --------------------------
    /** @type {Map<string, Promise<StoryboardImage>>} */
    const cache = new Map();
    /** @type {Map<string, number>} */
    const refs = new Map();
    for (const job of jobs) refs.set(job.url, (refs.get(job.url) ?? 0) + 1);
    const schedule = _sbCreateLimiter(STORYBOARD_MAX_CONCURRENT_LOADS);

    /**
     * Returns the (shared) load promise for an image, starting it if needed.
     * @param {string} url Absolute image URL.
     * @returns {Promise<StoryboardImage>} The decoded image.
     */
    const getImage = url => {
      let promise = cache.get(url);
      if (!promise) {
        promise = schedule(() => _sbLoadImage(url));
        promise.catch(() => {}); // failures are handled where awaited
        cache.set(url, promise);
      }
      return promise;
    };

    /**
     * Drops one reference to an image and frees it after the last use.
     * @param {string} url Absolute image URL.
     * @returns {void}
     */
    const release = url => {
      const left = (refs.get(url) ?? 1) - 1;
      refs.set(url, left);
      if (left > 0) return;
      const promise = cache.get(url);
      cache.delete(url);
      promise?.then(
        img => img.dispose(),
        () => {},
      );
    };

    // ---- 3. Timing, labels, sizing ---------------------------------------
    /** @type {StoryboardTile[]} */
    const tiles = [];
    /** @type {Map<number, StoryboardTile>} */
    const byIndex = new Map();
    /** @type {WeakMap<Element, StoryboardTile>} */
    const byElement = new WeakMap();
    let interval = layout?.interval ?? _sbPositive(intervalOption);
    /** @type {{width: number, height: number} | null} */
    let nativeSize = null;

    /**
     * Completes `interval` from the video duration when still unknown.
     * @returns {void}
     */
    const updateInterval = () => {
      const duration = video?.duration;
      const count = layout?.totalSlots ?? tiles.length;
      if (!interval && duration && Number.isFinite(duration) && count)
        interval = duration / count;
    };

    /**
     * Start time of a tile in seconds.
     * @param {StoryboardTile} tile Tile to resolve.
     * @returns {number | null} Seconds, or `null` when not yet known.
     */
    const slotTime = tile =>
      tile.time ?? (interval ? (tile.index + offset) * interval : null);

    /**
     * Refreshes the timestamp label of one tile.
     * @param {StoryboardTile} tile Tile to label.
     * @returns {void}
     */
    const labelTile = tile => {
      const time = slotTime(tile);
      tile.label.textContent = time === null ? '' : formatStoryboardTime(time);
    };

    /**
     * Recomputes the interval and relabels every tile.
     * @returns {void}
     */
    const refreshLabels = () => {
      updateInterval();
      tiles.forEach(labelTile);
    };

    /**
     * Sets the tile width in CSS pixels, preserving the native aspect ratio.
     * @param {number} width Width in CSS pixels.
     * @returns {void}
     */
    const setTileWidth = width => {
      if (!nativeSize || !(width > 0)) return;
      grid.style.setProperty('--sb-w', `${width}px`);
      grid.style.setProperty(
        '--sb-h',
        `${(width * nativeSize.height) / nativeSize.width}px`,
      );
    };

    /**
     * Sets the tile size as a multiple of the native size.
     * @param {number} factor Scale factor (1 = native).
     * @returns {void}
     */
    const setScale = factor => {
      if (nativeSize) setTileWidth(nativeSize.width * factor);
    };

    // ---- 4. Seeking and locating -----------------------------------------
    /**
     * Seeks the video, starts playback and scrolls it into view.
     * @param {number | null} time Target time in seconds.
     * @returns {void}
     */
    const seekTo = time => {
      if (!video || time === null || !Number.isFinite(time)) return;
      video.scrollIntoView({ behavior: 'instant', block: 'center' });
      video.currentTime = Math.max(0, time);
      video.play()?.catch(() => {});
    };

    /**
     * Seeks the video to a slot index.
     * @param {number} index Global slot index.
     * @returns {void}
     */
    const seekToSlot = index => {
      const tile = byIndex.get(index);
      seekTo(
        tile ? slotTime(tile) : interval ? (index + offset) * interval : null,
      );
    };

    /**
     * Finds the tile whose start time is at or immediately before playback.
     * @returns {StoryboardTile | null} The current tile, or `null` when no tile has a known time.
     * @example
     * const tile = currentTile();
     */
    const currentTile = () => {
      if (!video) return null;
      const now = video.currentTime;
      /** @type {StoryboardTile | null} */
      let current = null;
      let currentTime = -Infinity;
      for (const tile of tiles) {
        const time = slotTime(tile);
        if (time !== null && time <= now && time >= currentTime) {
          current = tile;
          currentTime = time;
        }
      }
      return current;
    };

    /**
     * Updates played and current classes from the video's playback position.
     * The current tile is excluded from `sb-played` so the two visual states
     * remain distinct while the video is playing.
     * @returns {void}
     * @example
     * video.addEventListener('timeupdate', updatePlaybackState);
     */
    const updatePlaybackState = () => {
      if (!video) return;
      const now = video.currentTime;
      const current = currentTile();
      for (const tile of tiles) {
        const time = slotTime(tile);
        tile.element.classList.toggle(
          'sb-played',
          time !== null && time < now && tile !== current,
        );
        tile.element.classList.toggle('sb-current', tile === current);
      }
    };

    let gridHidden = Boolean(
      _sbGM.getValue(STORYBOARD_STORAGE_KEYS.gridHidden, false),
    );
    grid.hidden = gridHidden;

    /** @type {StoryboardPanel | null} */
    let panel = null;

    /**
     * Shows or hides the grid and persists the choice.
     * @param {boolean} hidden Desired state.
     * @returns {void}
     */
    const setGridHidden = hidden => {
      gridHidden = hidden;
      grid.hidden = hidden;
      panel?.setGridHidden(hidden);
      _sbGM.setValue(STORYBOARD_STORAGE_KEYS.gridHidden, hidden);
    };

    /**
     * Scrolls to and flashes the tile at (or just before) the current playback time.
     * @returns {StoryboardTile | null} The located tile, or `null` when none has a known time.
     * @example
     * const tile = locateCurrent();
     */
    const locateCurrent = () => {
      const target = currentTile();
      if (!target) {
        if (!video) return null;
        const earliest = tiles
          .map(tile => ({ tile, time: slotTime(tile) }))
          .filter(item => item.time !== null)
          .sort((a, b) => a.time - b.time)[0];
        if (!earliest) return null;
        return locateTile(earliest.tile);
      }
      return locateTile(target);
    };

    /**
     * Scrolls to and flashes a storyboard tile.
     * @param {StoryboardTile} target Tile to locate.
     * @returns {StoryboardTile} The located tile.
     * @example
     * locateTile(tile);
     */
    const locateTile = target => {
      if (gridHidden) setGridHidden(false);
      const el = target.element;
      el.classList.remove('sb-blink');
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      void el.offsetWidth; // restart the CSS animation
      el.classList.add('sb-blink');
      el.addEventListener(
        'animationend',
        () => el.classList.remove('sb-blink'),
        { once: true },
      );
      return target;
    };

    // ---- 5. Events --------------------------------------------------------
    grid.addEventListener(
      'click',
      event => {
        const el = /** @type {Element} */ (event.target).closest('.sb-tile');
        const tile = el && byElement.get(el);
        if (!tile || !video) return;
        const modified =
          event.ctrlKey || event.metaKey || event.shiftKey || event.altKey;
        if (modified && el.querySelector('a')) return; // let the browser open the link
        event.preventDefault();
        seekTo(slotTime(tile));
      },
      { signal },
    );

    if (video) {
      video.addEventListener('loadedmetadata', refreshLabels, { signal });
      video.addEventListener('durationchange', refreshLabels, { signal });
      video.addEventListener('loadedmetadata', updatePlaybackState, { signal });
      video.addEventListener('durationchange', updatePlaybackState, { signal });
      video.addEventListener('timeupdate', updatePlaybackState, { signal });
      video.addEventListener('seeking', updatePlaybackState, { signal });
    }

    if (controls) {
      panel = _sbCreatePanel({
        onLocate: video ? locateCurrent : null,
        onToggleGrid: () => setGridHidden(!gridHidden),
        gridHidden,
      });
      root.prepend(panel.element);
    }

    // ---- 6. Load and render in source order ------------------------------
    jobs.forEach(job => getImage(job.url)); // start prefetching (limited concurrency)

    for (const job of jobs) {
      if (signal.aborted) break;

      /** @type {StoryboardTile[]} */
      let batch;
      try {
        const image = await getImage(job.url);
        batch = job.crops(image).map(crop => {
          try {
            return _sbCreateTile(crop, image, linkUrl);
          } catch (error) {
            console.warn('[storyboard] tile failed', error);
            return _sbCreateErrorTile(crop);
          }
        });
      } catch (error) {
        console.warn('[storyboard] image failed', job.url, error);
        batch = [_sbCreateErrorTile(job.fallback)];
      }
      release(job.url);

      for (const tile of batch) {
        tiles.push(tile);
        byIndex.set(tile.index, tile);
        byElement.set(tile.element, tile);
        if (!nativeSize && tile.canvas) {
          nativeSize = { width: tile.canvas.width, height: tile.canvas.height };
          setTileWidth(
            _sbPositive(tileWidth) ?? Math.max(nativeSize.width, minTileWidth),
          );
        }
      }
      grid.append(...batch.map(tile => tile.element));
      updateInterval();
      batch.forEach(labelTile);
      updatePlaybackState();
    }

    // ---- 7. Finish ---------------------------------------------------------
    panel?.setStats({
      tiles: tiles.length,
      ms: performance.now() - startedAt,
      urls: [...new Set(jobs.map(j => j.url))],
    });

    if (video && hashSeek) {
      const slot = _sbSlotFromHash();
      if (slot !== null) {
        _sbWhenMetadata(video).then(() => {
          if (!signal.aborted) seekToSlot(slot);
        });
      }
    }

    return {
      root,
      grid,
      tiles,
      setTileWidth,
      setScale,
      seekToSlot,
      locateCurrent,
      destroy() {
        abort.abort();
        root.remove();
      },
    };
  } catch (error) {
    abort.abort();
    root.remove();
    throw error;
  }
}
