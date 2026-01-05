(function () {
  ('use strict');
  if (window.top != window.self) return; //don't run on frames or iframes

  //* API
  (function () {
    'use strict';

    const CLIENT_ID = getSecret('redditClientId');
    const CLIENT_SECRET = getSecret('redditClientSecret');
    const USER_AGENT = 'MainScript/1.0 (by /u/codexophile)';

    waitForEach('shreddit-post', async postEl => {
      const postId = getPostId(postEl);
      const token = await getAccessToken();
      const postData = await getPostData(postId, token);

      //* displaying selftext
      if (
        postData.selftext &&
        postData.selftext.trim() !== '' &&
        !location.href.includes('/comments/')
      ) {
        const selfTextEl = generateElements(
          `<div class="shreddit-post-selftext userscript-code"></div>`,
          postEl
        );
        // selfTextEl.textContent = postData.selftext;
        selfTextEl.innerHTML = marked.parse(postData.selftext);
        selfTextEl.querySelectorAll('a').forEach(aEl => {
          aEl.target = '_blank';
        });
        style(
          selfTextEl,
          `
          max-height: 500px;
          overflow-y: auto;`
        );

        const originalSelfTextEl = postEl.querySelector(
          'shreddit-post-text-body'
        );
        if (originalSelfTextEl) {
          originalSelfTextEl.style.display = 'none';
        }
      }

      //*

      const score = postData.score;
      const upvoteRatio = postData.upvote_ratio;
      const upvotes = calculateUpvotes(score, upvoteRatio);
      const downvotes = calculateDownvotes(score, upvoteRatio);
      const author = postData.author;

      const secondaryToolbarEl = generateElements('<div></div>', postEl);
      createPercentageDispEl(upvoteRatio, secondaryToolbarEl);
      const upvotesDispEl = createVotesDispEl(
        'up',
        upvotes,
        secondaryToolbarEl
      );
      const downvotesDispEl = createVotesDispEl(
        'down',
        downvotes,
        secondaryToolbarEl
      );
      postEl.querySelector('a[data-ks-id]').remove();
      const opDispEl = createOpDispEl(author, secondaryToolbarEl);

      // Add button to load top 3 comments
      const loadCommentsBtn = createSecondaryToolbarElement(
        '💬 Load Top 3 Comments',
        null,
        secondaryToolbarEl
      );
      loadCommentsBtn.addEventListener('click', async () => {
        loadCommentsBtn.disabled = true;
        loadCommentsBtn.textContent = 'Loading...';

        try {
          const comments = await getTopComments(postId, token, 3);
          displayComments(comments, postEl, loadCommentsBtn);
        } catch (error) {
          console.error('Error loading comments:', error);
          loadCommentsBtn.textContent = '❌ Error loading comments';
        }
      });
    });

    async function getTopComments(postId, token, limit = 3) {
      return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: 'GET',
          url: `https://oauth.reddit.com/comments/${postId}?limit=${
            limit + 10
          }&depth=1&sort=top`,
          headers: {
            Authorization: `Bearer ${token}`,
            'User-Agent': USER_AGENT,
          },
          onload: function (response) {
            try {
              const data = JSON.parse(response.responseText);
              if (data && data.length > 1 && data[1].data.children) {
                const comments = data[1].data.children
                  .filter(
                    child =>
                      child.kind === 't1' &&
                      child.data.author !== 'AutoModerator'
                  )
                  .slice(0, limit)
                  .map(child => child.data);
                resolve(comments);
              } else {
                reject(new Error('Comments not found'));
              }
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

    function displayComments(comments, postEl, buttonEl) {
      // Remove existing comments container if it exists
      const existingContainer = postEl.querySelector(
        '.userscript-comments-container'
      );
      if (existingContainer) {
        existingContainer.remove();
      }

      // Create container for comments
      const commentsContainer = generateElements(
        '<div class="userscript-comments-container"></div>',
        postEl
      );

      style(
        commentsContainer,
        `
        margin: 10px;
        padding: 10px;
        background: rgba(0, 0, 0, 0.05);
        border-radius: 5px;
        border-left: 3px solid #ff4500;
      `
      );

      comments.forEach((comment, index) => {
        const commentEl = generateElements(
          '<div class="userscript-comment"></div>',
          commentsContainer
        );

        style(
          commentEl,
          `
          margin-bottom: 10px;
          padding: 10px;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 3px;
        `
        );

        const authorEl = generateElements(
          `<div><strong>👤 ${comment.author}</strong> • 👍 ${comment.score}</div>`,
          commentEl
        );
        style(
          authorEl,
          `
          margin-bottom: 5px;
          font-size: 0.9em;
          color: #666;
        `
        );

        const bodyEl = generateElements('<div></div>', commentEl);
        bodyEl.innerHTML = marked.parse(comment.body);
        bodyEl.querySelectorAll('a').forEach(aEl => {
          aEl.target = '_blank';
        });
        style(
          bodyEl,
          `
          line-height: 1.5;
        `
        );
      });

      buttonEl.textContent = `💬 Loaded ${comments.length} comments`;
      buttonEl.disabled = false;
    }

    function createSecondaryToolbarElement(text, childEl, parentEl) {
      const secondaryToolbarEl = generateElements(
        `<button>${text}</button>`,
        parentEl
      );
      style(
        secondaryToolbarEl,
        `
        margin: 10px;
        padding: 5px;
        line-height: unset;
      `
      );
      if (childEl) secondaryToolbarEl.appendChild(childEl);
      return secondaryToolbarEl;
    }

    function createPercentageDispEl(ratioValue, parentEl) {
      const percentage = Math.round(ratioValue * 100);
      const percentageDispEl = createSecondaryToolbarElement(
        `${percentage}% 💹`,
        null,
        parentEl
      );
      // const percentageDispEl = generateElements( `<button>${ percentage } 💹</button>`, parentEl );
      return percentageDispEl;
    }

    function createOpDispEl(username, parentEl) {
      const opLinkEl = generateElements(`<a>${username}</a>`);
      const opDispEl = createSecondaryToolbarElement('🧑🏻‍🦱 ', opLinkEl, parentEl);
      opLinkEl.href = `https://www.reddit.com/user/${username}`;
      opLinkEl.target = '_blank';
      return opDispEl;
    }

    function createVotesDispEl(direction, value, parent) {
      if (direction === 'up') {
        const dispEl = createSecondaryToolbarElement(
          `☝🏻 ${value}`,
          null,
          parent
        );
        return dispEl;
      } else if (direction === 'down') {
        const dispEl = createSecondaryToolbarElement(
          `👇🏻 ${value}`,
          null,
          parent
        );
        return dispEl;
      } else {
        return null;
      }
    }

    function calculateUpvotes(score, upvoteRatio) {
      // Handle edge cases
      if (upvoteRatio === 0) return score; // 0% upvoted, all downvotes
      if (upvoteRatio === 1) return score; // 100% upvoted, all upvotes
      if (upvoteRatio === 0.5) return score; // 50% upvoted, equal upvotes and downvotes

      const upvotes = Math.round((score * upvoteRatio) / (2 * upvoteRatio - 1));
      return upvotes;
    }

    function calculateDownvotes(score, upvoteRatio) {
      // Handle edge cases
      if (upvoteRatio === 0) return 0; // Should never happen in practice
      if (upvoteRatio === 1) return 0; // 100% upvoted, no downvotes
      if (upvoteRatio === 0.5) return Math.abs(score); // Score should be 0 in this case, but taking abs for safety

      const downvotes = Math.round(
        (score * (1 - upvoteRatio)) / (2 * upvoteRatio - 1)
      );
      return downvotes;
    }

    function getPostData(postId, token) {
      return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: 'GET',
          url: `https://oauth.reddit.com/api/info?id=t3_${postId}`,
          headers: {
            Authorization: `Bearer ${token}`,
            'User-Agent': USER_AGENT,
          },
          onload: function (response) {
            try {
              const data = JSON.parse(response.responseText);
              if (
                data.data &&
                data.data.children &&
                data.data.children.length > 0
              ) {
                resolve(data.data.children[0].data);
              } else {
                reject(new Error('Post data not found'));
              }
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

    function getAccessToken() {
      return new Promise((resolve, reject) => {
        // Check if we have a cached token and it's not expired
        const tokenData = GM_getValue('redditTokenData', null);
        const currentTime = Date.now();

        if (tokenData && tokenData.expiresAt > currentTime) {
          console.log('Using cached token');
          resolve(tokenData.accessToken);
          return;
        }

        // No valid cached token, request a new one
        const auth = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);

        GM_xmlhttpRequest({
          method: 'POST',
          url: 'https://www.reddit.com/api/v1/access_token',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': USER_AGENT,
          },
          data: 'grant_type=client_credentials',
          onload: function (response) {
            try {
              const data = JSON.parse(response.responseText);
              if (data.access_token) {
                // Cache the token with expiration time (subtract 60 seconds for safety)
                const expiresIn = (data.expires_in || 3600) - 60;
                const expiresAt = currentTime + expiresIn * 1000;

                GM_setValue('redditTokenData', {
                  accessToken: data.access_token,
                  expiresAt: expiresAt,
                });

                console.log(
                  'New token cached until:',
                  new Date(expiresAt).toLocaleString()
                );
                resolve(data.access_token);
              } else {
                reject(new Error('No access token received'));
              }
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

    function getPostId(postEl) {
      const matches = location.href.match(/\/comments\/(.+?)\//);
      if (matches) {
        return matches[1];
      }
      return postEl.id.slice(3);
    }
  })();

  //* Filtering
  markAndFilter(
    'shreddit-feed > article',
    'shreddit-post',
    'id',
    /t3_(.+)$/,
    null,
    false
    // 'https://sh.reddit.com'
  );

  //* Collapsible
  waitFor('.collapsible-content').then(async el => {
    // el.parentElement.style.left = '';
    // el.parentElement.style.right = '5px';

    const collapsible = await Collapsible();
    const redditPopup = collapsible.addPopup();
    redditPopup.id = 'redditPopup';
    collapsible.addButton('Reddit', redditPopup);
    const match = location.href.match(/\/\/.+?\.(.*)/);
    const oldLink = `https://old.${match[1]}`;
    const newLink = `https://new.${match[1]}`;
    const shLink = `https://sh.${match[1]}`;
    const wwwLink = `https://www.${match[1]}`;

    function blockAnchor(href, text) {
      generateElements(
        `<a href=${href}>${text}</a>`,
        redditPopup
      ).style.display = 'block';
    }
    blockAnchor(newLink, 'New');
    blockAnchor(shLink, 'SH');
    blockAnchor(oldLink, 'Old');
    blockAnchor(wwwLink, 'WWW');

    //? regex -> (.+?/r/.+?)(/|$)
    const subredditMatch = location.href.match(/(.+?\/r\/.+?)(\/|$)/);
    if (subredditMatch) {
      generateElements('<hr>', redditPopup);
      const topAllLink = `${subredditMatch[1]}/top/?t=all`;
      blockAnchor(topAllLink, 'TopAll');
    }

    const uncollapseBtnEl = collapsible.addButton('🌂', null, () => {
      document.querySelectorAll(`shreddit-comment`).forEach(el => {
        el.style.display = 'block';
      });
    });
  });

  //* Upvote/Downvote buttons
  waitForEach('shreddit-comment', commentEl => {
    const buttonsContEl = generateElements('<div></div>', commentEl);
    buttonsContEl.classList.add('up-down-container');
    style(
      buttonsContEl,
      `
      position: absolute;
      top: 0;
      left: -30px;
      margin: 5px;
    `
    );

    const generateButton = (icon, container, commentEl, direction) => {
      const buttonEl = generateElements(`<button>${icon}</button>`, container);
      buttonEl.addEventListener('click', event => {
        const targetCommentEl =
          direction === 'next'
            ? next(commentEl, 'shreddit-comment')
            : prev(commentEl, 'shreddit-comment');
        const buttonContEls =
          targetCommentEl.querySelectorAll('.up-down-container');
        const buttonContEl = buttonContEls[buttonContEls.length - 1];
        scrollElementToCursor(buttonContEl, event);
      });
      return buttonEl;
    };

    const upBtnEl = generateButton('⬆️', buttonsContEl, commentEl, 'prev');
    const downBtnEl = generateButton('⬇️', buttonsContEl, commentEl, 'next');
  });

  let observer = new MutationObserver(() => {
    //* gallery
    jQuery('gallery-carousel:not(.galleryDone)').each(function () {
      const $this = jQuery(this);
      $this.addClass('galleryDone');
      $this
        .find('figure > img')
        .prependTo($this.parent())
        .css(`width`, `200px`)
        .each(function () {
          const $imgEl = jQuery(this);

          let finalSrc;
          let lazySrcSet = $imgEl.attr('data-lazy-srcset');
          let srcSet = $imgEl.attr('srcset');
          let dataLazySrc = $imgEl.attr('data-lazy-src');

          if (lazySrcSet) {
            finalSrc = getBestSrc(lazySrcSet);
          } else if (srcSet) {
            finalSrc = getBestSrc(srcSet);
          } else finalSrc = dataLazySrc;

          $imgEl.attr('src', finalSrc);

          function getBestSrc(srcSet) {
            srcSet = srcSet.split(' ').filter((current, index) => {
              return !(index % 2);
            });
            return srcSet[srcSet.length - 1];
          }
        });
    });

    //* Enabling controls for "gif" video elements
    //? Only applicable to the 'new' new reddit UI
    jQuery(`[gif]`).removeAttr('gif');

    // if( !document.querySelector( `#oldHome` ) ) {
    // console.log( 'test' )
    // }
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
