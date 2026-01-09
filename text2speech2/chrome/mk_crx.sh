#!/usr/bin/bash
# Chrome extension packaging script

# Create temp directory
mkdir -p chrome_build

# Copy all necessary files
cp -r icons chrome_build/
cp -r options chrome_build/
cp -r popup chrome_build/
cp background.js chrome_build/
cp content.js chrome_build/
cp manifest.json chrome_build/

# Remove Firefox-specific files
rm -f chrome_build/mk_xpi.sh chrome_build/mk_icons.sh chrome_build/concat.sh 2>/dev/null

# Create zip file for Chrome Web Store
cd chrome_build
zip -r ../read-aloud-chrome.zip . -x '*.sh' '*.xpi'

# Create .crx if you have private key (optional)
# if [ -f ../key.pem ]; then
#     chrome --pack-extension=. --pack-extension-key=../key.pem
#     mv .crx ../read-aloud-chrome.crx
# fi

cd ..
echo "Chrome extension built:"
echo "  - Web Store ZIP: read-aloud-chrome.zip"
echo "  - Unpacked folder: chrome_build/"
