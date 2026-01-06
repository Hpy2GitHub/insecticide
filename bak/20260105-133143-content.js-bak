console.log("Pesticide content script loaded");

let pesticideActive = false;
let hoverInfoDiv = null;
let currentHoverElement = null;
let ctrlPressed = false;
let observer = null;

// COMPLETE element type to color mapping (all HTML5 elements + more)
const elementColors = {
  // Structural
  'div': 'red',
  'span': 'blue',
  'p': 'green',
  'a': 'orange',
  'ul': 'purple',
  'ol': 'purple',
  'li': 'brown',
  
  // Headings
  'h1': 'darkred',
  'h2': 'darkgreen',
  'h3': 'darkblue',
  'h4': 'darkorange',
  'h5': 'darkviolet',
  'h6': 'darkcyan',
  
  // Semantic
  'section': 'crimson',
  'article': 'chocolate',
  'nav': 'darkmagenta',
  'header': 'darkslateblue',
  'footer': 'darkslategray',
  'main': 'darkgoldenrod',
  'aside': 'darkkhaki',
  'figure': 'darkolivegreen',
  'figcaption': 'darksalmon',
  'details': 'darkseagreen',
  'summary': 'darkslategrey',
  'mark': 'yellow',
  'time': 'lightgray',
  'progress': 'mediumseagreen',
  'meter': 'mediumaquamarine',
  
  // Tables
  'table': 'indigo',
  'thead': 'indigo',
  'tbody': 'indigo',
  'tfoot': 'indigo',
  'tr': 'mediumvioletred',
  'td': 'midnightblue',
  'th': 'navy',
  'caption': 'mediumpurple',
  'colgroup': 'mediumslateblue',
  'col': 'mediumorchid',
  
  // Forms
  'form': 'sienna',
  'input': 'teal',
  'button': 'maroon',
  'textarea': 'steelblue',
  'select': 'rosybrown',
  'option': 'rosybrown',
  'optgroup': 'saddlebrown',
  'label': 'peru',
  'fieldset': 'sandybrown',
  'legend': 'sienna',
  'datalist': 'slategrey',
  'output': 'tan',
  
  // Media
  'img': 'cadetblue',
  'video': 'slateblue',
  'audio': 'dimgray',
  'source': 'gray',
  'track': 'darkgray',
  'canvas': 'orangered',
  'svg': 'mediumvioletred',
  'path': 'mediumorchid',
  'circle': 'mediumpurple',
  'rect': 'mediumslateblue',
  'polygon': 'mediumorchid',
  
  // Text formatting
  'strong': 'darkred',
  'em': 'darkgreen',
  'i': 'darkblue',
  'b': 'darkorange',
  'u': 'darkviolet',
  's': 'darkcyan',
  'sup': 'darksalmon',
  'sub': 'darkseagreen',
  'small': 'lightslategray',
  'code': 'black',
  'pre': 'dimgray',
  'blockquote': 'silver',
  'q': 'lightsteelblue',
  'cite': 'lightgray',
  'abbr': 'lightcyan',
  'address': 'lightyellow',
  
  // Lists
  'dl': 'purple',
  'dt': 'mediumvioletred',
  'dd': 'midnightblue',
  
  // Interactive
  'menu': 'darkmagenta',
  'menuitem': 'darkorchid',
  'dialog': 'darkgoldenrod',
  
  // Embedding
  'iframe': 'black',
  'embed': 'darkslateblue',
  'object': 'darkslategray',
  'param': 'dimgray',
  
  // Ruby annotations
  'ruby': 'firebrick',
  'rt': 'firebrick',
  'rp': 'firebrick',
  
  // Other
  'wbr': 'transparent',
  'br': 'transparent',
  'hr': 'gray',
  'area': 'lightblue',
  'map': 'lightcoral',
  'picture': 'lightcyan',
  'template': 'lightgray',
  'slot': 'lightpink',
  'shadow': 'lightskyblue',
  
  // Web components / custom elements
  '*': 'hotpink' // For custom elements
};

