( function () {
    'use strict';

    const headersContainerEl = generateElements( `<div></div>` );
    const headerEls = document.querySelectorAll( `main :is(h2,h3)` );

    headerEls.forEach( header => {
        const dialogItem = generateElements( `<div>${ header.textContent }</div>`, headersContainerEl );
        dialogItem.title = header.textContent;
        dialogItem.style = `
            color: black;
            white-space: nowrap;
        `;
        dialogItem.addEventListener( 'click', () => {
            header.scrollIntoView( { behavior: 'smooth', block: 'center' } );
        } );
    } );

    const dialogEl = dialog( null, headersContainerEl );
    dialogEl.querySelector( '#expand-btn' ).click();

    document.querySelectorAll( `.code` ).forEach( item => {
        const copyButton = generateElements( `<button>🧱</button>`, item );
        copyButton.style = `
            position: absolute;
            right: 0px;
            top: 0px;
        `;
        copyButton.addEventListener( 'click', () => {
            const codeContent = item.querySelector( 'code' ).textContent;
            GM_setClipboard( codeContent );
        } );
    } );

} )();