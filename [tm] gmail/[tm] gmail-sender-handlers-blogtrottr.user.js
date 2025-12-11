function blogtrottrHandler() {
  // document.querySelectorAll( '[href*="li.blogtrottr.com"]' ).forEach( element => { element.remove(); } );
  // this gets rid of the ads by blogtrottr
  // Alternatively an ad blocker can remove these automatically too

  const queryForTitleEl =
    'span[style="font-family:Helvetica,sans-serif;font-size:20px;font-weight:bold;line-height:16px"]';
  const titleElement = document.querySelector(queryForTitleEl);
  titleElement.classList.add('fixedCSS');
  const feedTitle = titleElement.textContent;
  console.log(`%c📶 ${feedTitle}`, 'font-size: large; color: gold');

  let items = Array.from(document.querySelectorAll('[cellpadding="3"][class]'));
  const parent = items[0].parentNode;
  parent.style.flexWrap = `wrap`;
  parent.style.display = `flex`;

  items.forEach(async item => {
    item.removeAttribute('width');

    const innerDiv = item.querySelectorAll('tbody > tr > td > div')[1];

    if (!innerDiv) {
      return;
    }

    const innerDivPs = innerDiv.querySelectorAll('p');
    innerDivPs.forEach(paragraph => {
      paragraph.style = `
                        overflow          : hidden      !important;
                        text-overflow     : ellipsis    !important;
                        display           : -webkit-box !important;
                        -webkit-line-clamp: 5           !important; /* number of lines to show */
                        -webkit-box-orient: vertical    !important;`;
    });

    if (innerDiv.querySelectorAll('img').length > 5) {
      //! sometimes there are false positives here
      innerDiv.style = `display: flex; flex-wrap: wrap;`;
      item.style.maxWidth = 'unset';
      item.style.width = '100%';
      innerDiv.querySelectorAll('img').forEach(image => {
        image.style.maxWidth = '300px';
      });
    }

    const itemUrl = item.querySelector('a').href;
    let tempDoc;

    function expandBlogtrottrItem() {
      // innerDiv.style = `display: flex; flex-wrap: wrap;`
      item.style.maxWidth = '90vw';
      item.style.width = '100%';
    }

    async function addIframeHrefs(tempDoc) {
      if (!tempDoc) tempDoc = await GMXmlHttpRequest(itemUrl);
      const iframes = tempDoc.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        GM_addElement(innerDiv, 'a', {
          textContent: iframe.src,
          href: iframe.src,
          style: 'display: block',
        });
      });
      try {
        addPeekButtons(innerDiv, item);
      } catch (error) {
        console.log(error);
      }
    }

    async function addPeekButtons(itemInnerDiv, item) {
      const doodDomains = ['d000d', 'ds2play', 'd0000d', 'dood', 'do0od'];
      const doodSelector = doodDomains
        .map(domain => `a[href*="${domain}"]`)
        .join(',');
      const doodLinksEls = itemInnerDiv.querySelectorAll(doodSelector);
      const doodResult = await addDoodStoryboard(doodLinksEls, itemInnerDiv);
      console.log('ssssss', doodResult);
      if (doodResult) return;

      const streamWishDomains = [
        'ghbrisk',
        'streamiwish',
        'cdnstream',
        'jodwish',
        '74k',
        'iplayerhls',
      ];
      const streamWishSelector = streamWishDomains
        .map(domain => `a[href*="${domain}"]`)
        .join(',');
      const streamWishLinksEls =
        itemInnerDiv.querySelectorAll(streamWishSelector);
      console.log(streamWishLinksEls);
      const streamWishResult = await addStreamWishStoryboard(
        streamWishLinksEls,
        itemInnerDiv
      );
      console.log('streamWishResult', streamWishResult);
      if (streamWishResult) return;

      console.log('testXXXXXXXXXXXXXXXXXXXXXXXXXXX');
      const streamtapeLinksEls = itemInnerDiv.querySelectorAll(
        'a[href*="streamtape"]'
      );
      const streamtapeResult = await addStreamtapePreview(
        streamtapeLinksEls,
        itemInnerDiv
      );
      if (streamtapeResult) return;

      return;

      const links = itemInnerDiv.querySelectorAll('a');
      links.forEach(async link => {
        if (item.querySelector('#slotsDiv')) return; // 🛑

        if (link.href.match(/(voe)/)) {
          const doodButton = GM_addElement('button', { textContent: 'Voe' });
          doodButton.addEventListener('click', () => {
            if (itemInnerDiv.querySelector('#voeImg')) return;
            const videoId = link.href.match(/\..+\/(.+?)$/)[1];
            const imageUrl = `https://i.voe.sx/cache/${videoId}_storyboard_L0.jpg`;
            storyboardFlex(itemInnerDiv, 10, 10, imageUrl, link.href, true);
            item.style.width = '100%';
            item.style.maxWidth = 'unset';
            fauxHistoryPushState(link.href);
          });
          link.after(doodButton);
        }
      });
    }

    async function addStreamtapePreview(streamtapeLinksEls, itemInnerDiv) {
      if (!streamtapeLinksEls.length) return false;
      let result = true;
      streamtapeLinksEls.forEach(async streamtapeLinkEl => {
        let doc;
        try {
          doc = await GMXmlHttpRequest(streamtapeLinkEl.href);
        } catch (error) {
          console.log('StreamWish error:', error);
          result = result && false;
        }
        const previewImgUrl = doc.querySelector(
          'meta[name="og:image"]'
        ).content;
        generateElements(
          `<a href=${streamtapeLinkEl.href}><img src=${previewImgUrl}></a>`,
          itemInnerDiv
        );
        result = result && true;
      });
      return result;
    }

    async function addStreamWishStoryboard(streamWishLinksEls, itemInnerDiv) {
      if (!streamWishLinksEls.length) return false;
      let result = true;
      streamWishLinksEls.forEach(async streamWishLinkEl => {
        let doc;
        try {
          doc = await GMXmlHttpRequest(streamWishLinkEl.href);
        } catch (error) {
          console.log('StreamWish error:', error);
          result = result && false;
        }
        const stem = doc.querySelector('#vplayer > img').src.match(/.+\//)[0];
        const path = streamWishLinkEl.href.match(/\/(............)$/)[1];
        const storyboardUrl = `${stem}${path}0000.jpg`;
        const storyboardParent = generateElements(
          `<div id=sbParent></div>`,
          itemInnerDiv
        );
        await storyboardToggleable({
          storyboardParent,
          horizontal: 10,
          vertical: 10,
          linkToVid: streamWishLinkEl.href,
          // samplingFq = null,
          trueNoOfSlots: 100,
          imgUrls: [storyboardUrl],
        });
        result = result && true;
      });
      return result;
    }

    async function addDoodStoryboard(doodLinksEls, itemInnerDiv) {
      if (!doodLinksEls.length) return false;
      let result = true;
      doodLinksEls.forEach(async doodLinkEl => {
        let resText = '';
        try {
          resText = await GMXmlHttpRequest(doodLinkEl.href, null, true);
        } catch (error) {
          console.log('Dood error:', error);
          result = result && false;
          console.log('result', result);
        }
        const matches = resText.match(/\/(splash|snaps)\/(.+?)\.jpg/);
        if (matches) {
          const slidesId = matches[2];
          const imgSrc = `https://img.doodcdn.co/slides/${slidesId}.jpg`;
          generateElements(
            `<a href=${link}><img id=doodImg src=${imgSrc}></a>`,
            itemInnerDiv,
            true
          );
          result = result && true;
        }
      });
      return result;
    }

    const feedTitleHandlers = {
      'New Gay Porn Videos & Sex Tube Movies | SexTubeSpot.com': async () => {},

      'Latest gay porn videos on 4gay.com': async () => {
        const tempDoc4gay = await GMXmlHttpRequest(itemUrl);
        const duration_ = tempDoc4gay.querySelector(
          'meta[property="video:duration"]'
        ).content;
        const durationInSeconds_ = toSeconds(duration_);
        if (durationInSeconds_ < 15 * 60) {
          item.remove();
        }
      },

      GVUV2: () => {
        innerDiv.querySelectorAll('p:not(:has(a))').forEach(el => {
          el.remove();
        });
        addPeekButtons(innerDiv, item);
      },

      'BoyFriendTv.com - RSS video Feed': async () => {
        bftStoryboardFromUrl(itemUrl, item);
        expandBlogtrottrItem();
      },

      'Watch Full HD Gay Porn Videos Online Free | Watch Free HD Gay porn online free. Video streams and full movies. Daily new...':
        async () => {
          const tempDoc__ = await GMXmlHttpRequest(itemUrl);
          addIframeHrefs(tempDoc__);
        },

      'VIDÉOS XXX GAY - Porno GAY Gratuit en Streaming': async () => {
        const videoUrl = itemUrl;
        const doc = await GMXmlHttpRequest(videoUrl);
        const sbSrc = doc
          .querySelector('[property="twitter:image"]')
          .content.replace('/default', '/nvsprite');
        const script = doc.querySelector('script');
        const match = script.innerHTML.match(/"duration": "(\w\w(\d+)S)"/);
        let duration;
        if (match) duration = match[2];
        else alert('error');

        const allUrls = sbSrc;
        const trueNoOfSlots = 20;
        const samplingFq = duration / trueNoOfSlots;

        const modalBody = generateElements('<div></div>', innerDiv);
        await storyboard(
          modalBody,
          20,
          1,
          videoUrl,
          null,
          samplingFq,
          trueNoOfSlots,
          allUrls
        );

        const videoId = itemUrl.match(/\/video\/(.+?)\//)[1];
        const previewVidSrc = `https://www.videosxgays.com/media/videos/tmb4/${videoId}/video.webm`;
        generateElements(
          `<video controls src=${previewVidSrc}></video>`,
          innerDiv
        );

        expandBlogtrottrItem();
      },

      'ONLYFANS GAY SEX': addIframeHrefs,
      OnlyBussy: addIframeHrefs,
      GayPornHot: addIframeHrefs,
      HutGay: addIframeHrefs,
      'Super Tudo Gay – Porno Gay | Gay Amador | Sexo Gay': addIframeHrefs,
      'Gay Porn Hub': addIframeHrefs,
      GayCock4U: addIframeHrefs,
      'TURBOGVIDEOS.COM': addIframeHrefs,
      'Gay – Faply': addIframeHrefs,
      iGay69: addIframeHrefs,

      '4horlover': async () => {
        const tempDoc = await GMXmlHttpRequest(itemUrl);
        const centerEl = tempDoc.querySelector('main center');
        innerDiv.append(centerEl);
        centerEl.querySelectorAll('b, img').forEach(el => {
          unwrapItself(el.parentElement);
        });
        const outerWrapper = generateElements(
          '<div id=outerWrapper></div>',
          null,
          true
        );
        outerWrapper.style.display = 'flex';
        innerDiv.prepend(outerWrapper);
        innerDiv.querySelectorAll('b + p + p').forEach(locator => {
          const wrapper = wrap(
            '<div class=wrapper></div>',
            prev(prev(locator)),
            prev(locator),
            locator
          );
          outerWrapper.append(wrapper);
        });
      },

      'Meu Mundo Gay | Porno Gay | Incesto Gay | Vídeo Gay | Desenho Gay':
        () => {
          item.querySelector('[href="https://meumundogay.net"]').remove();
          addIframeHrefs();
        },

      'porno gay latinos': () => {
        addIframeHrefs();
      },
      'GayVids.tube': () => {
        addIframeHrefs();
      },

      'GayGuy.Top': () => {
        removeEmptytextEls(innerDiv);
        addIframeHrefs();
      },
      'GayGuy.Top - Watch Gay Porn Videos Free': () => {
        removeEmptytextEls(innerDiv);
        addIframeHrefs();
      },

      Gaystream: addIframeHrefs,
      'Gaystream is brat': async () => {
        const tempDocGstrm = await GMXmlHttpRequest(itemUrl);
        const btnEls = tempDocGstrm.querySelectorAll('.tab.boner');
        btnEls.forEach(item => {
          const iframeLink = item
            .getAttribute('onclick')
            .match(/\.src="(.+?)"/)[1];
          const iframeLinkEl = generateElements(
            `<a href=${iframeLink}>${iframeLink}</a>`,
            null,
            true
          );
          iframeLinkEl.style.display = 'block';
          innerDiv.prepend(iframeLinkEl);
        });
        const imgUrl = tempDocGstrm
          .querySelector('#overlay')
          .style.backgroundImage.match(/"(.+?)"/)[1];
        const imgEl = generateElements(`<img src=${imgUrl}>`, null, true);
        innerDiv.prepend(imgEl);
      },

      'FreePornVideosHDGay.com – Videos online free gay porn': async () => {
        const tempDocD = await GMXmlHttpRequest(itemUrl);
        tempDocD.querySelectorAll('.button_choice_server').forEach(item => {
          const linkHref = item.getAttribute('onclick').match(/'(.+?)'/)[1];
          generateElements(
            `<a href=${linkHref}>${linkHref}</a>`,
            innerDiv,
            true
          );
        });
        addPeekButtons(innerDiv, item);
      },

      'New Videos': async () => {
        if (item.querySelectorAll('.thumbContainer').length) {
          toggle(item.querySelector('.thumbContainer'));
          alert('check userscript code');
        }

        const tempDoc = await GMXmlHttpRequest(itemUrl);
        const script_ = tempDoc.querySelectorAll(
          'script[type="text/javascript"]'
        )[1];
        const screensCountMatch = script_.innerHTML.match(
          /timeline_screens_count: '(\d+)'/
        );
        const screensCount = screensCountMatch ? screensCountMatch[1] : 108;
        const imgUrlTemplate = script_.innerHTML.match(
          /timeline_screens_url: '(.+?)'/
        )[1];
        const samplingFq_ = script_.innerHTML.match(
          /timeline_screens_interval: '(\d+)'/
        )[1];

        let imgUrls = [];
        repeat(+screensCount, j => {
          const thisUrl = imgUrlTemplate.replace('{time}', +j + 1);
          imgUrls.push(thisUrl);
        });

        const sb = await storyboardToggleable({
          storyboardParent: item,
          horizontal: 1,
          vertical: 1,
          linkToVid: itemUrl,
          samplingFq: samplingFq_,
          imgUrls,
        });
        sb.style.width = '85vw';

        expandBlogtrottrItem();
      },
      'New Videos - GayHardFuck.com': async () => {
        if (item.querySelectorAll('.thumbContainer').length) {
          toggle(item.querySelector('.thumbContainer'));
          alert('check userscript code');
        }

        const tempDoc = await GMXmlHttpRequest(itemUrl);
        const script_ = tempDoc.querySelectorAll(
          'script[type="text/javascript"]'
        )[1];
        const screensCountMatch = script_.innerHTML.match(
          /timeline_screens_count: '(\d+)'/
        );
        const screensCount = screensCountMatch ? screensCountMatch[1] : 108;
        const imgUrlTemplate = script_.innerHTML.match(
          /timeline_screens_url: '(.+?)'/
        )[1];
        const samplingFq_ = script_.innerHTML.match(
          /timeline_screens_interval: '(\d+)'/
        )[1];

        let imgUrls = [];
        repeat(+screensCount, j => {
          const thisUrl = imgUrlTemplate.replace('{time}', +j + 1);
          imgUrls.push(thisUrl);
        });

        const sb = await storyboardToggleable({
          storyboardParent: item,
          horizontal: 1,
          vertical: 1,
          linkToVid: itemUrl,
          samplingFq: samplingFq_,
          imgUrls,
        });
        sb.style.width = '85vw';

        expandBlogtrottrItem();
      },

      'NurGAY.to': async () => {
        const newDiv = document.createElement('div');
        newDiv.append(...innerDiv.querySelectorAll('a:has(img)'));
        innerDiv.replaceChildren();
        innerDiv.append(newDiv);

        const tempDoc_ = await GMXmlHttpRequest(itemUrl);
        const actorsList = tempDoc_
          .querySelector('#video-actors')
          .textContent.replaceAll('\t', '')
          .replace('Actors: ', '')
          .replaceAll(' /', ',');
        GM_addElement(innerDiv, 'div', { textContent: actorsList });

        const links = tempDoc_.querySelectorAll(
          'p > [data-wpel-link="external"]'
        );
        const ExtLinksUl = generateElements('<ul></ul>', innerDiv);
        links.forEach(link => {
          const linkHref = link.getAttribute('href');
          const linkText = link.textContent;
          generateElements(
            `<li><a href=${linkHref}>${linkText}</a></li>`,
            ExtLinksUl
          );
        });

        addPeekButtons(innerDiv);
      },

      'Hacker News: Front Page': () => {
        GM_xmlhttpRequest({
          method: 'GET',
          url: `https://api.linkpreview.net/?q=${itemUrl}`,
          headers: {
            'X-Linkpreview-Api-Key': '81dd9d9372dcef7c430a92b177e09dfa',
          },
          responseType: 'document',
          onload: function (response) {
            const resText = response.responseText;
            const imgSrc = resText.match(/"image":"(.+?)"/)[1];
            const prevImg = generateElements(`<img src=${imgSrc}>`, null, true);
            innerDiv.prepend(prevImg);
          },
        });
        innerDiv.prepend(item.querySelector('[href*="news.ycombinator.com"]'));
      },

      'reddit.com: search results - sri lanka': () => {
        if (item.querySelector('[href*=Cricket],[href*=cricket]'))
          item.remove();

        const innerDivAll = item.querySelectorAll('tbody > tr > td > div');
        innerDivAll.forEach(div => {
          div.style.overflow = 'auto';
          div.style.maxHeight = '300px';
        });
      },

      'Download all YIFY Movies Torrents - YTS': () => {
        const title = encodeURI(
          document.querySelector(`[href*="https://yts.mx/movies/"]`).textContent
        );
        const year = innerDiv.querySelector('div').textContent;
        const url = `https://www.google.com/search?btnI=1&q=site:imdb.com+${title}+${year}`;
        generateElements(`<a href=${url}>IMDB</a>`, innerDiv);
      },

      default: () => {},
    };

    // Execute the appropriate handler
    (feedTitleHandlers[feedTitle] || feedTitleHandlers['default'])();

    return;
    switch (feedTitle) {
      case 'Latest gay porn videos on 4gay.com':
        const tempDoc4gay = await GMXmlHttpRequest(itemUrl);
        const duration_ = tempDoc4gay.querySelector(
          'meta[property="video:duration"]'
        ).content;
        const durationInSeconds_ = toSeconds(duration_);
        if (durationInSeconds_ < 15 * 60) {
          item.remove();
          break;
        }
        break;

      case 'GVUV2':
        // select all p elements that does not have an a element
        innerDiv.querySelectorAll('p:not(:has(a))').forEach(el => {
          el.remove();
        });
        addPeekButtons(innerDiv, item);
        break;

      case 'BoyFriendTv.com - RSS video Feed':
        const bftvDoc = await GMXmlHttpRequest(itemUrl);
        const bftvScript = bftvDoc.querySelector(
          'script[type="application/ld+json"]'
        );
        const durationMatches = bftvScript.textContent.match(
          /"duration":"PT(.+?)H(.+?)M(.+?)S"/
        );
        const durationString = `${durationMatches[1]}:${durationMatches[2]}:${durationMatches[3]}`;
        const durationInSeconds = toSeconds(durationString);
        if (durationInSeconds < 15 * 60) {
          item.remove();
          break;
        }

        const thumbnailSrc = bftvDoc.querySelector(
          'meta[property="og:image"]'
        ).content;
        const thumbEl = generateElements(`<img src=${thumbnailSrc}>`, item);
        thumbEl.style.maxHeight = '300px';
        generateElements(`<div>${durationString}</div>`, item);

        const otherScript = contains('script', 'initPlayer', bftvDoc)[0];
        const thumbBase =
          otherScript.textContent.match(/thumbBase: '(.+?)'/)[1];
        const thumbCount =
          otherScript.textContent.match(/thumbsCount: (\d+)/)[1];
        let imgUrls_ = [];
        for (let i = 1; i <= thumbCount; i++) {
          const thisUrl = thumbBase.replace('{THUMB_ID}', i);
          imgUrls_.push(thisUrl);
        }

        const storyboardParent = generateElements(`<div></div>`, item);
        storyboardToggleable({
          storyboardParent,
          horizontal: 1,
          vertical: 1,
          linkToVid: itemUrl,
          trueNoOfSlots: thumbCount,
          imgUrls: imgUrls_,
        });

        expandBlogtrottrItem();

        break;

      case 'Watch Full HD Gay Porn Videos Online Free | Watch Free HD Gay porn online free. Video streams and full movies. Daily new...':
        const tempDoc__ = await GMXmlHttpRequest(itemUrl);
        addIframeHrefs(tempDoc__);
        break;

      case 'VIDÉOS XXX GAY - Porno GAY Gratuit en Streaming':
        const videoUrl = itemUrl;

        const doc = await GMXmlHttpRequest(videoUrl);
        const sbSrc = doc
          .querySelector('[property="twitter:image"]')
          .content.replace('/default', '/nvsprite');
        const script = doc.querySelector('script');
        const match = script.innerHTML.match(/"duration": "(\w\w(\d+)S)"/);
        let duration;
        if (match) duration = match[2];
        else alert('error');

        const allUrls = sbSrc;
        const trueNoOfSlots = 20;
        const samplingFq = duration / trueNoOfSlots;

        const modalBody = generateElements('<div></div>', innerDiv);
        await storyboard(
          modalBody,
          20,
          1,
          videoUrl,
          null,
          samplingFq,
          trueNoOfSlots,
          allUrls
        );

        const videoId = itemUrl.match(/\/video\/(.+?)\//)[1];
        const previewVidSrc = `https://www.videosxgays.com/media/videos/tmb4/${videoId}/video.webm`;
        generateElements(
          `<video controls src=${previewVidSrc}></video>`,
          innerDiv
        );

        expandBlogtrottrItem();

        break;

      case 'OnlyBussy':
      case 'GayPornHot':
      case 'HutGay':
      case 'Super Tudo Gay – Porno Gay | Gay Amador | Sexo Gay':
      case 'Gay Porn Hub':
      case 'GayCock4U':
      case 'TURBOGVIDEOS.COM':
      case 'Gay – Faply':
      case 'iGay69':
        addIframeHrefs();
        break;

      case '4horlover':
        tempDoc = await GMXmlHttpRequest(itemUrl);
        const centerEl = tempDoc.querySelector('main center');
        innerDiv.append(centerEl);
        centerEl.querySelectorAll('b, img').forEach(el => {
          unwrap(el.parentElement);
        });
        const outerWrapper = generateElements(
          '<div id=outerWrapper></div>',
          null,
          true
        );
        outerWrapper.style.display = 'flex';
        innerDiv.prepend(outerWrapper);
        innerDiv.querySelectorAll('b + p + p').forEach(locator => {
          const wrapper = wrap(
            '<div class=wrapper></div>',
            prev(prev(locator)),
            prev(locator),
            locator
          );
          outerWrapper.append(wrapper);
        });
        break;

      case 'Meu Mundo Gay | Porno Gay | Incesto Gay | Vídeo Gay | Desenho Gay':
        item.querySelector('[href="https://meumundogay.net"]').remove();
        addIframeHrefs();
        break;

      case 'porno gay latinos':

      case 'GayVids.tube | GayVids, gaybb, porn gay hd, gay porn online, czech hunter, gayvids, freeonlinegayporn, gay porn, gay por...':

      case 'GayGuy.Top':
      case 'GayGuy.Top - Watch Gay Porn Videos Free':
        removeEmptytextEls(innerDiv);
        addIframeHrefs();
        break;

      case 'Gaystream':
      case 'Gaystream is brat':
        const tempDocGstrm = await GMXmlHttpRequest(itemUrl);
        const btnEls = tempDocGstrm.querySelectorAll('.tab.boner');
        btnEls.forEach(item => {
          const iframeLink = item
            .getAttribute('onclick')
            .match(/\.src="(.+?)"/)[1];
          const iframeLinkEl = generateElements(
            `<a href=${iframeLink}>${iframeLink}</a>`,
            null,
            true
          );
          iframeLinkEl.style.display = 'block';
          innerDiv.prepend(iframeLinkEl);
        });
        // alert( btnEls )

        const imgUrl = tempDocGstrm
          .querySelector('#overlay')
          .style.backgroundImage.match(/"(.+?)"/)[1];
        const imgEl = generateElements(`<img src=${imgUrl}>`, null, true);
        innerDiv.prepend(imgEl);
        break;

      case 'FreePornVideosHDGay.com – Videos online free gay porn':
        const tempDocD = await GMXmlHttpRequest(itemUrl);
        tempDocD.querySelectorAll('.button_choice_server').forEach(item => {
          const linkHref = item.getAttribute('onclick').match(/'(.+?)'/)[1];
          generateElements(
            `<a href=${linkHref}>${linkHref}</a>`,
            innerDiv,
            true
          );
        });
        addPeekButtons(innerDiv, item);
        break;

      case 'New Videos':
      case 'New Videos - GayHardFuck.com':
        if (item.querySelectorAll('.thumbContainer').length) {
          toggle(item.querySelector('.thumbContainer'));
          alert('check userscript code');
        }

        const tempDoc = await GMXmlHttpRequest(itemUrl);
        const script_ = tempDoc.querySelectorAll(
          'script[type="text/javascript"]'
        )[1];
        const screensCountMatch = script_.innerHTML.match(
          /timeline_screens_count: '(\d+)'/
        );
        const screensCount = screensCountMatch ? screensCountMatch[1] : 108;
        const imgUrlTemplate = script_.innerHTML.match(
          /timeline_screens_url: '(.+?)'/
        )[1];
        const samplingFq_ = script_.innerHTML.match(
          /timeline_screens_interval: '(\d+)'/
        )[1];
        // const trueNoOfSlots_ = script_.innerHTML.match( /timeline_screens_count: '(\d+)'/ )[ 1 ];

        let imgUrls = [];
        repeat(+screensCount, j => {
          const thisUrl = imgUrlTemplate.replace('{time}', +j + 1);
          imgUrls.push(thisUrl);
        });

        const sb = await storyboardToggleable({
          storyboardParent: item,
          horizontal: 1,
          vertical: 1,
          linkToVid: itemUrl,
          samplingFq: samplingFq_,
          // trueNoOfSlots: trueNoOfSlots_,
          imgUrls,
        });
        // const sb = await storyboardHorizontal( item, 1, 1, itemUrl, null, samplingFq_, trueNoOfSlots_, ...imgUrls );
        sb.style.width = '85vw';

        expandBlogtrottrItem();

        break;

      case 'NurGAY.to':
        const newDiv = document.createElement('div');
        newDiv.append(...innerDiv.querySelectorAll('a:has(img)'));
        innerDiv.replaceChildren();
        innerDiv.append(newDiv);

        const tempDoc_ = await GMXmlHttpRequest(itemUrl);
        const actorsList = tempDoc_
          .querySelector('#video-actors')
          .textContent.replaceAll('\t', '')
          .replace('Actors: ', '')
          .replaceAll(' /', ',');
        GM_addElement(innerDiv, 'div', { textContent: actorsList });

        const links = tempDoc_.querySelectorAll(
          'p > [data-wpel-link="external"]'
        );
        const ExtLinksUl = generateElements('<ul></ul>', innerDiv);
        links.forEach(link => {
          const linkHref = link.getAttribute('href');
          const linkText = link.textContent;
          generateElements(
            `<li><a href=${linkHref}>${linkText}</a></li>`,
            ExtLinksUl
          );
          // GM_addElement( innerDiv, 'a', { href: linkHref, textContent: linkText } );
        });

        addPeekButtons(innerDiv);

        break;

      case 'Hacker News: Front Page':
        GM_xmlhttpRequest({
          method: 'GET',
          url: `https://api.linkpreview.net/?q=${itemUrl}`,
          headers: {
            'X-Linkpreview-Api-Key': '81dd9d9372dcef7c430a92b177e09dfa',
          },
          responseType: 'document',
          onload: function (response) {
            const resText = response.responseText;
            const imgSrc = resText.match(/"image":"(.+?)"/)[1];
            const prevImg = generateElements(`<img src=${imgSrc}>`, null, true);
            innerDiv.prepend(prevImg);
          },
        });
        innerDiv.prepend(item.querySelector('[href*="news.ycombinator.com"]'));
      // no break here because reddit has some stuff in common

      case 'reddit.com: search results - sri lanka':
        // console.log( innerDiv )
        if (item.querySelector('[href*=Cricket],[href*=cricket]'))
          item.remove();

        const innerDivAll = item.querySelectorAll('tbody > tr > td > div');
        innerDivAll.forEach(div => {
          div.style.overflow = 'auto';
          div.style.maxHeight = '300px';
        });
        break;

      default:
        break;
    }
  });
}
