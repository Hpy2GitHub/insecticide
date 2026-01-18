// Manage extension state and context
class ExtensionBackground {
  constructor() {
    this.context = {
      selectedText: null,
      selectedTextTimestamp: null,
      session: null,
      hasGeminiNano: false,
      availability: null,
      isInitializing: false
    };
    this.init();
  }

  async init() {
    // Check for AI API availability
    await this.checkAICapabilities();
    
    // Setup context menu if available
    this.setupContextMenu();
    
    // Listen for messages from content scripts and popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async
    });
  }

  async checkAICapabilities() {
    // Check if LanguageModel API is available (current Chrome API)
    if (typeof LanguageModel === 'undefined') {
      console.warn("LanguageModel API not available");
      this.context.hasGeminiNano = false;
      return;
    }

    try {
      const availability = await LanguageModel.availability();
      console.log("AI Availability:", availability);
      
      this.context.availability = availability;
      this.context.hasGeminiNano = (availability === "available");
      
      // Initialize session if available
      if (this.context.hasGeminiNano && !this.context.session) {
        await this.initializeSession();
      } else if (availability === "downloadable") {
        console.log("Gemini Nano model needs to be downloaded");
      } else if (availability === "downloading") {
        console.log("Gemini Nano model is downloading");
      }
      
    } catch (error) {
      console.error("Failed to check AI availability:", error);
      this.context.hasGeminiNano = false;
    }
  }

  async initializeSession() {
    if (this.context.isInitializing) return;
    
    this.context.isInitializing = true;
    try {
      this.context.session = await LanguageModel.create({
        systemPrompt: "You are a helpful AI assistant. Provide clear, concise, and accurate responses.",
        temperature: 0.7,
        topK: 40
      });
      console.log("AI session initialized successfully");
    } catch (error) {
      console.error("Failed to initialize AI session:", error);
      this.context.session = null;
    } finally {
      this.context.isInitializing = false;
    }
  }

  setupContextMenu() {
    // Create context menu for text selection
    chrome.contextMenus.create({
      id: "ask-gemini",
      title: "Ask Gemini Nano",
      contexts: ["selection"]
    });

    chrome.contextMenus.onClicked.addListener(async (info, tab) => {
      if (info.menuItemId === "ask-gemini" && info.selectionText) {
        // Store the selected text with timestamp
        this.context.selectedText = info.selectionText;
        this.context.selectedTextTimestamp = Date.now();
        
        // Open side panel
        try {
          await chrome.sidePanel.open({ tabId: tab.id });
        } catch (error) {
          console.error("Failed to open side panel:", error);
        }
      }
    });
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.action) {
        case "generateText":
          await this.generateText(message.prompt, sendResponse);
          break;
          
        case "checkAvailability":
          // Re-check availability in case it changed
          await this.checkAICapabilities();
          
          sendResponse({
            available: this.context.hasGeminiNano,
            hasSession: !!this.context.session,
            downloading: this.context.availability === "downloading",
            downloadable: this.context.availability === "downloadable"
          });
          break;
          
        case "openSidePanel":
          // Store selected text if provided
          if (message.text) {
            this.context.selectedText = message.text;
            this.context.selectedTextTimestamp = Date.now();
          }
          
          if (sender.tab?.id) {
            await chrome.sidePanel.open({ tabId: sender.tab.id });
            sendResponse({ success: true });
          } else {
            sendResponse({ success: false, error: "No tab ID available" });
          }
          break;
          
        case "getContext":
          // Return context and clear it (one-time use)
          const contextData = {
            text: this.context.selectedText,
            timestamp: this.context.selectedTextTimestamp
          };
          
          // Clear context after retrieval
          this.context.selectedText = null;
          this.context.selectedTextTimestamp = null;
          
          sendResponse(contextData);
          break;
          
        default:
          sendResponse({ error: "Unknown action" });
      }
    } catch (error) {
      console.error("Error handling message:", error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async generateText(prompt, callback) {
    try {
      // Ensure session exists
      if (!this.context.session) {
        if (this.context.hasGeminiNano) {
          await this.initializeSession();
        } else {
          throw new Error("AI model not available");
        }
      }

      if (!this.context.session) {
        throw new Error("Failed to initialize AI session");
      }

      // Use prompt() method (not generate())
      const response = await this.context.session.prompt(prompt);

      callback({ success: true, response });
    } catch (error) {
      console.error("Background generation error:", error);
      callback({ success: false, error: error.message });
    }
  }

  // Cleanup on extension unload
  async cleanup() {
    if (this.context.session) {
      try {
        await this.context.session.destroy();
      } catch (error) {
        console.error("Error destroying session:", error);
      }
    }
  }
}

// Initialize
const background = new ExtensionBackground();

// Handle extension unload
self.addEventListener('unload', () => {
  background.cleanup();
});
