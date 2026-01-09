// This handles the extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Reload the current tab
  chrome.tabs.reload(tab.id);
  
  // Optional: Show a brief notification (uncomment if desired)
  // chrome.action.setBadgeText({ text: '↻', tabId: tab.id });
  // setTimeout(() => {
  //   chrome.action.setBadgeText({ text: '', tabId: tab.id });
  // }, 500);
});
