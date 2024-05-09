function addTooltip ( tooltipParent, tooltipContent ) {

    addStyle( /*css*/`
        .tooltipParent {
            position: relative;
            display: inline-block;
            border-bottom: 1px dotted black;
        }

        .tooltipParent + .tooltip {
            visibility: hidden;
            width: 120px;
            background-color: #555;
            color: #fff;
            text-align: center;
            border-radius: 6px;
            padding: 5px 0;
            position: absolute;
            z-index: 1;
            bottom: 125%;
            left: 50%;
            margin-left: -60px;
            opacity: 0;
            transition: opacity 0.3s;
        }

        .tooltipParent + .tooltip::after {
            content: "";
            position: absolute;
            top: 100%;
            left: 50%;
            margin-left: -5px;
            border-width: 5px;
            border-style: solid;
            border-color: #555 transparent transparent transparent;
        }

        .tooltipParent:hover + .tooltip {
            visibility: visible;
            opacity: 1;
        }
    `)

    tooltipParent.classList.add( 'tooltipParent' )
    const toolTip = generateElements( '<span class=tooltip></span>', null, true )
    tooltipParent.after( toolTip )
    const wrapper = wrap( '<div class=wrapper></div>', tooltipParent, toolTip )
    style( wrapper, `
        position: relative;
        width:    fit-content;
    `)
    toolTip.append( tooltipContent )

}

// function calculateWidthAndExpand ( collapsibleContent )
//? Moved to [fun] vanilla.js


function collapsibleHorizontal ( maxHeight, togglerText = '' ) {

    const { collapsibleStructure, collapsibleToggler, collapsibleContent } = collapsible( togglerText )
    style( collapsibleStructure, `
            max-height: ${ maxHeight };
            display: flex;` )
    collapsibleToggler.style.width = 'unset'
    style( collapsibleContent, `
            padding:     0;
            max-height:  unset;
            width:       0;
            transition:  width 0.2s ease-out;
        `)

    let mouseDownX, mouseUpX, mouseDownY, mouseUpY
    collapsibleToggler.addEventListener( 'mousedown', ( event ) => {
        mouseDownX = event.clientX
        mouseDownY = event.clientY
    } )
    collapsibleToggler.addEventListener( 'mouseup', ( event ) => {
        if ( event.button !== 0 ) return // 🛑

        mouseUpX = event.clientX
        mouseUpY = event.clientY

        if ( mouseDownX === mouseUpX && mouseDownY === mouseUpY ) {

            event.target.classList.toggle( "active" )
            if ( collapsibleContent.style.width === '0px' ) {
                calculateWidthAndExpand( collapsibleContent )
            } else {
                collapsibleContent.style.width = 0
            }

        }

    } )

    return { collapsibleStructure, collapsibleToggler, collapsibleContent }


}

function collapsibleVertical () {
    const { collapsibleStructure, collapsibleToggler, collapsibleContent } = collapsible()
    collapsibleToggler.addEventListener( "click", function () {
        this.classList.toggle( "active" )
        if ( collapsibleContent.style.maxHeight ) {
            collapsibleContent.style.maxHeight = null
        } else {
            collapsibleContent.style.maxHeight = collapsibleContent.scrollHeight + "px"
        }
    } )

}

function collapsible ( togglerText = '' ) {

    const css = /*css*/`

            /* * { box-sizing: border-box } */    
            #collapsible-toggler {
                width: 100%;
                background-color: #777;
                color: white;
                cursor: pointer;
                padding: 18px;
                border: none;
                text-align: left;
                outline: none;
                font-size: 15px;
            }

            .active, #collapsible-toggler:hover {
                background-color: #555;
            }

            #collapsibleContent > * {
                margin: 3px;
            }

            #collapsibleContent {
                display: flex;
                padding: 0 18px;
                max-height: 0;
                overflow: hidden;
                transition: all 0.2s ease-out;
                background-color: #f1f1f1;

        `
    GM_addStyle( css )


    const collapsibleStructure = generateElements( /*html*/`
                <div id=collapsibleStructure'>
                    <button id="collapsible-toggler" > ${ togglerText }</button>
                    <div id=collapsibleContent>
                    </div>
                <div>
        `, null, true )
    document.body.prepend( collapsibleStructure )

    const collapsibleContent = document.querySelector( `#collapsibleContent` )
    const collapsibleToggler = document.querySelector( `#collapsible-toggler` )

    return { collapsibleStructure, collapsibleToggler, collapsibleContent }

}

// function collapsibleHorizontal () {

