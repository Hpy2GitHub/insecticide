// Background service worker for Read Aloud extension
// Manifest V3 implementation with offscreen document for Web Speech API

class ReadAloudEngine {
    constructor() {
        this.isReading = false;
        this.isPaused = false;
        this.offscreenDocumentReady = false;
        this.preferences = {
            voice: null,
            rate: 1,
            pitch: 1,
            volume: 1,
            readingMode: 'fullPage',
            autoRead: false,
            highlightText: true,
            continueReading: false,
            highlightColor: '#fff9c4'
        };
        this.currentReadingSession = {
            text: null,
            sourceUrl: null,
            startTime: null,
            position: 0
        };
        this.init();
    }

    async init() {
        await this.loadPreferences();
        this.setupMessageListeners();
        this.setupCommands();
        this.setupTabListeners();
        console.log('Read Aloud engine initialized');
    }

    async loadPreferences() {
        try {
            const result = await chrome.storage.sync.get('readAloudPreferences');
            if (result.readAloudPreferences) {
                this.preferences = { ...this.preferences, ...result.readAloudPreferences };
                console.log('Preferences loaded:', this.preferences);
            }
        } catch (error) {
            console.error('Failed to load preferences:', error);
        }
    }

    setupMessageListeners() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            console.log('Background received message:', request.action);
            
            switch (request.action) {
                case 'startReading':
                    this.startReading(request.text);
                    sendResponse({ success: true });
                    break;
                    
                case 'pauseReading':
                    this.pauseReading();
                    sendResponse({ success: true });
                    break;
                    
                case 'resumeReading':
                    this.resumeReading();
                    sendResponse({ success: true });
                    break;
                    
                case 'stopReading':
                    this.stopReading();
                    sendResponse({ success: true });
                    break;
                    
                case 'getStatus':
                    sendResponse({
                        isReading: this.isReading,
                        isPaused: this.isPaused,
                        preferences: this.preferences
                    });
                    return true;
                    
                case 'updatePreferences':
                    this.updatePreferences(request.preferences);
                    sendResponse({ success: true });
                    break;
                    
                case 'getPreferences':
                    sendResponse({ preferences: this.preferences });
                    return true;
                    
                case 'getVoices':
                    // Forward to offscreen document
                    this.getVoices().then(voices => {
                        sendResponse({ voices: voices });
                    }).catch(err => {
                        console.error('Failed to get voices:', err);
                        sendResponse({ voices: [] });
                    });
                    return true; // Will respond asynchronously
                    
                case 'speechEvent':
                    this.handleSpeechEvent(request.event, request.data);
                    break;
            }
            
