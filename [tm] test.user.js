// https://example.com
// http://www.blankwebsite.com

( async function () {
    'use strict'

    // ==UserScript==
    // @name         Draggable GUI
    // @namespace    http://tampermonkey.net/
    // @version      0.1
    // @description  Create a draggable GUI with collapse and close functionality
    // @author       Your Name
    // @match        *://*/*
    // @grant        none
    // ==/UserScript==

    // Create the GUI container
    const guiContainer = document.createElement( 'div' )
    guiContainer.style.position = 'fixed'
    guiContainer.style.top = '50px'
    guiContainer.style.left = '50px'
    guiContainer.style.width = '300px'
    guiContainer.style.border = '1px solid #ccc'
    guiContainer.style.backgroundColor = '#f0f0f0'
    guiContainer.style.zIndex = '9999'
    guiContainer.style.boxShadow = '0px 0px 10px rgba(0, 0, 0, 0.1)'

    // Create the header
    const header = document.createElement( 'div' )
    header.style.backgroundColor = '#e0e0e0'
    header.style.padding = '10px'
    header.style.cursor = 'move'
    header.style.display = 'flex'
    header.style.justifyContent = 'space-between'
    header.style.alignItems = 'center'
    header.innerText = 'Basic dialog'

    // Create the collapse button
    const collapseBtn = document.createElement( 'button' )
    collapseBtn.innerHTML = '-'
    collapseBtn.style.marginLeft = 'auto'
    collapseBtn.style.marginRight = '5px'
    collapseBtn.onclick = () => {
        if ( body.style.display === 'none' ) {
            body.style.display = 'block'
            collapseBtn.innerHTML = '-'
        } else {
            body.style.display = 'none'
            collapseBtn.innerHTML = '+'
        }
    }

    // Create the close button
    const closeBtn = document.createElement( 'button' )
    closeBtn.innerHTML = 'x'
    closeBtn.onclick = () => {
        guiContainer.remove()
    }

    // Append buttons to the header
    header.appendChild( collapseBtn )
    header.appendChild( closeBtn )

    // Create the body
    const body = document.createElement( 'div' )
    body.style.padding = '10px'
    body.style.backgroundColor = '#fff'
    body.innerText = 'This is the body of the dialog.'

    // Append header and body to the container
    guiContainer.appendChild( header )
    guiContainer.appendChild( body )

    // Append the container to the document body
    document.body.appendChild( guiContainer )

    // Make the GUI draggable
    let isDragging = false
    let offsetX = 0
    let offsetY = 0

    header.onmousedown = ( e ) => {
        isDragging = true
        offsetX = e.clientX - guiContainer.getBoundingClientRect().left
        offsetY = e.clientY - guiContainer.getBoundingClientRect().top
    }

    document.onmousemove = ( e ) => {
        if ( isDragging ) {
            guiContainer.style.left = `${ e.clientX - offsetX }px`
            guiContainer.style.top = `${ e.clientY - offsetY }px`
        }
    }

    document.onmouseup = () => {
        isDragging = false
    }
























    return
    GM_xmlhttpRequest( {
        method: 'GET',
        url: 'https://l.facebook.com/l.php?u=https%3A%2F%2Fyoutube.com%2F%40KanchuKa%3Fsi%3DJkOj7F_-ZDDGV91G%26fbclid%3DIwZXh0bgNhZW0CMTAAAR35NYxeBVpBO_oWXIS8XGa5jaI_vC41CTm9e0dChJF_5nrY7N6oxoIEJMI_aem_AZMKtC4HfAWojQ67M-NsHh9BA9LjMfCdTvVeAQlB5kbtYnJuMxkhqjrwvf9syjr2bi5PhM-SsTzbUZPgxPjgKMh-&h=AT0WdoWZ6BtJ7QO85SNvaX14AV5JJDppIW1zmMVc6g-vv_mEaZ4G574h9w_QtE2RhLMZ0VrjgKfrTU3EVXLHszCSNSVE0_tNd_mzqbWhA4faWfotFdpnCfRTbgfuci6EUYgz&__tn__=-UK-R&c[0]=AT3ijOV185uVdAuWhslaqXElcLR4Wf0KogZvNEx0LEJ3yOmgtdMjEyqzlrOVDct3fl8gwBDOPPBng0zRy0Nl_eI8OE4yhLbdw8HQ1reBKkUfdPWZX5U2kAsXqjsxQ-rz3mElq1IU681XYJxgd9h02trBZrC4GqDfpWWCc51ojrJfFV-0QP3kdb7rHtUWRdVF5BkzIeWY0g',
        responseType: 'document',
        onload: function ( response ) {
            const resText = response.responseText
            let temp = resText.match( /replace\("(.+?)"/ )[ 1 ]
            temp = `{"":"${ temp }"}`
            console.log( JSON.parse( temp ) )
            console.log( JSON.stringify( JSON.parse( temp ) ) )
        }
    } )

} )()