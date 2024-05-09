(function() {
'use strict';

if( location.href !== 'https://adventofcode.com/2022/day/1/input' ) return // 🛑

let $pre  = $( `pre` )
let text  = $pre.text()
let elves = text.match( /(\d+\n)+/g )
let max   = 0

elves.forEach( elf => {
    
    let foodItems = elf.match( /\d+/g )
    let sum       = foodItems.reduce( ( a, b ) => +a + +b, 0 )
    if( sum > max ) max = sum

});

console.log( max )
alert( max )


})();