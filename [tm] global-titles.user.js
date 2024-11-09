( function () {
    'use strict';

    // Configuration object for easy customization
    const CONFIG = {
        position: {
            bottom: '0',
            right: '0'
        },
        style: {
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            color: '#333',
            padding: '3px 3px',
            borderRadius: '4px 0 0 0',
            maxWidth: '50vw',
            fontSize: '12px',
            fontWeight: 'bold',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(5px)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
        }
    };

    class TitleDisplay {
        constructor ( options = {} ) {
            this.options = { ...CONFIG, ...options };
            this.element = null;
            this.observer = null;
            this.init();
        }

        init () {
            this.createDisplayElement();
            this.setupObserver();
            this.setupHoverEffect();
            this.setupKeyboardControls();
        }

        createDisplayElement () {
            this.element = document.createElement( 'div' );
            this.element.classList.add( 'title-display' );
            this.updateContent();
            this.applyStyles();
            document.body.appendChild( this.element );
        }

        applyStyles () {
            Object.assign( this.element.style, {
                position: 'fixed',
                zIndex: '9999',
                ...this.options.position,
                ...this.options.style
            } );
        }

        updateContent () {
            this.element.textContent = document.title;
            this.element.setAttribute( 'title', `
                ${ document.title }

Press ctrl to toggle visibility
            ` );
        }

        setupObserver () {
            this.observer = new MutationObserver( () => {
                this.updateContent();
                this.animateUpdate();
            } );

            const titleElement = document.querySelector( 'title' );
            if ( titleElement ) {
                this.observer.observe( titleElement, {
                    childList: true,
                    subtree: true,
                    characterData: true
                } );
            }
        }

        setupKeyboardControls () {
            this.isVisible = true;
            document.addEventListener( 'keydown', ( event ) => {
                if ( event.key === 'Alt' ) {
                    this.toggleVisibility();
                }
            } );
        }

        toggleVisibility () {
            this.isVisible = !this.isVisible;
            Object.assign( this.element.style, {
                transform: this.isVisible ? 'translateX(0)' : 'translateX(100%)',
                transition: 'transform 0.3s ease'
            } );
        }

        setupHoverEffect () {
            this.element.addEventListener( 'mouseenter', () => {
                Object.assign( this.element.style, {
                    backgroundColor: 'rgba(255, 255, 255, 1)',
                    boxShadow: '0 0 15px rgba(0, 0, 0, 0.15)',
                    transform: 'translateY(-2px)'
                } );
            } );

            this.element.addEventListener( 'mouseleave', () => {
                Object.assign( this.element.style, {
                    backgroundColor: this.options.style.backgroundColor,
                    boxShadow: this.options.style.boxShadow,
                    transform: 'translateY(0)'
                } );
            } );
        }

        animateUpdate () {
            // Remove any existing animation
            this.element.style.animation = 'none';
            this.element.offsetHeight; // Trigger reflow

            // Create a wrapper for the content
            const currentWidth = this.element.offsetWidth;
            const currentHeight = this.element.offsetHeight;

            // Apply new animation
            this.element.style.animation = 'pulseSize 0.3s ease-in-out';

            // Calculate target size based on content
            requestAnimationFrame( () => {
                const targetWidth = this.element.offsetWidth;
                const targetHeight = this.element.offsetHeight;

                // Update animation properties
                document.documentElement.style.setProperty( '--start-width', `${ currentWidth }px` );
                document.documentElement.style.setProperty( '--target-width', `${ targetWidth }px` );
                document.documentElement.style.setProperty( '--start-height', `${ currentHeight }px` );
                document.documentElement.style.setProperty( '--target-height', `${ targetHeight }px` );
            } );
        }

        destroy () {
            if ( this.observer ) {
                this.observer.disconnect();
            }
            if ( this.element && this.element.parentNode ) {
                this.element.parentNode.removeChild( this.element );
            }
        }
    }

    // Add animation keyframes to document
    const style = document.createElement( 'style' );
    style.textContent = `
  :root {
    --start-width: 0px;
    --target-width: 0px;
    --start-height: 0px;
    --target-height: 0px;
  }
  
  @keyframes pulseSize {
    0% {
      transform: scale(0.95);
    }
    50% {
      transform: scale(1.02);
    }
    100% {
      transform: scale(1);
    }
  }
`;
    document.head.appendChild( style );

    // Usage:
    const titleDisplay = new TitleDisplay();

    // Optional: Custom configuration
    // const titleDisplay = new TitleDisplay({
    //   position: { top: '0', left: '0' },
    //   style: {
    //     backgroundColor: '#000',
    //     color: '#fff'
    //   }
    // });

} )();