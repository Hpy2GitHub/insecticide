// Content script for Read Aloud extension
console.log('Read Aloud content script initialized');

(function() {
    let isHighlightingEnabled = true;
    let highlightColor = '#fff9c4';
    let currentHighlightElement = null;
    let paragraphRanges = [];

    init();

    function init() {
        setupMessageListeners();
        requestPreferences();
        setupMutationObserver();
        console.log('Content script ready');
    }

    function setupMessageListeners() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            console.log('Content received:', request.action);
            
            try {
                switch (request.action) {
                    case 'extractText':
                        const content = extractContent(request.option);
                        sendResponse({
                            success: true,
                            text: content,
                            url: window.location.href,
                            title: document.title
                        });
                        break;
                        
                    case 'getSelectedText':
                        const selectedText = getSelectedText();
                        sendResponse({
                            success: !!selectedText,
                            text: selectedText,
                            url: window.location.href,
                            title: document.title
                        });
                        break;
                        
                    case 'highlightTextProgressive':
                        if (request.position !== undefined) {
                            highlightTextWithPrediction(request.position, request.rate || 1);
                            sendResponse({ success: true });
                        } else {
                            sendResponse({ success: false, error: 'No position provided' });
                        }
                        break;
                        
                    case 'clearHighlight':
                        clearHighlight();
                        sendResponse({ success: true });
                        break;
                        
                    case 'prepareHighlighting':
                        prepareTextForHighlighting();
                        sendResponse({
                            success: true,
                            totalParagraphs: paragraphRanges.length
                        });
                        break;
                        
                    case 'statusUpdate':
                        if (request.status && request.status.preferences) {
                            updatePreferences(request.status.preferences);
                        }
                        sendResponse({ success: true });
                        break;

	  	    case 'ping':
                        // Respond to ping to confirm content script is loaded
                        sendResponse({ success: true, loaded: true });
                        break;
                        
                    default:
                        sendResponse({ success: false, error: 'Unknown action' });
                }
            } catch (error) {
                console.error('Content error:', error);
                sendResponse({ success: false, error: error.message });
            }
            
            return true;
        });
    }

    function requestPreferences() {
        chrome.runtime.sendMessage({ action: 'getPreferences' }, (response) => {
            if (response && response.preferences) {
                updatePreferences(response.preferences);
            }
        });
    }

    function updatePreferences(preferences) {
        isHighlightingEnabled = preferences.highlightText !== false;
        highlightColor = preferences.highlightColor || '#fff9c4';
        
        if (currentHighlightElement) {
            currentHighlightElement.style.backgroundColor = highlightColor;
        }
    }

    function setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            let shouldUpdate = false;
            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    shouldUpdate = true;
                    break;
                }
            }
            
            if (shouldUpdate) {
                prepareTextForHighlighting();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    function extractContent(option = 'fullPage') {
        let content = '';
        
        switch (option) {
            case 'articleOnly':
                content = extractArticleContent();
                break;
            case 'selectedText':
                content = getSelectedText() || extractArticleContent();
                break;
            case 'fullPage':
            default:
                content = extractMainContent();
                break;
        }

        return cleanText(content);
    }

    function extractArticleContent() {
        const selectors = [
            'article',
            '[role="main"]',
            'main',
            '[itemprop="articleBody"]',
            '.post-content',
            '.article-content',
            '.entry-content',
            '.content',
            '.main-content',
            '#content'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                return element.textContent;
            }
        }

        return extractMainContent();
    }

    function extractMainContent() {
        const nonContentSelectors = [
            'nav', 'header', 'footer', 'aside', 'form', 'script', 
            'style', 'noscript', 'iframe', 'object', 'embed'
        ];

        const bodyClone = document.body.cloneNode(true);

        nonContentSelectors.forEach(selector => {
            const elements = bodyClone.querySelectorAll(selector);
            elements.forEach(el => el.remove());
        });

        const nonContentClasses = [
            'nav', 'navbar', 'menu', 'sidebar', 'ad', 'advertisement', 
            'ads', 'comments', 'share', 'social', 'newsletter', 'subscribe'
        ];

        nonContentClasses.forEach(className => {
            const elements = bodyClone.querySelectorAll(`.${className}`);
            elements.forEach(el => el.remove());
        });

        return bodyClone.textContent;
    }

    function cleanText(text) {
        if (!text) return '';
        
        return text
            .replace(/\s+/g, ' ')
            .replace(/\n+/g, '\n')
            .replace(/\s\./g, '.')
            .trim();
    }

    function getSelectedText() {
        const selection = window.getSelection();
        if (!selection || selection.toString().trim().length === 0) {
            return null;
        }
        
        return cleanText(selection.toString());
    }

    function prepareTextForHighlighting() {
        if (!isHighlightingEnabled) {
            return;
        }
        
        paragraphRanges = [];
        
        const paragraphSelectors = [
            'p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
            'li', 'blockquote', 'pre', 'article > *', 'section > *'
        ];
        
        let currentGlobalCharIndex = 0;
        const paragraphElements = Array.from(document.querySelectorAll(paragraphSelectors.join(', ')));
        
        for (const element of paragraphElements) {
            if (!element.textContent.trim() || 
                element.style.display === 'none' || 
                element.hidden ||
                element.tagName === 'SCRIPT' ||
                element.tagName === 'STYLE') {
                continue;
            }
            
            const isChildOfParagraph = paragraphElements.some(parent => 
                parent !== element && parent.contains(element)
            );
            if (isChildOfParagraph) continue;
            
            const text = element.textContent.trim();
            if (text.length > 0) {
                const range = document.createRange();
                range.selectNodeContents(element);
                
                paragraphRanges.push({
                    range: range,
                    element: element,
                    startCharIndex: currentGlobalCharIndex,
                    endCharIndex: currentGlobalCharIndex + text.length,
                    text: text
                });
                
                currentGlobalCharIndex += text.length + 1;
            }
        }
        
        console.log(`Prepared ${paragraphRanges.length} paragraphs for highlighting`);
    }

    function highlightTextWithPrediction(charIndex, speechRate) {
        if (!isHighlightingEnabled) {
            return;
        }
        
        if (paragraphRanges.length === 0) {
            prepareTextForHighlighting();
        }
        
        const currentParagraphInfo = paragraphRanges.find(info => {
            return charIndex >= info.startCharIndex && charIndex < info.endCharIndex;
        });
        
        if (!currentParagraphInfo) {
            return;
        }
        
        const paragraphProgress = (charIndex - currentParagraphInfo.startCharIndex) / 
                                 (currentParagraphInfo.endCharIndex - currentParagraphInfo.startCharIndex);
        
        if (paragraphProgress >= 0.15) {
            clearHighlight();
            
            const element = currentParagraphInfo.element;
            element.style.backgroundColor = highlightColor;
            element.style.transition = 'background-color 0.3s ease';
            element.classList.add('read-aloud-highlight');
            
            currentHighlightElement = element;
            
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest'
            });
        }
    }

    function clearHighlight() {
        if (currentHighlightElement) {
            currentHighlightElement.style.backgroundColor = '';
            currentHighlightElement.classList.remove('read-aloud-highlight');
            currentHighlightElement = null;
        }
    }

    document.addEventListener('selectionchange', () => {
        const selectedText = getSelectedText();
        if (selectedText) {
            chrome.runtime.sendMessage({
                action: 'textSelected',
                text: selectedText
            }).catch(() => {
                // Background might not be ready
            });
        }
    });

})();
