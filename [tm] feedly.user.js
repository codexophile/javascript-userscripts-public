'use strict'

let blackList = [ 'suwa hamuwa', 'Rasa Madura', 'Manasika Saukkhya', 'Wawamu Rakemu', 'Rasawindana paya',
    'paththara sirasthala', 'Swayan Rakiya Athwala', 'Waiddhya Hamuwa', 'Mahapolowa', 'Lottery Draw',
    'Nirogi Segment', 'rividina arunella', 'Dinanajeevitha', 'Ehipassiko', 'රතු ඉර', 'ඉර', 'Mahajana Dinaya',
    'මහජන දිනය', 'business in brief', 'Suba Dawasak Paththara', '| Paththara |', 'Suba Dawasak | Paththra',
    'Sinhala News', 'Saara sankalpa', 'සුළිය', 'Siyatha Kathuwakiya', 'ආදරණීය ජීවිතය', 'Jeewamana Mahaa Ravana',
    'Vinadi 20 |', 'supreme chef', 'COFFEE STUDIO WITH MUDITHA AND ISHI', 'ඉවුම් - පිහුම්', 'Hada Nim Nadaya',
    'හදනිම් නාදය', 'adrushyamanaya', 'Waiddhya Sakachchawa', 'Waiddya Hamuwa', 'වෛද්‍ය හමුව', 'රූපලාවන්‍ය',
    'back to school', 'podi waddo', 'රසට රසක්', 'Lyrical', 'Sathiya Obata', 'කරට කර', 'Rasin Rasa', 'රසින් රස',
    'නීතිය ඔබයි', 'ගෙවතු වගාව', 'සොදුරු කතාබහ', 'Soduru Kathabha', 'Iwum Pihum', 'Athkam Nirmana', 'Gewathu Wagawa',
    'Diwiyata Sawiyak', 'ඉවුම් පිහුම්', 'Alawantha Widiya', 'Api Wawamu', 'අත්කම්', 'නීතියයි', 'ranbimata arunella',
    'siwmansala', 'saddharma', 'Nugasewana', 'Nugasevana', 'miyasi saradha', 'Paara Kiyana Tharuka', 'Today @ 9',
    'ජීවමාන මහා රාවණා', 'Adaraneeya Jeewithaya', 'RanbimataArunella', 'වින්දනීය උදෑසන', 'bushaltestelle',
    'tharupirire', 'Derana Aruna', 'Siyatha Paththare', 'Industry Sri Lanka', 'Connect Sri Lanka', 'GUWAN SIHINAYA',
    'Gamata Cricket', 'smart poddo', 'ගුවන් සිහිනය', 'mihikatha dinuwo', 'sith asaka sakmana', 'pro +', 'a park',
    'ranmasu uyana', 'samma dhitti', 'dream villa', 'irida ayubowan', 'govibimata', 'japanese language',
    'දෙමටගොඩ සවස', 'Triplep', '12 horawa', 'bushalt', 'threethal', 'bus halt', 'aluth katha', 'turning point',
    'check mate', 'newsfeed', 'Raga Suthra', 'full audio', 'good morning Sri Lanka', 'game rasa', 'ambayaluwo' ]

