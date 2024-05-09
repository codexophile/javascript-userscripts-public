( function () {
    'use strict'

    const scrollEl = document.getElementById( 'reader_pane' )

    scrollEl.onscroll = function () {
        console.log( 'x' )

        const scrollMaxVal = ( scrollEl.scrollHeight - scrollEl.clientHeight )

        if (
            scrollEl.scrollTop == scrollMaxVal &&
            scrollMaxVal != 0 &&
            document.querySelectorAll( '#no_more_div' )
        ) {

            window.setTimeout( function () {
                if ( scrollEl.scrollTop == scrollMaxVal ) {
                    var e = jQuery.Event( "keydown" )
                    e.which = 74
                    e.shiftKey = true
                    $( "#reader_pane" ).trigger( e )
                }
            }, 1500 )

        }

    }

} )()