// Prevent double loading
if (window.insecticideLoaded) {
  console.log("Insecticide: Already loaded, skipping");
} else {
  window.insecticideLoaded = true;

console.log("Insecticide content script loaded");

const MAX_BORDERED_ELEMENTS = 5000;
let borderedElementCount = 0;

let insecticideActive = false;
let hoverInfoDiv = null;
let currentHoverElement = null;
let ctrlPressed = false;
let observer = null;

// Element color mapping
const elementColors = {
  'div': 'red', 'span': 'blue', 'p': 'green', 'a': 'orange',
  'ul': 'purple', 'ol': 'purple', 'li': 'brown',
  'h1': 'darkred', 'h2': 'darkgreen', 'h3': 'darkblue',
  'h4': 'darkorange', 'h5': 'darkviolet', 'h6': 'darkcyan',
  'section': 'crimson', 'article': 'chocolate', 'nav': 'darkmagenta',
  'header': 'darkslateblue', 'footer': 'darkslategray', 'main': 'darkgoldenrod',
  'aside': 'darkkhaki', 'table': 'indigo', 'form': 'sienna',
  'input': 'teal', 'button': 'maroon', 'textarea': 'steelblue',
  'img': 'cadetblue', 'video': 'slateblue', 'canvas': 'orangered'
};

const defaultColor = 'gray';
const insecticideClass = 'insecticide-border-' + Math.random().toString(36).substr(2, 9);

// Message listener
browser.runtime.onMessage.addListener((message) => {
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

// Add CSS styles
function addInsecticideStyles() {
  console.log("Adding insecticide styles");
  const styleId = 'insecticide-styles';
  
  if (document.getElementById(styleId)) {
    return; // Already exists
  }
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .${insecticideClass} {
      box-sizing: border-box !important;
    }
  `;
  
  document.head.appendChild(style);
}

function addBorderToElement(element) {
  if (!element || element === document.documentElement || element === document.body) {
    return;
  }

  if (element.classList.contains(insecticideClass)) {
    return;
  }

  if (borderedElementCount >= MAX_BORDERED_ELEMENTS) {
    if (borderedElementCount === MAX_BORDERED_ELEMENTS) {
      console.warn(`Max element limit (${MAX_BORDERED_ELEMENTS}) reached`);
      borderedElementCount++;
    }
    return;
  }

  const tagName = element.tagName.toLowerCase();
  const color = elementColors[tagName] || defaultColor;

  if (color === 'transparent') {
    return;
  }

  element.classList.add(insecticideClass);
  borderedElementCount++;

  if (!element.dataset.originalBorder) {
    element.dataset.originalBorder = element.style.border || '';
  }

  element.style.border = `1px solid ${color}`;
  element.style.boxSizing = 'border-box';
}

function removeBorderFromElement(element) {
  if (!element || !element.classList.contains(insecticideClass)) {
    return;
  }
  
  element.classList.remove(insecticideClass);
  borderedElementCount = Math.max(0, borderedElementCount - 1);
  
  if (element.dataset.originalBorder !== undefined) {
    element.style.border = element.dataset.originalBorder;
    delete element.dataset.originalBorder;
  }
}

// Add borders to all elements
function addBorders() {
  console.log("Adding borders to all elements");
  
  addInsecticideStyles();
  
  const allElements = document.querySelectorAll('*');
  console.log(`Found ${allElements.length} elements`);
  
  borderedElementCount = 0; // Reset counter
  
  // Add borders in batches
  const batchSize = 1000;
  let processed = 0;
  
  function processBatch(start) {
    const end = Math.min(start + batchSize, allElements.length);
    
    for (let i = start; i < end; i++) {
      addBorderToElement(allElements[i]);
    }
    
    processed = end;
    
    if (processed < allElements.length) {
      requestAnimationFrame(() => processBatch(processed));
    } else {
      console.log(`Finished adding borders to ${borderedElementCount} elements`);
      startObserving();
    }
  }
  
  processBatch(0);
}

// Remove all borders
function removeBorders() {
  console.log("Removing all borders");
  
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  
  const elementsWithBorders = document.querySelectorAll(`.${insecticideClass}`);
  console.log(`Removing borders from ${elementsWithBorders.length} elements`);
  
  elementsWithBorders.forEach(element => {
    removeBorderFromElement(element);
  });
  
  borderedElementCount = 0; // Reset counter after removing all
  
  const styleElement = document.getElementById('insecticide-styles');
  if (styleElement) {
    styleElement.remove();
  }
  
  if (hoverInfoDiv) {
    hoverInfoDiv.style.display = 'none';
  }
}

// Observe DOM changes
function startObserving() {
  if (observer) {
    observer.disconnect();
  }

  observer = new MutationObserver((mutations) => {
    if (!insecticideActive) return;

    observer.disconnect();

    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.id === 'insecticide-hover-info' ||
                node.id === 'insecticide-active-indicator' ||
                node.id === 'insecticide-styles') {
              return;
            }

            addBorderToElement(node);

            if (borderedElementCount < MAX_BORDERED_ELEMENTS) {
              const childElements = node.querySelectorAll('*');
              childElements.forEach(child => addBorderToElement(child));
            }
          }
        });
      }
    }

    if (insecticideActive) {
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  console.log("Started observing DOM changes");
}

// Create hover info panel
function createHoverInfoDiv() {
  if (hoverInfoDiv) return;

  hoverInfoDiv = document.createElement('div');
  hoverInfoDiv.id = 'insecticide-hover-info';
  hoverInfoDiv.style.cssText = `
    position: fixed;
    top: 60px;
    right: 10px;
    width: 350px;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 12px 15px;
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 11px;
    z-index: 2147483647;
    display: none;
    border: 1px solid #4CAF50;
    border-radius: 4px;
    max-height: 200px;
    overflow-y: auto;
    line-height: 1.4;
    pointer-events: none;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  `;
  document.body.appendChild(hoverInfoDiv);
}

function updateHoverInfo(element) {
  if (!hoverInfoDiv || !element) return;
  
  hoverInfoDiv.textContent = '';
  
  const tagName = element.tagName.toLowerCase();
  const id = element.id ? `#${element.id}` : '';
  const classes = element.className ? `.${element.className.split(' ').join('.')}` : '';
  
  const infoLine = document.createElement('div');
  infoLine.textContent = `<${tagName}${id}${classes}> | ${element.offsetWidth}×${element.offsetHeight}px`;
  
  hoverInfoDiv.appendChild(infoLine);
  hoverInfoDiv.style.display = 'block';
}

// Event handlers
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

// Activate
function activateInsecticide() {
  if (insecticideActive) {
    console.log("Already active");
    return;
  }
  
  console.log("Activating insecticide");
  insecticideActive = true;
  
  if (!document.body) {
    setTimeout(activateInsecticide, 100);
    return;
  }
  
  createHoverInfoDiv();
  addBorders();
  setupHoverHandlers();
  
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

// Deactivate
function deactivateInsecticide() {
  if (!insecticideActive) {
    console.log("Already inactive");
    return;
  }
  
  console.log("Deactivating insecticide");
  insecticideActive = false;
  
  removeBorders();
  
  if (hoverInfoDiv) {
    hoverInfoDiv.remove();
    hoverInfoDiv = null;
  }
  
  const indicator = document.getElementById('insecticide-active-indicator');
  if (indicator) {
    indicator.remove();
  }
  
  currentHoverElement = null;
  ctrlPressed = false;
}

console.log("Insecticide initialized");
}
