//* External links
const titleMatch = location.href.match( /\/title\/(tt\d+)/ );
if ( !titleMatch ) return;
const titleId = titleMatch[ 1 ];
const ytsUrlBase = 'https://yts.mx/';
const el = document.querySelector( `[data-testid="hero__pageTitle"] + ul` );
const ytsLinkEl = generateElements( `
    <li class=ipc-inline-list__item>
        <a target=_blank href=${ ytsUrlBase }browse-movies/${ titleId }>
            <img style='max-width: 32px' src='https://www.google.com/s2/favicons?sz=64&domain=${ ytsUrlBase }'>
        </a>
    </li>` );
el.appendChild( ytsLinkEl );

const $moreFromSectionEl = $( `[data-testid="more-from-section"]` );
$moreFromSectionEl.insertBefore( '[data-testid="contribution"]' );

//*____________________
if ( location.href.includes( 'https://m.' ) ) {
    location.replace( location.href.replace( 'https://m.', 'https://www.' ) );
}

let observer = new MutationObserver( () => {
    $( 'a[href*="?ref"]' ).each( function () {
        this.href = this.href.replace( /\?ref.*$/, '' );
    } );
} );
observer.observe( document.body, { childList: true, subtree: true } );
