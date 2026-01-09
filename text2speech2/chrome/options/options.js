document.addEventListener('DOMContentLoaded', function() {
    const voiceSelect = document.getElementById('voiceSelect');
    const rateSlider = document.getElementById('rateSlider');
    const rateValue = document.getElementById('rateValue');
    const pitchSlider = document.getElementById('pitchSlider');
    const pitchValue = document.getElementById('pitchValue');
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeValue = document.getElementById('volumeValue');
    const highlightColor = document.getElementById('highlightColor');
    const highlightPreview = document.getElementById('highlightPreview');
    const saveBtn = document.getElementById('saveBtn');
    const resetBtn = document.getElementById('resetBtn');
    const testBtn = document.getElementById('testBtn');
    const notification = document.getElementById('notification');
    
    let voices = [];
    let testUtterance = null;
    
    init();
    
    function init() {
        loadVoices();
        loadSettings();
        setupEventListeners();
    }
    
    function loadVoices() {
        // Request voices from background (which will get them from offscreen)
        chrome.runtime.sendMessage({ action: 'getVoices' }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Error getting voices:', chrome.runtime.lastError);
                // Retry after a delay
                setTimeout(loadVoices, 1000);
                return;
            }
            
            if (response && response.voices && response.voices.length > 0) {
                voices = response.voices;
                populateVoiceSelect();
            } else {
                // Voices not ready yet, retry
                console.log('Voices not ready, retrying...');
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
        
        // Load saved voice preference
        chrome.storage.sync.get('readAloudPreferences', function(data) {
            if (data.readAloudPreferences && data.readAloudPreferences.voice) {
                voiceSelect.value = data.readAloudPreferences.voice;
            }
        });
        
        console.log(`Loaded ${voices.length} voices`);
    }
    
    function loadSettings() {
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
                if (data.readAloudPreferences.volume) {
                    volumeSlider.value = data.readAloudPreferences.volume;
                    volumeValue.textContent = data.readAloudPreferences.volume;
                }
                if (data.readAloudPreferences.voice) {
                    voiceSelect.value = data.readAloudPreferences.voice;
                }
                
                if (data.readAloudPreferences.readingMode) {
                    const radioBtn = document.querySelector(`input[name="readingMode"][value="${data.readAloudPreferences.readingMode}"]`);
                    if (radioBtn) radioBtn.checked = true;
                }
                if (data.readAloudPreferences.autoRead !== undefined) {
                    document.getElementById('autoRead').checked = data.readAloudPreferences.autoRead;
                }
                if (data.readAloudPreferences.highlightText !== undefined) {
                    document.getElementById('highlightText').checked = data.readAloudPreferences.highlightText;
                }
                if (data.readAloudPreferences.continueReading !== undefined) {
                    document.getElementById('continueReading').checked = data.readAloudPreferences.continueReading;
                }
                
                if (data.readAloudPreferences.highlightColor) {
                    highlightColor.value = data.readAloudPreferences.highlightColor;
                    highlightPreview.style.backgroundColor = data.readAloudPreferences.highlightColor;
                }
            }
        });
        
        // Load keyboard shortcuts
        chrome.commands.getAll(function(commands) {
            commands.forEach(command => {
                if (command.shortcut) {
                    const shortcutMap = {
                        'toggle-play': 'playPauseShortcut',
                        'stop': 'stopShortcut',
                        'read-selected': 'readSelectedShortcut'
                    };
                    
                    const elementId = shortcutMap[command.name];
                    if (elementId) {
                        const element = document.getElementById(elementId);
                        if (element) {
                            element.textContent = command.shortcut;
                        }
                    }
                }
            });
        });
    }
    
    function setupEventListeners() {
        rateSlider.addEventListener('input', function() {
            rateValue.textContent = this.value;
        });
        
        pitchSlider.addEventListener('input', function() {
            pitchValue.textContent = this.value;
        });
        
        volumeSlider.addEventListener('input', function() {
            volumeValue.textContent = this.value;
        });
        
        highlightColor.addEventListener('input', function() {
            highlightPreview.style.backgroundColor = this.value;
        });
        
        saveBtn.addEventListener('click', saveSettings);
        resetBtn.addEventListener('click', resetSettings);
        testBtn.addEventListener('click', testVoice);
        
        document.getElementById('changePlayPause').addEventListener('click', function() {
            showNotification('To change shortcuts, go to chrome://extensions/shortcuts');
        });
        
        document.getElementById('changeStop').addEventListener('click', function() {
            showNotification('To change shortcuts, go to chrome://extensions/shortcuts');
        });
        
        document.getElementById('changeReadSelected').addEventListener('click', function() {
            showNotification('To change shortcuts, go to chrome://extensions/shortcuts');
        });
    }
    
    function saveSettings() {
        const preferences = {
            voice: voiceSelect.value,
            rate: parseFloat(rateSlider.value),
            pitch: parseFloat(pitchSlider.value),
            volume: parseFloat(volumeSlider.value),
            readingMode: document.querySelector('input[name="readingMode"]:checked').value,
            autoRead: document.getElementById('autoRead').checked,
            highlightText: document.getElementById('highlightText').checked,
            continueReading: document.getElementById('continueReading').checked,
            highlightColor: highlightColor.value
        };
        
        chrome.storage.sync.set({ readAloudPreferences: preferences }, function() {
            showNotification('Settings saved successfully!');
            
            chrome.runtime.sendMessage({
                action: 'updatePreferences',
                preferences: preferences
            });
        });
    }
    
    function resetSettings() {
        if (confirm('Are you sure you want to reset all settings to default values?')) {
            const defaultPreferences = {
                voice: '',
                rate: 1,
                pitch: 1,
                volume: 1,
                readingMode: 'fullPage',
                autoRead: false,
                highlightText: true,
                continueReading: false,
                highlightColor: '#fff9c4'
            };
            
            chrome.storage.sync.set({ readAloudPreferences: defaultPreferences }, function() {
                loadSettings();
                showNotification('Settings reset to defaults!');
                
                chrome.runtime.sendMessage({
                    action: 'updatePreferences',
                    preferences: defaultPreferences
                });
            });
        }
    }
    
    function testVoice() {
        // Stop any previous test
        if (testUtterance) {
            speechSynthesis.cancel();
        }
        
        const preferences = {
            voice: voiceSelect.value,
            rate: parseFloat(rateSlider.value),
            pitch: parseFloat(pitchSlider.value),
            volume: parseFloat(volumeSlider.value)
        };
        
        testUtterance = new SpeechSynthesisUtterance(
            'This is a test of the current voice settings. You can adjust the voice, speed, pitch, and volume to your preference.'
        );
        
        testUtterance.rate = preferences.rate;
        testUtterance.pitch = preferences.pitch;
        testUtterance.volume = preferences.volume;
        
        if (preferences.voice) {
            const allVoices = speechSynthesis.getVoices();
            const selectedVoice = allVoices.find(voice => voice.name === preferences.voice);
            if (selectedVoice) {
                testUtterance.voice = selectedVoice;
            }
        }
        
        speechSynthesis.speak(testUtterance);
    }
    
    function showNotification(message) {
        notification.textContent = message;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
});
