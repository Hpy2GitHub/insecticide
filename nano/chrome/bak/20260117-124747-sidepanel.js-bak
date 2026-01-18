class SidePanelAssistant {
  constructor() {
    this.context = '';
    this.conversationHistory = [];
    this.isGenerating = false;
    this.init();
  }

  async init() {
    await this.loadContext();
    await this.checkAIStatus();
    this.setupEventListeners();
    this.focusInput();
  }

  async loadContext() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: "getContext"
      });

      if (response?.text) {
        this.context = response.text;
        this.displayContext(response.text);
        
        // Automatically add context as first message
        this.addMessage('user', `Please help me with this text:\n\n"${response.text}"`);
      }
    } catch (error) {
      console.error('Failed to load context:', error);
    }
  }

  displayContext(text) {
    const contextSection = document.getElementById('contextSection');
    const contextText = document.getElementById('contextText');
    
    contextText.textContent = text;
    contextSection.classList.add('show');
  }

  async checkAIStatus() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: "checkAvailability"
      });

      const statusIndicator = document.getElementById('statusIndicator');
      const sendBtn = document.getElementById('sendBtn');

      if (response?.available && response?.hasSession) {
        statusIndicator.classList.remove('disconnected');
        sendBtn.disabled = false;
      } else {
        statusIndicator.classList.add('disconnected');
        this.addMessage('error', 'AI model not available. Please ensure Gemini Nano is enabled in your browser.');
      }
    } catch (error) {
      console.error('Failed to check AI status:', error);
      document.getElementById('statusIndicator').classList.add('disconnected');
    }
  }

  setupEventListeners() {
    const sendBtn = document.getElementById('sendBtn');
    const userInput = document.getElementById('userInput');

    sendBtn.addEventListener('click', () => this.handleSend());

    userInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });

    // Auto-resize textarea
    userInput.addEventListener('input', () => {
      this.autoResizeTextarea(userInput);
    });
  }

  autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
  }

  focusInput() {
    document.getElementById('userInput').focus();
  }

  async handleSend() {
    if (this.isGenerating) return;

    const userInput = document.getElementById('userInput');
    const input = userInput.value.trim();

    if (!input) return;

    // Clear input immediately
    userInput.value = '';
    userInput.style.height = 'auto';

    // Add user message to conversation
    this.addMessage('user', input);

    // Build prompt with context if available
    const fullPrompt = this.context 
      ? `Context: ${this.context}\n\nQuestion: ${input}`
      : input;

    // Show loading indicator
    this.showLoading(true);
    this.isGenerating = true;
    document.getElementById('sendBtn').disabled = true;

    try {
      const response = await chrome.runtime.sendMessage({
        action: "generateText",
        prompt: fullPrompt
      });

      if (response.success) {
        this.addMessage('assistant', response.response);
        // Clear context after first use
        this.context = '';
      } else {
        this.addMessage('error', `Error: ${response.error || 'Unknown error occurred'}`);
      }
    } catch (error) {
      console.error('Generation error:', error);
      this.addMessage('error', `Failed to generate response: ${error.message}`);
    } finally {
      this.showLoading(false);
      this.isGenerating = false;
      document.getElementById('sendBtn').disabled = false;
      this.focusInput();
    }
  }

  addMessage(type, content) {
    const conversation = document.getElementById('conversation');
    
    // Remove empty state if it exists
    const emptyState = conversation.querySelector('.empty-state');
    if (emptyState) {
      emptyState.remove();
    }

    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}`;
    messageEl.textContent = content;

    conversation.appendChild(messageEl);
    
    // Store in history
    this.conversationHistory.push({ type, content });

    // Scroll to bottom
    this.scrollToBottom();
  }

  showLoading(show) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    
    if (show) {
      loadingIndicator.classList.add('show');
      this.scrollToBottom();
    } else {
      loadingIndicator.classList.remove('show');
    }
  }

  scrollToBottom() {
    const conversation = document.getElementById('conversation');
    requestAnimationFrame(() => {
      conversation.scrollTop = conversation.scrollHeight;
    });
  }
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
  new SidePanelAssistant();
});
