// background.js
// This script runs in the background to handle page load events and 
// store visit data

// Listen for tab updates to track page loads
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url.startsWith('http')) {
        chrome.scripting.executeScript({
            target: { tabId },
            files: ['content.js']
        });
    }
});

// Listen for messages from content.js to store visit data
chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.type === 'VISIT_DATA') {
        chrome.storage.local.get({history: []}, (data) => {
            const updatedHistory = [...data.history, message];
            chrome.storage.local.set({ history: updatedHistory });
        });
    }
});


// potential todo: track tab movement, for now just worry about page loads
// chrome.tabs.onActivated.addListener(function(activeInfo) {
//     console.log(activeInfo);
// });

