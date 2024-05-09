oldId = ''
newId = ''

main()

window.addEventListener( 'urlchange', () => { main() } )

function main () {

    newId = location.href.match( /v=(.{11})/ )
    newId = newId ? newId[ 1 ] : ''
    selector = newId ? `[video-id="${ newId }"]` : ''
    console.log( newId )

    waitFor( `ytd-watch-flexy${ selector }` ).then( ( el ) => {
        // console.clear()
        console.log( 'xxx' )
        // $( el ).addClass( 'autoStopped' )
        $( '#movie_player' )[ 0 ].pauseVideo()
    } )

}

function waitForRecursive () {
    alert()
    console.log( newId )
    waitFor( `ytd-watch-flexy${ selector }:not(.autoStopped)` ).then( ( el ) => {

        console.log( newId, oldId )
        if ( newId == oldId ) { return }

        oldId = location.href.match( /v=(.{11})/ )[ 1 ]
        console.log( oldId )
        waitForRecursive()

    } )
}




// var shouldStop = true;

// if(document.getElementById("thumbDiv" ) ) {

//     var p=document.getElementById("movie_player");

//     var timerVar2 = setInterval(myTimer2, 100);
//     function myTimer2() {
//         if(p.getPlayerState() == 1 && shouldStop) {
//             shouldStop = false;
//             clearInterval(timerVar2);
//             p.pauseVideo();
//             p.stopVideo();
//         }
//     }
// }
// });

// var timerVar = setInterval(myTimer, 100);
// function myTimer() {
//     if(document.getElementById("thumbDiv") ) {
//         clearInterval(timerVar);
//         var p=document.getElementById("movie_player");
//         p.pauseVideo();
//         p.stopVideo();
//     }
// }