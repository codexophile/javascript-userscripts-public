(function () {
  'use strict';
  if (window.top != window.self) return; //don't run on frames or iframes

  waitForEach('.group .lucide-eye-off', lucideEyeEl => {
    const actualImgEl =
      lucideEyeEl.parentElement.parentElement.querySelector('[alt=Moderated]');
    const imgSrc = actualImgEl.src;
    GM_notification({
      text: '',
      title: 'Moderated',
      image: imgSrc,
    });
  });

  waitForEach('video', videoEl => {
    videoEl.volume = 0.1;
  });

  //* Prompt history management
  const STORAGE_KEY = 'grok_video_prompts';

  function getSavedPrompts() {
    const saved = GM_getValue(STORAGE_KEY, '[]');
    return JSON.parse(saved);
  }

  function savePrompt(prompt) {
    if (!prompt || !prompt.trim()) return;

    const prompts = getSavedPrompts();

    // Silently ignore if prompt already exists
    if (prompts.includes(prompt.trim())) return;

    prompts.unshift(prompt.trim()); // Add to beginning
    GM_setValue(STORAGE_KEY, JSON.stringify(prompts));

    return true; // Indicate it was saved
  }

  function deletePrompt(prompt) {
    const prompts = getSavedPrompts();
    const filtered = prompts.filter(p => p !== prompt);
    GM_setValue(STORAGE_KEY, JSON.stringify(filtered));
  }

  function usePrompt(prompt) {
    const promptTextareaEl = document.querySelector(
      `textarea[aria-label="Make a video"]`,
    );
    if (promptTextareaEl) {
      const { set } = Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype,
        'value',
      );
      set.call(promptTextareaEl, prompt);
      promptTextareaEl.dispatchEvent(new Event('input', { bubbles: true }));
      promptTextareaEl.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  function isPostUrl(url) {
    return url.includes('/post/');
  }

  function createUrlChangeWatcher(onChange) {
    let lastUrl = window.location.href;
    let installed = false;

    function notifyIfChanged() {
      const currentUrl = window.location.href;
      if (currentUrl === lastUrl) return;
      lastUrl = currentUrl;
      onChange(currentUrl);
    }

    if (installed) return;
    installed = true;

    const wrapHistoryMethod = methodName => {
      const original = history[methodName];
      history[methodName] = function (...args) {
        const result = original.apply(this, args);
        notifyIfChanged();
        return result;
      };
    };

    wrapHistoryMethod('pushState');
    wrapHistoryMethod('replaceState');
    window.addEventListener('popstate', notifyIfChanged);
    window.addEventListener('hashchange', notifyIfChanged);

    // Initial page load
    onChange(lastUrl);
  }

  // Create UI for saved prompts
  async function createPromptsUI() {
    const container = document.createElement('div');
    container.id = 'grok-prompt-history';
    container.className = 'grok-prompt-history__container';
    container.style.cssText =
      'display: flex; flex-direction: column; gap: 6px;';

    const headerHint = document.createElement('div');
    headerHint.id = 'grok-prompt-history-hint';
    headerHint.className = 'grok-prompt-history__hint';
    headerHint.style.cssText =
      'font-size: 12px; color: #666; margin-bottom: 4px;';
    headerHint.textContent =
      'Click a prompt to reuse it. Only on /post/ pages.';
    container.appendChild(headerHint);

    const listContainer = document.createElement('div');
    listContainer.id = 'grok-prompt-history-list';
    listContainer.className = 'grok-prompt-history__list';
    listContainer.style.cssText =
      'display: flex; flex-direction: column; gap: 5px;';
    container.appendChild(listContainer);

    const guiContainer = dialog('Saved Prompts', container, '300px');
    guiContainer.querySelector('#expand-btn').click();
    guiContainer.id = 'grok-prompt-history-dialog';
    guiContainer.classList.add('grok-prompt-history__dialog');
    guiContainer.style.backgroundColor = '#f6f6f6';

    function refreshPromptsList() {
      listContainer.replaceChildren();

      const prompts = getSavedPrompts();

      if (prompts.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.id = 'grok-prompt-history-empty';
        emptyMsg.className = 'grok-prompt-history__empty';
        emptyMsg.style.cssText =
          'padding: 8px; color: #888; text-align: center; width: 100%;';
        emptyMsg.textContent = 'No saved prompts yet';
        listContainer.appendChild(emptyMsg);
        return;
      }

      prompts.forEach(prompt => {
        const promptItem = document.createElement('div');
        promptItem.className = 'grok-prompt-history__item';
        promptItem.setAttribute('data-prompt', prompt);
        promptItem.style.cssText = `
          display: flex;
          gap: 6px;
          background: #ffffff;
          padding: 8px;
          border-radius: 4px;
          border: 1px solid #e1e1e1;
          cursor: pointer;
          transition: background 0.2s;
        `;

        const promptText = document.createElement('div');
        promptText.className = 'grok-prompt-history__text';
        promptText.style.cssText = `
          flex: 1;
          color: #333;
          font-size: 12px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        `;
        promptText.textContent = prompt;
        promptText.title = prompt;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'grok-prompt-history__delete-btn';
        deleteBtn.type = 'button';
        deleteBtn.textContent = '🗑️';
        deleteBtn.title = 'Delete prompt';
        deleteBtn.style.cssText = `
          background: #ff4444;
          color: #fff;
          border: none;
          border-radius: 3px;
          cursor: pointer;
          padding: 2px 6px;
          font-size: 12px;
        `;

        deleteBtn.addEventListener('click', e => {
          e.stopPropagation();
          deletePrompt(prompt);
          refreshPromptsList();
        });

        promptItem.addEventListener('click', () => {
          usePrompt(prompt);
        });

        promptItem.addEventListener('mouseenter', () => {
          promptItem.style.background = '#f0f0f0';
        });

        promptItem.addEventListener('mouseleave', () => {
          promptItem.style.background = '#ffffff';
        });

        promptItem.appendChild(promptText);
        promptItem.appendChild(deleteBtn);
        listContainer.appendChild(promptItem);
      });
    }

    refreshPromptsList();
    return { refresh: refreshPromptsList, root: guiContainer };
  }

  const promptUiState = {
    refresh: null,
    root: null,
    created: false,
  };

  function teardownPromptsUI() {
    if (promptUiState.root && promptUiState.root.remove) {
      promptUiState.root.remove();
    }
    promptUiState.refresh = null;
    promptUiState.root = null;
    promptUiState.created = false;
  }

  async function ensurePromptsUI() {
    if (promptUiState.created) return;
    const { refresh, root } = await createPromptsUI();
    promptUiState.refresh = refresh;
    promptUiState.root = root;
    promptUiState.created = true;
  }

  createUrlChangeWatcher(url => {
    if (isPostUrl(url)) {
      ensurePromptsUI();
    } else {
      teardownPromptsUI();
    }
  });

  waitForEach('button[aria-label="Make video"]', makeVidBtnEl => {
    makeVidBtnEl.addEventListener('click', () => {
      const promptTextareaEl = document.querySelector(
        `textarea[aria-label="Make a video"]`,
      );
      const prompt = promptTextareaEl.value;

      if (savePrompt(prompt)) {
        // Prompt was saved (wasn't a duplicate)
        if (promptUiState.refresh) promptUiState.refresh();
      }
    });
  });
})();
