// Offscreen document for Web Speech API access
console.log('Read Aloud offscreen document loaded');

let currentUtterance = null;
let isReading = false;
let isPaused = false;
let currentText = '';
let currentPosition = 0;
let startPosition = 0;

// Listen for messages from the service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Offscreen received message:', message.action);
    
    switch (message.action) {
        case 'speak':
            speak(message.text, message.preferences, message.startPosition || 0);
            sendResponse({ success: true });
            break;
            
        case 'pause':
            pause();
            sendResponse({ success: true });
            break;
            
        case 'resume':
            resume();
            sendResponse({ success: true });
            break;
            
        case 'stop':
            stop();
            sendResponse({ success: true });
            break;
            
        case 'getVoices':
            const voices = speechSynthesis.getVoices();
            sendResponse({ voices: voices.map(v => ({ name: v.name, lang: v.lang })) });
            break;
            
        case 'getStatus':
            sendResponse({ 
                isReading: isReading, 
                isPaused: isPaused,
                position: currentPosition
            });
            break;
    }
    
    return true;
});

// Speak the text with given preferences
function speak(text, preferences, startPos = 0) {
    console.log('Offscreen: Starting to speak from position', startPos);
    
    // Stop any current speech
    stop();
    
    currentText = text;
    startPosition = startPos;
    currentPosition = startPos;
    isReading = true;
    isPaused = false;
    
    // Create utterance
    currentUtterance = new SpeechSynthesisUtterance(text);
    
    // Set voice if specified
    if (preferences.voice) {
        const voices = speechSynthesis.getVoices();
        const selectedVoice = voices.find(v => v.name === preferences.voice);
        if (selectedVoice) {
            currentUtterance.voice = selectedVoice;
        }
    }
    
    // Set speech parameters
    currentUtterance.rate = preferences.rate || 1;
    currentUtterance.pitch = preferences.pitch || 1;
    currentUtterance.volume = preferences.volume || 1;
    
    // Event handlers
    currentUtterance.onstart = () => {
        console.log('Offscreen: Speech started');
        notifyBackgroundScript('started');
    };
    
    currentUtterance.onend = () => {
        console.log('Offscreen: Speech ended');
        isReading = false;
        isPaused = false;
        currentPosition = 0;
        notifyBackgroundScript('ended');
    };
    
    currentUtterance.onerror = (event) => {
        console.error('Offscreen: Speech error:', event.error);
        isReading = false;
        isPaused = false;
        notifyBackgroundScript('error', { error: event.error });
    };
    
    currentUtterance.onpause = () => {
        console.log('Offscreen: Speech paused');
        isPaused = true;
        notifyBackgroundScript('paused');
    };
    
    currentUtterance.onresume = () => {
        console.log('Offscreen: Speech resumed');
        isPaused = false;
        notifyBackgroundScript('resumed');
    };
    
    currentUtterance.onboundary = (event) => {
        if (event.name === 'word') {
            currentPosition = startPosition + event.charIndex;
            notifyBackgroundScript('boundary', { 
                position: currentPosition,
                charIndex: event.charIndex,
                rate: preferences.rate || 1
            });
        }
    };
    
    // Start speaking
    speechSynthesis.speak(currentUtterance);
    
    // Chrome bug workaround: keep speech synthesis alive
    startKeepAliveTimer();
}

// Pause speech
function pause() {
    if (isReading && !isPaused) {
        console.log('Offscreen: Pausing speech');
        speechSynthesis.pause();
        isPaused = true;
        stopKeepAliveTimer();
    }
}

// Resume speech
function resume() {
    if (isReading && isPaused) {
        console.log('Offscreen: Resuming speech');
        speechSynthesis.resume();
        isPaused = false;
        startKeepAliveTimer();
    }
}

// Stop speech
function stop() {
    console.log('Offscreen: Stopping speech');
    speechSynthesis.cancel();
    stopKeepAliveTimer();
    isReading = false;
    isPaused = false;
    currentUtterance = null;
    currentPosition = 0;
}

// Notify background script of events
function notifyBackgroundScript(event, data = {}) {
    chrome.runtime.sendMessage({
        action: 'speechEvent',
        event: event,
        data: data
    }).catch(err => {
        console.log('Could not send message to background:', err);
    });
}

// Keep-alive timer to prevent Chrome from stopping speech
let keepAliveTimer = null;

function startKeepAliveTimer() {
    stopKeepAliveTimer();
    keepAliveTimer = setInterval(() => {
        if (speechSynthesis.speaking && !speechSynthesis.paused) {
            speechSynthesis.resume();
        }
    }, 5000);
}

function stopKeepAliveTimer() {
    if (keepAliveTimer) {
        clearInterval(keepAliveTimer);
        keepAliveTimer = null;
    }
}

// Load voices when available
if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = () => {
        console.log('Offscreen: Voices loaded');
    };
}
