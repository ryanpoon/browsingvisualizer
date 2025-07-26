document.getElementById("open").addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("visualization/visualization.html") });
});
document.getElementById("start").addEventListener("click", () => {
    chrome.storage.local.set({ history: [] }, () => {
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