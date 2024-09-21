function dialog ( title = '', contentElement, maxHeight = '300px' ) {
    // Create the GUI container
    const guiContainer = document.createElement( 'div' );
    guiContainer.style.position = 'fixed';
    guiContainer.style.top = '100px';
    guiContainer.style.right = '50px';
    guiContainer.style.width = '300px';
    guiContainer.style.border = '1px solid #ccc';
    guiContainer.style.backgroundColor = '#f0f0f0';
    guiContainer.style.zIndex = '9999';
    guiContainer.style.boxShadow = '0px 0px 10px rgba(0, 0, 0, 0.1)';

    // Create the header
    const header = document.createElement( 'div' );
    header.style.backgroundColor = '#e0e0e0';
    // header.style.padding = '10px';
    header.style.cursor = 'move';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.innerText = title;

    // Create the collapse button
    const collapseBtn = document.createElement( 'button' );
    collapseBtn.id = 'close-btn';
    collapseBtn.innerHTML = '+';
    collapseBtn.style.marginLeft = 'auto';
    collapseBtn.style.marginRight = '5px';
    collapseBtn.onclick = () => {
        if ( body.style.display === 'none' ) {
            body.style.display = 'block';
            collapseBtn.innerHTML = '-';
        } else {
            body.style.display = 'none';
            collapseBtn.innerHTML = '+';
        }
    };

    // Create the close button
    const closeBtn = document.createElement( 'button' );
    closeBtn.innerHTML = 'x';
    closeBtn.onclick = () => {
        guiContainer.remove();
    };

    // Append buttons to the header
    header.appendChild( collapseBtn );
    header.appendChild( closeBtn );

    // Create the body
    const body = document.createElement( 'div' );
    body.style.display = 'none';
    body.style.padding = '10px';
    body.style.backgroundColor = '#fff';
    body.style.maxHeight = maxHeight;
    body.style.overflow = 'auto';
    // adding the content element given by the function parameter
    body.append( contentElement );

    // Append header and body to the container
    guiContainer.appendChild( header );
    guiContainer.appendChild( body );

    // Append the container to the document body
    document.body.appendChild( guiContainer );

    // Make the GUI draggable
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    header.onmousedown = ( e ) => {
        isDragging = true;
        offsetX = e.clientX - guiContainer.getBoundingClientRect().left;
        offsetY = e.clientY - guiContainer.getBoundingClientRect().top;
    };

    document.onmousemove = ( e ) => {
        if ( isDragging ) {
            guiContainer.style.left = `${ e.clientX - offsetX }px`;
            guiContainer.style.top = `${ e.clientY - offsetY }px`;
        }
    };

    document.onmouseup = () => {
        isDragging = false;
    };

    return guiContainer;

}

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
    `);

    tooltipParent.classList.add( 'tooltipParent' );
    const toolTip = generateElements( '<span class=tooltip></span>', null, true );
    tooltipParent.after( toolTip );
    const wrapper = wrap( '<div class=wrapper></div>', tooltipParent, toolTip );
    style( wrapper, `
        position: relative;
        width:    fit-content;
    `);
    toolTip.append( tooltipContent );

}

// function calculateWidthAndExpand ( collapsibleContent )
//? Moved to [fun] vanilla.js


function collapsibleHorizontal ( maxHeight, togglerText = '' ) {

    const { collapsibleStructure, collapsibleToggler, collapsibleContent } = collapsible( togglerText );
    style( collapsibleStructure, `
            max-height: ${ maxHeight };
            display: flex;` );
    collapsibleToggler.style.width = 'unset';
    style( collapsibleContent, `
            padding:     0;
            max-height:  unset;
            width:       0;
            transition:  width 0.2s ease-out;
        `);

    let mouseDownX, mouseUpX, mouseDownY, mouseUpY;
    collapsibleToggler.addEventListener( 'mousedown', ( event ) => {
        mouseDownX = event.clientX;
        mouseDownY = event.clientY;
    } );
    collapsibleToggler.addEventListener( 'mouseup', ( event ) => {
        if ( event.button !== 0 ) return; // 🛑

        mouseUpX = event.clientX;
        mouseUpY = event.clientY;

        if ( mouseDownX === mouseUpX && mouseDownY === mouseUpY ) {

            event.target.classList.toggle( "togglerActive" );
            if ( collapsibleContent.style.width === '0px' ) {
                calculateWidthAndExpand( collapsibleContent );
            } else {
                collapsibleContent.style.width = 0;
            }

        }

    } );

    return { collapsibleStructure, collapsibleToggler, collapsibleContent };


}

function collapsibleVertical () {
    const { collapsibleStructure, collapsibleToggler, collapsibleContent } = collapsible();
    collapsibleToggler.addEventListener( "click", function () {
        this.classList.toggle( "active" );
        if ( collapsibleContent.style.maxHeight ) {
            collapsibleContent.style.maxHeight = null;
        } else {
            collapsibleContent.style.maxHeight = collapsibleContent.scrollHeight + "px";
        }
    } );

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

            .togglerActive, #collapsible-toggler:hover {
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

        `;
    GM_addStyle( css );


    const collapsibleStructure = generateElements( /*html*/`
                <div id=collapsibleStructure'>
                    <button id="collapsible-toggler" > ${ togglerText }</button>
                    <div id=collapsibleContent>
                    </div>
                <div>
        `, null, true );
    document.body.prepend( collapsibleStructure );

    const collapsibleContent = document.querySelector( `#collapsibleContent` );
    const collapsibleToggler = document.querySelector( `#collapsible-toggler` );

    return { collapsibleStructure, collapsibleToggler, collapsibleContent };

}

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
    ` );

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
            `);
    document.body.append( sgContent );

    const fullImgContainer = document.querySelector( `#fullImgCont` );
    const row = document.querySelector( `.row` );
    for ( const item in arguments ) {
        fullImgContainer.append( generateElements( /*html*/`
            <div class=mySlides>
                <div class=numbertext>${ +item + 1 } / ${ arguments.length }</div>
                <img src=${ arguments[ item ] } style='width:100%'>
            </div>
        `) );
        row.append( generateElements( /*html*/`
            <div class=column>
                <img class='demo cursor' src=${ arguments[ item ] } style='width:100%'>
            </div>
            `) );
    }

    document.querySelector( `.prev` ).addEventListener( 'click', () => { plusSlides( -1 ); } );
    document.querySelector( `.next` ).addEventListener( 'click', () => { plusSlides( 1 ); } );
    document.querySelectorAll( `.demo` ).forEach( item => {
        item.addEventListener( 'click', ( event ) => {
            const element = event.target.parentNode;
            const index = Array.from( element.parentNode.children ).indexOf( element ) + 1;
            currentSlide( index );
        } );
    } );


    let slideIndex = 1;
    showSlides( slideIndex );

    function plusSlides ( n ) {
        showSlides( slideIndex += n );
    }

    function currentSlide ( n ) {
        showSlides( slideIndex = n );
    }

    function showSlides ( n ) {
        let i;
        let slides = document.getElementsByClassName( "mySlides" );
        let dots = document.getElementsByClassName( "demo" );
        let captionText = document.getElementById( "caption" );
        if ( n > slides.length ) { slideIndex = 1; }
        if ( n < 1 ) { slideIndex = slides.length; }
        for ( i = 0; i < slides.length; i++ ) {
            slides[ i ].style.display = "none";
        }
        for ( i = 0; i < dots.length; i++ ) {
            dots[ i ].className = dots[ i ].className.replace( " active", "" );
        }
        slides[ slideIndex - 1 ].style.display = "block";
        dots[ slideIndex - 1 ].className += " active";
        captionText.innerHTML = dots[ slideIndex - 1 ].alt;
    }

    return sgContent;

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

        ` );

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
            ` );

        document.body.append( this.modal );
        this.header = this.modal.querySelector( '#header-content' );
        this.body = this.modal.querySelector( '#modal-body' );
        const dismiss = this.modal.querySelector( '#dismiss' );
        dismiss.addEventListener( 'click', () => { this.destroy(); } );

    }

    display () {
        this.modal.style.display = 'block';
    }
    headerAddContent ( content ) {
        this.header.append( content );
    }
    bodyAddContent ( content ) {
        this.body.append( content );
    }
    hide () {
        this.modal.style.display = 'none';
    }
    flushHeader () {
        this.modal.querySelector( '#header-content' ).replaceChildren();
    }
    flushBody () {
        this.modal.querySelector( '#modal-body' ).replaceChildren();
    }
    destroy () {
        this.flushHeader();
        this.flushBody();
        this.hide();
    }

}

