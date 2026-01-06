// Track active state per tab
const activeTabs = {};

// Function to update the icon and title
function updateIcon(tabId, isActive) {
  const iconPath = isActive ? {
    48: 'icons/icon48-active.png'
  } : {
    48: 'icons/icon48.png'
  };
  
  browser.browserAction.setIcon({
    tabId: tabId,
    path: iconPath
  });
  
  browser.browserAction.setTitle({
    tabId: tabId,
    title: isActive ? "Pesticide: ON (Ctrl+Shift+P)" : "Pesticide: OFF (Ctrl+Shift+P)"
  });
}

// Function to toggle pesticide for a tab
async function togglePesticide(tabId) {
  // Toggle state
  const currentActive = activeTabs[tabId] || false;
  const newActive = !currentActive;
  
  // Store state
  activeTabs[tabId] = newActive;
  
  // Update icon
  updateIcon(tabId, newActive);
  
  // Send message to content script
  try {
    await browser.tabs.sendMessage(tabId, {
      action: 'togglePesticide',
      isActive: newActive
    });
    console.log(`Pesticide ${newActive ? 'activated' : 'deactivated'} for tab ${tabId}`);
  } catch (error) {
    console.log("Could not send message, injecting script...", error);
    
    // Try to inject the content script
    await browser.tabs.executeScript(tabId, {
      file: "content.js"
    });
    
    // Try sending message again
    setTimeout(async () => {
      try {
        await browser.tabs.sendMessage(tabId, {
          action: 'togglePesticide',
          isActive: newActive
        });
      } catch (e) {
        console.error("Failed to activate pesticide:", e);
      }
    }, 500);
  }
}

// Listen for browser action clicks
browser.browserAction.onClicked.addListener(async (tab) => {
  await togglePesticide(tab.id);
});

// Listen for keyboard shortcut (if defined in manifest)
browser.commands.onCommand.addListener(async (command) => {
  if (command === "toggle-pesticide") {
    // Get active tab
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
      await togglePesticide(tabs[0].id);
    }
  }
});

// Clean up when tab is closed
browser.tabs.onRemoved.addListener((tabId) => {
  delete activeTabs[tabId];
});

// Update icon when switching tabs
browser.tabs.onActivated.addListener(async (activeInfo) => {
  const isActive = activeTabs[activeInfo.tabId] || false;
  updateIcon(activeInfo.tabId, isActive);
});
