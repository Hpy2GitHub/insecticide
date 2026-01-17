// Inject Gemini Nano assistant into web pages
class ContentAssistant {
  constructor() {
    this.selectedText = '';
    this.floatingButton = null;
    this.removeTimeout = null;
    this.selectionTimeout = null;
    this.setupSelectionListener();
    this.injectAssistantButton();
  }

  setupSelectionListener() {
    // Debounced text selection listener
    document.addEventListener('mouseup', (e) => {
      // Clear previous timeout
      if (this.selectionTimeout) {
        clearTimeout(this.selectionTimeout);
      }

      // Debounce selection handling
      this.selectionTimeout = setTimeout(() => {
        const selection = window.getSelection().toString().trim();
        if (selection && selection.length > 0 && selection.length < 5000) {
          this.selectedText = selection;
          this.showFloatingButton(e.pageX, e.pageY);
        } else if (!selection) {
          // Remove button if no selection
          this.removeFloatingButton();
        }
      }, 150);
    });

    // Remove button when clicking elsewhere
    document.addEventListener('mousedown', (e) => {
      if (this.floatingButton && !this.floatingButton.contains(e.target)) {
        this.removeFloatingButton();
      }
    });
  }

  removeFloatingButton() {
    if (this.removeTimeout) {
      clearTimeout(this.removeTimeout);
      this.removeTimeout = null;
    }
    
    if (this.floatingButton?.parentNode) {
      this.floatingButton.remove();
      this.floatingButton = null;
    }
  }

  showFloatingButton(x, y) {
    // Clean up existing button
    this.removeFloatingButton();

    // Create floating button
    const btn = document.createElement('div');
    btn.id = 'gemini-floating-btn';
    btn.textContent = '✨';
    btn.title = 'Ask Gemini Nano about this text';
    btn.setAttribute('role', 'button');
    btn.setAttribute('aria-label', 'Ask Gemini Nano');
    
    Object.assign(btn.style, {
      position: 'absolute',
      left: `${x + 10}px`,
      top: `${y - 40}px`,
      background: '#4285f4',
      color: 'white',
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
      cursor: 'pointer',
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
      zIndex: '2147483647', // Maximum z-index
      transition: 'transform 0.2s, opacity 0.2s',
      opacity: '0'
    });

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.openSidePanelWithText();
    });

    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'scale(1.1)';
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'scale(1)';
    });

    document.body.appendChild(btn);
    this.floatingButton = btn;

    // Fade in
    requestAnimationFrame(() => {
      btn.style.opacity = '1';
    });

    // Auto-remove after 5 seconds
    this.removeTimeout = setTimeout(() => {
      if (btn.parentNode) {
        btn.style.opacity = '0';
        setTimeout(() => {
          if (btn.parentNode) btn.remove();
          this.floatingButton = null;
        }, 200);
      }
    }, 5000);
  }

  async openSidePanelWithText() {
    try {
      // Send selected text to extension
      const response = await chrome.runtime.sendMessage({
        action: "openSidePanel",
        text: this.selectedText
      });

      if (response?.success) {
        this.removeFloatingButton();
      }
    } catch (error) {
      console.error("Failed to open side panel:", error);
    }
  }

  injectAssistantButton() {
    // Add styles for the persistent assistant button
    const style = document.createElement('style');
    style.textContent = `
      #gemini-sidebar-btn {
        position: fixed;
        right: 20px;
        bottom: 20px;
        width: 50px;
        height: 50px;
        background: linear-gradient(135deg, #4285f4 0%, #34a853 100%);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 2147483646;
        transition: transform 0.2s, box-shadow 0.2s;
        user-select: none;
      }
      #gemini-sidebar-btn:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 16px rgba(0,0,0,0.2);
      }
      #gemini-sidebar-btn:active {
        transform: scale(0.95);
      }
    `;
    document.head.appendChild(style);

    const btn = document.createElement('div');
    btn.id = 'gemini-sidebar-btn';
    btn.textContent = '🤖';
    btn.title = 'Open Gemini Nano Assistant';
    btn.setAttribute('role', 'button');
    btn.setAttribute('aria-label', 'Open Gemini Nano Assistant');
    
    btn.addEventListener('click', async () => {
      try {
        await chrome.runtime.sendMessage({
          action: "openSidePanel"
        });
      } catch (error) {
        console.error("Failed to open side panel:", error);
      }
    });

    // Wait for body to be available
    if (document.body) {
      document.body.appendChild(btn);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(btn);
      });
    }
  }
}

// Listen for messages from background/popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "selectedText") {
    console.log("Selected text received:", message.text);
    // Could potentially highlight or do something with this
  }
  sendResponse({ received: true });
  return true;
});

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new ContentAssistant());
} else {
  new ContentAssistant();
}
