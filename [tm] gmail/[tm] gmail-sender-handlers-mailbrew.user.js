function mailbrewHandler() {
  const containers = document.querySelectorAll(`[class$=src-content]`);
  containers.forEach(element => {
    element.style = `
                        display: flex;
                        flex-wrap: wrap;
                        max-width: unset;
                `;
  });
  containers[0].classList.add('fixedCSS');
  document.querySelectorAll(`[class*=src-item]`).forEach(element => {
    element.style.width = `33%`;
  });

  let mbTitleElement = document.querySelector('[class*=brew-title]');
  let mbFeedTitle = mbTitleElement.textContent.trim();
  console.log(`%c📶 ${mbFeedTitle}`, 'font-size: large; color: gold');

  const mbItems = document.querySelectorAll('[class*=src-item]');
  mbItems.forEach(async item => {
    const itemHref = item.querySelector(`a`).href;
    const itemTitle = item.querySelector(`a`).textContent;

    async function addIframeHrefsMailBrew() {
      const tempDoc = await fetchDoc(itemHref);
      const iframes = tempDoc.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        GM_addElement(item, 'a', {
          textContent: iframe.src,
          href: iframe.src,
          style: 'display: block',
        });
      });
      addPeekButtonsMailBrew();
      return tempDoc;
    }

    function addPeekButtonsMailBrew() {
      const links = item.querySelectorAll('a');
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
        if (link.href.match(/(streamiwish|cdnstream|jodwish|74k)/)) {
          const doc = await fetchDoc(link.href);
          const stem = doc.querySelector('#vplayer > img').src.match(/.+\//)[0];
          const path = link.href.match(/\/(............)$/)[1];
          storyboard(
            item,
            10,
            10,
            link.href,
            null,
            null,
            100,
            `${stem}${path}0000.jpg`
          );
          expandBlogtrottrItem();
        }
        if (link.href.match(/d000d|ds2play|d0000d|dood|do0od/)) {
          const imgSrc = getDoodStoryboardSrc(link.href);
          generateElements(
            `<a href=${link}><img id=doodImg src=${imgSrc}></a>`,
            item,
            true
          );
        }
      });
    }

    switch (mbFeedTitle) {
      case '4horlover':
        const doc = await fetchDoc(itemHref);
        const entryContent = doc.querySelector('.entry-content');
        item.append(entryContent);
        break;
      case 'GVDBlog':
      case 'fxggxt.com':
        const fxggxtDoc = await addIframeHrefsMailBrew();
        const thumbUrl = fxggxtDoc.querySelector(
          'meta[property="og:image"]'
        ).content;
        generateElements(`<img src="${thumbUrl}" alt="Thumbnail">`, item, true);
        break;
      case 'CocyStream':
        addIframeHrefsMailBrew();
        break;
      case 'MasalaDesi':
        item.style.width = '100%';
        item.style.maxWidth = 'unset';
        item.querySelectorAll('br').forEach(br => {
          br.remove();
        });
        item.querySelectorAll('img').forEach(img => {
          img.style.maxHeight = '300px';
          img.style.maxWidth = '300px';
          item.append(img);
        });
        break;
      case 'PSA':
        const tempDoc = await fetchDoc(itemHref);
        const tagEls = tempDoc.querySelectorAll('[rel=tag]');
        if (!tagEls.length) {
          const errorEl = generateElements(
            '<div style="color: red">Error</div>',
            null,
            true
          );
          item.append(errorEl);
          return;
        }
        tagEls.forEach(tag => {
          if (
            [
              'HEVC',
              'HEVC PSA',
              'x265',
              'x265 HEVC',
              '2160p',
              'hdr',
              'HDR10Plus',
            ].includes(tag.textContent)
          )
            return; // 🛑
          style(
            tag,
            `
                                            background-color: #2196F3;
                                            color: white;
                                            margin: 3px;
                                            padding: 2px;
                                        `
          );
          if (['TV-Show', 'Movie'].includes(tag.textContent))
            style(
              tag,
              `
                                                background-color: #f44336;
                                            `
            );

          item.append(tag);
        });

        const googleEl = generateElements(
          `<a href="https://www.google.com/search?q=${itemTitle}">Google</a>`,
          null,
          true
        );
        item.append(googleEl);

        break;
      case 'happy2hub':
        item.style.width = '100%';
        item.style.maxWidth = 'unset';
        const tempDocH2h = await fetchDoc(itemHref);
        item.append(tempDocH2h.querySelector('[href*="paste.happy2hub"]'));
        tempDocH2h.querySelectorAll('p > a > img[decoding]').forEach(img => {
          img.style.width = '250px';
          item.append(img);
        });
        break;

      default:
        break;
    }
  });
}
