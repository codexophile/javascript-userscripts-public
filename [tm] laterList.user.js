// ==UserScript==
// @name         Read Later App
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Save and organize links for later reading
// @match        file:///*laterList-view.html
// @grant        GM_setValue
// @grant        GM_getValue
// @require      https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js
// ==/UserScript==

( function () {
    'use strict';

    // Sample data structure
    const DEFAULT_DATA = {
        tabs: [
            {
                id: 'tab-1',
                name: 'Programming',
                containers: [
                    {
                        id: 'container-1',
                        name: 'JavaScript',
                        links: [
                            { id: 'link-1', title: 'MDN Web Docs', url: 'https://developer.mozilla.org' },
                            { id: 'link-2', title: 'JavaScript.info', url: 'https://javascript.info' }
                        ]
                    },
                    {
                        id: 'container-2',
                        name: 'Python',
                        links: [
                            { id: 'link-3', title: 'Python Documentation', url: 'https://docs.python.org' }
                        ]
                    }
                ]
            },
            {
                id: 'tab-2',
                name: 'Reading List',
                containers: [
                    {
                        id: 'container-3',
                        name: 'Articles',
                        links: [
                            { id: 'link-4', title: 'Medium', url: 'https://medium.com' }
                        ]
                    }
                ]
            }
        ]
    };

    // Styles
    const styles = `
        :root {
            --bg-primary: #1a1b1e;
            --bg-secondary: #2c2d31;
            --text-primary: #ffffff;
            --text-secondary: #a0a0a0;
            --accent: #6366f1;
            --border: #404040;
            --hover: #3f3f46;
        }

        body {
            margin: 0;
            padding: 20px;
            background: var(--bg-primary);
            color: var(--text-primary);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        #app {
            max-width: 1200px;
            margin: 0 auto;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            padding: 10px;
            background: var(--bg-secondary);
            border-radius: 8px;
            overflow-x: auto;
        }

        .tab {
            padding: 8px 16px;
            background: var(--bg-primary);
            border: 1px solid var(--border);
            border-radius: 6px;
            color: var(--text-primary);
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            white-space: nowrap;
        }

        .tab.active {
            background: var(--accent);
        }

        .containers {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }

        .container {
            background: var(--bg-secondary);
            border-radius: 8px;
            border: 1px solid var(--border);
        }

        .container-header {
            padding: 12px;
            border-bottom: 1px solid var(--border);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .container-content {
            min-height: 100px;
            padding: 12px;
        }

        .link {
            padding: 8px 12px;
            margin-bottom: 8px;
            background: var(--bg-primary);
            border-radius: 6px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: move;
        }

        .link a {
            color: var(--text-primary);
            text-decoration: none;
        }

        .link a:hover {
            text-decoration: underline;
        }

        .btn {
            padding: 6px 12px;
            background: var(--bg-primary);
            border: 1px solid var(--border);
            border-radius: 4px;
            color: var(--text-primary);
            cursor: pointer;
        }

        .btn:hover {
            background: var(--hover);
        }

        .btn-delete {
            padding: 4px 8px;
            color: #ff4444;
        }

        .btn-primary {
            background: var(--accent);
            border-color: var(--accent);
        }

        .sortable-ghost {
            opacity: 0.5;
        }
    `;

    class ReadLaterApp {
        constructor () {
            this.data = GM_getValue( 'readLaterData', DEFAULT_DATA );
            this.activeTab = this.data.tabs[ 0 ].id;
            this.init();
        }

        init () {
            this.injectStyles();
            this.render();
            this.initSortable();
        }

        injectStyles () {
            const styleEl = document.createElement( 'style' );
            styleEl.textContent = styles;
            document.head.appendChild( styleEl );
        }

        saveData () {
            GM_setValue( 'readLaterData', this.data );
        }

        render () {
            const app = document.body;
            app.innerHTML = this.getTemplate();
            this.attachEventListeners();
        }

        getTemplate () {
            return `
                <div class="header">
                    <h1>Read Later</h1>
                    <button class="btn btn-primary" id="addTab">New Tab</button>
                </div>
                <div class="tabs">
                    ${ this.data.tabs.map( tab => `
                        <div class="tab ${ tab.id === this.activeTab ? 'active' : '' }" data-tab-id="${ tab.id }">
                            <span>${ tab.name }</span>
                            ${ this.data.tabs.length > 1 ? `
                                <button class="btn btn-delete" data-delete-tab="${ tab.id }">×</button>
                            ` : '' }
                        </div>
                    `).join( '' ) }
                </div>
                <div class="containers">
                    ${ this.getCurrentTab().containers.map( container => `
                        <div class="container">
                            <div class="container-header">
                                <span class="container-name" data-container-id="${ container.id }">${ container.name }</span>
                                <button class="btn btn-delete" data-delete-container="${ container.id }">×</button>
                            </div>
                            <div class="container-content" data-container-id="${ container.id }">
                                ${ container.links.map( link => `
                                    <div class="link" data-link-id="${ link.id }">
                                        <a href="${ link.url }" target="_blank">${ link.title }</a>
                                        <button class="btn btn-delete" data-delete-link="${ link.id }">×</button>
                                    </div>
                                `).join( '' ) }
                            </div>
                        </div>
                    `).join( '' ) }
                    <button class="btn" id="addContainer">Add Container</button>
                </div>
            `;
        }

        getCurrentTab () {
            return this.data.tabs.find( tab => tab.id === this.activeTab );
        }

        attachEventListeners () {
            // Tab events
            document.querySelectorAll( '.tab' ).forEach( tab => {
                tab.addEventListener( 'click', ( e ) => {
                    const tabId = tab.dataset.tabId;
                    if ( tabId ) {
                        this.activeTab = tabId;
                        this.render();
                        this.initSortable();
                    }
                } );
            } );

            // Delete buttons
            document.addEventListener( 'click', ( e ) => {
                const deleteTab = e.target.dataset.deleteTab;
                const deleteContainer = e.target.dataset.deleteContainer;
                const deleteLink = e.target.dataset.deleteLink;

                if ( deleteTab ) this.deleteTab( deleteTab );
                if ( deleteContainer ) this.deleteContainer( deleteContainer );
                if ( deleteLink ) this.deleteLink( deleteLink );
            } );

            // Add new items
            document.getElementById( 'addTab' )?.addEventListener( 'click', () => this.addTab() );
            document.getElementById( 'addContainer' )?.addEventListener( 'click', () => this.addContainer() );

            // Container name edit
            document.querySelectorAll( '.container-name' ).forEach( nameEl => {
                nameEl.addEventListener( 'dblclick', () => {
                    const containerId = nameEl.dataset.containerId;
                    this.renameContainer( containerId );
                } );
            } );
        }

        initSortable () {
            document.querySelectorAll( '.container-content' ).forEach( container => {
                new Sortable( container, {
                    group: 'links',
                    animation: 150,
                    ghostClass: 'sortable-ghost',
                    onEnd: ( evt ) => {
                        this.handleLinkMove( evt );
                    }
                } );
            } );
        }

        handleLinkMove ( evt ) {
            const linkId = evt.item.dataset.linkId;
            const toContainerId = evt.to.dataset.containerId;
            const fromContainerId = evt.from.dataset.containerId;

            if ( fromContainerId === toContainerId ) return;

            const fromContainer = this.getCurrentTab().containers.find( c => c.id === fromContainerId );
            const toContainer = this.getCurrentTab().containers.find( c => c.id === toContainerId );

            const linkIndex = fromContainer.links.findIndex( l => l.id === linkId );
            if ( linkIndex === -1 ) return;

            const [ link ] = fromContainer.links.splice( linkIndex, 1 );
            toContainer.links.splice( evt.newIndex, 0, link );

            this.saveData();
        }

        addTab () {
            const name = prompt( 'Enter tab name:' );
            if ( !name ) return;

            const newTab = {
                id: 'tab-' + Date.now(),
                name,
                containers: []
            };

            this.data.tabs.push( newTab );
            this.activeTab = newTab.id;
            this.saveData();
            this.render();
        }

        deleteTab ( tabId ) {
            if ( !confirm( 'Are you sure you want to delete this tab?' ) ) return;

            this.data.tabs = this.data.tabs.filter( tab => tab.id !== tabId );
            if ( this.activeTab === tabId ) {
                this.activeTab = this.data.tabs[ 0 ].id;
            }
            this.saveData();
            this.render();
        }

        addContainer () {
            const name = prompt( 'Enter container name:' );
            if ( !name ) return;

            const currentTab = this.getCurrentTab();
            currentTab.containers.push( {
                id: 'container-' + Date.now(),
                name,
                links: []
            } );

            this.saveData();
            this.render();
            this.initSortable();
        }

        deleteContainer ( containerId ) {
            if ( !confirm( 'Are you sure you want to delete this container?' ) ) return;

            const currentTab = this.getCurrentTab();
            currentTab.containers = currentTab.containers.filter( c => c.id !== containerId );
            this.saveData();
            this.render();
        }

        renameContainer ( containerId ) {
            const container = this.getCurrentTab().containers.find( c => c.id === containerId );
            const newName = prompt( 'Enter new name:', container.name );
            if ( !newName ) return;

            container.name = newName;
            this.saveData();
            this.render();
        }

        deleteLink ( linkId ) {
            if ( !confirm( 'Are you sure you want to delete this link?' ) ) return;

            const currentTab = this.getCurrentTab();
            currentTab.containers.forEach( container => {
                container.links = container.links.filter( link => link.id !== linkId );
            } );
            this.saveData();
            this.render();
        }
    }

    // Initialize the app
    new ReadLaterApp();
} )();