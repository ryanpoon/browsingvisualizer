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

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        checkAndSendVisit();  // attempt sending again when the tab is seen
    }
});


// For handling SPAs...
let lastUrl = location.href;

// Function to wait for the page to settle before sending data
function waitForPageToSettle(callback, maxWait = 5000, settleDelay = 300) {
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

    const start = Date.now();

    function check() {
        const now = Date.now();
        if (now - lastChange >= settleDelay || now - start >= maxWait) {
            observer.disconnect();
            callback();
        } else {
            setTimeout(check, 100);
        }
    }

    check();
}


// Check for URL changes and send visit data when it changes
const checkUrlChange = () => {
    if (location.href !== lastUrl) {
        const newUrl = location.href;
        const referrer = lastUrl;

        waitForPageToSettle(() => {
            chrome.runtime.sendMessage({
                type: 'VISIT_DATA',
                url: newUrl,
                referrer: referrer,
                title: document.title,
                timestamp: Date.now(),
                favicon: document.querySelector("link[rel*='icon']")?.href || null,
            });
        });

        lastUrl = newUrl;
    }
};


setInterval(checkUrlChange, 200); // every 200ms (for the short form content degens)


// Google search specific handling
if (location.hostname.includes("google.") && location.pathname === "/search") {
    document.addEventListener("click", (e) => {
        const link = e.target.closest("a");
        if (!link || !link.href.startsWith("http")) return;
        chrome.runtime.sendMessage({
            type: "SEARCH_CLICK",
            searchUrl: location.href,
            targetUrl: link.href,
            timestamp: Date.now(),
        });
    }, true); 
}

