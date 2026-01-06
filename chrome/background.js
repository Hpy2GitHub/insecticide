// Track active state per tab
const activeTabs = {};

// Update icon and title
function updateIcon(tabId, isActive) {
  const iconPath = isActive ? {
    16: 'icons/icon-active-16.png',
    32: 'icons/icon-active-32.png',
    48: 'icons/icon-active-48.png',
    128: 'icons/icon-active-128.png'
  } : {
    16: 'icons/icon16.png',
    32: 'icons/icon32.png',
    48: 'icons/icon48.png',
    128: 'icons/icon128.png'
  };
  
  chrome.action.setIcon({ tabId, path: iconPath }).catch(err => 
    console.error("Failed to set icon:", err)
  );
  
  chrome.action.setTitle({
    tabId,
    title: isActive ? "Insecticide: ON (Ctrl+Shift+U)" : "Insecticide: OFF (Ctrl+Shift+U)"
  }).catch(err => 
    console.error("Failed to set title:", err)
  );
}

// Toggle insecticide for a tab
async function toggleInsecticide(tabId) {
  try {
    const currentActive = activeTabs[tabId] || false;
    const newActive = !currentActive;
    
    // Update state
    activeTabs[tabId] = newActive;
    
    // Save to storage for persistence
    await chrome.storage.local.set({ 
      [`insecticideActive_${tabId}`]: newActive 
    });
    
    updateIcon(tabId, newActive);
    
    // Send message to content script
    await chrome.tabs.sendMessage(tabId, {
      action: 'toggleInsecticide',
      isActive: newActive
    });
    
    console.log(`Insecticide ${newActive ? 'ON' : 'OFF'} for tab ${tabId}`);
  } catch (error) {
    console.error("Toggle error:", error);
  }
}

// FIXED: Sync state when switching tabs
async function syncTabState(tabId) {
  try {
    // Check if we think this tab is active
    const shouldBeActive = activeTabs[tabId] || false;
    
    // Update icon to match stored state
    updateIcon(tabId, shouldBeActive);
    
    // Also verify with content script
    try {
      const response = await chrome.tabs.sendMessage(tabId, {
        action: 'checkState'
      });
      
      if (response && response.isActive !== shouldBeActive) {
        // State mismatch - sync them
        console.log(`Syncing state for tab ${tabId}: background=${shouldBeActive}, content=${response.isActive}`);
        activeTabs[tabId] = response.isActive;
        updateIcon(tabId, response.isActive);
      }
    } catch (error) {
      // Content script not ready yet
      console.log(`Content script not ready on tab ${tabId}`);
    }
  } catch (error) {
    console.error("Error syncing tab state:", error);
  }
}

// Listen for toolbar button clicks
chrome.action.onClicked.addListener(async (tab) => {
  await toggleInsecticide(tab.id);
});

// Listen for keyboard shortcut
chrome.commands.onCommand.addListener(async (command) => {
  console.log(`Command received: "${command}"`);
  
  if (command === "toggle-insecticide") {
    console.log("Toggle-insecticide command triggered!");
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      console.log("Active tabs:", tabs);
      
      if (tabs[0]) {
        console.log(`Toggling insecticide for tab ${tabs[0].id}`);
        await toggleInsecticide(tabs[0].id);
      } else {
        console.error("No active tab found");
      }
    } catch (error) {
      console.error("Keyboard shortcut error:", error);
    }
  } else {
    console.log(`Unknown command: ${command}`);
  }
});

// Clean up when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  delete activeTabs[tabId];
  chrome.storage.local.remove(`insecticideActive_${tabId}`);
  console.log(`Cleaned up state for closed tab ${tabId}`);
});

// FIXED: Update icon and sync state when switching tabs
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  console.log(`Switched to tab ${activeInfo.tabId}`);
  await syncTabState(activeInfo.tabId);
});

// Restore state when page loads or reloads
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    try {
      // Check storage for this tab's previous state
      const result = await chrome.storage.local.get(`insecticideActive_${tabId}`);
      const wasActive = result[`insecticideActive_${tabId}`] || false;
      
      console.log(`Tab ${tabId} loaded, previous state: ${wasActive}`);
      
      if (wasActive) {
        // Restore active state
        activeTabs[tabId] = true;
        updateIcon(tabId, true);
        
        // Wait a bit for content script to be ready, then activate
        setTimeout(async () => {
          try {
            await chrome.tabs.sendMessage(tabId, {
              action: 'toggleInsecticide',
              isActive: true
            });
            console.log(`Restored insecticide state on tab ${tabId}`);
          } catch (error) {
            console.log(`Could not restore state on tab ${tabId}:`, error);
          }
        }, 500);
      } else {
        // Make sure icon shows inactive state
        activeTabs[tabId] = false;
        updateIcon(tabId, false);
      }
    } catch (error) {
      console.error("Error restoring state:", error);
    }
  }
});

// FIXED: Load all stored states on startup
chrome.runtime.onStartup.addListener(async () => {
  console.log("Extension started, loading saved states");
  try {
    const allStorage = await chrome.storage.local.get(null);
    for (const key in allStorage) {
      if (key.startsWith('insecticideActive_')) {
        const tabId = parseInt(key.replace('insecticideActive_', ''));
        if (allStorage[key]) {
          activeTabs[tabId] = true;
          console.log(`Loaded saved state for tab ${tabId}: active`);
        }
      }
    }
  } catch (error) {
    console.error("Error loading saved states:", error);
  }
});

console.log("Insecticide background script loaded");

// Test: List all registered commands on startup
chrome.commands.getAll().then(commands => {
  console.log("Registered commands:", commands);
  commands.forEach(cmd => {
    console.log(`  - ${cmd.name}: ${cmd.shortcut || 'no shortcut'}`);
  });
}).catch(err => {
  console.error("Failed to get commands:", err);
});