const defaultColor = 'gray';

// Message listener
browser.runtime.onMessage.addListener((message) => {
  console.log("Content script received message:", message);
  
  if (message.action === 'togglePesticide') {
    if (message.isActive) {
      activatePesticide();
    } else {
      deactivatePesticide();
    }
    return Promise.resolve({success: true});
  }
});

// Create a unique class name for pesticide borders
const pesticideClass = 'pesticide-border-' + Math.random().toString(36).substr(2, 9);

// Add CSS styles to the page
function addPesticideStyles() {
  const styleId = 'pesticide-styles';
  
  // Remove existing styles if any
  const existingStyle = document.getElementById(styleId);
  if (existingStyle) {
    existingStyle.remove();
  }
  
  // Create style element
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .${pesticideClass} {
      box-sizing: border-box !important;
      position: relative !important;
      background-clip: padding-box !important;
    }
    
    /* Force borders to stay visible */
    .${pesticideClass}::before {
      content: '' !important;
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      pointer-events: none !important;
      z-index: 2147483647 !important; /* Maximum z-index */
    }
    
    /* Ensure borders are visible during scrolling */
    .${pesticideClass}, .${pesticideClass} * {
      will-change: transform !important;
      backface-visibility: visible !important;
    }
    
    /* Make sure borders don't affect layout */
    .${pesticideClass} {
      contain: layout style paint !important;
    }
  `;
  
  document.head.appendChild(style);
}

// Add border to a single element
function addBorderToElement(element) {
  if (!element || element === document.documentElement || element === document.body) {
    return;
  }
  
  // Skip elements that already have our border
  if (element.classList.contains(pesticideClass)) {
    return;
  }
  
  const tagName = element.tagName.toLowerCase();
  const color = elementColors[tagName] || 
                elementColors['*'] || 
                defaultColor;
  
  // Skip transparent elements (like br, wbr)
  if (color === 'transparent') {
    return;
  }
  
  // Add our class
  element.classList.add(pesticideClass);
  
  // Store original border
  if (!element.dataset.originalBorder) {
    element.dataset.originalBorder = element.style.border || '';
    element.dataset.originalBoxSizing = element.style.boxSizing || '';
  }
  
  // Apply border
  element.style.border = `1px solid ${color} !important`;
  element.style.boxSizing = 'border-box !important';
  
  // Use CSS custom property for the color
  element.style.setProperty('--pesticide-color', color, 'important');
  
  // Add a pseudo-element for the border to make it more persistent
  element.style.setProperty('border-color', color, 'important');
}

// Remove border from a single element
function removeBorderFromElement(element) {
  if (!element || !element.classList.contains(pesticideClass)) {
    return;
  }
  
  element.classList.remove(pesticideClass);
  
  // Restore original border
  if (element.dataset.originalBorder !== undefined) {
    element.style.border = element.dataset.originalBorder;
    delete element.dataset.originalBorder;
  }
  
  if (element.dataset.originalBoxSizing !== undefined) {
    element.style.boxSizing = element.dataset.originalBoxSizing;
    delete element.dataset.originalBoxSizing;
  }
  
  // Remove custom property
  element.style.removeProperty('--pesticide-color');
  element.style.removeProperty('border-color');
}

// Add borders to ALL elements
function addBorders() {
  console.log("Adding borders to all elements");
  
  // Add our CSS styles
  addPesticideStyles();
  
  // Get ALL elements
  const allElements = document.querySelectorAll('*');
  console.log(`Found ${allElements.length} total elements`);
  
  // Add borders in batches to avoid blocking
  const batchSize = 1000;
  let processed = 0;
  
  function processBatch(start) {
    const end = Math.min(start + batchSize, allElements.length);
    
    for (let i = start; i < end; i++) {
      addBorderToElement(allElements[i]);
    }
    
    processed = end;
    
    if (processed < allElements.length) {
      // Process next batch on next animation frame
      requestAnimationFrame(() => processBatch(processed));
    } else {
      console.log("Finished adding borders to all elements");
      startObserving();
    }
  }
  
  processBatch(0);
}

// Remove borders from ALL elements
function removeBorders() {
  console.log("Removing borders from all elements");
  
  // Stop observing
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  
  // Remove all borders
  const elementsWithBorders = document.querySelectorAll(`.${pesticideClass}`);
  console.log(`Removing borders from ${elementsWithBorders.length} elements`);
  
  elementsWithBorders.forEach(element => {
    removeBorderFromElement(element);
  });
  
  // Remove our styles
  const styleElement = document.getElementById('pesticide-styles');
  if (styleElement) {
    styleElement.remove();
  }
  
  // Hide hover info if visible
  if (hoverInfoDiv) {
    hoverInfoDiv.style.display = 'none';
  }
}

// Observe DOM changes to add borders to new elements
function startObserving() {
  if (observer) {
    observer.disconnect();
  }
  
  observer = new MutationObserver((mutations) => {
    if (!pesticideActive) return;
    
    for (const mutation of mutations) {
      // Handle added nodes
      if (mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Add border to this element
            addBorderToElement(node);
            
            // Also add borders to all children
            const childElements = node.querySelectorAll('*');
            childElements.forEach(child => addBorderToElement(child));
          }
        });
      }
    }
  });
  
  // Start observing the entire document
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
  
  console.log("Started observing DOM changes");
}

// Handle scroll events to ensure borders stay visible
function setupScrollHandler() {
  let scrollTimeout = null;
  
  const handleScroll = () => {
    // When scrolling, ensure borders are still visible
    if (pesticideActive) {
      // Force a re-render of borders
      document.querySelectorAll(`.${pesticideClass}`).forEach(element => {
        // This forces the browser to repaint the border
        element.style.borderStyle = 'solid';
      });
    }
    
    // Clear timeout
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
    
    // Set a timeout to re-apply borders after scrolling stops
    scrollTimeout = setTimeout(() => {
      if (pesticideActive) {
        // Reapply borders to ensure they're visible
        const elements = document.querySelectorAll('*');
        elements.forEach(element => {
          if (element.classList.contains(pesticideClass)) {
            const tagName = element.tagName.toLowerCase();
            const color = elementColors[tagName] || 
                         elementColors['*'] || 
                         defaultColor;
            if (color !== 'transparent') {
              element.style.border = `1px solid ${color} !important`;
            }
          }
        });
      }
    }, 100);
  };
  
  window.addEventListener('scroll', handleScroll, { passive: true });
  
  // Also listen for resize and orientation changes
  window.addEventListener('resize', handleScroll);
  window.addEventListener('orientationchange', handleScroll);
}

// Create hover info div
function createHoverInfoDiv() {
  if (hoverInfoDiv) {
    hoverInfoDiv.remove();
  }
  
  hoverInfoDiv = document.createElement('div');
  hoverInfoDiv.id = 'pesticide-hover-info';
  hoverInfoDiv.style.cssText = `
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 12px 15px;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 11px;
    z-index: 2147483647;
    display: none;
    border-top: 2px solid #4CAF50;
    max-height: 150px;
    overflow-y: auto;
    line-height: 1.4;
  `;
  document.body.appendChild(hoverInfoDiv);
}

// Update hover info
function updateHoverInfo(element) {
  if (!hoverInfoDiv || !element) return;
  
  const tagName = element.tagName.toLowerCase();
  const id = element.id ? `#${element.id}` : '';
  const classes = element.className && typeof element.className === 'string' 
    ? `.${element.className.split(' ').join('.')}` 
    : '';
  const color = elementColors[tagName] || elementColors['*'] || defaultColor;
  
  hoverInfoDiv.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
      <div style="flex: 1;">
        <strong style="color: #4CAF50;">Element:</strong> &lt;${tagName}${id}${classes}&gt;
        <br>
        <strong style="color: #4CAF50;">Dimensions:</strong> ${element.offsetWidth}px × ${element.offsetHeight}px
        <br>
        <strong style="color: #4CAF50;">Position:</strong> X:${element.offsetLeft}, Y:${element.offsetTop}
        <br>
        <strong style="color: #4CAF50;">Color:</strong> <span style="color: ${color};">${color}</span>
      </div>
      <div style="margin-left: 15px; font-size: 10px; opacity: 0.7;">
        Press Ctrl + Hover
      </div>
    </div>
  `;
  
  hoverInfoDiv.style.display = 'block';
}

// Event handlers for hover info
function setupHoverHandlers() {
  function handleMouseOver(e) {
    if (!pesticideActive || !ctrlPressed) return;
    
    currentHoverElement = e.target;
    updateHoverInfo(currentHoverElement);
  }
  
  function handleMouseOut(e) {
    if (!pesticideActive || !hoverInfoDiv) return;
    
    if (currentHoverElement === e.target) {
      hoverInfoDiv.style.display = 'none';
      currentHoverElement = null;
    }
  }
  
  function handleKeyDown(e) {
    if (e.key === 'Control' || e.key === 'Meta') {
      ctrlPressed = true;
      if (pesticideActive && currentHoverElement) {
        updateHoverInfo(currentHoverElement);
      }
    }
  }
  
  function handleKeyUp(e) {
    if (e.key === 'Control' || e.key === 'Meta') {
      ctrlPressed = false;
      if (hoverInfoDiv) {
        hoverInfoDiv.style.display = 'none';
      }
    }
  }
  
  document.addEventListener('mouseover', handleMouseOver, true);
  document.addEventListener('mouseout', handleMouseOut, true);
  document.addEventListener('keydown', handleKeyDown, true);
  document.addEventListener('keyup', handleKeyUp, true);
}

// Activate pesticide
function activatePesticide() {
  if (pesticideActive) return;
  
  console.log("Activating pesticide");
  pesticideActive = true;
  
  // Create hover info div
  createHoverInfoDiv();
  
  // Add borders to all elements
  addBorders();
  
  // Setup scroll handler to maintain borders
  setupScrollHandler();
  
  // Setup hover handlers
  setupHoverHandlers();
  
  // Add visual indicator
  const indicator = document.createElement('div');
  indicator.id = 'pesticide-active-indicator';
  indicator.textContent = 'PESTICIDE ACTIVE (Ctrl + Hover for info)';
  indicator.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: #4CAF50;
    color: white;
    padding: 8px 12px;
    z-index: 2147483646;
    font-family: Arial, sans-serif;
    font-size: 12px;
    border-radius: 4px;
    font-weight: bold;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    pointer-events: none;
  `;
  document.body.appendChild(indicator);
}

// Deactivate pesticide
function deactivatePesticide() {
  if (!pesticideActive) return;
  
  console.log("Deactivating pesticide");
  pesticideActive = false;
  
  // Remove borders
  removeBorders();
  
  // Remove hover info
  if (hoverInfoDiv) {
    hoverInfoDiv.remove();
    hoverInfoDiv = null;
  }
  
  // Remove indicator
  const indicator = document.getElementById('pesticide-active-indicator');
  if (indicator) {
    indicator.remove();
  }
  
  // Remove event listeners
  // (We could keep track of them, but for simplicity, we'll rely on garbage collection)
}

// Send ready message
console.log("Pesticide content script ready");

// Optional: Auto-activate if the extension was active before page reload
browser.storage.local.get(['pesticideActive']).then(result => {
  if (result.pesticideActive) {
    // Wait a bit for the page to fully load
    setTimeout(() => {
      if (document.readyState === 'complete') {
        activatePesticide();
      } else {
        window.addEventListener('load', () => activatePesticide());
      }
    }, 100);
  }
});
