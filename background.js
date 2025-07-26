// background.js
// This script runs in the background to handle page load events and 
// store visit data

// Listen for tab updates to track page loads
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    chrome.storage.local.get({active: false}, (data) => {
        // console.log(data.active);
        if (data.active && changeInfo.status === 'complete' && tab.url.startsWith('http')) {
            chrome.scripting.executeScript({
                target: { tabId },
                files: ['content.js']
            });
        }
    });
});

// Listen for messages from content.js to store visit data
chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.type === 'VISIT_DATA') {
        console.log("Received url:", message.url);
        chrome.storage.local.get({history: []}, (data) => {
            const updatedHistory = [...data.history, message];
            chrome.storage.local.set({ history: updatedHistory });
        });
    }
});

// Listen for changes in the active state to update the icon
const stateToIcon = {
    "active": "icons/track_active.png",
    "inactive": "icons/track_inactive.png",
};

// update the icon based on state
function updateIcon(active) {
    if (active) {
        iconPath = stateToIcon.active;
    } else {
        iconPath = stateToIcon.inactive;
    }
    chrome.action.setIcon({ path: iconPath });
}

// on extension load, read state from storage
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get("active", (data) => {
        updateIcon(data.active);
    });
});

// listen for changes in storage to update the icon
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes.active) {
        updateIcon(changes.active.newValue);
    }
});

// potential todo: track tab movement, for now just worry about page loads
// chrome.tabs.onActivated.addListener(function(activeInfo) {
//     console.log(activeInfo);
// });

