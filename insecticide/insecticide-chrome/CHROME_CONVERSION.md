# Chrome Extension Conversion Notes

This extension was automatically converted from Firefox to Chrome.

## Important Changes

1. **Background Script**: Converted to service worker for Chrome MV3
   - Service workers have no DOM access
   - No persistent state between events
   - May need refactoring if using timers/intervals

2. **API Namespace**: All `browser.*` calls changed to `chrome.*`
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

1. Open Chrome and go to `chrome://extensions/`
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
