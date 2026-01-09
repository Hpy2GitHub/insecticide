Page Reloader Extension
=======================

1. Create a folder named "reloader-extension"
2. Place all the provided files in the folder.
3. Ensure you have the icons in the icons folder:
   - icon16.png (16x16 pixels)
   - icon48.png (48x48 pixels)
   - icon128.png (128x128 pixels)

4. Open Chrome and go to: chrome://extensions/
5. Enable "Developer mode" (toggle in top right)
6. Click "Load unpacked" and select the "reloader-extension" folder.
7. The extension should appear in your toolbar.

To use: Click the extension icon and then click the "Reload Page" button.

Note: The extension only reloads the current active tab.

instant-reloader/
├── manifest.json
├── background.js
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
