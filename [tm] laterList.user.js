// ==UserScript==
// @name         Later-List
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  A sophisticated "read later" application with tabs and containers
// @author       Your Name
// @match        *://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// ==/UserScript==

( function () {
    'use strict';

    // Styles
    const styles = `
        .later-list-popup {
            position: fixed;
            background: #1a1a1a;
            color: #ffffff;
            border: 1px solid #333;
            border-radius: 8px;
            padding: 15px;
            z-index: 9999;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            min-width: 250px;
        }

        .later-list-container {
            background: #262626;
            border-radius: 6px;
            padding: 15px;
            margin: 10px 0;
            min-height: 100px;
        }

        .later-list-tab {
            background: #333;
            padding: 10px;
            margin: 5px;
            border-radius: 4px;
        }

        .later-list-tab.active {
            background: #4a4a4a;
        }

        .later-list-link {
            background: #363636;
            padding: 8px;
            margin: 5px 0;
            border-radius: 4px;
            cursor: move;
            transition: background 0.3s;
        }

        .later-list-link:hover {
            background: #404040;
        }

        .later-list-link.dragging {
            opacity: 0.5;
        }

        .later-list-button {
            background: #4a4a4a;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            margin: 5px;
        }

        .later-list-button:hover {
            background: #5a5a5a;
        }

        .later-list-select {
            background: #333;
            color: white;
            border: 1px solid #4a4a4a;
            padding: 5px;
            border-radius: 4px;
            margin: 5px;
        }

        #later-list-main {
            background: #1a1a1a;
            color: white;
            padding: 20px;
            min-height: 100vh;
        }

        .later-list-controls {
            display: flex;
            gap: 10px;
            margin-bottom: 15px;
            flex-wrap: wrap;
        }

        .later-list-container-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }

        .later-list-tab-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }

        .dragover {
            border: 2px dashed #666;
            background: #2a2a2a;
        }
    `;

    // Initialize default data
    const defaultData = {
        tabs: [
            {
                id: 'tab1',
                name: 'Reading List',
                containers: [
                    {
                        id: 'container1',
                        name: 'Articles',
                        links: [
                            { id: 'link1', url: 'https://example.com/article1', title: 'Sample Article 1' },
                            { id: 'link2', url: 'https://example.com/article2', title: 'Sample Article 2' }
                        ]
                    },
                    {
                        id: 'container2',
                        name: 'Tutorials',
                        links: [
                            { id: 'link3', url: 'https://example.com/tutorial1', title: 'Sample Tutorial 1' }
                        ]
                    }
                ]
            }
        ]
    };

    // Load or initialize data
    let data = GM_getValue( 'laterListData', defaultData );

    // Save data
    function saveData () {
        GM_setValue( 'laterListData', data );
    }

    // Helper functions for managing tabs and containers
    function addTab () {
        const name = prompt( 'Enter tab name:' );
        if ( name ) {
            data.tabs.push( {
                id: 'tab' + Date.now(),
                name: name,
                containers: []
            } );
            saveData();
            renderMainView();
        }
    }

    function deleteTab ( tabId ) {
        if ( confirm( 'Are you sure you want to delete this tab and all its containers?' ) ) {
            data.tabs = data.tabs.filter( tab => tab.id !== tabId );
            saveData();
            renderMainView();
        }
    }

    function renameTab ( tabId ) {
        const tab = data.tabs.find( t => t.id === tabId );
        const newName = prompt( 'Enter new tab name:', tab.name );
        if ( newName ) {
            tab.name = newName;
            saveData();
            renderMainView();
        }
    }

    function addContainer ( tabId ) {
        const name = prompt( 'Enter container name:' );
        if ( name ) {
            const tab = data.tabs.find( t => t.id === tabId );
            tab.containers.push( {
                id: 'container' + Date.now(),
                name: name,
                links: []
            } );
            saveData();
            renderMainView();
        }
    }

    function deleteContainer ( tabId, containerId ) {
        if ( confirm( 'Are you sure you want to delete this container and all its links?' ) ) {
            const tab = data.tabs.find( t => t.id === tabId );
            tab.containers = tab.containers.filter( c => c.id !== containerId );
            saveData();
            renderMainView();
        }
    }

    function renameContainer ( tabId, containerId ) {
        const tab = data.tabs.find( t => t.id === tabId );
        const container = tab.containers.find( c => c.id === containerId );
        const newName = prompt( 'Enter new container name:', container.name );
        if ( newName ) {
            container.name = newName;
            saveData();
            renderMainView();
        }
    }

    // Create popup for saving links
    function createSavePopup ( x, y, linkUrl, linkTitle ) {
        const popup = document.createElement( 'div' );
        popup.className = 'later-list-popup';
        popup.style.left = x + 'px';
        popup.style.top = y + 'px';

        const tabSelect = document.createElement( 'select' );
        tabSelect.className = 'later-list-select';
        data.tabs.forEach( tab => {
            const option = document.createElement( 'option' );
            option.value = tab.id;
            option.textContent = tab.name;
            tabSelect.appendChild( option );
        } );

        const containerSelect = document.createElement( 'select' );
        containerSelect.className = 'later-list-select';

        function updateContainers () {
            const selectedTab = data.tabs.find( t => t.id === tabSelect.value );
            containerSelect.innerHTML = '';
            selectedTab.containers.forEach( container => {
                const option = document.createElement( 'option' );
                option.value = container.id;
                option.textContent = container.name;
                containerSelect.appendChild( option );
            } );
        }

        tabSelect.addEventListener( 'change', updateContainers );
        updateContainers();

        const saveButton = document.createElement( 'button' );
        saveButton.className = 'later-list-button';
        saveButton.textContent = 'Save';
        saveButton.onclick = () => {
            const selectedTab = data.tabs.find( t => t.id === tabSelect.value );
            const selectedContainer = selectedTab.containers.find( c => c.id === containerSelect.value );
            selectedContainer.links.push( {
                id: 'link' + Date.now(),
                url: linkUrl,
                title: linkTitle
            } );
            saveData();
            popup.remove();
        };

        popup.appendChild( tabSelect );
        popup.appendChild( containerSelect );
        popup.appendChild( saveButton );

        document.body.appendChild( popup );
    }

    // Main view initialization
    function initializeMainView () {
        const mainContainer = document.createElement( 'div' );
        mainContainer.id = 'later-list-main';

        // Global controls
        const controls = document.createElement( 'div' );
        controls.className = 'later-list-controls';

        const newTabButton = document.createElement( 'button' );
        newTabButton.className = 'later-list-button';
        newTabButton.textContent = 'New Tab';
        newTabButton.onclick = addTab;

        controls.appendChild( newTabButton );
        mainContainer.appendChild( controls );

        // Tabs
        data.tabs.forEach( tab => {
            const tabElement = document.createElement( 'div' );
            tabElement.className = 'later-list-tab';

            // Tab header with controls
            const tabHeader = document.createElement( 'div' );
            tabHeader.className = 'later-list-tab-header';
            tabHeader.innerHTML = `
                <span>${ tab.name }</span>
                <div>
                    <button class="later-list-button" onclick="return false;">Add Container</button>
                    <button class="later-list-button" onclick="return false;">Rename Tab</button>
                    <button class="later-list-button" onclick="return false;">Delete Tab</button>
                </div>
            `;

            // Add event listeners for tab controls
            const [ addContainerBtn, renameTabBtn, deleteTabBtn ] = tabHeader.querySelectorAll( 'button' );
            addContainerBtn.onclick = () => addContainer( tab.id );
            renameTabBtn.onclick = () => renameTab( tab.id );
            deleteTabBtn.onclick = () => deleteTab( tab.id );

            tabElement.appendChild( tabHeader );

            // Containers
            tab.containers.forEach( container => {
                const containerElement = document.createElement( 'div' );
                containerElement.className = 'later-list-container';
                containerElement.dataset.containerId = container.id;
                containerElement.dataset.tabId = tab.id;

                // Container header with controls
                const containerHeader = document.createElement( 'div' );
                containerHeader.className = 'later-list-container-header';
                containerHeader.innerHTML = `
                    <span>${ container.name }</span>
                    <div>
                        <button class="later-list-button" onclick="return false;">Rename</button>
                        <button class="later-list-button" onclick="return false;">Delete</button>
                    </div>
                `;

                // Add event listeners for container controls
                const [ renameContainerBtn, deleteContainerBtn ] = containerHeader.querySelectorAll( 'button' );
                renameContainerBtn.onclick = () => renameContainer( tab.id, container.id );
                deleteContainerBtn.onclick = () => deleteContainer( tab.id, container.id );

                containerElement.appendChild( containerHeader );

                // Links
                const linksContainer = document.createElement( 'div' );
                linksContainer.className = 'later-list-links';
                container.links.forEach( link => {
                    const linkElement = document.createElement( 'div' );
                    linkElement.className = 'later-list-link';
                    linkElement.draggable = true;
                    linkElement.dataset.linkId = link.id;
                    linkElement.innerHTML = `<a href="${ link.url }" target="_blank">${ link.title }</a>`;

                    // Drag and drop handlers for links
                    linkElement.addEventListener( 'dragstart', e => {
                        e.dataTransfer.setData( 'text/plain', JSON.stringify( {
                            linkId: link.id,
                            sourceContainerId: container.id,
                            sourceTabId: tab.id
                        } ) );
                        linkElement.classList.add( 'dragging' );
                    } );

                    linkElement.addEventListener( 'dragend', () => {
                        linkElement.classList.remove( 'dragging' );
                    } );

                    linksContainer.appendChild( linkElement );
                } );

                containerElement.appendChild( linksContainer );

                // Container drag and drop handlers
                containerElement.addEventListener( 'dragover', e => {
                    e.preventDefault();
                    containerElement.classList.add( 'dragover' );
                } );

                containerElement.addEventListener( 'dragleave', () => {
                    containerElement.classList.remove( 'dragover' );
                } );

                containerElement.addEventListener( 'drop', e => {
                    e.preventDefault();
                    containerElement.classList.remove( 'dragover' );

                    const dropData = JSON.parse( e.dataTransfer.getData( 'text/plain' ) );
                    const sourceTab = data.tabs.find( t => t.id === dropData.sourceTabId );
                    const sourceContainer = sourceTab.containers.find( c => c.id === dropData.sourceContainerId );
                    const targetTab = data.tabs.find( t => t.id === tab.id );
                    const targetContainer = targetTab.containers.find( c => c.id === container.id );

                    // Find and move the link
                    const linkIndex = sourceContainer.links.findIndex( l => l.id === dropData.linkId );
                    if ( linkIndex !== -1 ) {
                        const [ movedLink ] = sourceContainer.links.splice( linkIndex, 1 );
                        targetContainer.links.push( movedLink );
                        saveData();
                        renderMainView();
                    }
                } );

                tabElement.appendChild( containerElement );
            } );

            mainContainer.appendChild( tabElement );
        } );

        // Clear and replace the main view
        const existingMain = document.getElementById( 'later-list-main' );
        if ( existingMain ) {
            existingMain.remove();
        }
        document.body.appendChild( mainContainer );
    }

    // Initialize the script
    if ( window.location.href === 'file:///D:/Mega/IDEs/JavaScript/[tm]%20laterList-view.html' ) {
        GM_addStyle( styles );
        initializeMainView();
    } else {
        // Add context menu handler for other pages
        document.addEventListener( 'contextmenu', function ( e ) {
            if ( e.ctrlKey ) {
                e.preventDefault();
                const link = e.target.closest( 'a' );
                if ( link ) {
                    createSavePopup( e.pageX, e.pageY, link.href, link.textContent );
                }
            }
        } );
    }
} )();