            return true;
        });
    }

    async getVoices() {
        try {
            await this.ensureOffscreenDocument();
            
            return new Promise((resolve, reject) => {
                chrome.runtime.sendMessage(
                    { action: 'getVoices' },
                    (response) => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else if (response && response.voices) {
                            resolve(response.voices);
                        } else {
                            resolve([]);
                        }
                    }
                );
            });
        } catch (error) {
            console.error('Error getting voices:', error);
            return [];
        }
    }

    async ensureOffscreenDocument() {
        // Check if offscreen document exists
        const existingContexts = await chrome.runtime.getContexts({
            contextTypes: ['OFFSCREEN_DOCUMENT']
        });

        if (existingContexts.length > 0) {
            console.log('Offscreen document already exists');
            this.offscreenDocumentReady = true;
            return;
        }

        // Create offscreen document
        console.log('Creating offscreen document...');
        await chrome.offscreen.createDocument({
            url: 'offscreen.html',
            reasons: ['USER_MEDIA'], // closest match for audio output
            justification: 'Text-to-speech requires Web Speech API access'
        });
        
        // Give it a moment to initialize
        await new Promise(resolve => setTimeout(resolve, 100));
        
        this.offscreenDocumentReady = true;
        console.log('Offscreen document created');
    }

    async startReading(text) {
        console.log('Starting to read text...');
        
        if (this.isReading) {
            await this.stopReading();
        }

        await this.ensureOffscreenDocument();

        this.currentReadingSession.text = text;
        this.currentReadingSession.position = 0;
        this.currentReadingSession.startTime = Date.now();
        this.isReading = true;
        this.isPaused = false;
        
        // Prepare highlighting in content script
        this.sendToActiveTab({ action: 'prepareHighlighting' });
        
        // Send to offscreen document to start speaking
        chrome.runtime.sendMessage({
            action: 'speak',
            text: text,
            preferences: this.preferences,
            startPosition: 0
        }).catch(err => console.error('Failed to send speak message:', err));
        
        this.updateStatus();
    }

    async pauseReading() {
        if (this.isReading && !this.isPaused) {
            console.log('Pausing reading...');
            
            chrome.runtime.sendMessage({
                action: 'pause'
            }).catch(err => console.error('Failed to send pause message:', err));
            
            this.isPaused = true;
            this.updateStatus();
        }
    }

    async resumeReading() {
        if (this.isReading && this.isPaused) {
            console.log('Resuming reading...');
            
            chrome.runtime.sendMessage({
                action: 'resume'
            }).catch(err => console.error('Failed to send resume message:', err));
            
            this.isPaused = false;
            this.updateStatus();
        }
    }

    async stopReading() {
        if (this.isReading) {
            console.log('Stopping reading...');
            
            chrome.runtime.sendMessage({
                action: 'stop'
            }).catch(err => console.error('Failed to send stop message:', err));
            
            this.isReading = false;
            this.isPaused = false;
            this.currentReadingSession.position = 0;
            
            // Clear highlighting
            this.sendToActiveTab({ action: 'clearHighlight' });
            
            this.updateStatus();
        }
    }

    handleSpeechEvent(event, data) {
        console.log('Speech event:', event, data);
        
        switch (event) {
            case 'started':
                this.isReading = true;
                this.isPaused = false;
                this.updateStatus();
                break;
                
            case 'ended':
                this.isReading = false;
                this.isPaused = false;
                this.sendToActiveTab({ action: 'clearHighlight' });
                this.updateStatus();
                break;
                
            case 'paused':
                this.isPaused = true;
                this.updateStatus();
                break;
                
            case 'resumed':
                this.isPaused = false;
                this.updateStatus();
                break;
                
            case 'boundary':
                if (data.position !== undefined) {
                    this.currentReadingSession.position = data.position;
                    
                    // Send highlight update to content script
                    this.sendToActiveTab({
                        action: 'highlightTextProgressive',
                        position: data.position,
                        rate: data.rate || 1
                    });
                }
                break;
                
            case 'error':
                console.error('Speech error:', data.error);
                this.isReading = false;
                this.isPaused = false;
                this.updateStatus();
                break;
        }
    }

    updateStatus() {
        chrome.runtime.sendMessage({
            action: 'statusUpdate',
            status: {
                isReading: this.isReading,
                isPaused: this.isPaused,
                preferences: this.preferences
            }
        }).catch(() => {
            // Popup might be closed, that's ok
        });
    }

    updatePreferences(newPreferences) {
        this.preferences = { ...this.preferences, ...newPreferences };
        chrome.storage.sync.set({ readAloudPreferences: this.preferences });
        console.log('Preferences updated:', this.preferences);
    }

    async sendToActiveTab(message) {
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs.length > 0) {
                chrome.tabs.sendMessage(tabs[0].id, message).catch(err => {
                    console.log('Could not send to content script:', err.message);
                });
            }
        } catch (error) {
            console.error('Error sending to active tab:', error);
        }
    }

    setupCommands() {
        chrome.commands.onCommand.addListener((command) => {
            console.log('Command received:', command);
            
            switch (command) {
                case 'toggle-play':
                    if (this.isReading) {
                        if (this.isPaused) {
                            this.resumeReading();
                        } else {
                            this.pauseReading();
                        }
                    }
                    break;
                    
                case 'stop':
                    this.stopReading();
                    break;
                    
                case 'read-selected':
                    this.handleReadSelected();
                    break;
            }
        });
    }

    async handleReadSelected() {
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs.length > 0) {
                chrome.tabs.sendMessage(
                    tabs[0].id,
                    { action: 'getSelectedText' },
                    (response) => {
                        if (response && response.success && response.text) {
                            this.startReading(response.text);
                        }
                    }
                );
            }
        } catch (error) {
            console.error('Error reading selected text:', error);
        }
    }

    setupTabListeners() {
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete' && this.preferences.continueReading && this.isReading) {
                console.log('Tab updated, continuing reading if enabled');
            }
        });
    }
}

// Initialize the engine
const readAloudEngine = new ReadAloudEngine();

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('Read Aloud extension installed');
});

// Handle storage changes
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.readAloudPreferences) {
        readAloudEngine.preferences = {
            ...readAloudEngine.preferences,
            ...changes.readAloudPreferences.newValue
        };
        console.log('Preferences updated from storage');
    }
});
