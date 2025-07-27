// content.js
// This script runs on every page load to track visit data to 
// populate the history

// send visit data to background script on page load
chrome.runtime.sendMessage({
    type: 'VISIT_DATA',
    url: window.location.href,
    referrer: document.referrer,
    title: document.title,
    timestamp: Date.now()
});


// for handling SPAs...
let lastUrl = location.href;

const checkUrlChange = () => {
    if (location.href !== lastUrl) {
        chrome.runtime.sendMessage({
            type: 'VISIT_DATA',
            url: location.href,
            referrer: lastUrl,
            title: document.title,
            timestamp: Date.now()
        });
        lastUrl = location.href;
    }
};

setInterval(checkUrlChange, 200); // every 200ms (for the short form content degens)
