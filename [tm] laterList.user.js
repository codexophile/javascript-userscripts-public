// ==UserScript==
// @name         Read Later App (Dark Theme)
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Save links to read later in tabs and containers with a dark theme
// @match        *://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// ==/UserScript==

( function () {
    'use strict';

    // Initialize storage with example data
    const storage = {
        tabs: GM_getValue( 'tabs', [
            {
                id: 'work',
                name: 'Work',
                containers: [
                    { id: 'projects', name: 'Projects' },
                    { id: 'research', name: 'Research' },
                    { id: 'meetings', name: 'Meeting Notes' }
                ]
            },
            {
                id: 'personal',
                name: 'Personal',
                containers: [
                    { id: 'reading', name: 'Reading List' },
                    { id: 'shopping', name: 'Shopping' },
                    { id: 'recipes', name: 'Recipes' }
                ]
            },
            {
                id: 'learning',
                name: 'Learning',
                containers: [
                    { id: 'tutorials', name: 'Tutorials' },
                    { id: 'courses', name: 'Online Courses' },
                    { id: 'documentation', name: 'Documentation' }
                ]
            }
        ] ),
        links: GM_getValue( 'links', [
            // Work tab links
            { url: 'https://github.com/trending', title: 'GitHub Trending', tabId: 'work', containerId: 'projects', id: 'link1', faviconUrl: 'https://github.com/favicon.ico' },
            { url: 'https://dev.to', title: 'DEV Community', tabId: 'work', containerId: 'research', id: 'link2' },
            { url: 'https://meet.google.com', title: 'Team Sync Notes', tabId: 'work', containerId: 'meetings', id: 'link3' },

            // Personal tab links
            { url: 'https://medium.com', title: 'Medium Articles', tabId: 'personal', containerId: 'reading', id: 'link4' },
            { url: 'https://amazon.com', title: 'Tech Gadgets List', tabId: 'personal', containerId: 'shopping', id: 'link5' },
            { url: 'https://cooking.nytimes.com', title: 'NYT Cooking', tabId: 'personal', containerId: 'recipes', id: 'link6' },

            // Learning tab links
            { url: 'https://www.udemy.com', title: 'JavaScript Course', tabId: 'learning', containerId: 'courses', id: 'link7' },
            { url: 'https://developer.mozilla.org', title: 'MDN Web Docs', tabId: 'learning', containerId: 'documentation', id: 'link8' },
            { url: 'https://www.freecodecamp.org', title: 'FreeCodeCamp', tabId: 'learning', containerId: 'tutorials', id: 'link9' }
        ] )
    };

    // Enhanced styles with tabs and containers
    const styles = `
        .tabs {
            display: flex;
            margin-bottom: 20px;
            border-bottom: 2px solid #444;
            gap: 5px;
        }

        .tab {
            padding: 12px 24px;
            background-color: #2c2c2c;
            color: #fff;
            border: none;
            cursor: pointer;
            border-radius: 5px 5px 0 0;
            transition: all 0.3s ease;
            font-size: 14px;
            font-weight: 500;
        }

        .tab.active {
            background-color: #4CAF50;
            color: white;
            transform: translateY(2px);
        }

        .tab:hover:not(.active) {
            background-color: #444;
        }

        .tab-content {
            display: none;
            padding: 20px;
        }

        .tab-content.active {
            display: block;
        }

        .containers-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }

        .container {
            background-color: #2c2c2c;
            border-radius: 8px;
            padding: 15px;
            min-height: 200px;
        }

        .container h3 {
            color: #4CAF50;
            margin-top: 0;
            padding-bottom: 10px;
            border-bottom: 1px solid #444;
        }

        li > a {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            flex-grow: 1;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .container li:hover .delete-btn { 
            opacity: 1; 
        }

        .delete-btn { 
            opacity: 0;
            cursor: pointer;
            margin-left: 10px;
            transition: opacity 0.3s ease;
        }

        .container li {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px;
            margin: 5px 0;
            background-color: #363636;
            border-radius: 4px;
            transition: background-color 0.3s ease;
        }

        .container li:hover {
            background-color: #404040;
        }

        #main { 
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }

        .read-later-view {
            background-color: #1a1a1a;
            color: #fff;
            font-family: system-ui, -apple-system, sans-serif;
            min-height: 100vh;
        }

        .read-later-view h1 {
            color: #4CAF50;
            text-align: center;
            font-size: 2em;
            margin-bottom: 30px;
        }

        .read-later-view ul {
            list-style-type: none;
            padding: 0;
            margin: 0;
        }

        .read-later-view a {
            color: #FFC107;
            text-decoration: none;
            transition: color 0.3s;
        }
            
        .read-later-view a:hover {
            color: #FFD54F;
        }

        .favicon {
            width: 16px;
            height: 16px;
            margin-right: 8px;
        }

        .empty-container {
            color: #666;
            text-align: center;
            padding: 20px;
            font-style: italic;
        }
    `;

    // Save link function
    function saveLink ( url, title, tabId, containerId ) {
        const faviconUrl = getFaviconUrl();
        const id = generateUniqueString( 10 );
        storage.links.push( { url, title, tabId, containerId, id, faviconUrl } );
        GM_setValue( 'links', storage.links );
        try { addHistoryEntry( url ); }
        catch { fauxHistoryPushState( url ); }
    }

    function removeLink ( linkId ) {
        storage.links = storage.links.filter( link => link.id !== linkId );
        GM_setValue( "links", storage.links );
    }

    // Create dedicated page for viewing saved links with tabs
    function createViewPage () {
        document.body.innerHTML = '';
        document.body.className = 'read-later-view';

        const h1 = document.createElement( 'h1' );
        h1.textContent = 'Read Later App';
        document.body.appendChild( h1 );

        const mainEl = generateElements( `<div id="main"></div>`, document.body );

        // Create tabs container
        const tabsContainer = generateElements( `<div class="tabs"></div>`, mainEl );

        // Create content container
        const contentContainer = generateElements( `<div class="content-container"></div>`, mainEl );

        // Create tabs and their content
        storage.tabs.forEach( ( tab, index ) => {
            // Create tab button
            const tabBtn = generateElements( `<button class="tab">${ tab.name }</button>`, tabsContainer );
            if ( index === 0 ) tabBtn.classList.add( 'active' );

            // Create tab content
            const tabContent = generateElements( `<div class="tab-content"></div>`, contentContainer );
            if ( index === 0 ) tabContent.classList.add( 'active' );

            // Create containers grid
            const containersGrid = generateElements( `<div class="containers-grid"></div>`, tabContent );

            // Create containers
            tab.containers.forEach( container => {
                const containerEl = generateElements( `<div class="container"></div>`, containersGrid );
                generateElements( `<h3>${ container.name }</h3>`, containerEl );

                const ul = document.createElement( 'ul' );
                const containerLinks = storage.links.filter(
                    link => link.tabId === tab.id && link.containerId === container.id
                );

                if ( containerLinks.length === 0 ) {
                    generateElements( `<div class="empty-container">No links saved yet</div>`, containerEl );
                } else {
                    containerLinks.forEach( link => {
                        const li = document.createElement( 'li' );

                        const a = document.createElement( 'a' );
                        a.target = '_blank';
                        a.href = link.url;

                        if ( link.faviconUrl ) {
                            const favicon = generateElements( `<img class="favicon" src="${ link.faviconUrl }">`, a );
                            favicon.onerror = () => favicon.style.display = 'none';
                        }

                        const titleSpan = generateElements( `<span>${ link.title }</span>`, a );

                        li.appendChild( a );

                        const deleteBtn = generateElements( `<div class="delete-btn">✖️</div>`, li );
                        deleteBtn.addEventListener( 'click', () => {
                            removeLink( link.id );
                            li.remove();
                            if ( ul.children.length === 0 ) {
                                containerEl.innerHTML = '<div class="empty-container">No links saved yet</div>';
                            }
                        } );

                        ul.appendChild( li );
                    } );
                }
                containerEl.appendChild( ul );
            } );

            // Add tab click handler
            tabBtn.addEventListener( 'click', () => {
                document.querySelectorAll( '.tab' ).forEach( t => t.classList.remove( 'active' ) );
                document.querySelectorAll( '.tab-content' ).forEach( c => c.classList.remove( 'active' ) );

                tabBtn.classList.add( 'active' );
                tabContent.classList.add( 'active' );
            } );
        } );
    }

    // Register menu command to view saved links
    GM_registerMenuCommand( 'View Saved Links', () => {
        createViewPage();
    } );

    // Initialize the script
    createViewPage();
    GM_addStyle( styles );

    // Context menu popup for saving links
    const popupEl = generateElements( `<div id="popup"></div>`, document.body );
    popupEl.style = `
        display: none;
        position: fixed;
        z-index: 10;
        background: #2c2c2c;
        border-radius: 8px;
        padding: 10px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    `;

    // Dynamically create buttons for each tab and container
    storage.tabs.forEach( tab => {
        const tabContainer = generateElements( `
            <div style="margin-bottom: 10px;">
                <div style="color: #fff; font-weight: bold; margin-bottom: 5px;">${ tab.name }</div>
            </div>
        `, popupEl );

        tab.containers.forEach( container => {
            const btn = generateElements( `
                <button style="
                    display: block;
                    width: 100%;
                    padding: 5px 10px;
                    margin: 2px 0;
                    background: #444;
                    border: none;
                    color: #fff;
                    cursor: pointer;
                    border-radius: 4px;
                ">${ container.name }</button>
            `, tabContainer );

            btn.addEventListener( 'click', () => {
                saveLink( currentLink, currentTitle, tab.id, container.id );
                closePopup();
                alert( 'Link saved!' );
            } );
        } );
    } );

    const btnClose = generateElements( `
        <button style="
            display: block;
            width: 100%;
            padding: 5px 10px;
            margin-top: 10px;
            background: #666;
            border: none;
            color: #fff;
            cursor: pointer;
            border-radius: 4px;
        ">Close</button>
    `, popupEl );

    let currentLink, currentTitle;

    btnClose.addEventListener( 'click', closePopup );

    function closePopup () {
        popupEl.style.display = 'none';
    }

    document.addEventListener( 'contextmenu', ( event ) => {
        const anchorEls = parents( event.target, 'a' );
        if ( !event.ctrlKey ) return;
        if ( event.target.matches( 'a' ) )
            anchorEl = event.target;
        else if ( anchorEls.length )
            anchorEl = anchorEls[ 0 ];
        else
            return;
        event.preventDefault();

        popupEl.style.display = 'block';
        popupEl.style.left = `${ event.x }px`;
        popupEl.style.top = `${ event.y }px`;

        currentLink = anchorEl.href;
        currentTitle = anchorEl.textContent || currentLink;
    } );
} )();