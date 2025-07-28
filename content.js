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
        timestamp: Date.now(),
        favicon: document.querySelector("link[rel*='icon']") ? document.querySelector("link[rel*='icon']").href : null,
    });

    hasSentVisit = true;
}

// Check if this tab is active
function checkAndSendVisit() {
    console.log("Checking if tab is active...");
    setTimeout(() => {
        try {
            chrome.runtime.sendMessage({ type: 'IS_TAB_ACTIVE' }, (response) => {
                if (chrome.runtime.lastError) {
                    console.warn("Message failed:", chrome.runtime.lastError.message);
                    return;
                }

                if (response && response.active) {
                    if (document.visibilityState === 'visible') {
                        sendVisitData();
                    } else {
                        const onVisible = () => {
                            if (document.visibilityState === 'visible') {
                                sendVisitData();
                                document.removeEventListener('visibilitychange', onVisible);
                            }
                        };
                        document.addEventListener('visibilitychange', onVisible);
                    }
                }
            });
        } catch (err) {
            console.error("Error sending message:", err);
        }
    }, 100);  // small delay to let service worker initialize
}

checkAndSendVisit();

// For handling SPAs...
let lastUrl = location.href;

// Wait for the page to fully load in before sending visit data
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

// Check for URL changes and send visit data when it changes
const checkUrlChange = () => {
    if (location.href !== lastUrl) {
        waitForPageToSettle(() => {
            chrome.runtime.sendMessage({
                type: 'VISIT_DATA',
                url: location.href,
                referrer: lastUrl,
                title: document.title,
                timestamp: Date.now(),
                favicon: document.querySelector("link[rel*='icon']") ? document.querySelector("link[rel*='icon']").href : null,
            });
        });
        lastUrl = location.href;
    }
};

setInterval(checkUrlChange, 200); // every 200ms (for the short form content degens)
