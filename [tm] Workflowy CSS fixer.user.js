GM_addStyle(`
    .contentTag {
        background-color: #606060;
        margin          : 1px !important;
        color           : #00000000 !important;
        padding         : 2px 4px !important;
    }

    .contentTagText {
        position       : relative;
        left           : -4px;
        color          : rgba(255,255,255,0.4);
        /* text-shadow    : 1px 2px 3px #eee, 0 0 0 #000, 1px 2px 3px #eee; */
        text-decoration: none !important;
        color          : white;
    }
    
    [data-val]:hover:before {
        opacity         : 0.70;
        color           : white;
        font-size       : small;
        background-color: black;
        position        : absolute;
        top             : -10px;
    } `);

addTagCSS( 'ahk', '#357721'   , 'AutoHotkey' )
addTagCSS( 'js' , 'gold'      , 'JavaScript' )
addTagCSS( '❗'  , 'darksalmon', 'Important'  )
addTagCSS( 'css', 'azure' )

function addTagCSS( tag, backgroundColor, toolTip = '', fontColor = 'unset' ) {
    GM_addStyle( `
    [data-val='#${tag}'] {
        color              : #00000000 !important;
        background-color   : ${backgroundColor};
    }
    [data-val='#${tag}']:hover:before {
        content            : '${toolTip}';
    } ` ) }