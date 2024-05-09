( function () {
    'use strict'

    $( `.clicky:contains('next')` ).each( function () {
        const $this = $( this )
        $this.insertBefore( $this.closest( '.default' ).prevAll( '.votelinks' ) )
    } )

    return
    const $voteEls = $( '.votelinks' )
    const $nextBtn = $( `<button>⏭️</button>` ).insertBefore( $voteEls )


} )()