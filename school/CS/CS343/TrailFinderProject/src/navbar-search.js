// Navbar search functionality
(function() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNavbarSearch);
    } else {
        initNavbarSearch();
    }

    function initNavbarSearch() {
        // Find all navbar search forms
        const searchForms = document.querySelectorAll('nav form[role="search"]');
        
        searchForms.forEach(form => {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // Get the search input from this form
                const searchInput = form.querySelector('input[type="search"]');
                const query = searchInput ? searchInput.value.trim() : '';
                
                if (query) {
                    // Redirect to search results page with query
                    window.location.href = `search-results.html?q=${encodeURIComponent(query)}`;
                }
            });
        });
    }
})();
