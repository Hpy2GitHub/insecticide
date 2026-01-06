// Chrome API compatibility layer
// Note: Chrome now supports promises in MV3, but you may need to handle older versions
console.log("Insecticide content script loaded");

let insecticideActive = false;
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
  'code': 'lightslategray',
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
chrome.runtime.onMessage.addListener((message) => {
  console.log("Content script received message:", message);
  
  if (message.action === 'toggleInsecticide') {
    if (message.isActive) {
      activateInsecticide();
    } else {
      deactivateInsecticide();
    }
    return Promise.resolve({success: true});
  }
});

// Create a unique class name for insecticide borders
const insecticideClass = 'insecticide-border-' + Math.random().toString(36).substr(2, 9);

// Add CSS styles to the page (simplified - no overlay or will-change)
function addInsecticideStyles() {
  const styleId = 'insecticide-styles';
  
  // Remove existing styles if any
  const existingStyle = document.getElementById(styleId);
  if (existingStyle) {
    existingStyle.remove();
  }
  
  // Create style element
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .${insecticideClass} {
      box-sizing: border-box !important;
      contain: layout style paint !important;
    }
  `;
  
  document.head.appendChild(style);
}

// Function to get only visible elements in the viewport
function getVisibleElements() {
  const elements = [];
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;

  function traverse(node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const rect = node.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0 &&
          rect.bottom >= 0 && rect.top <= viewportHeight &&
          rect.right >= 0 && rect.left <= viewportWidth) {
        elements.push(node);
      }
      for (let child of node.children) {
        traverse(child);
      }
    }
  }

  traverse(document.body);
  return elements;
}

// Add outline to a single element
function addBorderToElement(element) {
  if (!element || element === document.documentElement || element === document.body) {
    return;
  }
  
  // Skip elements that already have our class
  if (element.classList.contains(insecticideClass)) {
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
  element.classList.add(insecticideClass);
  
  // Store original outline if needed
  if (!element.dataset.originalOutline) {
    element.dataset.originalOutline = element.style.outline || '';
    element.dataset.originalOutlineOffset = element.style.outlineOffset || '';
  }
  
  // Apply outline (more reliable than border)
  element.style.outline = `1px solid ${color} !important`;
  element.style.outlineOffset = `-1px !important`;
}

// Remove outline from a single element
function removeBorderFromElement(element) {
  if (!element || !element.classList.contains(insecticideClass)) {
    return;
  }
  
  element.classList.remove(insecticideClass);
  
  // Restore original outline
  if (element.dataset.originalOutline !== undefined) {
    element.style.outline = element.dataset.originalOutline;
    delete element.dataset.originalOutline;
  }
  
  if (element.dataset.originalOutlineOffset !== undefined) {
    element.style.outlineOffset = element.dataset.originalOutlineOffset;
    delete element.dataset.originalOutlineOffset;
  }
}

// Add outlines to visible elements only
function addBorders() {
  console.log("Adding borders to visible elements");
  
  // Add our CSS styles
  addInsecticideStyles();
  
  // Get only visible elements
  const visibleElements = getVisibleElements();
  console.log(`Found ${visibleElements.length} visible elements`);
  
  // Add borders in batches to avoid blocking
  const batchSize = 1000;
  let processed = 0;
  
  function processBatch(start) {
    const end = Math.min(start + batchSize, visibleElements.length);
    
    for (let i = start; i < end; i++) {
      addBorderToElement(visibleElements[i]);
    }
    
    processed = end;
    
    if (processed < visibleElements.length) {
      requestAnimationFrame(() => processBatch(processed));
    } else {
      console.log("Finished adding borders to visible elements");
      startObserving();
    }
  }
  
  processBatch(0);
}

// Remove borders from ALL elements (since some may have been added via observer)
function removeBorders() {
  console.log("Removing borders from all elements");
  
  // Stop observing
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  
  // Remove from all with class
  const elementsWithBorders = document.querySelectorAll(`.${insecticideClass}`);
  console.log(`Removing borders from ${elementsWithBorders.length} elements`);
  
  elementsWithBorders.forEach(element => {
    removeBorderFromElement(element);
  });
  
  // Remove our styles
  const styleElement = document.getElementById('insecticide-styles');
  if (styleElement) {
    styleElement.remove();
  }
  
  // Hide hover info if visible
  if (hoverInfoDiv) {
    hoverInfoDiv.style.display = 'none';
  }
}

// Observe DOM changes to add borders to new elements (only if visible)
function startObserving() {
  if (observer) {
    observer.disconnect();
  }
  
  observer = new MutationObserver((mutations) => {
    if (!insecticideActive) return;
    
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Add only if visible
            const rect = node.getBoundingClientRect();
            if (rect.bottom >= 0 && rect.top <= window.innerHeight &&
                rect.right >= 0 && rect.left <= window.innerWidth) {
              addBorderToElement(node);
            }
            
            // Check children recursively
            const childElements = node.querySelectorAll('*');
            childElements.forEach(child => {
              const childRect = child.getBoundingClientRect();
              if (childRect.bottom >= 0 && childRect.top <= window.innerHeight &&
                  childRect.right >= 0 && childRect.left <= window.innerWidth) {
                addBorderToElement(child);
              }
            });
          }
        });
      }
    }
  });
  
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
  
  console.log("Started observing DOM changes");
}

// Create hover info div - with body existence check
function createHoverInfoDiv() {
  // Wait for body to exist
  if (!document.body) {
    setTimeout(createHoverInfoDiv, 100);
    return;
  }
  
  if (hoverInfoDiv) {
    hoverInfoDiv.remove();
  }
  
  hoverInfoDiv = document.createElement('div');
  hoverInfoDiv.id = 'insecticide-hover-info';
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

// Update hover info - FIXED character encoding
function updateHoverInfo(element) {
  if (!hoverInfoDiv || !element) return;
  
  const tagName = element.tagName.toLowerCase();
  const id = element.id ? `#${element.id}` : '';
  
  // FIXED: Handle className properly (could be string or DOMTokenList)
  let classes = '';
  if (element.className) {
    if (typeof element.className === 'string') {
      classes = element.className ? `.${element.className.split(' ').filter(c => c).join('.')}` : '';
    } else if (element.classList && element.classList.length > 0) {
      classes = `.${Array.from(element.classList).join('.')}`;
    }
  }
  
  const color = elementColors[tagName] || elementColors['*'] || defaultColor;
  
  // FIXED: Proper multiplication symbol
  hoverInfoDiv.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
      <div style="flex: 1;">
        <strong style="color: #4CAF50;">Element:</strong> &lt;${tagName}${id}${classes}&gt;
        <br>
        <strong style="color: #4CAF50;">Dimensions:</strong> ${element.offsetWidth}px x ${element.offsetHeight}px
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
    if (!insecticideActive || !ctrlPressed) return;
    
    currentHoverElement = e.target;
    updateHoverInfo(currentHoverElement);
  }
  
  function handleMouseOut(e) {
    if (!insecticideActive || !hoverInfoDiv) return;
    
    if (currentHoverElement === e.target) {
      hoverInfoDiv.style.display = 'none';
      currentHoverElement = null;
    }
  }
  
  function handleKeyDown(e) {
    if (e.key === 'Control' || e.key === 'Meta') {
      ctrlPressed = true;
      if (insecticideActive && currentHoverElement) {
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

// Activate insecticide - with body existence check
function activateInsecticide() {
  if (insecticideActive) return;
  
  console.log("Activating insecticide");
  insecticideActive = true;
  
  // Create hover info div (with body check inside)
  createHoverInfoDiv();
  
  // Add borders to visible elements only
  addBorders();
  
  // Setup hover handlers
  setupHoverHandlers();
  
  // Add visual indicator - with body check
  function addIndicator() {
    if (!document.body) {
      setTimeout(addIndicator, 100);
      return;
    }
    
    const indicator = document.createElement('div');
    indicator.id = 'insecticide-active-indicator';
    indicator.textContent = 'INSECTICIDE ACTIVE (Ctrl + Hover for info)';
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
  
  addIndicator();
}

// Deactivate insecticide
function deactivateInsecticide() {
  if (!insecticideActive) return;
  
  console.log("Deactivating insecticide");
  insecticideActive = false;
  
  // Remove borders
  removeBorders();
  
  // Remove hover info
  if (hoverInfoDiv) {
    hoverInfoDiv.remove();
    hoverInfoDiv = null;
  }
  
  // Remove indicator
  const indicator = document.getElementById('insecticide-active-indicator');
  if (indicator) {
    indicator.remove();
  }
  
  currentHoverElement = null;
  ctrlPressed = false;
}

// Deactivate on first scroll
const handleInitialScroll = () => {
  if (insecticideActive) {
    // Notify background script to deactivate
    chrome.runtime.sendMessage({ action: 'deactivateOnScroll' });
    
    // Stop listening after first scroll
    window.removeEventListener('scroll', handleInitialScroll);
  }
};

// Use passive listener for better performance
window.addEventListener('scroll', handleInitialScroll, { passive: true });

// Send ready message
console.log("Insecticide content script ready");
