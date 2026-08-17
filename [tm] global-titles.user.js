(async function () {
  'use strict';

  const titleEl = await waitFor(`title`);

  const LengthVal = '0.8rem';
  const btnLengthVal = '1.7rem';

  function colorToRgbValues(color) {
    const value = (color || '').trim();

    if (!value) {
      return { r: 120, g: 144, b: 255 };
    }

    const rgbMatch = value.match(/\d+/g);
    if (rgbMatch && rgbMatch.length >= 3) {
      return {
        r: Number(rgbMatch[0]),
        g: Number(rgbMatch[1]),
        b: Number(rgbMatch[2]),
      };
    }

    // Support hex colors such as #RGB, #RRGGBB, #RGBA, #RRGGBBAA.
    if (value.startsWith('#')) {
      const hex = value.slice(1);
      const hexToNum = pair => Number.parseInt(pair, 16);

      if (hex.length === 3 || hex.length === 4) {
        return {
          r: hexToNum(hex[0] + hex[0]),
          g: hexToNum(hex[1] + hex[1]),
          b: hexToNum(hex[2] + hex[2]),
        };
      }

      if (hex.length === 6 || hex.length === 8) {
        return {
          r: hexToNum(hex.slice(0, 2)),
          g: hexToNum(hex.slice(2, 4)),
          b: hexToNum(hex.slice(4, 6)),
        };
      }
    }

    return { r: 120, g: 144, b: 255 };
  }

  function applyAccentColor(color) {
    const { r, g, b } = colorToRgbValues(color);
    const contrast = r * 0.299 + g * 0.587 + b * 0.114;

    document.documentElement.style.setProperty(
      '--global-title-accent-rgb',
      `${r}, ${g}, ${b}`,
    );
    document.documentElement.style.setProperty(
      '--global-title-accent-color',
      `rgb(${r}, ${g}, ${b})`,
    );
    document.documentElement.style.setProperty(
      '--global-title-accent-soft',
      `rgba(${r}, ${g}, ${b}, 0.2)`,
    );
    document.documentElement.style.setProperty(
      '--global-title-accent-strong',
      `rgba(${r}, ${g}, ${b}, 0.9)`,
    );
    document.documentElement.style.setProperty(
      '--global-title-accent-ink',
      contrast > 176 ? '#0d1117' : '#f6f8ff',
    );
  }

  function isUsableAccentColor(color) {
    if (!color) return false;

    const normalized = color.toLowerCase().replace(/\s+/g, '');
    return normalized !== '#000000' && normalized !== 'rgb(0,0,0)';
  }

  async function resolveAccentColor() {
    try {
      const faviconColor = await getAccentColorFromFavicon();
      if (isUsableAccentColor(faviconColor)) {
        return faviconColor;
      }
    } catch (error) {
      console.warn('Failed to read favicon accent color:', error);
    }

    try {
      const pageAccentColor = getAccentColor();
      if (isUsableAccentColor(pageAccentColor)) {
        return pageAccentColor;
      }
    } catch (error) {
      console.warn('Failed to infer accent color from page styles:', error);
    }

    return '#7588ff';
  }

  const accentColor = await resolveAccentColor();

  applyAccentColor(accentColor);

  GM_addStyle(`
    :root {
      --global-title-accent-rgb: 118, 136, 255;
      --global-title-accent-color: rgb(var(--global-title-accent-rgb));
      --global-title-accent-soft: rgba(var(--global-title-accent-rgb), 0.2);
      --global-title-accent-strong: rgba(var(--global-title-accent-rgb), 0.9);
      --global-title-accent-ink: #edf3ff;
    }

    #main-cnt {
      --shadow-1: rgba(0, 0, 0, 0.32);
      --shadow-2: rgba(var(--global-title-accent-rgb), 0.28);
      z-index: 2147483647;
      position: fixed;
      right: ${LengthVal};
      bottom: ${LengthVal};
      display: flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.25rem 0.35rem 0.25rem 0.5rem;
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      background: linear-gradient(135deg, rgba(12, 15, 22, 0.82) 0%, rgba(20, 22, 30, 0.9) 100%);
      box-shadow:
        0 16px 40px var(--shadow-1),
        0 0 0 1px rgba(255, 255, 255, 0.06) inset,
        0 0 24px var(--shadow-2);
      backdrop-filter: blur(16px) saturate(1.2);
      -webkit-backdrop-filter: blur(16px) saturate(1.2);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      transition: transform 180ms ease, box-shadow 180ms ease, opacity 180ms ease;
      user-select: none;
    }

    #main-cnt:hover {
      box-shadow:
        0 18px 42px var(--shadow-1),
        0 0 0 1px rgba(255, 255, 255, 0.08) inset,
        0 0 28px var(--shadow-2);
      transform: translateY(-1px);
    }

    #main-cnt #content {
      min-width: 0;
      max-width: min(34vw, 420px);
      padding: 0.2rem 0.35rem 0.2rem 0.1rem;
      color: rgba(255, 255, 255, 0.92);
      font-size: clamp(0.95rem, 0.8rem + 0.42vw, 1.15rem);
      font-weight: 600;
      letter-spacing: 0.01em;
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.28);
      transition: max-width 180ms ease, opacity 180ms ease, padding 180ms ease;
    }

    #main-cnt #content.is-updating {
      animation: content-refresh 240ms ease;
    }

    @keyframes content-refresh {
      0% {
        opacity: 0.45;
        transform: translateY(2px);
      }

      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }

    #main-cnt #btns-cnt {
      display: flex;
      align-items: center;
      gap: 0.28rem;
      flex-shrink: 0;
    }

    #main-cnt .btn {
      width: ${btnLengthVal};
      height: ${btnLengthVal};
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      padding: 0;
      background: linear-gradient(135deg, rgba(var(--global-title-accent-rgb), 0.92) 0%, rgba(var(--global-title-accent-rgb), 0.7) 100%);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 6px 16px rgba(var(--global-title-accent-rgb), 0.25);
      color: var(--global-title-accent-ink);
      font-weight: 700;
      font-size: 0.78rem;
      line-height: 1;
      cursor: pointer;
      transition: transform 160ms ease, box-shadow 160ms ease, filter 160ms ease;
    }

    #main-cnt .btn:hover {
      transform: translateY(-1px) scale(1.02);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22), 0 10px 18px rgba(var(--global-title-accent-rgb), 0.32);
      filter: brightness(1.05);
    }

    #main-cnt .btn:active {
      transform: translateY(0) scale(0.98);
    }

    #main-cnt .btn:focus-visible {
      outline: 2px solid rgba(var(--global-title-accent-rgb), 0.9);
      outline-offset: 2px;
    }

    #main-cnt #btn-toggle {
      background: linear-gradient(135deg, rgba(120, 128, 144, 0.96) 0%, rgba(86, 92, 107, 0.9) 100%);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 6px 16px rgba(0, 0, 0, 0.2);
      color: rgba(255, 255, 255, 0.94);
    }

    #main-cnt.is-collapsed #content {
      max-width: 0;
      opacity: 0;
      padding-left: 0;
      padding-right: 0;
      margin-right: -0.15rem;
    }

    @media (max-width: 640px) {
      #main-cnt {
        max-width: calc(100vw - 1rem);
      }

      #main-cnt #content {
        max-width: min(52vw, 260px);
      }
    }
  `);

  await waitFor('body');
  const mainCntEl = generateElements(
    `
    <div id="main-cnt" aria-live="polite">
      <div id="btns-cnt">
        <button id="btn-toggle" class="btn" type="button" aria-label="Toggle title panel">⇰</button>
        <button id="btn-copy-title" class="btn" type="button" aria-label="Copy page title">T</button>
        <button id="btn-copy-url" class="btn" type="button" aria-label="Copy page URL">U</button>
        <button id="btn-open-in-new" class="btn" type="button" aria-label="Open page in new tab">↗</button>
      </div>
      <div id="content"></div>
    </div>
  `,
    document.body,
  );

  const titleCntEl = mainCntEl.querySelector('#content');
  const toggleBtn = mainCntEl.querySelector('#btn-toggle');
  const copyTitleBtn = mainCntEl.querySelector('#btn-copy-title');
  const copyUrlBtn = mainCntEl.querySelector('#btn-copy-url');

  const setCollapseState = isCollapsed => {
    mainCntEl.classList.toggle('is-collapsed', isCollapsed);
    toggleBtn.textContent = isCollapsed ? '⇱' : '⇰';
    toggleBtn.title = isCollapsed
      ? 'Expand title panel'
      : 'Collapse title panel';
  };

  toggleBtn.addEventListener('click', () => {
    setCollapseState(!mainCntEl.classList.contains('is-collapsed'));
  });

  const copyText = async value => {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch (error) {
      try {
        GM_setClipboard(value);
        return true;
      } catch (clipboardError) {
        console.warn('Failed to copy text:', clipboardError);
        return false;
      }
    }
  };

  copyTitleBtn.addEventListener('click', async () => {
    const copied = await copyText(document.title);
    if (copied) {
      copyTitleBtn.textContent = '✓';
      setTimeout(() => {
        copyTitleBtn.textContent = 'T';
      }, 900);
    }
  });

  copyUrlBtn.addEventListener('click', async () => {
    const copied = await copyText(window.location.href);
    if (copied) {
      copyUrlBtn.textContent = '✓';
      setTimeout(() => {
        copyUrlBtn.textContent = 'U';
      }, 900);
    }
  });

  mainCntEl.querySelector('#btn-open-in-new').addEventListener('click', () => {
    window.open(window.location.href, '_blank', 'noopener,noreferrer');
  });

  setCollapseState(false);

  const triggerContentUpdateAnimation = () => {
    titleCntEl.classList.remove('is-updating');
    // Force a reflow so the animation reliably re-triggers on rapid updates.
    void titleCntEl.offsetWidth;
    titleCntEl.classList.add('is-updating');
  };

  let observer = new MutationObserver(main);
  observer.observe(titleEl, { childList: true, subtree: true });
  main();

  function main() {
    const title = document.title;
    if (!titleCntEl) return;
    titleCntEl.textContent = title;
    titleCntEl.title = title;
    triggerContentUpdateAnimation();
  }
})();
