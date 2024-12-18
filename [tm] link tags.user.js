$allAnchors = $( 'a' );

$allAnchors.each( function () {

  $this = $( this );
  tags = [];
  link = this.href;

  $this.wrapAll( '<div style="display: flex; flex-wrap: wrap"></div>' );


  if ( link && link.includes( 'sblanh' ) ) { tag( $this, '🖼️', 'good' ); }
  if ( link && link.includes( 'sbanh' ) ) { tag( $this, '🖼️', 'good' ); }
  if ( link && link.includes( 'sblongvu' ) ) { tag( $this, '🖼️', 'good' ); }
  if ( link && link.includes( 'dood' ) ) { tag( $this, '🖼️', 'good' ); }
  if ( link && link.includes( 'videobin' ) ) { tag( $this, '🖼️', 'good' ); }
  if ( link && link.includes( 'gofile' ) ) { tag( $this, '⏬', 'good' ); }

  if ( link && link.includes( 'send.cm' ) ) {
    tag( $this, 'no ytdlp', 'bad' );
  }
  if ( link && link.includes( 'drop.download' ) ) {
    tag( $this, '...', 'good' );
  }

  if ( link && link.includes( 'racaty' ) ) {
    tag( $this, '1🖱️', 'good' );
    tag( $this, '1.4MB/s', 'ok' );
  }

  if ( link && link.includes( '1fichier' ) ) {
    tag( $this, '⏳bet', 'bad' );
    tag( $this, '2🖱️', 'good' );
    tag( $this, '⏳', '' );
    tag( $this, 'Max/s', 'good' );
  }
  if ( link && link.includes( 'anonfiles' ) ) {
    tag( $this, '📶', 'good' );
    tag( $this, '4.6 MB/s', 'good' );
  }
  if ( link && link.match( /dropgalaxy|dgdrive/ ) ) {
    tag( $this, '4🖱️', 'ok' );
    tag( $this, '20s+⏳', 'ok' );
    tag( $this, '1MB/s', 'ok' );
  }
  if ( link && link.includes( 'vupload' ) ) {
    tag( $this, '🖼️', 'good' );
  }
  if ( link && link.includes( '9xupload' ) ) {
    tag( $this, 'Max/s', 'good' );
    tag( $this, '2🖱', 'good' );
  }
  if ( link && link.includes( 'mixloads' ) ) {
    tag( $this, '280KB/s', 'bad' );
    tag( $this, '3🖱', 'ok' );
  }
  if ( link && link.includes( 'clicknupload' ) ) {
    tag( $this, '1MB/s', 'ok' );
    tag( $this, '3🖱', 'ok' );
    tag( $this, '15s⏳', 'ok' );
  }

  $buttonCopy = $( '<button>📋</button>' ).insertBefore( $this );
  $( `<div style="flex-basis: 100%"></div>` ).insertBefore( $this );
  $buttonCopy.on( 'click', function () { GM_setClipboard( $( this ).siblings( 'a' ).attr( 'href' ) ); } );

} );

function tag ( element, text, rating ) {
  let $element = $( element );
  $element.before( `<code class="tag ${ rating }">${ text }</code>` );
  // $element.text( $element.attr( 'href' ).match( /\/\/(.*)\// )[1] )
  $element.css( `font-weight`, `normal` );
}

GM_addStyle( `

    .tag,
    button { height       : fit-content  }

    .tag   { border-radius: 5px;
             padding      : 1px;
             margin       : 3px;
             text-shadow  : black 1px 1px 1px; }

    .bad   { background   : fireBrick    }

    .good  { background   : green        }

    .ok    { background   : yellowGreen;
             color        : lime;
             font-weight  : lighter      }
    
` );