// User Details Page UI Manager
document.addEventListener('DOMContentLoaded', function() {
    const dataManager = new UserDataManager();
    
    // Initialize displays
    updateStatistics();
    renderFavorites();
    renderCompletedHikes();
    renderReviews();

    // Update statistics
    function updateStatistics() {
        const stats = dataManager.calculateStats();
        document.getElementById('statHikesCompleted').textContent = stats.hikesCompleted;
        document.getElementById('statMilesHiked').textContent = stats.milesHiked;
        document.getElementById('statReviewsWritten').textContent = stats.reviewsWritten;
        document.getElementById('statFavoriteTrails').textContent = stats.favoriteTrails;
    }

    // Render Favorites
    function renderFavorites() {
        const container = document.getElementById('favoritesContainer');
        if (!container) return;
        
        if (dataManager.favorites.length === 0) {
            container.innerHTML = '<div class="alert alert-info">No favorite hikes yet. Add one to get started!</div>';
            return;
        }

        container.innerHTML = dataManager.favorites.map(fav => `
            <div class="list-group-item list-group-item-action">
                <div class="d-flex w-100 justify-content-between align-items-center">
                    <div class="flex-grow-1">
                        <h3 class="mb-1 h5">${fav.name}</h3>
                        <p class="mb-1">${fav.location} • ${fav.distance} miles • ${fav.difficulty}</p>
                        <small>${fav.description}</small>
                    </div>
                    <div class="d-flex align-items-center ms-2">
                        <span class="stars me-2" aria-label="Rating: ${fav.rating} out of 5 stars" role="img">${dataManager.generateStars(fav.rating)}</span>
                        <button class="btn btn-sm btn-outline-primary edit-favorite me-1" data-id="${fav.id}">Edit</button>
                        <button class="btn btn-sm btn-outline-danger delete-favorite" data-id="${fav.id}">Delete</button>
                    </div>
                </div>
            </div>
        `).join('');

        // Add event listeners
        container.querySelectorAll('.edit-favorite').forEach(btn => {
            btn.addEventListener('click', () => editFavorite(parseInt(btn.dataset.id)));
        });
        container.querySelectorAll('.delete-favorite').forEach(btn => {
            btn.addEventListener('click', () => deleteFavorite(parseInt(btn.dataset.id)));
        });
    }

    // Render Completed Hikes
    function renderCompletedHikes() {
        const container = document.getElementById('hikesContainer');
        if (!container) return;
        
        if (dataManager.completedHikes.length === 0) {
            container.innerHTML = '<tr><td colspan="6" class="text-center">No completed hikes yet. Add one to track your progress!</td></tr>';
            return;
        }

        container.innerHTML = dataManager.completedHikes.map(hike => `
            <tr>
                <td>${hike.name}</td>
                <td>${hike.location}</td>
                <td>${hike.date}</td>
                <td>${hike.distance} miles</td>
                <td><span class="badge ${dataManager.getDifficultyBadgeClass(hike.difficulty)}">${hike.difficulty}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary edit-hike me-1" data-id="${hike.id}">Edit</button>
                    <button class="btn btn-sm btn-outline-danger delete-hike" data-id="${hike.id}">Delete</button>
                </td>
            </tr>
        `).join('');

        // Add event listeners
        container.querySelectorAll('.edit-hike').forEach(btn => {
            btn.addEventListener('click', () => editHike(parseInt(btn.dataset.id)));
        });
        container.querySelectorAll('.delete-hike').forEach(btn => {
            btn.addEventListener('click', () => deleteHike(parseInt(btn.dataset.id)));
        });
    }

    // Render Reviews
    function renderReviews() {
        const container = document.getElementById('reviewsContainer');
        if (!container) return;
        
        if (dataManager.reviews.length === 0) {
            container.innerHTML = '<div class="alert alert-info">No reviews yet. Share your trail experience!</div>';
            return;
        }

        container.innerHTML = dataManager.reviews.map(review => `
            <article class="card mb-3">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h3 class="card-title mb-0 h5">${review.name}</h3>
                        <div>
                            <span class="stars me-2" aria-label="Rating: ${review.rating} out of 5 stars" role="img">${dataManager.generateStars(review.rating)}</span>
                            <button class="btn btn-sm btn-outline-primary edit-review me-1" data-id="${review.id}">Edit</button>
                            <button class="btn btn-sm btn-outline-danger delete-review" data-id="${review.id}">Delete</button>
                        </div>
                    </div>
                    <p class="card-subtitle mb-2 text-muted">Reviewed on ${review.date}</p>
                    <p class="card-text">${review.review}</p>
                </div>
            </article>
        `).join('');

        // Add event listeners
        container.querySelectorAll('.edit-review').forEach(btn => {
            btn.addEventListener('click', () => editReview(parseInt(btn.dataset.id)));
        });
        container.querySelectorAll('.delete-review').forEach(btn => {
            btn.addEventListener('click', () => deleteReview(parseInt(btn.dataset.id)));
        });
    }

    // Add Favorite
    document.getElementById('addFavoriteBtn')?.addEventListener('click', function() {
        showFavoriteForm();
    });

    // Add Hike
    document.getElementById('addHikeBtn')?.addEventListener('click', function() {
        showHikeForm();
    });

    // Add Review
    document.getElementById('addReviewBtn')?.addEventListener('click', function() {
        showReviewForm();
    });

    // Edit/Delete Functions
    function editFavorite(id) {
        const fav = dataManager.favorites.find(f => f.id === id);
        if (!fav) return;
        showFavoriteForm(fav);
    }

    function deleteFavorite(id) {
        if (confirm('Are you sure you want to remove this favorite?')) {
            dataManager.deleteFavorite(id);
            renderFavorites();
            updateStatistics();
        }
    }

    function editHike(id) {
        const hike = dataManager.completedHikes.find(h => h.id === id);
        if (!hike) return;
        showHikeForm(hike);
    }

    function deleteHike(id) {
        if (confirm('Are you sure you want to delete this hike?')) {
            dataManager.deleteHike(id);
            renderCompletedHikes();
            updateStatistics();
        }
    }

    function editReview(id) {
        const rev = dataManager.reviews.find(r => r.id === id);
        if (!rev) return;
        showReviewForm(rev);
    }

    function deleteReview(id) {
        if (confirm('Are you sure you want to delete this review?')) {
            dataManager.deleteReview(id);
            renderReviews();
            updateStatistics();
        }
    }

    // Form Display Functions
    function showFavoriteForm(favorite = null) {
        const isEdit = favorite !== null;
        const container = document.getElementById('favoritesContainer');
        
        const formHtml = `
            <div class="card mb-3" id="favoriteFormCard">
                <div class="card-body">
                    <h5 class="card-title">${isEdit ? 'Edit Favorite' : 'Add New Favorite'}</h5>
                    <form id="favoriteForm">
                        <div class="mb-3">
                            <label for="favName" class="form-label">Trail Name</label>
                            <input type="text" class="form-control" id="favName" value="${isEdit ? favorite.name : ''}" required>
                        </div>
                        <div class="mb-3">
                            <label for="favLocation" class="form-label">Location</label>
                            <input type="text" class="form-control" id="favLocation" value="${isEdit ? favorite.location : ''}" required>
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label for="favDistance" class="form-label">Distance (miles)</label>
                                <input type="number" step="0.1" class="form-control" id="favDistance" value="${isEdit ? favorite.distance : ''}" required>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="favDifficulty" class="form-label">Difficulty</label>
                                <select class="form-select" id="favDifficulty" required>
                                    <option value="">Select...</option>
                                    <option value="Easy" ${isEdit && favorite.difficulty === 'Easy' ? 'selected' : ''}>Easy</option>
                                    <option value="Moderate" ${isEdit && favorite.difficulty === 'Moderate' ? 'selected' : ''}>Moderate</option>
                                    <option value="Hard" ${isEdit && favorite.difficulty === 'Hard' ? 'selected' : ''}>Hard</option>
                                </select>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label for="favRating" class="form-label">Rating (1-5)</label>
                            <input type="number" min="1" max="5" class="form-control" id="favRating" value="${isEdit ? favorite.rating : ''}" required>
                        </div>
                        <div class="mb-3">
                            <label for="favDescription" class="form-label">Description</label>
                            <textarea class="form-control" id="favDescription" rows="2" required>${isEdit ? favorite.description : ''}</textarea>
                        </div>
                        <button type="submit" class="btn btn-success">${isEdit ? 'Update' : 'Add'} Favorite</button>
                        <button type="button" class="btn btn-secondary ms-2" id="cancelFavoriteForm">Cancel</button>
                    </form>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('afterbegin', formHtml);
        
        document.getElementById('favoriteForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const data = {
                name: document.getElementById('favName').value,
                location: document.getElementById('favLocation').value,
                distance: parseFloat(document.getElementById('favDistance').value),
                difficulty: document.getElementById('favDifficulty').value,
                rating: parseInt(document.getElementById('favRating').value),
                description: document.getElementById('favDescription').value
            };
            
            if (isEdit) {
                dataManager.updateFavorite(favorite.id, data);
            } else {
                dataManager.addFavorite(data);
            }
            
            document.getElementById('favoriteFormCard').remove();
            renderFavorites();
            updateStatistics();
        });
        
        document.getElementById('cancelFavoriteForm').addEventListener('click', function() {
            document.getElementById('favoriteFormCard').remove();
        });
    }

    function showHikeForm(hike = null) {
        const isEdit = hike !== null;
        const container = document.getElementById('hikesContainer').parentElement.parentElement;
        
        const formHtml = `
            <div class="card mb-3" id="hikeFormCard">
                <div class="card-body">
                    <h5 class="card-title">${isEdit ? 'Edit Hike' : 'Add New Hike'}</h5>
                    <form id="hikeForm">
                        <div class="mb-3">
                            <label for="hikeName" class="form-label">Trail Name</label>
                            <input type="text" class="form-control" id="hikeName" value="${isEdit ? hike.name : ''}" required>
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label for="hikeLocation" class="form-label">Location</label>
                                <input type="text" class="form-control" id="hikeLocation" value="${isEdit ? hike.location : ''}" required>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="hikeDate" class="form-label">Date Completed</label>
                                <input type="text" class="form-control" id="hikeDate" value="${isEdit ? hike.date : ''}" placeholder="Nov 1, 2025" required>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label for="hikeDistance" class="form-label">Distance (miles)</label>
                                <input type="number" step="0.1" class="form-control" id="hikeDistance" value="${isEdit ? hike.distance : ''}" required>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="hikeDifficulty" class="form-label">Difficulty</label>
                                <select class="form-select" id="hikeDifficulty" required>
                                    <option value="">Select...</option>
                                    <option value="Easy" ${isEdit && hike.difficulty === 'Easy' ? 'selected' : ''}>Easy</option>
                                    <option value="Moderate" ${isEdit && hike.difficulty === 'Moderate' ? 'selected' : ''}>Moderate</option>
                                    <option value="Hard" ${isEdit && hike.difficulty === 'Hard' ? 'selected' : ''}>Hard</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" class="btn btn-success">${isEdit ? 'Update' : 'Add'} Hike</button>
                        <button type="button" class="btn btn-secondary ms-2" id="cancelHikeForm">Cancel</button>
                    </form>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', formHtml);
        
        document.getElementById('hikeForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const data = {
                name: document.getElementById('hikeName').value,
                location: document.getElementById('hikeLocation').value,
                date: document.getElementById('hikeDate').value,
                distance: parseFloat(document.getElementById('hikeDistance').value),
                difficulty: document.getElementById('hikeDifficulty').value
            };
            
            if (isEdit) {
                dataManager.updateHike(hike.id, data);
            } else {
                dataManager.addHike(data);
            }
            
            document.getElementById('hikeFormCard').remove();
            renderCompletedHikes();
            updateStatistics();
        });
        
        document.getElementById('cancelHikeForm').addEventListener('click', function() {
            document.getElementById('hikeFormCard').remove();
        });
    }

    function showReviewForm(review = null) {
        const isEdit = review !== null;
        const container = document.getElementById('reviewsContainer');
        
        const formHtml = `
            <div class="card mb-3" id="reviewFormCard">
                <div class="card-body">
                    <h5 class="card-title">${isEdit ? 'Edit Review' : 'Add New Review'}</h5>
                    <form id="reviewForm">
                        <div class="mb-3">
                            <label for="reviewName" class="form-label">Trail Name</label>
                            <input type="text" class="form-control" id="reviewName" value="${isEdit ? review.name : ''}" required>
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label for="reviewDate" class="form-label">Review Date</label>
                                <input type="text" class="form-control" id="reviewDate" value="${isEdit ? review.date : ''}" placeholder="Nov 1, 2025" required>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="reviewRating" class="form-label">Rating (1-5)</label>
                                <input type="number" min="1" max="5" class="form-control" id="reviewRating" value="${isEdit ? review.rating : ''}" required>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label for="reviewText" class="form-label">Your Review</label>
                            <textarea class="form-control" id="reviewText" rows="4" required>${isEdit ? review.review : ''}</textarea>
                        </div>
                        <button type="submit" class="btn btn-success">${isEdit ? 'Update' : 'Add'} Review</button>
                        <button type="button" class="btn btn-secondary ms-2" id="cancelReviewForm">Cancel</button>
                    </form>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('afterbegin', formHtml);
        
        document.getElementById('reviewForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const data = {
                name: document.getElementById('reviewName').value,
                date: document.getElementById('reviewDate').value,
                rating: parseInt(document.getElementById('reviewRating').value),
                review: document.getElementById('reviewText').value
            };
            
            if (isEdit) {
                dataManager.updateReview(review.id, data);
            } else {
                dataManager.addReview(data);
            }
            
            document.getElementById('reviewFormCard').remove();
            renderReviews();
            updateStatistics();
        });
        
        document.getElementById('cancelReviewForm').addEventListener('click', function() {
            document.getElementById('reviewFormCard').remove();
        });
    }

    // Profile Import/Export Functions
    document.getElementById('downloadProfileBtn')?.addEventListener('click', function() {
        downloadProfile();
    });

    document.getElementById('uploadProfileBtn')?.addEventListener('click', function() {
        uploadProfile();
    });

    function downloadProfile() {
        // Gather all profile data
        const profile = loadProfileData();
        
        const profileData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            profile: {
                name: profile.name,
                username: profile.username,
                email: profile.email,
                memberSince: profile.memberSince
            },
            favorites: dataManager.favorites,
            completedHikes: dataManager.completedHikes,
            reviews: dataManager.reviews,
            statistics: dataManager.calculateStats()
        };

        // Create blob and download
        const dataStr = JSON.stringify(profileData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `trail-finder-profile-${profile.username}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showUploadStatus('Profile downloaded successfully!', 'success');
    }

    function uploadProfile() {
        const fileInput = document.getElementById('uploadProfileInput');
        const file = fileInput.files[0];

        if (!file) {
            showUploadStatus('Please select a file to upload.', 'warning');
            return;
        }

        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const profileData = JSON.parse(e.target.result);
                
                // Validate the data structure
                if (!profileData.profile || !profileData.favorites || !profileData.completedHikes || !profileData.reviews) {
                    throw new Error('Invalid profile file format');
                }

                // Confirm before overwriting
                if (!confirm('This will replace all your current profile data. Are you sure you want to continue?')) {
                    return;
                }

                // Import profile data
                saveProfileData({
                    name: profileData.profile.name,
                    username: profileData.profile.username,
                    email: profileData.profile.email,
                    memberSince: profileData.profile.memberSince
                });

                // Import favorites, hikes, and reviews
                localStorage.setItem('userFavorites', JSON.stringify(profileData.favorites));
                localStorage.setItem('userCompletedHikes', JSON.stringify(profileData.completedHikes));
                localStorage.setItem('userReviews', JSON.stringify(profileData.reviews));

                // Reload data manager
                dataManager.loadData();

                // Update all displays
                const profile = loadProfileData();
                updateProfileDisplay(profile);
                renderFavorites();
                renderCompletedHikes();
                renderReviews();
                updateStatistics();

                showUploadStatus('Profile imported successfully! All data has been updated.', 'success');
                fileInput.value = ''; // Clear file input
            } catch (error) {
                console.error('Error importing profile:', error);
                showUploadStatus('Error importing profile: ' + error.message, 'danger');
            }
        };

        reader.onerror = function() {
            showUploadStatus('Error reading file.', 'danger');
        };

        reader.readAsText(file);
    }

    function showUploadStatus(message, type) {
        const statusDiv = document.getElementById('uploadStatus');
        statusDiv.className = `alert alert-${type} mt-3`;
        statusDiv.textContent = message;
        statusDiv.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    }
});
