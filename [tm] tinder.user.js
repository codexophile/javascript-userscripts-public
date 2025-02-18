( async function () {
  'use strict';

  //* Adding the filter button
  const collapsibleEl = await Collapsible();
  collapsibleEl.addButton( '👁️', null, filter );

  function filter () {

    // Get all message list items
    const messageItems = document.querySelectorAll( '.messageListItem' );

    // Filter unread messages
    const unreadMessages = Array.from( messageItems ).filter( item => {
      // Check if the item has the 'messageListItem--isNew' class
      return item.classList.contains( 'messageListItem--isNew' ) ||
        item.querySelector( '[aria-label="New Message"]' ) !== null;
    } );

    // Filter read messages
    const readMessages = Array.from( messageItems ).filter( item => {
      // Check if the item does NOT have the 'messageListItem--isNew' class or the new message indicator
      return !item.classList.contains( 'messageListItem--isNew' ) &&
        item.querySelector( '[aria-label="New Message"]' ) === null;
    } );

    // Hide read messages
    readMessages.forEach( item => item.style.display = 'none' );

  }

} )();
