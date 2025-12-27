(function () {
  'use strict';

  reEnableConsole();
  console.log('Userscript startup');

  const skipBtnSelectors = [
    '[data-test="player-skip-continue"]',
    '[data-test="plus-no-thanks"]',
    '[data-test="practice-hub-ad-no-thanks-button"]',
    '[data-test="plus-no-thanks"]',
  ];
  const skipBtnSelector = skipBtnSelectors.join(', ');

  //* auto advancing
  (function () {
    'use strict';

    waitForEach(skipBtnSelector, el => {
      el.click();
    });

    waitForEach('[data-test="session-complete-slide"]', () => {
      clickContinue();
    });

    waitForEach('[data-test="session-duo"]', el => {
      const messageElsArr = contains('div', 'You can do it', el.parentElement);
      const messageElsArr2 = contains(
        'div',
        "Let's review the exercises you missed!",
        el.parentElement
      );
      const messageElsArr3 = contains(
        'h2',
        'Daily Quests update!',
        el.parentElement
      );
      if (
        !messageElsArr.length &&
        !messageElsArr2.length &&
        !messageElsArr3.length
      ) {
        return;
      }
      clickContinue();
    });

    waitForEach('[data-test^="blame blame-correct"]', () => {
      //* auto advance when the answer is correct
      clickContinue();
    });

    //* skipping friend quest reminders
    waitForEach('[data-test="player-next"]', () => {
      const allBtnEls = document.querySelectorAll('button');
      const maybeLaterBtnsArr = contains('button', 'Maybe later');
      const isAFriendQuestReminder = contains('span', 'Friends Quest update!');
      if (isAFriendQuestReminder.length && maybeLaterBtnsArr.length) {
        maybeLaterBtnsArr[0].click();
      }
    });

    //* skipping ads
    waitForEach('[data-test="plus-close-x"]', skipBtnEl => {
      skipBtnEl.click();
    });

    //* auto skipping
    const noListeningLanguages = ['es'];
    waitForEach('[data-test="player-skip"]', skipBtnEl => {
      if (skipBtnEl.textContent === "Can't speak now") {
        skipBtnEl.click();
      }
      const isAListeningExercise = skipBtnEl.textContent === "Can't listen now";
      const language = document.querySelector(
        `[data-test="challenge-translate-input"], [data-test*="challenge-tap-token"]:has([data-test="challenge-tap-token-text"])`
      ).lang;
      const isANoListeningLanguage = noListeningLanguages.includes(language);

      if (isAListeningExercise && isANoListeningLanguage) {
        skipBtnEl.click();
      }
    });

    function clickContinue() {
      const continueBtn = document.querySelector('[data-test="player-next"]');
      if (continueBtn) continueBtn.click();
    }
  })();

  //* auto click "use keyboard"
  waitForEach('[data-test="player-toggle-keyboard"]', buttonEl => {
    if (buttonEl.innerText === 'USE KEYBOARD') buttonEl.click();
  });

  document.addEventListener('keydown', doc_keyDown, false);
  document.addEventListener('keyup', doc_keyUp, false);
  // had to use keyup variation because a certain key combination didn't work in the other

  waitForEach('[spellcheck="false"]', el => {
    el.setAttribute('spellcheck', 'true');
  });

  function handleNumericKeyPresses(event) {
    const keyCode = +event.key;
    if (!Number.isInteger(keyCode)) return;

    const isKeyCodeGreaterThanOne = keyCode >= 1;
    const isKeyCodeLessThanTen = keyCode <= 9;
    if (!(isKeyCodeGreaterThanOne && isKeyCodeLessThanTen)) return;

    event.preventDefault();
    const query = '[data-test="hint-token"],[data-test="challenge-tap-token"]';
    const wordHintEls = document.querySelectorAll(query);
    const selectedWordHintEl = wordHintEls[keyCode];
    selectedWordHintEl.click();
  }

  function doc_keyDown(e) {
    // numbers from 1 to 9 for word hints
    handleNumericKeyPresses(e);

    // backspace, space and a-z keys focuses the text area and send the pressed key again in the text area
    if (
      (e.code == 'Backspace' ||
        e.code == 'Space' ||
        (e.key.charCodeAt(0) >= 97 && e.key.charCodeAt(0) <= 122)) &&
      document.getElementsByTagName('textarea')[0]
    ) {
      var textEl = document.getElementsByTagName('textarea')[0];
      textEl.focus();
      // textEl.value += e.key;
      // textEl.value = e.key;
    }

    // console.log(e.code);

    // can't speak and can't hear buttons
    if (e.ctrlKey && e.key == 'q') {
      const skipBtn = document.querySelector('[data-test=player-skip]');
      if (!skipBtn && skipBtn.innerText === 'SKIP') return; // 🛑
      skipBtn.click();
    }
    // discuss button
    var discusButton = document.querySelector('[data-test=discussion-button]');
    if (e.code == 'KeyD' && discusButton) discusButton.click();

    // tab to set focus on the text area
    if (e.code == 'Tab') document.getElementsByTagName('textarea')[0].focus();

    // condition to check if a choice element exists
    let choiceParent;
    let choiceEls;
    if (['j', 'k', 'l', ';'].includes(e.key)) {
      choiceParent = document.querySelector(`[aria-label='choice']`);
      if (!choiceParent) return; // 🛑
      choiceEls = document.querySelector(`[aria-label='choice']`).children;
    }

    switch (e.key) {
      case 'j':
        choiceEls[0].click();
        break;
      case 'k':
        choiceEls[1].click();
        break;
      case 'l':
        choiceEls[2].click();
        break;
      case ';':
        choiceEls[3].click();
        break;
      default:
        break;
    }
  }

  function doc_keyUp(e) {
    // ctrl + space to speak
    if (e.ctrlKey && e.code == 'Space')
      document.querySelectorAll('[dir=ltr] > button')[0].click();

    // ctrl + shift + space slow speak
    if (e.shiftKey && e.ctrlKey && e.code == 'Space')
      document.querySelectorAll('[dir=ltr] > button')[1].click();
  }
})();
