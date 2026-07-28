(function () {
  ('use strict');

  //* copy button for code blocks
  waitForEach('pre', preEl => {
    const copyBtn = generateElements(
      `<button class="copy-btn">📋</button>`,
      preEl,
    );
    copyBtn.addEventListener('click', () => {
      const code = preEl.textContent;
      GM_setClipboard(code);
    });

    preEl.style.position = 'relative';
    style(
      copyBtn,
      `
      position: absolute;
      top: 5px;
      right: 5px;
    `,
    );
  });

  //* external services that reveal deleted/private content
  waitForEach(
    '[data-testid="profile-details-wrapper"] .flex.items-baseline.justify-start',
    parentEl => {
      const matches = location.href.match(/\/u(?:ser)?\/(.+?)(?:[\/?]|$)/);
      if (!matches) return;
      const userId = matches[1];
      generateElements(
        `<a
          target="_blank"
          class="external-service-links"
          href="https://arctic-shift.photon-reddit.com/search?fun=posts_search&author=${userId}&limit=10&sort=desc"
        >arctic-shift</a>`,
        parentEl,
      );
      generateElements(
        `<a
          target="_blank"
          class="external-service-links"
          href="https://search.pullpush.io/?author=${userId}&type=submission&sort_type=created_utc&sort=desc"
        >pullpush</a>`,
        parentEl,
      );
    },
  );

  //*
  const REDDIT_TITLE_SUFFIX = '- [Reddit]';
  function ensureRedditTitleSuffix() {
    if (!document.title.includes(REDDIT_TITLE_SUFFIX)) {
      document.title = `${document.title.trim()} ${REDDIT_TITLE_SUFFIX}`;
    }
  }
  ensureRedditTitleSuffix();

  //* API
  (function () {
    'use strict';

    const CLIENT_ID = getSecret('redditClientId');
    const CLIENT_SECRET = getSecret('redditClientSecret');
    const USER_AGENT = 'MainScript/1.0 (by /u/codexophile)';
    const ARCTIC_SHIFT_BASE = 'https://arctic-shift.photon-reddit.com';
    const ARCTIC_SHIFT_TIMEOUT = 5000; // 5 second timeout for Arctic Shift requests

    // Arctic Shift API helper function
    async function arcticShiftFetch(endpoint, params = {}) {
      return new Promise((resolve, reject) => {
        const queryParams = new URLSearchParams(params);
        const fullUrl = `${ARCTIC_SHIFT_BASE}${endpoint}?${queryParams.toString()}`;

        GM_xmlhttpRequest({
          method: 'GET',
          url: fullUrl,
          timeout: ARCTIC_SHIFT_TIMEOUT,
          headers: {
            'User-Agent': USER_AGENT,
          },
          onload: function (response) {
            try {
              if (response.status === 200 || response.status === 0) {
                const data = JSON.parse(response.responseText);
                resolve(data);
              } else {
                reject(new Error(`Arctic Shift HTTP ${response.status}`));
              }
            } catch (error) {
              reject(new Error(`Arctic Shift parse error: ${error.message}`));
            }
          },
          onerror: function (error) {
            reject(new Error(`Arctic Shift request failed: ${error}`));
          },
          ontimeout: function () {
            reject(new Error('Arctic Shift request timed out'));
          },
        });
      });
    }

    // Get post data from Arctic Shift (for deleted or inaccessible posts)
    async function getPostDataFromArcticShift(postId) {
      try {
        const cleanId = postId.replace(/^t3_/, '');
        const response = await arcticShiftFetch('/api/posts/ids', {
          ids: cleanId,
          md2html: 'true',
        });

        if (response.data && response.data.length > 0) {
          return {
            ...response.data[0],
            _source: 'arctic_shift',
            _archived: true,
          };
        }
        return null;
      } catch (error) {
        console.warn('Arctic Shift post lookup failed:', error);
        return null;
      }
    }

    // Get user posts from Arctic Shift (for deleted or archived user content)
    async function getUserPostsFromArcticShift(username, limit = 20) {
      try {
        const response = await arcticShiftFetch('/api/posts/search', {
          author: username,
          limit: Math.min(limit, 100),
          sort: 'desc',
        });

        if (response.data && response.data.length > 0) {
          return response.data.map(post => ({
            ...post,
            _source: 'arctic_shift',
            _archived: true,
          }));
        }
        return [];
      } catch (error) {
        console.warn('Arctic Shift user posts lookup failed:', error);
        return [];
      }
    }

    // Get comments from Arctic Shift (for deleted or archived comments)
    async function getCommentsFromArcticShift(postId, limit = 3) {
      try {
        const cleanPostId = postId.replace(/^t3_/, '');
        const response = await arcticShiftFetch('/api/comments/search', {
          link_id: cleanPostId,
          limit: Math.min(limit + 10, 100),
          sort: 'desc',
        });

        if (response.data && response.data.length > 0) {
          return response.data
            .filter(
              comment =>
                comment.author &&
                comment.author !== 'AutoModerator' &&
                comment.body &&
                comment.body !== '[deleted]' &&
                comment.body !== '[removed]',
            )
            .slice(0, limit)
            .map(comment => ({
              ...comment,
              _source: 'arctic_shift',
              _archived: true,
            }));
        }
        return [];
      } catch (error) {
        console.warn('Arctic Shift comments lookup failed:', error);
        return [];
      }
    }

    // Helper to check if data is deleted/removed
    function isContentDeleted(data) {
      if (!data) return true;
      if (data.author === '[deleted]' || data.author === null) return true;
      if (data.selftext === '[deleted]' || data.selftext === '[removed]')
        return true;
      if (data.body === '[deleted]' || data.body === '[removed]') return true;
      return false;
    }

    waitForEach('shreddit-post', async postEl => {
      const postId = getPostId(postEl);
      const token = await getAccessToken();
      const postData = await getPostData(postId, token);

      //* displaying selftext
      if (
        postData.selftext &&
        postData.selftext.trim() !== '' &&
        postData.selftext !== '[deleted]' &&
        postData.selftext !== '[removed]' &&
        !location.href.includes('/comments/')
      ) {
        const selfTextEl = generateElements(
          `<div class="shreddit-post-selftext userscript-code"></div>`,
          postEl,
        );
        const headerText = postData._archived
          ? '📦 Archived from Arctic Shift'
          : '';
        if (headerText) {
          const headerEl = generateElements(
            `<div style="font-size: 0.8em; color: #4a90e2; margin-bottom: 5px;"><em>${headerText}</em></div>`,
            selfTextEl,
          );
        }
        selfTextEl.innerHTML =
          (postData._archived
            ? `<div style="font-size: 0.8em; color: #4a90e2; margin-bottom: 5px;"><em>📦 Archived from Arctic Shift</em></div>`
            : '') + marked.parse(postData.selftext);
        selfTextEl.querySelectorAll('a').forEach(aEl => {
          aEl.target = '_blank';
        });
        style(
          selfTextEl,
          `
          max-height: 500px;
          overflow-y: auto;
          ${postData._archived ? 'border-left: 2px solid #4a90e2; padding-left: 8px;' : ''}
        `,
        );

        const originalSelfTextEl = postEl.querySelector(
          'shreddit-post-text-body',
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
        secondaryToolbarEl,
      );
      const downvotesDispEl = createVotesDispEl(
        'down',
        downvotes,
        secondaryToolbarEl,
      );
      postEl.querySelector('a[data-ks-id]')?.remove();
      const opDispEl = createOpDispEl(author, secondaryToolbarEl);

      // Add button to load top 3 comments
      const loadCommentsBtn = createSecondaryToolbarElement(
        '💬 Load Top 3 Comments',
        null,
        secondaryToolbarEl,
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

      // Add button to load gallery view
      const galleryBtn = createSecondaryToolbarElement(
        '🖼️ Gallery View',
        null,
        secondaryToolbarEl,
      );
      galleryBtn.addEventListener('click', async () => {
        galleryBtn.disabled = true;
        galleryBtn.textContent = 'Loading...';

        try {
          const posts = await getUserImagePosts(author, token, 30);
          displayGallery(posts, postEl, galleryBtn);
        } catch (error) {
          console.error('Error loading gallery:', error);
          galleryBtn.textContent = '❌ Error loading gallery';
          galleryBtn.disabled = false;
        }
      });
    });

    async function getTopComments(postId, token, limit = 3) {
      return new Promise(async (resolve, reject) => {
        GM_xmlhttpRequest({
          method: 'GET',
          url: `https://oauth.reddit.com/comments/${postId}?limit=${
            limit + 10
          }&depth=1&sort=top`,
          headers: {
            Authorization: `Bearer ${token}`,
            'User-Agent': USER_AGENT,
          },
          onload: async function (response) {
            try {
              const data = JSON.parse(response.responseText);
              if (data && data.length > 1 && data[1].data.children) {
                const comments = data[1].data.children
                  .filter(
                    child =>
                      child.kind === 't1' &&
                      child.data.author !== 'AutoModerator' &&
                      child.data.stickied !== true &&
                      child.data.distinguished !== 'moderator' &&
                      !isContentDeleted(child.data),
                  )
                  .slice(0, limit)
                  .map(child => child.data);

                // If we got comments, return them
                if (comments.length > 0) {
                  resolve(comments);
                  return;
                }

                // All comments were deleted, try Arctic Shift
                console.log(
                  'Top comments are deleted, attempting Arctic Shift...',
                );
                try {
                  const archivedComments = await getCommentsFromArcticShift(
                    postId,
                    limit,
                  );
                  if (archivedComments.length > 0) {
                    console.log(
                      `✓ Retrieved ${archivedComments.length} archived comments from Arctic Shift`,
                    );
                    resolve(archivedComments);
                    return;
                  }
                } catch (error) {
                  console.warn('Arctic Shift comment fallback failed:', error);
                }

                resolve(comments); // Return empty array
              } else {
                // Comments endpoint failed, try Arctic Shift
                console.log(
                  'Comments endpoint unavailable, trying Arctic Shift...',
                );
                try {
                  const archivedComments = await getCommentsFromArcticShift(
                    postId,
                    limit,
                  );
                  if (archivedComments.length > 0) {
                    console.log(
                      `✓ Retrieved ${archivedComments.length} archived comments from Arctic Shift`,
                    );
                    resolve(archivedComments);
                    return;
                  }
                } catch (error) {
                  console.warn('Arctic Shift comment fallback failed:', error);
                }
                reject(new Error('Comments not found'));
              }
            } catch (error) {
              reject(error);
            }
          },
          onerror: async function (error) {
            console.log('Reddit comments API error, trying Arctic Shift...');
            try {
              const archivedComments = await getCommentsFromArcticShift(
                postId,
                limit,
              );
              if (archivedComments.length > 0) {
                console.log(
                  `✓ Retrieved ${archivedComments.length} archived comments from Arctic Shift (API error)`,
                );
                resolve(archivedComments);
                return;
              }
            } catch (arcticError) {
              console.warn('Arctic Shift fallback failed:', arcticError);
            }
            reject(error);
          },
        });
      });
    }

    function displayComments(comments, postEl, buttonEl) {
      // Remove existing comments container if it exists
      const existingContainer = postEl.querySelector(
        '.userscript-comments-container',
      );
      if (existingContainer) {
        existingContainer.remove();
      }

      // Create container for comments
      const commentsContainer = generateElements(
        '<div class="userscript-comments-container"></div>',
        postEl,
      );

      // Check if any comments are from Arctic Shift
      const isArchivedData = comments.some(c => c._archived);
      const archiveIndicator = isArchivedData
        ? ' 📦 (Archived from Arctic Shift)'
        : '';

      style(
        commentsContainer,
        `
        margin: 10px;
        padding: 10px;
        background: rgba(0, 0, 0, 0.05);
        border-radius: 5px;
        border-left: 3px solid ${isArchivedData ? '#4a90e2' : '#ff4500'};
      `,
      );

      comments.forEach((comment, index) => {
        const commentEl = generateElements(
          '<div class="userscript-comment"></div>',
          commentsContainer,
        );

        style(
          commentEl,
          `
          margin-bottom: 10px;
          padding: 10px;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 3px;
          ${comment._archived ? 'border-left: 2px solid #4a90e2;' : ''}
        `,
        );

        const authorEl = generateElements(
          `<div><strong>👤 ${comment.author}</strong> • 👍 ${
            comment.score || '?'
          }${comment._archived ? ' • 📦 Archived' : ''}</div>`,
          commentEl,
        );
        style(
          authorEl,
          `
          margin-bottom: 5px;
          font-size: 0.9em;
          color: ${comment._archived ? '#4a90e2' : '#666'};
        `,
        );

        const bodyEl = generateElements('<div></div>', commentEl);
        bodyEl.innerHTML = marked.parse(comment.body || '');
        bodyEl.querySelectorAll('a').forEach(aEl => {
          aEl.target = '_blank';
        });
        style(
          bodyEl,
          `
          line-height: 1.5;
        `,
        );
      });

      buttonEl.textContent = `💬 Loaded ${comments.length} comments${archiveIndicator}`;
      buttonEl.disabled = false;
    }

    async function getUserImagePosts(username, token, limit = 20) {
      return new Promise(async (resolve, reject) => {
        GM_xmlhttpRequest({
          method: 'GET',
          url: `https://oauth.reddit.com/user/${username}/submitted?limit=${limit}&sort=new`,
          headers: {
            Authorization: `Bearer ${token}`,
            'User-Agent': USER_AGENT,
          },
          onload: async function (response) {
            try {
              const data = JSON.parse(response.responseText);
              if (data && data.data && data.data.children) {
                const imagePosts = data.data.children
                  .map(child => child.data)
                  .filter(post => {
                    // Check if post has an image
                    return (
                      post.post_hint === 'image' ||
                      post.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
                      post.is_gallery
                    );
                  });

                if (imagePosts.length > 0) {
                  resolve(imagePosts);
                  return;
                }

                // User exists but no image posts, try Arctic Shift
                console.log(
                  'User has no accessible image posts, trying Arctic Shift...',
                );
                try {
                  const archivedPosts = await getUserPostsFromArcticShift(
                    username,
                    limit,
                  );
                  const archivedImagePosts = archivedPosts.filter(post => {
                    return (
                      post.post_hint === 'image' ||
                      post.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
                      post.is_gallery
                    );
                  });
                  if (archivedImagePosts.length > 0) {
                    console.log(
                      `✓ Retrieved ${archivedImagePosts.length} archived image posts from Arctic Shift`,
                    );
                    resolve(archivedImagePosts);
                    return;
                  }
                } catch (error) {
                  console.warn(
                    'Arctic Shift image posts fallback failed:',
                    error,
                  );
                }

                resolve(imagePosts); // Return empty array
              } else {
                // User page not accessible, try Arctic Shift
                console.log('User profile unavailable, trying Arctic Shift...');
                try {
                  const archivedPosts = await getUserPostsFromArcticShift(
                    username,
                    limit,
                  );
                  const archivedImagePosts = archivedPosts.filter(post => {
                    return (
                      post.post_hint === 'image' ||
                      post.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
                      post.is_gallery
                    );
                  });
                  if (archivedImagePosts.length > 0) {
                    console.log(
                      `✓ Retrieved ${archivedImagePosts.length} archived image posts from Arctic Shift (user unavailable)`,
                    );
                    resolve(archivedImagePosts);
                    return;
                  }
                } catch (error) {
                  console.warn(
                    'Arctic Shift image posts fallback failed:',
                    error,
                  );
                }
                reject(new Error('User posts not found'));
              }
            } catch (error) {
              reject(error);
            }
          },
          onerror: async function (error) {
            console.log('Reddit user API error, trying Arctic Shift...');
            try {
              const archivedPosts = await getUserPostsFromArcticShift(
                username,
                limit,
              );
              const archivedImagePosts = archivedPosts.filter(post => {
                return (
                  post.post_hint === 'image' ||
                  post.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
                  post.is_gallery
                );
              });
              if (archivedImagePosts.length > 0) {
                console.log(
                  `✓ Retrieved ${archivedImagePosts.length} archived image posts from Arctic Shift (API error)`,
                );
                resolve(archivedImagePosts);
                return;
              }
            } catch (arcticError) {
              console.warn('Arctic Shift fallback failed:', arcticError);
            }
            reject(error);
          },
        });
      });
    }

    function getThumbnailUrl(post, mediaId = null) {
      // Try to get a smaller preview/thumbnail image instead of full resolution
      if (post.is_gallery && mediaId && post.media_metadata) {
        const media = post.media_metadata[mediaId];
        if (media) {
          // Try to get preview images (smaller resolution)
          if (media.p && media.p.length > 0) {
            // Get medium-sized preview (not the largest, not the smallest)
            const previews = media.p;
            const midIndex = Math.min(2, previews.length - 1);
            return previews[midIndex].u.replace(/&amp;/g, '&');
          }
          // Fallback to full size
          return (media.s.u || media.s.gif)?.replace(/&amp;/g, '&');
        }
      } else {
        // For single image posts, try to use preview
        if (post.preview && post.preview.images && post.preview.images[0]) {
          const resolutions = post.preview.images[0].resolutions;
          if (resolutions && resolutions.length > 0) {
            // Get medium-sized preview
            const midIndex = Math.min(2, resolutions.length - 1);
            return resolutions[midIndex].url.replace(/&amp;/g, '&');
          }
        }
        // Fallback to original URL
        return post.url;
      }
    }

    function getFullResUrl(post, mediaId = null) {
      // Get the full resolution image URL
      if (post.is_gallery && mediaId && post.media_metadata) {
        const media = post.media_metadata[mediaId];
        if (media && media.s) {
          return (media.s.u || media.s.gif)?.replace(/&amp;/g, '&');
        }
      } else {
        // For single image posts, get the highest resolution or original
        if (post.preview && post.preview.images && post.preview.images[0]) {
          const resolutions = post.preview.images[0].resolutions;
          if (resolutions && resolutions.length > 0) {
            // Get the highest resolution preview
            const highRes = resolutions[resolutions.length - 1];
            return highRes.url.replace(/&amp;/g, '&');
          }
        }
        // Fallback to original URL
        return post.url;
      }
    }

    function displayGallery(posts, postEl, buttonEl) {
      // Remove existing gallery container if it exists
      const existingContainer = postEl.querySelector(
        '.userscript-gallery-container',
      );
      if (existingContainer) {
        existingContainer.remove();
      }

      if (posts.length === 0) {
        buttonEl.textContent = '🖼️ No images found';
        buttonEl.disabled = false;
        return;
      }

      // Check if any posts are from Arctic Shift
      const isArchivedData = posts.some(p => p._archived);

      // Create container for gallery
      const galleryContainer = generateElements(
        '<div class="userscript-gallery-container"></div>',
        postEl,
      );

      style(
        galleryContainer,
        `
        margin: 10px;
        padding: 10px;
        background: rgba(0, 0, 0, 0.05);
        border-radius: 5px;
        border-left: 3px solid ${isArchivedData ? '#4a90e2' : '#ff4500'};
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      `,
      );

      posts.forEach((post, index) => {
        // Check if it's a gallery post with multiple images
        const isGallery = post.is_gallery && post.media_metadata;
        const imageData = [];

        if (isGallery) {
          // Extract all images from gallery
          const galleryOrder = post.gallery_data?.items || [];
          galleryOrder.forEach(item => {
            const mediaId = item.media_id;
            const media = post.media_metadata[mediaId];
            if (media && media.s) {
              const thumbnailUrl = getThumbnailUrl(post, mediaId);
              const fullResUrl = getFullResUrl(post, mediaId);
              if (thumbnailUrl) {
                imageData.push({
                  thumbnail: thumbnailUrl,
                  fullRes: fullResUrl,
                });
              }
            }
          });
        } else {
          // Single image post - use thumbnail
          const thumbnailUrl = getThumbnailUrl(post);
          const fullResUrl = getFullResUrl(post);
          imageData.push({ thumbnail: thumbnailUrl, fullRes: fullResUrl });
        }

        // Create a container for the post (may contain multiple images)
        const postContainer = generateElements(
          '<div class="userscript-gallery-post"></div>',
          galleryContainer,
        );

        style(
          postContainer,
          `
          ${isGallery ? 'width: auto;' : 'width: 200px;'}
          display: flex;
          flex-direction: column;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 5px;
          overflow: hidden;
          ${post._archived ? 'border: 2px solid #4a90e2;' : ''}
        `,
        );

        // Create images container for gallery posts
        const imagesContainer = generateElements(
          '<div class="userscript-images-container"></div>',
          postContainer,
        );

        style(
          imagesContainer,
          `
          display: flex;
          flex-wrap: ${isGallery ? 'wrap' : 'nowrap'};
          gap: ${isGallery ? '5px' : '0'};
          padding: ${isGallery ? '5px' : '0'};
        `,
        );

        imageData.forEach((imgData, imgIndex) => {
          const galleryItem = generateElements(
            '<div class="userscript-gallery-item"></div>',
            imagesContainer,
          );

          style(
            galleryItem,
            `
            ${isGallery ? 'width: calc(50% - 2.5px);' : 'width: 200px;'}
            display: flex;
            flex-direction: column;
            transition: transform 0.2s;
            cursor: pointer;
            position: relative;
          `,
          );

          // Add hover effect
          galleryItem.addEventListener('mouseenter', () => {
            galleryItem.style.transform = 'scale(1.05)';
            galleryItem.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
          });
          galleryItem.addEventListener('mouseleave', () => {
            galleryItem.style.transform = 'scale(1)';
            galleryItem.style.boxShadow = 'none';
          });

          const linkEl = generateElements(
            `<a href="https://reddit.com${post.permalink}" target="_blank"></a>`,
            galleryItem,
          );
          style(linkEl, 'text-decoration: none; color: inherit;');

          const imgEl = generateElements('<img />', linkEl);
          // Lazy loading: use data-src and only set src when visible
          imgEl.dataset.src = imgData.thumbnail;
          // Add full-res URL to srcset for high-DPI displays or zoom
          if (imgData.fullRes && imgData.fullRes !== imgData.thumbnail) {
            imgEl.srcset = `${imgData.thumbnail} 1x, ${imgData.fullRes} 2x`;
          }
          imgEl.alt = post.title;
          // Placeholder background while loading
          imgEl.style.background =
            'linear-gradient(135deg, #f0f0f0 25%, #e0e0e0 25%, #e0e0e0 50%, #f0f0f0 50%, #f0f0f0 75%, #e0e0e0 75%, #e0e0e0)';
          style(
            imgEl,
            `
            width: 100%;
            height: 200px;
            object-fit: cover;
          `,
          );

          // Add to lazy load queue
          imgEl.classList.add('lazy-load-image');

          // Add badge for multi-image posts
          if (isGallery && imgIndex === 0) {
            const badgeEl = generateElements(
              `<div>📸 ${imageData.length}${post._archived ? ' 📦' : ''}</div>`,
              galleryItem,
            );
            style(
              badgeEl,
              `
              position: absolute;
              top: 5px;
              right: 5px;
              background: rgba(0, 0, 0, 0.7);
              color: ${post._archived ? '#4a90e2' : 'white'};
              padding: 3px 8px;
              border-radius: 3px;
              font-size: 0.75em;
              font-weight: bold;
            `,
            );
          }
        });

        // Post info (title, score) - shown once per post
        const infoEl = generateElements('<div></div>', postContainer);
        style(
          infoEl,
          `
          padding: 8px;
        `,
        );

        const titleEl = generateElements(`<div>${post.title}</div>`, infoEl);
        style(
          titleEl,
          `
          font-size: 0.85em;
          line-height: 1.3;
          max-height: 50px;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 5px;
        `,
        );

        const scoreEl = generateElements(
          `<div>👍 ${post.score || '?'} • 💬 ${post.num_comments || '?'}${
            isGallery ? ' • 📸 ' + imageData.length : ''
          }${post._archived ? ' • 📦 Archived' : ''}</div>`,
          infoEl,
        );
        style(
          scoreEl,
          `
          font-size: 0.75em;
          color: ${post._archived ? '#4a90e2' : '#666'};
        `,
        );
      });

      // Count total images including gallery images
      const totalImages = posts.reduce((count, post) => {
        if (post.is_gallery && post.media_metadata) {
          const galleryItems = post.gallery_data?.items || [];
          return count + galleryItems.length;
        }
        return count + 1;
      }, 0);

      const archiveIndicator = isArchivedData
        ? ' 📦 (Archived from Arctic Shift)'
        : '';

      // Set up lazy loading with Intersection Observer
      const lazyImages = galleryContainer.querySelectorAll('.lazy-load-image');
      const imageObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target;
              if (img.dataset.src) {
                img.src = img.dataset.src;
                img.onload = () => {
                  img.style.background = 'none';
                };
                delete img.dataset.src;
              }
              observer.unobserve(img);
            }
          });
        },
        {
          rootMargin: '50px', // Start loading 50px before image enters viewport
        },
      );

      lazyImages.forEach(img => imageObserver.observe(img));

      buttonEl.textContent = `🖼️ Loaded ${totalImages} images from ${posts.length} posts${archiveIndicator}`;
      buttonEl.disabled = false;
    }

    function createSecondaryToolbarElement(text, childEl, parentEl) {
      const secondaryToolbarEl = generateElements(
        `<button>${text}</button>`,
        parentEl,
      );
      style(
        secondaryToolbarEl,
        `
        margin: 10px;
        padding: 5px;
        line-height: unset;
      `,
      );
      if (childEl) secondaryToolbarEl.appendChild(childEl);
      return secondaryToolbarEl;
    }

    function createPercentageDispEl(ratioValue, parentEl) {
      const percentage = Math.round(ratioValue * 100);
      const percentageDispEl = createSecondaryToolbarElement(
        `${percentage}% 💹`,
        null,
        parentEl,
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
          parent,
        );
        return dispEl;
      } else if (direction === 'down') {
        const dispEl = createSecondaryToolbarElement(
          `👇🏻 ${value}`,
          null,
          parent,
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
        (score * (1 - upvoteRatio)) / (2 * upvoteRatio - 1),
      );
      return downvotes;
    }

    function getPostData(postId, token) {
      return new Promise(async (resolve, reject) => {
        GM_xmlhttpRequest({
          method: 'GET',
          url: `https://oauth.reddit.com/api/info?id=t3_${postId}`,
          headers: {
            Authorization: `Bearer ${token}`,
            'User-Agent': USER_AGENT,
          },
          onload: async function (response) {
            try {
              const data = JSON.parse(response.responseText);
              if (
                data.data &&
                data.data.children &&
                data.data.children.length > 0
              ) {
                const postData = data.data.children[0].data;

                // Check if post is deleted/removed
                if (isContentDeleted(postData)) {
                  console.log(
                    'Post is deleted/removed, attempting Arctic Shift...',
                  );
                  try {
                    const archivedData =
                      await getPostDataFromArcticShift(postId);
                    if (archivedData) {
                      console.log(
                        '✓ Retrieved archived post from Arctic Shift',
                      );
                      resolve(archivedData);
                      return;
                    }
                  } catch (error) {
                    console.warn('Arctic Shift fallback failed:', error);
                  }
                }

                resolve(postData);
              } else {
                // Post not found via Reddit API, try Arctic Shift
                console.log('Post not found on Reddit, trying Arctic Shift...');
                try {
                  const archivedData = await getPostDataFromArcticShift(postId);
                  if (archivedData) {
                    console.log(
                      '✓ Retrieved archived post from Arctic Shift (not found on Reddit)',
                    );
                    resolve(archivedData);
                    return;
                  }
                } catch (error) {
                  console.warn('Arctic Shift fallback failed:', error);
                }
                reject(new Error('Post data not found'));
              }
            } catch (error) {
              reject(error);
            }
          },
          onerror: async function (error) {
            console.log('Reddit API error, trying Arctic Shift...');
            try {
              const archivedData = await getPostDataFromArcticShift(postId);
              if (archivedData) {
                console.log(
                  '✓ Retrieved archived post from Arctic Shift (Reddit API error)',
                );
                resolve(archivedData);
                return;
              }
            } catch (arcticError) {
              console.warn('Arctic Shift fallback failed:', arcticError);
            }
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
                  new Date(expiresAt).toLocaleString(),
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
    false,
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
        redditPopup,
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
    `,
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
    ensureRedditTitleSuffix();

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