class ModalBox {
    constructor ( options = {} ) {
        this.options = {
            width: options.width || '95%',
            backgroundColor: options.backgroundColor || '#ffffff',
            headerColor: options.headerColor || '#5cb85c',
            headerTextColor: options.headerTextColor || '#ffffff',
            closeButtonColor: options.closeButtonColor || '#ffffff',
            animation: options.animation !== undefined ? options.animation : true,
            closeOnEscape: options.closeOnEscape !== undefined ? options.closeOnEscape : true,
            closeOnOutsideClick: options.closeOnOutsideClick !== undefined ? options.closeOnOutsideClick : true,
        };

        this.createStyles();
        this.createModal();
        this.setupEventListeners();
    }

    createStyles () {
        const styles = `
            .vanilla-modal {
                display: none;
                position: fixed;
                z-index: 10000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                overflow: auto;
                background-color: rgba(0,0,0,0.4);
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .vanilla-modal.show {
                opacity: 1;
            }

            .vanilla-modal-content {
                position: relative;
                background-color: ${ this.options.backgroundColor };
                margin: 50px auto;
                padding: 0;
                border-radius: 8px;
                width: ${ this.options.width };
                box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                transform: translateY(-50px);
                transition: transform 0.3s ease;
            }

            .vanilla-modal.show .vanilla-modal-content {
                transform: translateY(0);
            }

            .vanilla-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                background-color: ${ this.options.headerColor };
                color: ${ this.options.headerTextColor };
                border-top-left-radius: 8px;
                border-top-right-radius: 8px;
            }

            .vanilla-modal-title {
                margin: 0;
                font-size: 1.25rem;
                font-weight: 600;
            }

            .vanilla-modal-close {
                color: ${ this.options.closeButtonColor };
                font-size: 28px;
                font-weight: bold;
                cursor: pointer;
                transition: color 0.2s ease;
            }

            .vanilla-modal-close:hover {
                color: #000;
            }

            .vanilla-modal-body {
                padding: 20px;
                max-height: 70vh;
                overflow-y: auto;
            }
        `;

        GM_addStyle( styles );
    }

