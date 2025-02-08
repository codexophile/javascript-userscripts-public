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
      whiteSpace: 'nowrap'
    },
    buttonStyle: {
      backgroundColor: 'inherit',
      border: 'none',
      borderRight: '1px solid rgba(0, 0, 0, 0.1)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '20px',
      height: '100%'
    }
  };

  class TitleDisplay {
    constructor ( options = {} ) {
      this.options = { ...CONFIG, ...options };
      this.element = null;
      this.observer = null;
      this.isVisible = true;
      this.pageLoadTime = new Date();
      this.updateInterval = null;
      this.init();
    }

    init () {
      this.createDisplayElement();
      this.setupObserver();
      this.setupHoverEffect();
      this.startTimeUpdates();
    }

    createDisplayElement () {
      this.element = document.createElement( 'div' );
      this.element.className = 'title-display';

      // Create buttons container
      const buttonsContainer = document.createElement( 'div' );
      buttonsContainer.style.display = 'flex';
      buttonsContainer.style.position = 'absolute';
      buttonsContainer.style.left = '0';
      buttonsContainer.style.top = '0';
      buttonsContainer.style.bottom = '0';

      // Toggle button
      this.toggleButton = this.createButton( '▶', () => this.toggleVisibility() );

      // Copy title button
      this.copyTitleButton = this.createButton( 'T', () => this.copyToClipboard( document.title, 'title' ) );
      this.copyTitleButton.title = 'Copy title';

      // Copy URL button
      this.copyUrlButton = this.createButton( 'U', () => this.copyToClipboard( location.href, 'URL' ) );
      this.copyUrlButton.title = 'Copy URL';

      buttonsContainer.appendChild( this.toggleButton );
      buttonsContainer.appendChild( this.copyTitleButton );
      buttonsContainer.appendChild( this.copyUrlButton );

      // Create container for content
      this.contentContainer = document.createElement( 'div' );
      this.contentContainer.style.marginLeft = '64px'; // Adjusted for three buttons
      this.contentContainer.style.display = 'flex';
      this.contentContainer.style.flexDirection = 'column';
      this.contentContainer.style.gap = '2px';

      // Title link
      this.linkElement = document.createElement( 'a' );
      this.linkElement.target = '_blank';
      this.linkElement.style.color = 'inherit';
      this.linkElement.style.textDecoration = 'none';

      // Time element
      this.timeElement = document.createElement( 'div' );
      this.timeElement.style.fontSize = '10px';
      this.timeElement.style.opacity = '0.8';

      this.contentContainer.appendChild( this.linkElement );
      this.contentContainer.appendChild( this.timeElement );

      this.element.appendChild( buttonsContainer );
      this.element.appendChild( this.contentContainer );

      this.updateContent();
      this.applyStyles();
      document.body.appendChild( this.element );
    }

    createButton ( text, onClick ) {
      const button = document.createElement( 'button' );
      button.type = 'button';
      button.textContent = text;
      Object.assign( button.style, this.options.buttonStyle );
      button.addEventListener( 'click', onClick );
      return button;
    }

    async copyToClipboard ( text, type ) {
      try {
        await navigator.clipboard.writeText( text );
        this.showCopyAnimation( type );
      } catch ( err ) {
        console.error( 'Failed to copy:', err );
      }
    }

    showCopyAnimation ( type ) {
      // Animate the element
      requestAnimationFrame( () => {
        this.element.style.animation = 'none';
        this.element.offsetHeight; // Trigger reflow
        this.element.style.animation = 'copyPulse 0.5s ease-in-out';
      } );

      // Show temporary success indicator
      const originalText = type === 'title' ? this.copyTitleButton.textContent : this.copyUrlButton.textContent;
      const button = type === 'title' ? this.copyTitleButton : this.copyUrlButton;
      button.textContent = '✓';
      button.style.color = '#4CAF50';

      setTimeout( () => {
        button.textContent = originalText;
        button.style.color = 'inherit';
      }, 1000 );
    }

    startTimeUpdates () {
      this.updateTimeDisplay();
      this.updateInterval = setInterval( () => {
        this.updateTimeDisplay();
      }, 1000 );
    }

    updateTimeDisplay () {
      this.timeElement.textContent = `Open: ${ timeSince( this.pageLoadTime, true ) }`;
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
      requestAnimationFrame( () => {
        this.element.style.animation = 'none';
        this.element.offsetHeight; // Trigger reflow
        this.element.style.animation = 'pulseSize 0.3s ease-in-out';
      } );
    }

    destroy () {
      if ( this.observer ) {
        this.observer.disconnect();
      }
      if ( this.updateInterval ) {
        clearInterval( this.updateInterval );
      }
      if ( this.element && this.element.parentNode ) {
        this.element.parentNode.removeChild( this.element );
      }
    }
  }

  const style = document.createElement( 'style' );
  style.textContent = `
    .title-display {
      animation: none;
    }
    
    @keyframes pulseSize {
      0% { transform: scale(0.95); }
      50% { transform: scale(1.02); }
      100% { transform: scale(1); }
    }
    
    @keyframes copyPulse {
      0% { background-color: rgba(255, 255, 255, 0.9); }
      50% { background-color: rgba(76, 175, 80, 0.2); }
      100% { background-color: rgba(255, 255, 255, 0.9); }
    }
  `;
  document.head.appendChild( style );

  const titleDisplay = new TitleDisplay();
} )();