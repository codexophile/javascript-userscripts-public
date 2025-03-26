( async function () {
  'use strict';
  if ( window.top != window.self ) return; //don't run on frames or iframes

  //* Beep
  beep();
  function beep () {
    const blackListUrls = [
      'https://www.google.com/url?q=',
      'https://mail.google.com'
    ];
    if ( blackListUrls.some( url => location.href.includes( url ) ) ) return; // 🛑
    if ( document.hidden ) return;
    GM_setClipboard( `global-document-ready-${ document.title }` );
  }

  //* toolbar and toolbar buttons
  const collapsible = await Collapsible( "", {
    width: "300px",
    height: "50px",
    collapsedWidth: "40px",
  } );
  collapsible.collapsibleToggler.click();


  collapsible.addButton( "🔝", null, () => window.scrollTo( 0, 0 ) );
  const headersPopup = collapsible.addPopup();
  collapsible.addButton( "🇭", headersPopup );
  const iframesPopup = collapsible.addPopup();
  collapsible.addButton( "ℹ️", iframesPopup );

  waitForEach( "h,h1,h2,iframe", ( element ) => {
    switch ( element.tagName ) {
      case "H":
      case "H1":
      case "H2":
        generateElements(
          `<div>${ element.textContent }</div>`,
          headersPopup
        ).addEventListener( "click", () => {
          element.scrollIntoView();
        } );
        break;
      case "IFRAME":
        generateElements(
          `<a href=${ element.src } target=_blank>${ element.src }</a>`
          , iframesPopup );
        break;

      default:
        break;
    }
  } );

  collapsible.addButton( '🔊', null, () => {
    const text = window.getSelection().toString().replaceAll( '\n', '. ' );
    if ( !text ) return; // 🛑
    location.href = `edge-tts:${ text }`;
  } );

  const ytdlpBtn = collapsible.addButton( 'ytdlp', null, () => {
    GM_setClipboard( `initiate-ytdlp:url:${ location.href }::` );
  } );
  ytdlpBtn.id = 'yt-dlp-Btn';

  const rssLinks = document.querySelectorAll( 'link[rel="alternate"][type="application/rss+xml"], link[rel="alternate"][type="application/atom+xml"]' );
  if ( rssLinks.length ) {
    const rssFeedsContainer = collapsible.addPopup();
    collapsible.addButton( '📶', rssFeedsContainer );

    const addFeedBtnEl = generateElements( `<a>➕ Inoreader</a>`, rssFeedsContainer );
    var encodedURI = encodeURIComponent( window.location );
    addFeedBtnEl.href = `https://www.inoreader.com/search/feeds/${ encodedURI }`;
    addFeedBtnEl.target = '_blank';

    rssLinks.forEach( link => {
      generateElements( `<a
                        href='${ link.href }'
                        target=_blank
                        style='display: block;'
                >${ link.title }</a>`, rssFeedsContainer );
    } );
  }

} )();