    createModal () {

        this.modal = generateElements( `
            <div class="vanilla-modal-content">
                <div class="vanilla-modal-header">
                    <h2 class="vanilla-modal-title"></h2>
                    <span class="vanilla-modal-close">&times;</span>
                </div>
                <div class="vanilla-modal-body"></div>
            </div>
            `);
        this.modal.className = 'vanilla-modal';
        document.body.appendChild( this.modal );

        this.titleElement = this.modal.querySelector( '.vanilla-modal-title' );
        this.bodyElement = this.modal.querySelector( '.vanilla-modal-body' );
        this.closeButton = this.modal.querySelector( '.vanilla-modal-close' );
    }

    setupEventListeners () {
        this.closeButton.addEventListener( 'click', () => this.destroy() );

        if ( this.options.closeOnOutsideClick ) {
            this.modal.addEventListener( 'click', ( e ) => {
                if ( e.target === this.modal ) this.hide();
            } );
        }

        if ( this.options.closeOnEscape ) {
            document.addEventListener( 'keydown', ( e ) => {
                if ( e.key === 'Escape' && this.isVisible() ) this.hide();
            } );
        }
    }

    setTitle ( title ) {
        if ( typeof title === 'string' ) {
            this.titleElement.textContent = title;
        }
        // else {
        else if ( content instanceof Node ) {
            this.titleElement.appendChild( title );
        }
    }

    setContent ( content ) {
        if ( typeof content === 'string' ) {
            this.bodyElement.innerHTML = content;
        } else if ( content instanceof Node ) {
            let policy = trustedTypes.createPolicy( 'default', {
                createHTML: ( input ) => input
            } );
            this.bodyElement.innerHTML = policy.createHTML( '' );

            this.bodyElement.appendChild( content );
        }
    }

    show () {
        this.modal.style.display = 'block';
        setTimeout( () => this.modal.classList.add( 'show' ), 10 );
    }

    hide () {
        this.modal.classList.remove( 'show' );
        setTimeout( () => {
            this.modal.style.display = 'none';
        }, 300 );
    }

    isVisible () {
        return this.modal.style.display === 'block';
    }

    destroy () {
        document.body.removeChild( this.modal );
    }
}

// Usage example:
// const modal = new ModalBox({
//     width: '80%',
//     backgroundColor: '#f0f0f0',
//     headerColor: '#3498db',
//     animation: true,
//     closeOnEscape: true,
//     closeOnOutsideClick: true
// });
//
// modal.setTitle('Welcome');
// modal.setContent('<p>This is a customizable modal box!</p>');
// modal.show();