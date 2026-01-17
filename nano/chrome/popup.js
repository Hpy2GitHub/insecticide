class GeminiNanoExtension {
  constructor() {
    this.isAvailable = false;
    this.isGenerating = false;
    this.init();
  }

  async init() {
    await this.checkAIAvailability();
    this.setupEventListeners();
    this.focusInput();
  }

  async checkAIAvailability() {
    const statusEl = document.getElementById('status');
    const statusTextEl = document.getElementById('status-text');
    const statusIconEl = statusEl.querySelector('.status-icon');
    
    try {
      // Ask background script about AI availability
      const response = await chrome.runtime.sendMessage({
        action: "checkAvailability"
      });

      console.log('AI Status from background:', response);
      
      if (response?.available && response?.hasSession) {
        statusIconEl.textContent = '✅';
        statusTextEl.textContent = 'Gemini Nano Connected (Local)';
        statusEl.className = 'status connected';
        document.getElementById('sendBtn').disabled = false;
        this.isAvailable = true;
      } else if (response?.downloading) {
        statusIconEl.textContent = '⏳';
        statusTextEl.textContent = 'Model is downloading...';
        statusEl.className = 'status downloading';
        // Recheck in a few seconds
        setTimeout(() => this.checkAIAvailability(), 3000);
      } else if (response?.downloadable) {
        statusIconEl.textContent = '⚠️';
        statusTextEl.textContent = 'Model needs download';
        statusEl.className = 'status downloading';
        this.showError('Click "Generate Response" to trigger model download, or use the diagnostic page.');
      } else {
        statusIconEl.textContent = '❌';
        statusTextEl.textContent = 'AI not available';
        statusEl.className = 'status disconnected';
        this.showError('Gemini Nano is not available. Check chrome://on-device-internals/ and ensure Chrome flags are enabled.');
      }
    } catch (error) {
      console.error("Error checking AI:", error);
      statusIconEl.textContent = '❌';
      statusTextEl.textContent = 'Connection error';
      statusEl.className = 'status disconnected';
      this.showError(`Failed to check AI status: ${error.message}`);
    }
  }

  setupEventListeners() {
    const sendBtn = document.getElementById('sendBtn');
    const promptInput = document.getElementById('prompt');
    
    sendBtn.addEventListener('click', () => this.generateResponse());
    
    promptInput.addEventListener('keydown', (e) => {
      // Submit on Enter (without Shift)
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.generateResponse();
      }
    });

    // Auto-resize textarea
    promptInput.addEventListener('input', () => {
      this.autoResizeTextarea(promptInput);
    });
  }

  autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  }

  focusInput() {
    const promptInput = document.getElementById('prompt');
    promptInput.focus();
  }

  async generateResponse() {
    if (this.isGenerating) return;
    
    const prompt = document.getElementById('prompt').value.trim();
    const responseEl = document.getElementById('response');
    const loadingEl = document.getElementById('loading');
    const sendBtn = document.getElementById('sendBtn');
    
    if (!prompt) {
      this.showError('Please enter a prompt');
      return;
    }
    
    // Show loading state
    this.isGenerating = true;
    loadingEl.classList.add('show');
    responseEl.textContent = '';
    responseEl.classList.remove('show');
    sendBtn.disabled = true;
    
    try {
      // Send message to background script to generate
      const response = await chrome.runtime.sendMessage({
        action: "generateText",
        prompt: prompt
      });

      if (response.success) {
        responseEl.textContent = response.response;
        responseEl.classList.add('show');
        
        // Clear input after successful generation
        document.getElementById('prompt').value = '';
      } else {
        this.showError(`Generation failed: ${response.error || 'Unknown error'}`);
        responseEl.classList.add('show');
      }
      
    } catch (error) {
      console.error("Generation error:", error);
      this.showError(`Generation failed: ${error.message}`);
      responseEl.classList.add('show');
    } finally {
      loadingEl.classList.remove('show');
      sendBtn.disabled = false;
      this.isGenerating = false;
    }
  }

  showError(message) {
    const responseEl = document.getElementById('response');
    responseEl.innerHTML = `<div class="error">${this.escapeHtml(message)}</div>`;
    responseEl.classList.add('show');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
  new GeminiNanoExtension();
});
