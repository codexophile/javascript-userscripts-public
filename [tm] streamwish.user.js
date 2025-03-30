( async function () {
  'use strict';

  ( async function () {
    'use strict';

    let ytDlpBtnEl = await waitFor( '#yt-dlp-btn' );
    ytDlpBtnEl = removeListenersByCloning( ytDlpBtnEl );
    ytDlpBtnEl.addEventListener( 'click', () => {
      const videoUrl = document.querySelector( `#titleM3u8Link` )?.href;
      if ( !videoUrl ) alert( 'No video URL found' );
      const videoTitle = document.title.replace( ' • [Browser:Private-profile]', '' );
      GM_setClipboard( `initiate-ytdlp:url:${ videoUrl }::title:${ videoTitle }::` );
    } );

  } )();


  ( async function () {
    'use strict';

    let storyboardUrl;

    const thumbEl = await waitFor( '.jw-time-thumb[style*="background-image"]' );
    storyboardUrl = thumbEl.style.backgroundImage.match( /['"](.*)['"]/ )[ 1 ];

    const $videoEl = $( `video[src]` );
    $videoEl.data( 'processed', true );
    $videoEl.prop( 'volume', 0.01 );
    $( '#vplayer' ).css( `height`, `70vh` );

    let parent;
    if ( $( '.videoplayer, #vplayer' ).length )
      parent = $( `<div></div>` ).insertAfter( $( '.videoplayer, #vplayer' ).first() );
    else
      parent = $( `<div></div>` ).appendTo( document.body );

    const storyboardEl = await storyboard( {
      storyboardParent: parent[ 0 ],
      horizontal: 10, vertical: 10,
      vidOnPage: $videoEl[ 0 ],
      trueNoOfSlots: 100,
      imgUrls: [ storyboardUrl ]
    } );

  } )();


} )();