waitFor( '#collapsibleContent' ).then( ( el ) => {

    const itemQuery = '.StreamPage article:has([href*="www.youtube.com"])'

    generateElements( '<button id=loadAllSbsInlineBtn>🎞️</button>', el ).addEventListener( 'click', () => {
        document.querySelectorAll( itemQuery ).forEach( article => {
            loadSbInline( article )
        } )
        let observer = new MutationObserver( ( mutations ) => {
            mutations.forEach( mutation => {
                mutation.addedNodes.forEach( async item => {
                    if ( item.nodeType === 1 && item.matches( itemQuery ) ) {
                        loadSbInline( item )
                    }
                } )
            } )
        } )
        observer.observe( document.body, { childList: true, subtree: true } )

        async function loadSbInline ( item ) {
            const horSbParent = generateElements( '<div class=horSbParent style="width: -webkit-fill-available"></div>' )
            item.after( horSbParent )
            const linkToVid = item.querySelector( 'a' ).href
            const ytHtml = await GMXmlHttpReqResponse( linkToVid )
            const { allUrls, trueNoOfSlots, samplingFq } = generateAllYouTubeSbUrls( ytHtml )
            if ( !allUrls ) {
                console.log( 'error', item )
                const errorDiv = generateElements( '<div id=errorDiv>storyboard not available</div>', horSbParent )
                style( errorDiv, `
                    color:     red;
                    font-size: 20px;
                `)
                return
            }
            storyboardHorizontal( horSbParent, 5, 5, linkToVid, null, null, trueNoOfSlots, ...allUrls )

        }

    } )

    generateElements( '<button id=showFiltered>⚗️</button>', el ).addEventListener( 'click', () => {
        modalBoxFilteredItems.display()
    } )

    calculateWidthAndExpand( el )
} )

let observer = new MutationObserver( () => {

    if ( !document.querySelector( '#count-display' ) )
        document.querySelector( '.MarkAsReadButton' )?.parentElement.prepend( $countDisplay[ 0 ] )

    $( `article.entry.cards:has([href*='/www.youtube.com/'])` ).each( function () {
        const $item = $( this )
        if ( $item.find( '.peek-button' ).length ) return // 🛑
        const $peekButton = $( `<button class=peek-button>🫣</button>` )
        $item.find( '.CardLayout' ).append( $peekButton )
        $peekButton[ 0 ].style = 'position: absolute; left: 5px; top: 5px; z-index: 1;'

        $peekButton.on( 'click', async () => {

            const videoLink = $item.find( '.EntryTitle > a' )
            const videoUrl = videoLink[ 0 ].href

            const ytHtml = await GMXmlHttpReqResponse( videoUrl )
            const { allUrls, trueNoOfSlots, samplingFq } = generateAllYouTubeSbUrls( ytHtml )

            const headerLink = generateElements(
                `<a href=${ videoUrl } target=_blank> ${ videoLink.text() } </a>` )
            const modalBody = generateElements( '<div></div>' )
            modalBoxEl.destroy()
            modalBoxEl.headerAddContent( headerLink )
            modalBoxEl.bodyAddContent( modalBody )

            await storyboard( modalBody, 5, 5, videoUrl, null, null, trueNoOfSlots, ...allUrls )
            modalBoxEl.display()

        } )
    } )

    const $titleEls = $( `:is(.EntryTitle, .EntrySummary):not(.done)` )
    $titleEls.each( function () {

        let $el = $( this )
        let itemTitle = $el.text()
        // $el.attr( 'title', itemTitle )

        let $item = $el.closest( 'article' )
        blackList.forEach( phrase => {
            if ( itemTitle.toLowerCase().includes( phrase.toLowerCase() ) ) {
                $item.css( `border-color`, `red` )
                let $readButton = $item.find( '[aria-label="Mark as Read"]' )
                $readButton.click()
                // $item.hide()
                filteredItemsContainer.append( $item[ 0 ] )

                // $item.remove()
                filteredCount++
                $countDisplay.find( '#count-text' ).text( filteredCount )
            }
        } )

        $( '#feedlyPageHolderFX' ).scroll( function () { console.log( 'x' ) } )

        $el.addClass( 'done' )
    } )



} )
observer.observe( document.body, { childList: true, subtree: true } )

const modalBoxEl = new modalBox()
const modalBoxFilteredItems = new modalBox()
const filteredItemsContainer = generateElements( '<div></div>' )
modalBoxFilteredItems.bodyAddContent( filteredItemsContainer )

GM_addStyle( `
    article:hover .peek-button { display: inline;}
    .peek-button { display: none;}
` )

let filteredCount = 0

$countDisplay = $( `
    <div id=count-display style='display: flex;'>
        <div>⚗️</div>
        <div id=count-text>0</div>
    </div>
` )