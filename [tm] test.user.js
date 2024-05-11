// https://example.com
// http://www.blankwebsite.com

( async function () {
    'use strict'

    document.querySelectorAll( `p` ).forEach( item => { item.remove() } )

    const testVariable = GM_getValue( 'testKey' )
    console.log( testVariable )
    const currentTropes = await GM.getValue( 'testKey' )
    currentTropes.push( 'newValue' )
    await GM.setValue( 'testKey', currentTropes )
    console.log( GM_getValue( 'testKey' ) )
























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