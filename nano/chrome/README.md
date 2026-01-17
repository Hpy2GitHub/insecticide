# Privacy-First Gemini Nano Chrome Extension

A Chrome extension that runs Google's Gemini Nano model locally on your device using the Chrome AI API. Experience the power of AI while maintaining complete privacy - all processing happens on your device with zero data sent to external servers.

## ✨ Features

- **100% Local Processing**: All AI inference happens on your device
- **Chrome AI Integration**: Uses the official `chrome.ai.languageModel` API
- **Context Menu**: Right-click selected text to analyze with Gemini Nano
- **Floating Assistant**: Quick access button appears when you select text
- **Side Panel**: Full conversation interface for extended interactions
- **Privacy First**: No data collection, no tracking, no external API calls

## 📋 Requirements

- **Chrome Version**: Chrome 138 or later (stable channel)
- **Platform**: Desktop only (Windows 10/11, macOS 13+, Linux, ChromeOS)
- **Storage**: 22GB free disk space for Gemini Nano model
- **Memory**: 4GB+ RAM (8GB+ recommended)

⚠️ **Note**: Mobile platforms (Android/iOS) are not currently supported by Chrome's built-in AI.

## 🚀 Installation

### Step 1: Enable Chrome AI Features

The Prompt API is available in Chrome 138+ stable, but you need to ensure it's enabled:

1. Open Chrome and navigate to `chrome://flags`
2. Search for and enable the following flags:
   - `#optimization-guide-on-device-model` → **Enabled BypassPerfRequirement**
   - `#prompt-api-for-gemini-nano` → **Enabled**
3. Click **Relaunch** to restart Chrome

### Step 2: Verify AI Availability

1. Open Chrome DevTools (F12) on any page
2. In the Console, type: `await chrome.ai.languageModel.capabilities()`
3. You should see output indicating availability status

### Step 3: Load the Extension

1. Download or clone this repository
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (toggle in top-right)
4. Click **Load unpacked**
5. Select the extension folder

### Step 4: First Run

When you first use the extension, Chrome may need to download the Gemini Nano model (~1.5GB). This happens automatically and only needs to be done once.

## 🎯 Usage

### Method 1: Extension Popup
1. Click the extension icon in the toolbar
2. Type your question or prompt
3. Press Enter or click "Generate Response"

### Method 2: Text Selection
1. Select any text on a webpage
2. Click the floating ✨ button that appears
3. Ask questions about the selected text in the side panel

### Method 3: Context Menu
1. Select text on any webpage
2. Right-click and choose "Ask Gemini Nano"
3. The side panel opens with the selected text as context

### Method 4: Persistent Assistant
1. Click the 🤖 button in the bottom-right of any page
2. Opens the side panel for quick access

## 🔧 API Information

This extension uses the **Chrome AI Prompt API**, which provides:

- **Language Model**: Gemini Nano (on-device)
- **Access**: `chrome.ai.languageModel`
- **Methods**: 
  - `capabilities()` - Check model availability
  - `create()` - Initialize a session
  - `prompt()` - Generate responses

### Current Limitations

- Desktop platforms only (no mobile)
- Chrome Extensions only (not available to regular web pages)
- Requires 22GB disk space
- English language optimized (other languages may have reduced quality)

## 🔒 Privacy & Security

### What This Extension Does:
✅ Processes all AI requests locally on your device  
✅ Never sends data to external servers  
✅ No analytics or tracking  
✅ No data storage beyond active session  
✅ Open source - verify the code yourself

### What This Extension Doesn't Do:
❌ No internet connection required for AI processing  
❌ No data collection or logging  
❌ No third-party integrations  
❌ No user profiling or behavioral tracking

## 🛠️ Development

### File Structure
```
├── manifest.json          # Extension configuration
├── background.js          # Service worker (handles AI sessions)
├── content.js            # Injected into web pages (UI elements)
├── popup.html/js         # Extension popup interface
├── sidepanel.html/js     # Side panel conversation UI
└── icons/                # Extension icons
```

### Key Technologies
- Chrome Extensions Manifest V3
- Chrome AI Language Model API
- Vanilla JavaScript (no frameworks)
- Modern CSS with flexbox/grid

### Building/Testing
1. Make changes to the code
2. Go to `chrome://extensions`
3. Click the refresh icon on the extension card
4. Test your changes

## ⚠️ Troubleshooting

### "AI API not available"
- Ensure you're on Chrome 138+
- Check that Chrome flags are enabled
- Restart Chrome after enabling flags
- Verify you're on a supported platform (desktop only)

### "Model not available"
- Check that you have 22GB free disk space
- Wait for the model to download (first run)
- Try creating a session manually in DevTools

### "Generation failed"
- Check if the model is still available
- Try reloading the extension
- Check browser console for detailed errors

### Model Download Issues
- Ensure stable internet connection
- Check available disk space (need 22GB)
- Try manually triggering download via DevTools

## 📝 Version History

### v1.1.0 (Current)
- Updated to use stable Chrome AI API (`chrome.ai`)
- Fixed API method calls (`prompt()` vs `generate()`)
- Added proper error handling and loading states
- Improved UI/UX with better visual feedback
- Added context menu permission
- Fixed message passing between components
- Memory leak fixes in content script

### v1.0.0
- Initial release
- Basic Gemini Nano integration
- Popup and side panel interfaces

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

### Areas for Improvement
- [ ] Add conversation history persistence
- [ ] Implement streaming responses
- [ ] Add keyboard shortcuts
- [ ] Support for other Chrome AI APIs (Summarizer, Translator)
- [ ] Settings page for customization
- [ ] Export conversation feature

## 📄 License

MIT License - feel free to use and modify as needed.

## 🙏 Acknowledgments

- Built on Chrome's experimental AI capabilities
- Uses Google's Gemini Nano model
- Inspired by the privacy-first AI movement

## 📞 Support

- Report issues on GitHub
- Check Chrome AI documentation: https://developer.chrome.com/docs/ai/built-in
- Join discussions about Chrome's built-in AI features

---

**Remember**: This extension provides AI capabilities while respecting your privacy. All processing happens locally - your data never leaves your device.
