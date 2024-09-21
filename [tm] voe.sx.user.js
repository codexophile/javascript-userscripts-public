( function () {
    'use strict';

    document.body.style.overflow = 'scroll';
    let videoId;
    if ( document.querySelector( 'input[name=fileCode]' ) )
        videoId = document.querySelector( 'input[name=fileCode]' )?.value;
    else
        videoId = document.querySelector( '.html-embed-code' ).value.match( /\/e\/(.+?)"/ )[ 1 ];
    const imageUrl = `https://i.voe.sx/cache/${ videoId }_storyboard_L0.jpg`;
    const vidOnPage = document.querySelector( 'video' );
    const $sbParent = $( `<div id=sbParent></div>` );
    if ( location.href.includes( '/e/' ) )
        $sbParent.appendTo( document.body );
    else
        $sbParent.insertAfter( '.stream' );
    const storyboardParent = $sbParent[ 0 ];
    storyboard( {
        storyboardParent,
        horizontal: 10,
        vertical: 10,
        vidOnPage,
        trueNoOfSlots: 100,
        imgUrls: [ imageUrl ]
    } );
    // storyboard( $sbParent[ 0 ], 10, 10, null, vidOnPage, null, 100, imageUrl );

} )();