( function () {
    'use strict';

    const blackList = [ 'Food', 'Food Generic', 'Habit (Bad)', 'Total Carbohydrate', 'Magnesium', 'Sodium', 'Potassium', 'Calcium',
        'Iron', 'Total Fat', 'Saturated Fat', 'Protein (Plant)', 'Protein (Animal)', 'Cholesterol', 'Cobalamin', 'Vitamin B', 'Vitamin C',
        'Caffeine', 'Food Generic'
    ];

    waitForEach( '.tiny-trackable:not(.bg-transparent)', item => {

        // hiding blacklist items
        const label = item.querySelector( '.label' );
        const labelText = label.textContent;
        if ( blackList.includes( labelText ) )
            item.style.display = 'none';

        // sets the tooltip for the button
        item.title = label.textContent;
        // hides [.*] from label text
        label.textContent = label.textContent.replace( /\[.*\]/, '' );

    } );

    //* Right click/Middle click
    $( document.body ).on( 'contextmenu', '.button-wrapper', function ( event ) { clickMore( this, event ); } );

    $( document ).on( "middleclick", ".button-wrapper", function ( event ) {
        clickMore( this, event );
        waitFor( '#button-id-4' ).then( ( el ) => { el.click(); } );
    } );

    //* AutoNote
    let match;
    if ( match = location.href.match( /\?note=(.+)(\?|&|$)/ ) ) {
        waitFor( 'textarea' ).then( ( el ) => { el.focus(); } );
        waitFor( '#textarea-capture-note' ).then( ( el ) => {
            textToAdd = decodeURI( match[ 1 ] );
            textToAdd = textToAdd.replaceAll( '[hash]', '#' );
            $( el ).val( textToAdd );
            var eve = new Event( 'input', { bubbles: true, cancelable: true } );
            document.title = 'Autoclose';
            el.dispatchEvent( eve );
            setTimeout( () => {
                $( '#note-capture' ).find( 'button' ).eq( 5 ).click();
                waitFor( '.toast-type.success' ).then( ( el ) => { window.close(); } );
            }, 500 );
        } );
    }

    function clickMore ( element, event ) {
        event.preventDefault();
        $( element ).children( '[aria-label="More about this Trackable"]' ).click();
    }

    //* Middleclick
    $( document ).on( "mousedown", function ( e1 ) {
        if ( e1.which === 2 ) {
            e1.preventDefault();
            $( document ).one( "mouseup", function ( e2 ) {
                if ( e1.target === e2.target ) {
                    var e3 = $.event.fix( e2 );
                    e3.type = "middleclick";
                    $( e2.target ).trigger( e3 );
                }
            } );
        }
    } );

    //* Minimizing the left bar

    waitForEach( 'aside:not(.fixed)', el => {

        $( el ).addClass( 'fixed' );
        const $aside = $( 'aside' );
        const $buttonTitles = $( '.mr-2.link-title' ).remove();
        const $searchButtonTitle = $( 'aside button span:not([class])' ).remove();

        $aside.css( 'width', '80px' );
        $( '[alt="app-logo"]' ).css( 'max-width', 'unset' );
        const $mainContent = $( '[class="xl:ml-56 layout-section-wrap"]' ).css( 'margin-left', '80px' );

    } );

    GM_addStyle( `
    [class="button-wrapper relative w-full flex-grow flex-shrink normal"] {
      width: 150px;
    }
    .item-grid {
      flex-wrap: wrap;
      display  : flex;
    }
    .title.line-clamp-2 {
      overflow: hidden !important;
      white-space: nowrap !important;
      text-overflow: ellipsis !important;
    }` );


} )();