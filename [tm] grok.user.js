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
      promptTextareaEl.value = prompt;
      promptTextareaEl.dispatchEvent(new Event('input', { bubbles: true }));
      promptTextareaEl.focus();
    }
  }

  // Create UI for saved prompts
  async function createPromptsUI() {
    const collapsible = await Collapsible('Prompts', {
      bottom: '20px',
      left: '20px',
      width: '400px',
      height: '300px',
      backgroundColor: '#1a1a1a',
      contentBgColor: '#252525',
    });

    function refreshPromptsList() {
      collapsible.collapsibleContent.replaceChildren();

      const prompts = getSavedPrompts();

      if (prompts.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.style.cssText =
          'padding: 10px; color: #888; text-align: center; width: 100%;';
        emptyMsg.textContent = 'No saved prompts yet';
        collapsible.addElement(emptyMsg);
        return;
      }

      const listContainer = document.createElement('div');
      listContainer.style.cssText =
        'display: flex; flex-direction: column; gap: 5px; padding: 5px; width: 100%;';

      prompts.forEach(prompt => {
        const promptItem = document.createElement('div');
        promptItem.style.cssText = `
          display: flex;
          gap: 5px;
          background: #1a1a1a;
          padding: 8px;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.2s;
        `;

        const promptText = document.createElement('div');
        promptText.style.cssText = `
          flex: 1;
          color: #e0e0e0;
          font-size: 12px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        `;
        promptText.textContent = prompt;
        promptText.title = prompt;

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '🗑️';
        deleteBtn.style.cssText = `
          background: #ff4444;
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
          promptItem.style.background = '#2c2c2c';
        });

        promptItem.addEventListener('mouseleave', () => {
          promptItem.style.background = '#1a1a1a';
        });

        promptItem.appendChild(promptText);
        promptItem.appendChild(deleteBtn);
        listContainer.appendChild(promptItem);
      });

      collapsible.addElement(listContainer);
    }

    refreshPromptsList();
    return refreshPromptsList;
  }

  let refreshUI;
  createPromptsUI().then(refresh => {
    refreshUI = refresh;
  });

  waitForEach('button[aria-label="Make video"]', makeVidBtnEl => {
    makeVidBtnEl.addEventListener('click', () => {
      const promptTextareaEl = document.querySelector(
        `textarea[aria-label="Make a video"]`,
      );
      const prompt = promptTextareaEl.value;

      if (savePrompt(prompt)) {
        // Prompt was saved (wasn't a duplicate)
        if (refreshUI) refreshUI();
      }
    });
  });
})();