//     GM_addStyle( `

//         .active, #collapsible-toggler:hover {
//             background-color: #555;
//         }

//         #collapsible-content {
//             width: 0px;
//             overflow: hidden;
//             transition: all 0.2s ease-out;
//             background-color: #f1f1f1;
//         }
//     ` )

//     const collapsibleStructure = generateElements( /*html*/`
//             <div style='display: flex'>
//                 <button id=collapsible-toggler></button>
//                 <div id=collapsible-content></div>
//             </div>
//     `)
//     style( collapsibleStructure, `
//         height: fit-content;
//     `)
//     document.body.prepend( collapsibleStructure )

//     const collapsibleToggler = document.querySelector( '#collapsible-toggler' )
//     style( collapsibleToggler, `
//         cursor: pointer;
//     `)

//     let mouseDownX, mouseUpX, mouseDownY, mouseUpY
//     collapsibleToggler.addEventListener( 'mousedown', ( event ) => {
//         mouseDownX = event.clientX
//         mouseDownY = event.clientY
//     } )
//     collapsibleToggler.addEventListener( 'mouseup', ( event ) => {

//         mouseUpX = event.clientX
//         mouseUpY = event.clientY

//         if ( mouseDownX === mouseUpX && mouseDownY === mouseUpY ) {
//             event.target.classList.toggle( "active" )
//             const content = document.querySelector( '#collapsible-content' )
//             if ( content.style.width ) {
//                 content.style.width = null
//             } else {
//                 content.style.width = '100%'
//             }
//         }

//     } )

//     return collapsibleStructure

// }

function slideshowGallery () {

    GM_addStyle( `

        #slideShowGallery { display: ; }

        #slideShowGallery {
            font-family: Arial;
            margin: 0;
        }

        #slideShowGallery * {
            box-sizing: border-box;
        }

        #slideShowGallery img {
            vertical-align: middle;
        }

        /* Position the image container (needed to position the left and right arrows) */
        #slideShowGallery .container {
            position: relative;
        }

        /* Hide the images by default */
        #slideShowGallery .mySlides {
            display: none;
        }

        /* Add a pointer when hovering over the thumbnail images */
        #slideShowGallery .cursor {
            cursor: pointer;
        }

        /* Next & previous buttons */
        #slideShowGallery :is(.prev, .next) {
            cursor: pointer;
            position: absolute;
            top: 40%;
            width: auto;
            padding: 16px;
            margin-top: -50px;
            color: white;
            font-weight: bold;
            font-size: 20px;
            border-radius: 0 3px 3px 0;
            user-select: none;
            -webkit-user-select: none;
        }

        /* Position the "next button" to the right */
        #slideShowGallery .next {
            right: 0;
            border-radius: 3px 0 0 3px;
        }
        #slideShowGallery .prev {
            left: 0;
            border-radius: 3px 0 0 3px;
        }

        /* On hover, add a black background color with a little bit see-through */
        #slideShowGallery :is(.prev:hover, .next:hover) {
            background-color: rgba(0, 0, 0, 0.8);
        }

        /* Number text (1/3 etc) */
        #slideShowGallery .numbertext {
            color: #f2f2f2;
            font-size: 12px;
            padding: 8px 12px;
            position: absolute;
            top: 0;
        }

        /* Container for image text */
        #slideShowGallery .caption-container {
            text-align: center;
            background-color: #222;
            padding: 2px 16px;
            color: white;
        }

        #slideShowGallery .row {
            display: flex;
            align-items: baseline;
        }

        #slideShowGallery .row:after {
            content: "";
            display: table;
            clear: both;
        }

        /* Six columns side by side */
        #slideShowGallery .column {
            float: left;
            width: 16.66%;
        }

        /* Add a transparency effect for thumnbail images */
        #slideShowGallery .demo {
            opacity: 0.6;
        }

        #slideShowGallery :is(.active, .demo:hover) {
            opacity: 1;
        }
    ` )

    const sgContent = generateElements( /*html*/ `
            <div id=slideShowGallery>
                <h2 style="text-align:center">Slideshow Gallery</h2>
                <div class="container">
                    <div id=fullImgCont></div>
                    <a class="prev">❮</a>
                    <a class="next">❯</a>
                    <div class="caption-container">
                        <p id="caption"></p>
                    </div>
                    <div class="row"></div>
                </div>
            </div>
            `)
    document.body.append( sgContent )

    const fullImgContainer = document.querySelector( `#fullImgCont` )
    const row = document.querySelector( `.row` )
    for ( const item in arguments ) {
        fullImgContainer.append( generateElements( /*html*/`
            <div class=mySlides>
                <div class=numbertext>${ +item + 1 } / ${ arguments.length }</div>
                <img src=${ arguments[ item ] } style='width:100%'>
            </div>
        `) )
        row.append( generateElements( /*html*/`
            <div class=column>
                <img class='demo cursor' src=${ arguments[ item ] } style='width:100%'>
            </div>
            `) )
    }

    document.querySelector( `.prev` ).addEventListener( 'click', () => { plusSlides( -1 ) } )
    document.querySelector( `.next` ).addEventListener( 'click', () => { plusSlides( 1 ) } )
    document.querySelectorAll( `.demo` ).forEach( item => {
        item.addEventListener( 'click', ( event ) => {
            const element = event.target.parentNode
            const index = Array.from( element.parentNode.children ).indexOf( element ) + 1
            currentSlide( index )
        } )
    } )


    let slideIndex = 1
    showSlides( slideIndex )

    function plusSlides ( n ) {
        showSlides( slideIndex += n )
    }

    function currentSlide ( n ) {
        showSlides( slideIndex = n )
    }

    function showSlides ( n ) {
        let i
        let slides = document.getElementsByClassName( "mySlides" )
        let dots = document.getElementsByClassName( "demo" )
        let captionText = document.getElementById( "caption" )
        if ( n > slides.length ) { slideIndex = 1 }
        if ( n < 1 ) { slideIndex = slides.length }
        for ( i = 0; i < slides.length; i++ ) {
            slides[ i ].style.display = "none"
        }
        for ( i = 0; i < dots.length; i++ ) {
            dots[ i ].className = dots[ i ].className.replace( " active", "" )
        }
        slides[ slideIndex - 1 ].style.display = "block"
        dots[ slideIndex - 1 ].className += " active"
        captionText.innerHTML = dots[ slideIndex - 1 ].alt
    }

    return sgContent

}

