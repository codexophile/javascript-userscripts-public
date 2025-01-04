( function () {
  'use strict';

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
    },
    buttonStyle: {
      position: 'absolute',
      left: '0',
      top: '0',
      bottom: '0',
      width: '20px',
      backgroundColor: 'inherit',
      border: 'none',
      borderRight: '1px solid rgba(0, 0, 0, 0.1)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  };

  class TitleDisplay {
    constructor ( options = {} ) {
      this.options = { ...CONFIG, ...options };
      this.element = null;
      this.observer = null;
      this.isVisible = true;
      this.init();
    }

    init () {
      this.createDisplayElement();
      this.setupObserver();
      this.setupHoverEffect();
    }

    createDisplayElement () {
      this.element = generateElements( `<div class="title-display"></div>` );

      // Create toggle button
      this.toggleButton = generateElements( `<button type="button">▶</button>` );
      Object.assign( this.toggleButton.style, this.options.buttonStyle );

      // Create container for content
      this.contentContainer = generateElements( `<div style="margin-left: 24px;"></div>` );
      this.linkElement = generateElements( `<a target="_blank"></a>`, this.contentContainer );
      this.linkElement.style.color = 'inherit';
      this.linkElement.style.textDecoration = 'none';

      this.element.appendChild( this.toggleButton );
      this.element.appendChild( this.contentContainer );

      this.updateContent();
      this.applyStyles();
      this.setupToggleButton();
      document.body.appendChild( this.element );
    }

    setupToggleButton () {
      this.toggleButton.addEventListener( 'click', () => {
        this.toggleVisibility();
      } );
    }

    toggleVisibility () {
      this.isVisible = !this.isVisible;
      const translateX = this.isVisible ? '0' : `calc(100% - ${ this.toggleButton.offsetWidth }px)`;
      this.element.style.transform = `translateX(${ translateX })`;
      this.toggleButton.textContent = this.isVisible ? '▶' : '◀';
    }

    applyStyles () {
      Object.assign( this.element.style, {
        position: 'fixed',
        zIndex: '9999',
        transition: 'transform 0.3s ease',
        ...this.options.position,
        ...this.options.style
      } );
    }

    updateContent () {
      this.linkElement.textContent = document.title;
      this.linkElement.href = location.href;
      this.element.setAttribute( 'title', `
        ${ document.title }
        ${ location.href }
      `);
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

    setupHoverEffect () {
      this.element.addEventListener( 'mouseenter', () => {
        if ( this.isVisible ) {
          Object.assign( this.element.style, {
            backgroundColor: 'rgba(255, 255, 255, 1)',
            boxShadow: '0 0 15px rgba(0, 0, 0, 0.15)',
            transform: 'translateY(-2px)'
          } );
        }
      } );

      this.element.addEventListener( 'mouseleave', () => {
        if ( this.isVisible ) {
          Object.assign( this.element.style, {
            backgroundColor: this.options.style.backgroundColor,
            boxShadow: this.options.style.boxShadow,
            transform: 'translateY(0)'
          } );
        }
      } );
    }

    animateUpdate () {
      if ( !this.isVisible ) return;

      this.element.style.animation = 'none';
      this.element.offsetHeight;
      this.element.style.animation = 'pulseSize 0.3s ease-in-out';

      requestAnimationFrame( () => {
        const targetWidth = this.element.offsetWidth;
        const targetHeight = this.element.offsetHeight;

        document.documentElement.style.setProperty( '--start-width', `${ targetWidth }px` );
        document.documentElement.style.setProperty( '--target-width', `${ targetWidth }px` );
        document.documentElement.style.setProperty( '--start-height', `${ targetHeight }px` );
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

  const titleDisplay = new TitleDisplay();
} )();