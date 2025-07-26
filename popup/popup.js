document.getElementById("open").addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("visualization/visualization.html") });
});
document.getElementById("clear").addEventListener("click", () => {
    chrome.storage.local.set({ history: [] }, () => {
        alert("History cleared!");
    });
});