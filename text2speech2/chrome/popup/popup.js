document.addEventListener('DOMContentLoaded', function() {
    const statusElement = document.getElementById('status');
    const readPageBtn = document.getElementById('readPageBtn');
    const readSelectedBtn = document.getElementById('readSelectedBtn');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const stopBtn = document.getElementById('stopBtn');
    const voiceSelect = document.getElementById('voiceSelect');
    const rateSlider = document.getElementById('rateSlider');
    const rateValue = document.getElementById('rateValue');
    const pitchSlider = document.getElementById('pitchSlider');
    const pitchValue = document.getElementById('pitchValue');
    const progressFill = document.getElementById('progressFill');
    const progressTime = document.getElementById('progressTime');
    const totalTime = document.getElementById('totalTime');
    const settingsBtn = document.getElementById('settingsBtn');
    const helpBtn = document.getElementById('helpBtn');
    
    let isReading = false;
    let isPaused = false;
    let voices = [];
    
    init();

    function init() {
        loadVoices();
        loadPreferences();
        setupEventListeners();
        checkCurrentPage();
        checkReadingStatus();
    }
    
    function loadVoices() {
        // Request voices from background (which will get them from offscreen)
        chrome.runtime.sendMessage({ action: 'getVoices' }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Error getting voices:', chrome.runtime.lastError);
                setTimeout(loadVoices, 1000); // Retry after 1 second
                return;
            }
            
            if (response && response.voices && response.voices.length > 0) {
                voices = response.voices;
                populateVoiceSelect();
            } else {
                // Retry after a short delay
                setTimeout(loadVoices, 500);
            }
        });
    }
    
    function populateVoiceSelect() {
        voiceSelect.innerHTML = '';
        
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Default Voice';
        voiceSelect.appendChild(defaultOption);
        
        voices.forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.name;
            option.textContent = `${voice.name} (${voice.lang})`;
            voiceSelect.appendChild(option);
        });
        
        chrome.storage.sync.get('readAloudPreferences', function(data) {
            if (data.readAloudPreferences && data.readAloudPreferences.voice) {
                voiceSelect.value = data.readAloudPreferences.voice;
            }
        });
    }
    
    function loadPreferences() {
        chrome.storage.sync.get('readAloudPreferences', function(data) {
            if (data.readAloudPreferences) {
                if (data.readAloudPreferences.rate) {
                    rateSlider.value = data.readAloudPreferences.rate;
                    rateValue.textContent = data.readAloudPreferences.rate;
                }
                if (data.readAloudPreferences.pitch) {
                    pitchSlider.value = data.readAloudPreferences.pitch;
                    pitchValue.textContent = data.readAloudPreferences.pitch;
                }
            }
        });
    }
    
    function savePreferences() {
        const preferences = {
            voice: voiceSelect.value,
            rate: parseFloat(rateSlider.value),
            pitch: parseFloat(pitchSlider.value)
        };
        
        chrome.storage.sync.set({ readAloudPreferences: preferences });
        
        chrome.runtime.sendMessage({
            action: 'updatePreferences',
            preferences: preferences
        });
    }
    
    function setupEventListeners() {
        readPageBtn.addEventListener('click', readPage);
        readSelectedBtn.addEventListener('click', readSelectedText);
        playPauseBtn.addEventListener('click', togglePlayPause);
        stopBtn.addEventListener('click', stopReading);
        
        voiceSelect.addEventListener('change', savePreferences);
        rateSlider.addEventListener('input', function() {
            rateValue.textContent = this.value;
            savePreferences();
        });
        pitchSlider.addEventListener('input', function() {
            pitchValue.textContent = this.value;
            savePreferences();
        });
        
        settingsBtn.addEventListener('click', openSettings);
        helpBtn.addEventListener('click', openHelp);
        
        chrome.runtime.onMessage.addListener(handleMessage);
    }
    
    async function checkCurrentPage() {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (tabs.length === 0) {
            statusElement.textContent = 'No active tab';
            readPageBtn.disabled = true;
            return;
        }
        
        const tab = tabs[0];
        
        // Check if we can access this page
        const restrictedUrls = ['chrome://', 'chrome-extension://', 'edge://', 'about:', 'view-source:'];
        const isRestricted = restrictedUrls.some(prefix => tab.url.startsWith(prefix));
        
        if (isRestricted) {
            statusElement.textContent = 'Cannot access this page';
            readPageBtn.disabled = true;
            readSelectedBtn.disabled = true;
            return;
        }
        
        // Enable read page button
        readPageBtn.disabled = false;
        
        // Ensure content script is injected
        await ensureContentScript(tab.id);
        
        // Check for selected text
        checkSelectedText();
    }
    
    async function ensureContentScript(tabId) {
        try {
            // Try to ping the content script
            const response = await chrome.tabs.sendMessage(tabId, { action: 'ping' });
            console.log('Content script already loaded');
        } catch (error) {
            // Content script not loaded, inject it
            console.log('Content script not loaded, injecting...');
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ['content.js']
                });
                console.log('Content script injected successfully');
                // Give it a moment to initialize
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (injectError) {
                console.error('Failed to inject content script:', injectError);
            }
        }
    }
    
    function checkSelectedText() {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (tabs.length === 0) return;
            
            chrome.tabs.sendMessage(
                tabs[0].id, 
                { action: 'getSelectedText' }, 
                function(response) {
                    if (chrome.runtime.lastError) {
                        console.log('Could not check selection:', chrome.runtime.lastError.message);
                        readSelectedBtn.disabled = true;
                        return;
                    }
                    
                    if (response && response.success && response.text) {
                        readSelectedBtn.disabled = false;
                    } else {
                        readSelectedBtn.disabled = true;
                    }
                }
            );
        });
    }
    
    function checkReadingStatus() {
        chrome.runtime.sendMessage({ action: 'getStatus' }, function(response) {
            if (response) {
                isReading = response.isReading;
                isPaused = response.isPaused;
                updateUI();
            }
        });
    }
    
    function handleMessage(request, sender, sendResponse) {
        if (request.action === 'statusUpdate') {
            isReading = request.status.isReading;
            isPaused = request.status.isPaused;
            updateUI();
        } else if (request.action === 'textSelected') {
            readSelectedBtn.disabled = !request.text;
        }
    }
    
    function updateUI() {
        if (isReading) {
            statusElement.textContent = isPaused ? 'Paused' : 'Reading...';
            playPauseBtn.disabled = false;
            stopBtn.disabled = false;
            
            playPauseBtn.innerHTML = '';
            const iconSpan = document.createElement('span');
            iconSpan.textContent = isPaused ? '▶️' : '⏸️';
            playPauseBtn.appendChild(iconSpan);
            playPauseBtn.appendChild(document.createTextNode(isPaused ? ' Resume' : ' Pause'));
        } else {
            statusElement.textContent = 'Ready to read';
            playPauseBtn.disabled = true;
            stopBtn.disabled = true;
            
            progressFill.style.width = '0%';
            progressTime.textContent = '0:00';
            totalTime.textContent = '0:00';
        }
    }
    
    function updateProgress(current, total) {
        if (total > 0) {
            const percentage = (current / total) * 100;
            progressFill.style.width = percentage + '%';
            
            progressTime.textContent = formatTime(current);
            totalTime.textContent = formatTime(total);
        }
    }
    
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    async function readPage() {
        const textOption = document.querySelector('input[name="textOption"]:checked').value;
        
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (tabs.length === 0) {
            statusElement.textContent = 'No active tab';
            return;
        }
        
        const tab = tabs[0];
        
        // Double-check we can access this page
        const restrictedUrls = ['chrome://', 'chrome-extension://', 'edge://', 'about:', 'view-source:'];
        const isRestricted = restrictedUrls.some(prefix => tab.url.startsWith(prefix));
        
        if (isRestricted) {
            statusElement.textContent = 'Cannot read system pages';
            return;
        }
        
        statusElement.textContent = 'Extracting text...';
        
        // Ensure content script is loaded
        await ensureContentScript(tab.id);
        
        chrome.tabs.sendMessage(
            tab.id, 
            { action: 'extractText', option: textOption },
            function(response) {
                if (chrome.runtime.lastError) {
                    console.error('Content script error:', chrome.runtime.lastError);
                    statusElement.textContent = 'Failed to access page';
                    return;
                }
                
                if (response && response.success && response.text) {
                    if (response.text.trim().length === 0) {
                        statusElement.textContent = 'No text found on page';
                        return;
                    }
                    
                    chrome.runtime.sendMessage({
                        action: 'startReading',
                        text: response.text
                    });
                } else {
                    statusElement.textContent = 'Failed to extract text';
                }
            }
        );
    }
    
    async function readSelectedText() {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (tabs.length === 0) return;
        
        // Ensure content script is loaded
        await ensureContentScript(tabs[0].id);
        
        chrome.tabs.sendMessage(
            tabs[0].id, 
            { action: 'getSelectedText' },
            function(response) {
                if (chrome.runtime.lastError) {
                    statusElement.textContent = 'Cannot access this page';
                    return;
                }
                
                if (response && response.success && response.text) {
                    chrome.runtime.sendMessage({
                        action: 'startReading',
                        text: response.text
                    });
                } else {
                    statusElement.textContent = 'No text selected';
                }
            }
        );
    }
    
    function togglePlayPause() {
        if (isPaused) {
            chrome.runtime.sendMessage({ action: 'resumeReading' });
        } else {
            chrome.runtime.sendMessage({ action: 'pauseReading' });
        }
    }
    
    function stopReading() {
        chrome.runtime.sendMessage({ action: 'stopReading' });
    }
    
    function openSettings() {
        chrome.runtime.openOptionsPage();
    }
    
    function openHelp() {
        const helpUrl = 'https://github.com/yourusername/read-aloud-extension#readme';
        chrome.tabs.create({ url: helpUrl });
    }
});
