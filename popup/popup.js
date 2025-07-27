// popup.js

// just links to the visualization page
document.getElementById("open").addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("visualization/visualization.html") });
});

// buttons to start and stop tracking
document.getElementById("start").addEventListener("click", () => { 
    // replace current history with current open tabs
    chrome.tabs.query({}, function(tabs) {
        let updatedHistory = [];
        tabs.forEach(tab => {
            console.log(`Tracking tab: ${tab.url}`);
            const message = {
                type: 'VISIT_DATA',
                url: tab.url,
                title: tab.title,
                referrer: '',
                timestamp: Date.now()
            };
            updatedHistory.push(message);
        });
        console.log(updatedHistory);
        chrome.storage.local.set({ history: updatedHistory });
        document.getElementById("count").textContent = `Pages Tracked: ${updatedHistory.length}`;
        alert("History cleared!");
    });
    chrome.storage.local.set({ active: true }, () => {
        console.log("tracking active");
        document.getElementById("start").disabled = true;
        document.getElementById("end").disabled = false;
    });
    
});

document.getElementById("end").addEventListener("click", () => {
    chrome.storage.local.set({ active: false }, () => {
        console.log("tracking ended");
        document.getElementById("start").disabled = false;
        document.getElementById("end").disabled = true;
    });
});

document.addEventListener('DOMContentLoaded', () => {
    // get the current history count
    chrome.storage.local.get(["history"], function(result) {
        const history = result.history || [];
        document.getElementById("count").textContent = `Pages Tracked: ${history.length}`;
    });

    // get the current active state
    chrome.storage.local.get(["active"], function(result) {
        const active = result.active || false;
        document.getElementById("start").disabled = active;
        document.getElementById("end").disabled = !active;
    });
});