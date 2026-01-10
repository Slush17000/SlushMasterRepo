// Highlight search terms when coming from search results
(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const highlightTerm = urlParams.get('highlight');
    
    if (highlightTerm && window.location.hash === '#search-highlight') {
        // Wait for page to load
        window.addEventListener('DOMContentLoaded', function() {
            const mainContent = document.querySelector('main') || document.body;
            
            // Find all text nodes containing the search term
            const walker = document.createTreeWalker(
                mainContent,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: function(node) {
                        // Skip script, style, and empty nodes
                        if (node.parentElement.tagName === 'SCRIPT' || 
                            node.parentElement.tagName === 'STYLE' ||
                            !node.textContent.trim()) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        
                        // Accept nodes that contain the search term
                        if (node.textContent.toLowerCase().includes(highlightTerm.toLowerCase())) {
                            return NodeFilter.FILTER_ACCEPT;
                        }
                        
                        return NodeFilter.FILTER_REJECT;
                    }
                }
            );
            
            let firstMatch = null;
            const textNodes = [];
            let node;
            
            while (node = walker.nextNode()) {
                textNodes.push(node);
            }
            
            // Wrap matches in mark tags
            textNodes.forEach(textNode => {
                const parent = textNode.parentElement;
                const text = textNode.textContent;
                const regex = new RegExp(`(${highlightTerm})`, 'gi');
                
                if (regex.test(text)) {
                    // Create a span to replace the text node
                    const span = document.createElement('span');
                    span.innerHTML = text.replace(regex, '<mark id="search-highlight">$1</mark>');
                    parent.replaceChild(span, textNode);
                    
                    // Remember the first match
                    if (!firstMatch) {
                        firstMatch = span.querySelector('mark');
                    }
                }
            });
            
            // Scroll to the first match
            if (firstMatch) {
                setTimeout(() => {
                    firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            }
        });
    }
})();