class modalBox {

    constructor () {

        GM_addStyle( `

            #vanilla-presets-modal {
                display: none; /* Hidden by default */
                position: fixed; /* Stay in place */
                z-index: 10000; /* Sit on top */
                padding-top: 10px; /* Location of the box */
                left: 0;
                top: 0;
                width: 100%; /* Full width */
                height: 100%; /* Full height */
                overflow: auto; /* Enable scroll if needed */
                background-color: rgb(0,0,0); /* Fallback color */
                background-color: rgba(0,0,0,0.4); /* Black w/ opacity */
            }

            #modal-content {
                position: relative;
                background-color: black;
                margin: auto;
                padding: 0;
                border: 1px solid #888;
                width: 95%;
                box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2),0 6px 20px 0 rgba(0,0,0,0.19);
                animation-name: animatetop;
                animation-duration: 0.4s
            }

            @keyframes animatetop {
                from {top:-300px; opacity:0}
                to {top:0; opacity:1}
            }

            #close:hover,
            #close:focus {
                color: #000;
                text-decoration: none;
                cursor: pointer;
            }

            #modal-header {

                display: flex;
                justify-content: space-between;
                align-items: center;
                
                position: sticky;
                top: 0px;
                padding: 2px 16px;
                background-color: #5cb85c;
                color: white;
                
            }

            #header-content {
                margin: auto;
            }

            #modal-body {padding: 2px 16px;}

        ` )

        this.modal = generateElements( `
            <div id=vanilla-presets-modal class=modal>
                <div id=modal-content>
                    <div id=modal-header>
                        <h2 id=header-content></h2>
                        <div id=dismiss style='font-size: x-large'>❌</div>
                    </div>
                    <div id=modal-body></div>
                </div>
            </div>
            ` )

        document.body.append( this.modal )
        this.header = this.modal.querySelector( '#header-content' )
        this.body = this.modal.querySelector( '#modal-body' )
        const dismiss = this.modal.querySelector( '#dismiss' )
        dismiss.addEventListener( 'click', () => { this.destroy() } )

    }

    display () {
        this.modal.style.display = 'block'
    }
    headerAddContent ( content ) {
        this.header.append( content )
    }
    bodyAddContent ( content ) {
        this.body.append( content )
    }
    hide () {
        this.modal.style.display = 'none'
    }
    flushHeader () {
        this.modal.querySelector( '#header-content' ).replaceChildren()
    }
    flushBody () {
        this.modal.querySelector( '#modal-body' ).replaceChildren()
    }
    destroy () {
        this.flushHeader()
        this.flushBody()
        this.hide()
    }

}