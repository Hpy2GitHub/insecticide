#!/usr/bin/env node

/**
 * Firefox to Chrome Extension Converter
 * Converts Firefox extensions to Chrome-compatible versions
 * 
 * Usage: node convert-ff-to-chrome.js <source-dir> <output-dir>
 */

const fs = require('fs');
const path = require('path');

// Configuration
const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.git/,
  /\.DS_Store/,
  /package-lock\.json/,
  /yarn\.lock/
];

const JS_EXTENSIONS = ['.js'];
const JSON_EXTENSIONS = ['.json'];

function log(message, type = 'info') {
  const prefix = {
    info: '→',
    success: '✓',
    warning: '⚠',
    error: '✗'
  }[type] || '→';
  
  console.log(`${prefix} ${message}`);
}

function shouldExclude(filePath) {
  return EXCLUDE_PATTERNS.some(pattern => pattern.test(filePath));
}

function convertManifest(manifestContent) {
  const manifest = JSON.parse(manifestContent);
  
  // Remove Firefox-specific fields
  delete manifest.browser_specific_settings;
  
  // Ensure Chrome-compatible structure
  if (manifest.background && manifest.background.scripts) {
    // MV3 for Chrome uses service_worker
    manifest.background = {
      service_worker: manifest.background.scripts[0]
    };
    
    log('Converted background scripts to service_worker', 'warning');
    log('Note: You may need to refactor background.js for service worker context', 'warning');
  }
  
  // Chrome-specific optimizations
  if (!manifest.minimum_chrome_version) {
    manifest.minimum_chrome_version = '88';
  }
  
  // Update name if it contains "Firefox"
  if (manifest.name && manifest.name.includes('Firefox')) {
    manifest.name = manifest.name.replace(/for Firefox/gi, 'for Chrome');
  }
  
  return JSON.stringify(manifest, null, 2);
}

function convertJavaScript(jsContent) {
  let converted = jsContent;
  
  // Replace browser.* with chrome.*
  converted = converted.replace(/\bbrowser\./g, 'chrome.');
  
  // Add polyfill comment at the top of files that use chrome API
  if (converted.includes('chrome.')) {
    const polyfillComment = `// Chrome API compatibility layer
// Note: Chrome now supports promises in MV3, but you may need to handle older versions
`;
    if (!converted.startsWith('//')) {
      converted = polyfillComment + converted;
    }
  }
  
  return converted;
}

function copyDirectory(src, dest) {
  // Create destination directory
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (shouldExclude(srcPath)) {
      continue;
    }
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      const ext = path.extname(entry.name);
      
      if (entry.name === 'manifest.json') {
        // Convert manifest
        const content = fs.readFileSync(srcPath, 'utf8');
        const converted = convertManifest(content);
        fs.writeFileSync(destPath, converted, 'utf8');
        log(`Converted ${entry.name}`, 'success');
      } else if (JS_EXTENSIONS.includes(ext)) {
        // Convert JavaScript
        const content = fs.readFileSync(srcPath, 'utf8');
        const converted = convertJavaScript(content);
        fs.writeFileSync(destPath, converted, 'utf8');
        log(`Converted ${entry.name}`, 'success');
      } else {
        // Copy as-is
        fs.copyFileSync(srcPath, destPath);
        log(`Copied ${entry.name}`, 'info');
      }
    }
  }
}

function createReadme(destDir) {
  const readme = `# Chrome Extension Conversion Notes

This extension was automatically converted from Firefox to Chrome.

## Important Changes

1. **Background Script**: Converted to service worker for Chrome MV3
   - Service workers have no DOM access
   - No persistent state between events
   - May need refactoring if using timers/intervals

2. **API Namespace**: All \`browser.*\` calls changed to \`chrome.*\`
   - Chrome now supports promises in MV3
   - Older Chrome versions may need callback handling

3. **Manifest**: Removed Firefox-specific fields

## Testing Checklist

- [ ] Test keyboard shortcuts (may need adjustment)
- [ ] Verify storage persistence
- [ ] Check background script functionality
- [ ] Test content script injection
- [ ] Verify icon display
- [ ] Test all user-facing features

## Loading in Chrome

1. Open Chrome and go to \`chrome://extensions/\`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select this directory

## Known Limitations

- Service worker limitations may require code refactoring
- Some Firefox-specific APIs may not have direct Chrome equivalents

## Next Steps

1. Review the background script for service worker compatibility
2. Test thoroughly in Chrome
3. Update any Firefox-specific code patterns
`;

  fs.writeFileSync(path.join(destDir, 'CHROME_CONVERSION.md'), readme, 'utf8');
  log('Created conversion notes', 'success');
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: node convert-ff-to-chrome.js <source-dir> <output-dir>');
    process.exit(1);
  }
  
  const [sourceDir, outputDir] = args;
  
  if (!fs.existsSync(sourceDir)) {
    log(`Source directory not found: ${sourceDir}`, 'error');
    process.exit(1);
  }
  
  const manifestPath = path.join(sourceDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    log('No manifest.json found in source directory', 'error');
    process.exit(1);
  }
  
  log(`Converting extension from ${sourceDir} to ${outputDir}...`, 'info');
  console.log('');
  
  try {
    copyDirectory(sourceDir, outputDir);
    createReadme(outputDir);
    
    console.log('');
    log('Conversion complete!', 'success');
    console.log('');
    log('⚠  IMPORTANT: Review CHROME_CONVERSION.md for manual steps', 'warning');
    log('⚠  Test thoroughly before publishing', 'warning');
    console.log('');
    log(`Load in Chrome: chrome://extensions/ → Load unpacked → ${outputDir}`, 'info');
  } catch (error) {
    log(`Conversion failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { convertManifest, convertJavaScript };
