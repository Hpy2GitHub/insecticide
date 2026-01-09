// Firefox uses 'browser' namespace instead of 'chrome'
// This will work in both browsers
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// This handles the extension icon click
browserAPI.action.onClicked.addListener((tab) => {
  // Reload the current tab
  browserAPI.tabs.reload(tab.id);
  
  // Optional: Show a brief notification (uncomment if desired)
  // browserAPI.action.setBadgeText({ text: '↻', tabId: tab.id });
  // setTimeout(() => {
  //   browserAPI.action.setBadgeText({ text: '', tabId: tab.id });
  // }, 500);
});
