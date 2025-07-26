chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url.startsWith('http')) {
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === 'VISIT_DATA') {
    chrome.storage.local.get({history: []}, (data) => {
      const updatedHistory = [...data.history, message];
      chrome.storage.local.set({ history: updatedHistory });
    });
  }
});
