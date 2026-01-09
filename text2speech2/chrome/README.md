# Read Aloud - Chrome Extension

A professional text-to-speech reader for web content with pause/resume functionality, now fully compatible with Manifest V3.

## ✨ Features

- 📖 Read entire web pages or selected text
- ⏯️ Pause and resume functionality  
- 🎚️ Adjustable voice, speed, pitch, and volume
- 🎨 Text highlighting as it's being read
- ⌨️ Keyboard shortcuts for quick access
- 🔧 Comprehensive settings page
- 💾 Persistent preferences across sessions

## 🏗️ Architecture

This extension uses **Manifest V3** with an **offscreen document** architecture to access the Web Speech API:

- **background.js** (Service Worker): Manages state and coordinates between components
- **offscreen.js** (Offscreen Document): Handles actual text-to-speech using Web Speech API
- **content.js** (Content Script): Extracts text from web pages and handles highlighting
- **popup.js**: User interface for controls
- **options.js**: Settings management page

## 📦 Installation

### From Source (Development)

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right corner)
4. Click "Load unpacked"
5. Select the extension folder containing `manifest.json`

### File Structure

```
read-aloud-extension/
├── manifest.json
├── background.js
├── offscreen.html
├── offscreen.js
├── content.js
├── popup/
│   ├── popup.html
│   └── popup.js
├── options/
│   ├── options.html
│   └── options.js
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## 🎯 Usage

### Reading Web Pages

1. Click the extension icon in your toolbar
2. Choose your reading mode:
   - **Read full page**: Reads all visible text on the page
   - **Read article content only**: Attempts to read only the main article
3. Adjust voice settings (voice, speed, pitch)
4. Click "Read Page" to start

### Reading Selected Text

1. Select text on any web page
2. Click the extension icon
3. Click "Read Selected" button
4. Or use the keyboard shortcut: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)

### Playback Controls

- **Play/Pause**: Click the pause button or press `Ctrl+Shift+S` (`Cmd+Shift+S` on Mac)
- **Stop**: Click the stop button or press `Ctrl+Shift+X` (`Cmd+Shift+X` on Mac)
- **Progress**: Watch the progress bar to see reading progress

## ⌨️ Keyboard Shortcuts

| Action | Windows/Linux | Mac |
|--------|--------------|-----|
| Toggle Play/Pause | `Ctrl+Shift+S` | `Cmd+Shift+S` |
| Stop Reading | `Ctrl+Shift+X` | `Cmd+Shift+X` |
| Read Selected Text | `Ctrl+Shift+R` | `Cmd+Shift+R` |

To customize shortcuts: `chrome://extensions/shortcuts`

## ⚙️ Settings

Access the settings page by clicking the gear icon in the popup or right-clicking the extension icon and selecting "Options".

### Voice Settings
- **Preferred Voice**: Choose from available system voices
- **Speaking Rate**: 0.5x to 2.0x speed
- **Pitch**: Adjust voice pitch
- **Volume**: Control playback volume

### Reading Preferences
- **Default Reading Mode**: Choose what to read by default
- **Auto-read**: Start reading automatically when popup opens
- **Text Highlighting**: Enable/disable highlighting of current text
- **Continue Reading**: Continue on page navigation

### Highlighting Settings
- **Highlight Color**: Choose the color for text highlighting
- **Preview**: See how highlighting will appear

## 🔒 Permissions

This extension requires the following permissions:

- **activeTab**: Access the current tab for reading content
- **scripting**: Inject content scripts for text extraction
- **storage**: Save user preferences
- **tabs**: Manage reading across tabs
- **offscreen**: Create offscreen document for Web Speech API access

## 🐛 Troubleshooting

### No voices available
- Ensure your system has text-to-speech voices installed
- On Windows: Settings > Time & Language > Speech
- On Mac: System Preferences > Accessibility > Spoken Content
- On Linux: Install `espeak` or `festival`

### Extension doesn't work on certain pages
- Chrome extensions cannot run on:
  - `chrome://` pages
  - Chrome Web Store pages
  - Other browser internal pages
- This is a security restriction by Chrome

### Text highlighting not working
- Make sure highlighting is enabled in settings
- Some websites may have CSS that conflicts with highlighting
- Try refreshing the page and reading again

### Reading stops unexpectedly
- Check if the page has changed (some single-page apps reload content)
- Try stopping and starting again
- Check browser console for errors (F12 > Console)

## 🛠️ Technical Details

### Web Speech API
This extension uses the browser's built-in Web Speech API, which provides:
- Natural-sounding voices
- Multiple language support
- Real-time speech synthesis
- No server-side processing required

### Manifest V3 Compatibility
The extension uses the latest Manifest V3 format with:
- Service worker background script
- Offscreen document for DOM APIs
- Declarative content scripts
- Chrome storage API for preferences

## 📝 Known Limitations

1. **Browser Dependency**: Requires Chrome/Chromium-based browsers
2. **Voice Quality**: Depends on system-installed voices
3. **Page Restrictions**: Cannot run on Chrome internal pages
4. **Popup Closure**: Popup must remain open during reading (service worker limitation)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## 📄 License

MIT License - feel free to use and modify as needed.

## 🔄 Version History

### v1.0.0
- Initial release with Manifest V3
- Offscreen document architecture
- Full pause/resume support
- Text highlighting
- Keyboard shortcuts
- Comprehensive settings page

## 💡 Tips for Best Experience

1. **Use quality voices**: Install high-quality TTS voices on your system
2. **Adjust speed**: Most people prefer 1.2x to 1.5x reading speed
3. **Use article mode**: For better accuracy on news sites and blogs
4. **Save preferences**: Your settings are automatically saved
5. **Keyboard shortcuts**: Learn the shortcuts for faster workflow

## 🆘 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check the troubleshooting section above
- Review Chrome extension documentation

---

**Enjoy hands-free reading! 📖🔊**
