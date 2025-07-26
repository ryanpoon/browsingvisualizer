// content.js
// This script runs on every page load to track visit data to 
// populate the history
chrome.runtime.sendMessage({
    type: 'VISIT_DATA',
    url: window.location.href,
    referrer: document.referrer,
    timestamp: Date.now()
});
