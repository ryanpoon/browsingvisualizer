chrome.runtime.sendMessage({
  type: 'VISIT_DATA',
  url: window.location.href,
  referrer: document.referrer,
  timestamp: Date.now()
});
