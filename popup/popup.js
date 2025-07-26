// popup.js
// TODOS: when starting, track current open tabs
// and store them in history before tracking new tabs

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
                referrer: '',
                timestamp: Date.now()
            };
            updatedHistory.push(message);
        });
        console.log(updatedHistory);
        chrome.storage.local.set({ history: updatedHistory });
        alert("History cleared!");
    });
    chrome.storage.local.set({ active: true }, () => {
        console.log("tracking active");
    });
});

document.getElementById("end").addEventListener("click", () => {
    chrome.storage.local.set({ active: false }, () => {
        console.log("tracking ended");
    });
});