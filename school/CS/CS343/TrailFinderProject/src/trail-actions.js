// Trail Actions Module
// Handles marking trails as completed or favorite

class TrailActions {
    constructor() {
        this.dataManager = null;
    }

    // Initialize with UserDataManager instance
    init(dataManager) {
        this.dataManager = dataManager;
    }

    // Mark trail as completed
    markCompleted(trail) {
        if (!this.dataManager) {
            console.error('TrailActions not initialized with UserDataManager');
            return false;
        }

        // Check if trail is already completed
        const existingHike = this.dataManager.completedHikes.find(h => h.name === trail.name);
        if (existingHike) {
            alert('You have already marked this trail as completed!');
            return false;
        }

        // Create completed hike object
        const completedHike = {
            name: trail.name,
            location: typeof trail.location === 'string' ? trail.location : `${trail.location.city}, ${trail.location.state}`,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            distance: trail.length,
            difficulty: this.capitalize(trail.difficulty)
        };

        // Add to completed hikes
        this.dataManager.addHike(completedHike);
        
        // Show success message
        this.showToast('Success!', `${trail.name} marked as completed!`, 'success');
        
        return true;
    }

    // Mark trail as favorite
    markFavorite(trail) {
        if (!this.dataManager) {
            console.error('TrailActions not initialized with UserDataManager');
            return false;
        }

        // Check if trail is already a favorite
        const existingFavorite = this.dataManager.favorites.find(f => f.name === trail.name);
        if (existingFavorite) {
            alert('This trail is already in your favorites!');
            return false;
        }

        // Create favorite object
        const favorite = {
            name: trail.name,
            location: typeof trail.location === 'string' ? trail.location : `${trail.location.city}, ${trail.location.state}`,
            distance: trail.length,
            difficulty: this.capitalize(trail.difficulty),
            rating: trail.rating,
            description: trail.description
        };

        // Add to favorites
        this.dataManager.addFavorite(favorite);
        
        // Show success message
        this.showToast('Success!', `${trail.name} added to favorites!`, 'success');
        
        return true;
    }

    // Helper function to capitalize first letter
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Show toast notification
    showToast(title, message, type = 'info') {
        // Create toast container if it doesn't exist
        let toastContainer = document.getElementById('trailActionsToastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'trailActionsToastContainer';
            toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            toastContainer.style.zIndex = '9999';
            document.body.appendChild(toastContainer);
        }

        // Create toast element
        const toastId = `toast-${Date.now()}`;
        const bgClass = type === 'success' ? 'bg-success' : type === 'danger' ? 'bg-danger' : 'bg-info';
        
        const toastHTML = `
            <div id="${toastId}" class="toast align-items-center text-white ${bgClass} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        <strong>${title}</strong><br>
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `;

        toastContainer.insertAdjacentHTML('beforeend', toastHTML);

        // Initialize and show toast
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: 3000 });
        toast.show();

        // Remove toast after it's hidden
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }

    // Add action buttons to a trail card
    addActionButtons(trailCard, trail) {
        // Check if buttons already exist
        if (trailCard.querySelector('.trail-action-buttons')) {
            return;
        }

        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'trail-action-buttons mt-3';
        buttonContainer.innerHTML = `
            <button class="btn btn-success btn-sm mark-completed-btn me-2" data-trail-name="${trail.name}">
                <span>✓</span> Mark Completed
            </button>
            <button class="btn btn-warning btn-sm mark-favorite-btn" data-trail-name="${trail.name}">
                <span>★</span> Mark Favorite
            </button>
        `;

        // Find the card body and append buttons
        const cardBody = trailCard.querySelector('.card-body');
        if (cardBody) {
            cardBody.appendChild(buttonContainer);

            // Add event listeners
            const completedBtn = buttonContainer.querySelector('.mark-completed-btn');
            const favoriteBtn = buttonContainer.querySelector('.mark-favorite-btn');

            completedBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.markCompleted(trail);
            });

            favoriteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.markFavorite(trail);
            });
        }
    }
}

// Create global instance
const trailActions = new TrailActions();
