// content.js
// This script runs on every page load to track visit data to 
// populate the history

// send visit data to background script once tab is active
let hasSentVisit = false;

function sendVisitData() {
    if (hasSentVisit) return;

    chrome.runtime.sendMessage({
        type: 'VISIT_DATA',
        url: window.location.href,
        referrer: document.referrer,
        title: document.title,
        timestamp: Date.now()
    });

    hasSentVisit = true;
}

// check if this tab is active
chrome.runtime.sendMessage({ type: 'IS_TAB_ACTIVE' }, (response) => {
    if (response && response.active) {
        sendVisitData();
    } else {
        // wait for tab to become active before sending data
        document.addEventListener('visibilitychange', () => {
            if (!hasSentVisit && document.visibilityState === 'visible') {
                sendVisitData();
            }
        });
    }
});

// for handling SPAs...
let lastUrl = location.href;

// wait for the page to fully load in before sending visit data
function waitForPageToSettle(callback, maxWait = 5000, settleDelay = 300) {
    let timeout;
    let lastChange = Date.now();
    const observer = new MutationObserver(() => {
        lastChange = Date.now();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true
    });

    function check() {
        const now = Date.now();
        if (now - lastChange >= settleDelay || now - start >= maxWait) {
            observer.disconnect();
            callback();
        } else {
            timeout = setTimeout(check, 100);
        }
    }

    const start = Date.now();
    check();
}


const checkUrlChange = () => {
    if (location.href !== lastUrl) {
        waitForPageToSettle(() => {
            chrome.runtime.sendMessage({
                type: 'VISIT_DATA',
                url: location.href,
                referrer: lastUrl,
                title: document.title,
                timestamp: Date.now()
            });
        });
        lastUrl = location.href;
    }
};

setInterval(checkUrlChange, 200); // every 200ms (for the short form content degens)
