( function () {
  'use strict';

  //? events in order they occur
  // window.addEventListener( 'yt-navigate', findStuff )
  // window.addEventListener( 'urlchange', findStuff )
  //
  window.addEventListener( 'yt-navigate-finish', addStoryboard );
  // window.addEventListener( 'yt-page-data-updated', addStoryboard )
  //# window.addEventListener( 'yt-player-updated', addStoryboard )
  //? these didn't fire
  // window.addEventListener( 'yt-page-type-changed', findStuff )
  //* adding the main storyboard for the video page
  async function addStoryboard () {
    if ( !location.href.includes( '/watch?v=' ) ) return; // 🛑

    document.querySelector( `#storyboardParent` )?.remove();
    document.querySelectorAll( `#collapsibleContent > .storyboardControl` ).forEach( item => { item.remove(); } );

    const sbLocator = await waitFor( '#above-the-fold > #top-row' );
    const sbParent = generateElements( `<div id=storyboardParent></div>` );
    sbLocator.after( sbParent );
    const ytHtml = await GMXmlHttpReqResponse( location.href );
    const { allUrls, trueNoOfSlots, samplingFq } = generateAllYouTubeSbUrls( ytHtml );
    const video = document.querySelector( `video` );
    storyboard( {
      storyboardParent: sbParent,
      horizontal: 5,
      vertical: 5,
      vidOnPage: video,
      samplingFq: samplingFq,
      trueNoOfSlots: trueNoOfSlots,
      imgUrls: [ ...allUrls ]
    } );

  }

  waitForEach( '#buttonsContainer', async ( btnsContainerEl ) => {
    const peekButton = generateElements( `<button class=peekButton>🫣</button>` );
    btnsContainerEl.append( peekButton );

    peekButton.addEventListener( 'click', async () => {

      peekButton.textContent = '🔄';

      const videoLinkEl = btnsContainerEl.parentElement.querySelector( 'a' );
      const videoUrl = videoLinkEl.href;

      const ytHtml = await GMXmlHttpReqResponse( videoUrl );
      const { allUrls, trueNoOfSlots, samplingFq } = generateAllYouTubeSbUrls( ytHtml );

      const headerLink = generateElements(
        `<a href=${ videoUrl } target=_blank> ${ videoLinkEl.textContent } </a>` );
      const modalBody = generateElements( '<div></div>' );

      const modal = new ModalBox( {
        width: '95vw',
        backgroundColor: '#f0f0f0',
        headerColor: '#3498db',
        animation: true,
        closeOnEscape: true,
        closeOnOutsideClick: true
      } );

      modal.setTitle( headerLink );
      modal.setContent( modalBody );

      await storyboard( {
        storyboardParent: modalBody,
        horizontal: 5,
        vertical: 5,
        linkToVid: videoUrl,
        trueNoOfSlots,
        imgUrls: [ ...allUrls ]
      } );

      peekButton.textContent = '🫣';

      modal.show();

    } );
  } );

} )();