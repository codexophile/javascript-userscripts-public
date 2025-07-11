(function () {
  'use strict';

  const IMAGES_PER_QUERY = 12;
  const NTH_TO_LAST_IMAGE = 3;
  const HEIGHT_PCT = 0.8;
  const WIDTH_PCT = 0.49;
  const VID_VOLUME = 0.02;
  var MODE = 'profile';
  const win = window;
  var userId = win.userId;
  var notLoaded = true;
  const tempDiv = document.createElement('div');

  if (win.trustedTypes && win.trustedTypes.createPolicy) {
    win.trustedTypes.createPolicy('default', {
      createHTML: str => str,
    });
  }

  function getCsrfToken() {
    // The most reliable way to get the CSRF token is from the cookies
    const cookieMatch = document.cookie.match(/csrftoken=([^;]+)/);
    if (cookieMatch && cookieMatch[1]) {
      return cookieMatch[1];
    }
    // Fallback to the old method just in case
    return win._sharedData?.config?.csrf_token;
  }

  function pickMode() {
    console.log('picking mode');
    if (
      document.location.href.match(/https:\/\/(www\.)?instagram.com\/?(\?|$|#)/)
    ) {
      MODE = 'home';
      getQueryHash();
    } else if (document.location.href.match(/\/tagged\//)) {
      MODE = 'tagged';
      getUserId();
    } else if (document.location.href.match(/\/explore\//)) {
      MODE = 'explore';
      console.log('"Explore" loading not implemented yet!');
    } else if (
      document.location.href.match(/https:\/\/(www\.)?instagram.com\/p\//)
    ) {
      MODE = 'post';
    } else {
      MODE = 'profile';
      getUserId();
    }
    console.log('MODE', MODE);
  }

  function getUserId() {
    userId = userId || document.body.innerHTML.match(/profilePage_(\d+)/)?.[1];
    userId =
      userId ||
      document.body.innerHTML.match(/<a author_id="(\d+)" class="heKAw"/)?.[1];
    if (userId) {
      console.log('userId', userId);
      getQueryHash();
    } else {
      let req = indexedDB.open('redux');
      req.onsuccess = function (evt) {
        console.log('req evt', evt);
        let db = req.result;
        let req2 = db
          .transaction('paths')
          ?.objectStore('paths')
          ?.get('users.usernameToId');
        req2.onsuccess = function (evt) {
          console.log('db evt', evt);
          let result = req2?.result;
          let userName = document.location.href.match(
            /https:\/\/(?:www\.)?instagram.com\/([^\/]{3,})/
          )?.[1];
          console.log('userName', userName);
          userId = result?.[userName];
          if (userId) {
            getQueryHash();
          } else {
            requestUserId();
            console.log("Couldn't find user ID from DB, requesting it.");
          }
        };
        req.onerror = requestUserId; // Fallback if indexedDB fails
      };
      req.onerror = requestUserId; // Fallback if indexedDB fails
    }
  }

  function requestUserId() {
    let loc = document.location.href;
    if (loc.match(/https:\/\/(?:www\.)?instagram.com\/([^\/]{3,})\/?$/)) {
      loc += '?__a=1';
      fetch(loc)
        .then(resp => resp.json())
        .then(json => {
          console.log('userId json', json);
          userId = json?.graphql?.user?.id;
          if (userId) {
            getQueryHash();
          } else {
            console.log("Couldn't find user ID!");
          }
        });
    } else {
      console.log("URL doesn't match a profile page");
    }
  }

  function getQueryHash() {
    console.log('getQueryHash');
    // This function is complex and tries multiple ways to get API parameters.
    // We will simplify the final call to loadImages.
    if (notLoaded) {
      loadImages(); // We don't need to find query_id for the V1 API
    }
  }

  function loadImages(
    query_id = 0,
    query_hash = 0,
    doc_id = 0,
    app_id = 936619743392459,
    asbd_id = 129477,
    after = null
  ) {
    notLoaded = false;
    console.log('MODE', MODE);
    app_id = app_id || 936619743392459;
    asbd_id = asbd_id || 129477;
    const csrfToken = getCsrfToken();
    if (!csrfToken) {
      console.error('Could not find CSRF token. Aborting.');
      return;
    }

    let imageListQueryUrl;
    let init = {
      responseType: 'json',
      credentials: 'include',
      referrerPolicy: 'no-referrer',
    };

    if (MODE == 'profile') {
      if (!userId) {
        console.log("Couldn't find user ID!", userId);
        return;
      }
      imageListQueryUrl = `https://i.instagram.com/api/v1/feed/user/${userId}/?count=12`;
      if (after) {
        imageListQueryUrl += `&max_id=${after}`;
      }
      init.headers = {
        'X-IG-App-ID': app_id,
        'X-ASBD-ID': asbd_id,
        'X-CSRFToken': csrfToken,
      };
    } else if (MODE == 'tagged') {
      if (!userId) {
        console.log("Couldn't find user ID!", userId);
        return;
      }
      imageListQueryUrl = `https://i.instagram.com/api/v1/usertags/${userId}/feed/?count=${IMAGES_PER_QUERY}`;
      if (after) {
        imageListQueryUrl += `&max_id=${after}`;
      }
      init.headers = {
        'X-IG-App-ID': app_id,
        'X-ASBD-ID': asbd_id,
        'X-CSRFToken': csrfToken,
      };
    } else if (MODE == 'home') {
      imageListQueryUrl = 'https://i.instagram.com/api/v1/feed/timeline/';
      let fd = new URLSearchParams();
      fd.set('is_async_ads_rti', 0);
      fd.set('is_async_ads_double_request', 0);
      fd.set('rti_delivery_backend', 0);
      fd.set('is_async_ads_in_headload_enabled', 0);
      fd.set('device_id', win._sharedData?.device_id);
      if (after) {
        fd.set('max_id', after);
      }
      init.body = fd;
      init.method = 'POST';
      init.headers = {
        'X-IG-App-ID': app_id,
        'X-ASBD-ID': asbd_id,
        'X-CSRFToken': csrfToken,
      };
    } else {
      return; // Don't run for unsupported modes
    }

    fetch(imageListQueryUrl, init)
      .then(resp => {
        console.log('json resp', resp);
        if (!resp.ok) {
          return resp.json().then(err => {
            throw new Error(err.message || 'Request failed');
          });
        }
        return resp.json();
      })
      .then(json => {
        console.log('json', json);

        let end_cursor, mediaList;
        end_cursor = json.next_max_id;
        mediaList =
          json.items || json.feed_items?.map(n => n.media_or_ad).filter(n => n);

        if (!mediaList) {
          console.error('Could not find media list in API response.', json);
          return;
        }

        console.log('end_cursor', end_cursor, 'media list', mediaList);

        let bigContainer = document.querySelector('#igBigContainer');
        if (!bigContainer) {
          tempDiv.innerHTML = `<div id="igBigContainer" style="background-color: #112;width: 100%;height: 100%;z-index: 999;position: fixed;top: 0;left: 0;overflow: scroll;">
                    <div id="igAllImages" style="display:block; text-align:center;"></div></div>`;
          bigContainer = tempDiv.firstElementChild;
          let newBody = document.createElement('body');
          document.body = newBody;
          document.body.appendChild(bigContainer);
          XMLHttpRequest.prototype.send = evt => {}; // Stop further page loads

          let imgStyle = document.createElement('style');
          imgStyle.type = 'text/css';
          setMaxSize(imgStyle);
          document.body.appendChild(imgStyle);
          window.addEventListener('resize', evt => setMaxSize(imgStyle));
          styleIt();
        }
        let innerContainer = bigContainer.firstElementChild;

        for (let media of mediaList) {
          addMedia(media, innerContainer);
        }

        if (end_cursor) {
          let triggerImage =
            document.querySelector('#igAllImages > *:nth-last-of-type(3)') ||
            document.querySelector('#igAllImages > *:last-of-type');
          bigContainer.onscroll = evt => {
            if (!triggerImage) return;
            let vh =
              document.documentElement.clientHeight || window.innerHeight || 0;
            if (triggerImage.getBoundingClientRect().top - 800 < vh) {
              bigContainer.onscroll = null;
              console.log('loading next set of images');
              loadImages(
                query_id,
                query_hash,
                doc_id,
                app_id,
                asbd_id,
                end_cursor
              );
            }
          };
        }
      })
      .catch(error => {
        console.error('Instagram full-size media script error:', error);
      });
  }

  function getBestImage(media) {
    if (!media || !media.image_versions2 || !media.image_versions2.candidates)
      return '';
    let bestUrl = '';
    let bestSize = 0;
    let list = media.image_versions2.candidates;
    for (let m of list) {
      let size = Math.max(m.width, m.height);
      if (size > bestSize) {
        bestSize = size;
        bestUrl = m.url;
      }
    }
    return bestUrl;
  }

  function addMedia(media, container) {
    let shortcode = media?.code;
    if (!shortcode) return; // Skip items without a code (e.g., suggested users)

    let medias = media.carousel_media || [media];

    for (let i = 0; i < medias.length; i++) {
      let m = medias[i];
      let a = document.createElement('a');
      a.href = `https://www.instagram.com/p/${shortcode}/`;
      a.target = '_blank'; // Open in new tab
      let un = media.user?.username;
      let caption = media.caption?.text;
      a.title = `${media.user?.full_name || ''} (${un}) ${caption} [${i + 1}]`;

      if (m.video_versions) {
        tempDiv.innerHTML = `<div class="vidDiv"></div>`;
        let vidDiv = tempDiv.firstElementChild;
        let vid = document.createElement('video');
        vid.src = m.video_versions.reduce((a, b) =>
          a.width * a.height > b.width * b.height ? a : b
        )?.url;
        vid.controls = true;
        vid.volume = VID_VOLUME;
        vid.loop = true;
        vid.preload = 'metadata';
        a.textContent = 'Link';
        vidDiv.appendChild(vid);
        vidDiv.appendChild(a);
        container.appendChild(vidDiv);
      } else if (m.ad_id || media.label === 'Sponsored') {
        console.log('Skipping ad', m);
        return;
      } else if (m.image_versions2) {
        a.innerHTML = `<img src="${getBestImage(m)}">`;
        container.appendChild(a);
      }
    }
  }

  function setMaxSize(userStyle) {
    let vw = document.documentElement.clientWidth || window.innerWidth || 0;
    let vh = document.documentElement.clientHeight || window.innerHeight || 0;
    userStyle.innerHTML = `
#igAllImages img, #igAllImages video {
  max-height: ${vh * HEIGHT_PCT}px;
  max-width: ${vw * WIDTH_PCT}px;
  margin: 5px;
}
`;
  }

  function styleIt() {
    let userStyle = document.createElement('style');
    userStyle.type = 'text/css';
    userStyle.innerHTML = `
#igAllImages video {
  border: green solid 2px;
}
#igAllImages .vidDiv {
  display: inline-block;
  vertical-align: top;
}
#igAllImages .vidDiv a {
  display: block;
  text-decoration: none;
  margin-top: -5px;
  color: #ccc;
}
#loadallbutton {
  cursor: pointer;
}
`;
    document.body.appendChild(userStyle);
    console.log('styled');
  }

  function startUp() {
    (function insertButton() {
      let loadButton = document.querySelector('#loadallbutton');
      let insAt = null;
      if (!loadButton && !document.location.href.includes('instagram.com/p/')) {
        insAt = document.querySelector('div[role=tablist]');
        if (insAt) {
          tempDiv.innerHTML = profileButton;
          loadButton = tempDiv.firstElementChild;
          loadButton.onclick = pickMode;
          insAt.appendChild(loadButton);
        } else {
          insAt =
            document.querySelector('._aam1._aam2._aam5') ||
            document.querySelector('._ab6o._ab6q') ||
            document.querySelector('._aak6') ||
            document.querySelector('.collapsible-content');
          if (insAt) {
            tempDiv.innerHTML = homeButton;
            loadButton = tempDiv.firstElementChild;
            loadButton.onclick = pickMode;
            insAt.prepend(loadButton);
          }
        }
      }
      if (!insAt) {
        window.setTimeout(insertButton, 100);
      } else {
        styleIt();
      }
    })();
  }

  const profileButton = `<a aria-selected="false" class="_aa_0" role="tab" tabindex="0" id="loadallbutton"><span class="_aacl _aaco _aacp _aacu _aacx _aad6 _aade">Load Images</span></a>`;
  const homeButton = `<article class="_ab6k _ab6l _ab6m" role="presentation" tabindex="-1" style="cursor: pointer; border-bottom: 1px solid #363636; padding-bottom: 10px;" id="loadallbutton">
    <div style="text-align:center; padding: 20px; font-size: 16px; font-weight: bold; color: #fff;">Click to Load Full-Size Media Wall</div>
</article>`;
  startUp();
})();
