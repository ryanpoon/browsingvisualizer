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

// Function to capture a screenshot of the current tab
function tryCaptureScreenshot(retries = 5, delay = 300, callback) {
    chrome.tabs.captureVisibleTab(null, { format: "png" }, function (dataUrl) {
        if (chrome.runtime.lastError) {
            console.warn("Retrying screenshot:", chrome.runtime.lastError.message);
            if (retries > 0) {
                setTimeout(() => {
                    tryCaptureScreenshot(retries - 1, delay, callback);
                }, delay);
            } else {
                console.error("Failed to capture screenshot after retries:", chrome.runtime.lastError.message);
                callback(null); 
            }
        } else {
            callback(dataUrl);
        }
    });
}


// Listen for messages from content.js to store visit data and screenshot the
// current page
chrome.runtime.onMessage.addListener((message, sender) => {
    chrome.storage.local.get({active: false}, (data) => {
        if (message.type === 'IS_TAB_ACTIVE') {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const isActiveTab = tabs.length && sender.tab && tabs[0].id === sender.tab.id;
                sendResponse({ active: data.active && isActiveTab });
            });
            return true; 
        }
        if (data.active && message.type === 'VISIT_DATA') {
            console.log("Received url:", message.url);
            tryCaptureScreenshot(5, 300, function (dataUrl) {
                message.screenshot = dataUrl; // add screenshot to message
                console.log("Captured screenshot for:", message.url, dataUrl);
                chrome.storage.local.get({history: []}, (data) => {
                    const updatedHistory = [...data.history, message];
                    chrome.storage.local.set({ history: updatedHistory });
                });
            });            
        }
    });
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


