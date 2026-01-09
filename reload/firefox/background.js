const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Set initial badge when extension loads
browserAPI.runtime.onInstalled.addListener(() => {
  setReloaderBadge();
});

// Handle icon click with visual feedback
browserAPI.action.onClicked.addListener(async (tab) => {
  // Show loading state
  await browserAPI.action.setBadgeText({ text: '↻', tabId: tab.id });
  await browserAPI.action.setBadgeBackgroundColor({ 
    color: '#FFA500', // Orange
    tabId: tab.id 
  });
  
  // Reload the tab
  await browserAPI.tabs.reload(tab.id);
  
  // Reset badge after 2 seconds
  setTimeout(async () => {
    await browserAPI.action.setBadgeText({ text: '', tabId: tab.id });
  }, 2000);
});

// Set the badge for all tabs on extension load
async function setReloaderBadge() {
  const tabs = await browserAPI.tabs.query({});
  for (const tab of tabs) {
    await browserAPI.action.setBadgeText({ text: '↻', tabId: tab.id });
    await browserAPI.action.setBadgeBackgroundColor({ 
      color: '#4CAF50', // Green
      tabId: tab.id 
    });
  }
}

// Update badge when new tab is created
browserAPI.tabs.onCreated.addListener(async (tab) => {
  await browserAPI.action.setBadgeText({ text: '↻', tabId: tab.id });
  await browserAPI.action.setBadgeBackgroundColor({ 
    color: '#4CAF50',
    tabId: tab.id 
  });
});
