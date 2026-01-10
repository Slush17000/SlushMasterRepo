// User Data Manager for Trail Finder
// Manages favorites, completed hikes, and reviews

class UserDataManager {
    constructor() {
        this.loadData();
    }

    loadData() {
        const storedFavorites = localStorage.getItem('userFavorites');
        const storedHikes = localStorage.getItem('userCompletedHikes');
        const storedReviews = localStorage.getItem('userReviews');
        
        // Only load defaults if nothing is stored (first time user)
        // If empty arrays are stored, use those (deleted profile)
        this.favorites = storedFavorites !== null ? JSON.parse(storedFavorites) : this.getDefaultFavorites();
        this.completedHikes = storedHikes !== null ? JSON.parse(storedHikes) : this.getDefaultHikes();
        this.reviews = storedReviews !== null ? JSON.parse(storedReviews) : this.getDefaultReviews();
    }

    saveData() {
        localStorage.setItem('userFavorites', JSON.stringify(this.favorites));
        localStorage.setItem('userCompletedHikes', JSON.stringify(this.completedHikes));
        localStorage.setItem('userReviews', JSON.stringify(this.reviews));
    }

    getDefaultFavorites() {
        return [
            { id: 1, name: "McAfee Knob Trail", location: "Catawba, VA", distance: 7.8, difficulty: "Moderate", rating: 5, description: "Most photographed spot on the Appalachian Trail" },
            { id: 2, name: "Old Rag Mountain Trail", location: "Shenandoah National Park, VA", distance: 9.4, difficulty: "Hard", rating: 5, description: "Amazing rock scrambling and 360° views" },
            { id: 3, name: "Crabtree Falls Trail", location: "Montebello, VA", distance: 3.3, difficulty: "Moderate", rating: 5, description: "Virginia's highest cascading waterfall" },
            { id: 4, name: "Humpback Rocks Trail", location: "Blue Ridge Parkway, VA", distance: 3.5, difficulty: "Moderate", rating: 4, description: "Short but steep with spectacular views" },
            { id: 5, name: "Dragon's Tooth Trail", location: "Catawba, VA", distance: 4.6, difficulty: "Hard", rating: 5, description: "Iconic spire rock formation summit" }
        ];
    }

    getDefaultHikes() {
        return [
            { id: 1, name: "Spy Rock Trail", location: "Montebello, VA", date: "Oct 28, 2025", distance: 2.2, difficulty: "Easy" },
            { id: 2, name: "McAfee Knob Trail", location: "Catawba, VA", date: "Oct 20, 2025", distance: 7.8, difficulty: "Moderate" },
            { id: 3, name: "Dark Hollow Falls Trail", location: "Shenandoah NP, VA", date: "Oct 15, 2025", distance: 1.4, difficulty: "Easy" },
            { id: 4, name: "Old Rag Mountain Trail", location: "Shenandoah NP, VA", date: "Oct 8, 2025", distance: 9.4, difficulty: "Hard" },
            { id: 5, name: "Humpback Rocks Trail", location: "Blue Ridge Parkway, VA", date: "Sep 30, 2025", distance: 3.5, difficulty: "Moderate" },
            { id: 6, name: "Crabtree Falls Trail", location: "Montebello, VA", date: "Sep 22, 2025", distance: 3.3, difficulty: "Moderate" },
            { id: 7, name: "Dragon's Tooth Trail", location: "Catawba, VA", date: "Sep 10, 2025", distance: 4.6, difficulty: "Hard" }
        ];
    }

    getDefaultReviews() {
        return [
            { id: 1, name: "McAfee Knob Trail", date: "Oct 20, 2025", rating: 5, review: "Absolutely stunning views from the top! The iconic rock outcropping is even more impressive in person. Trail was busy on a Saturday morning, but totally worth it. Started at 7am and beat most of the crowds. The ascent is steady but manageable. Highly recommend bringing headlamp for the descent. This is now one of my favorite local hikes!" },
            { id: 2, name: "Old Rag Mountain Trail", date: "Oct 8, 2025", rating: 5, review: "Best hike I've done in Virginia! The rock scramble section was challenging but so much fun. Views from the summit are 360 degrees and absolutely breathtaking. Trail is well-marked and maintained. Started early to get parking - lot fills up fast. Took about 5.5 hours with breaks. This is a must-do for any serious hiker in the area." },
            { id: 3, name: "Dark Hollow Falls Trail", date: "Oct 15, 2025", rating: 4, review: "Great short hike to a beautiful waterfall. Perfect for a quick afternoon adventure. The trail follows the stream and has several nice viewpoints along the way. Falls were flowing well after recent rains. Trail can be steep and rocky on the way back up. Good for families but kids should be supervised on the steeper sections." },
            { id: 4, name: "Crabtree Falls Trail", date: "Sep 22, 2025", rating: 5, review: "Amazing trail with multiple waterfall viewpoints! The cascades are spectacular and the trail is well-maintained with sturdy platforms for viewing. Elevation gain is steady but not too difficult. Fall colors were starting to show which made it even more beautiful. Parking area has restrooms which is convenient. One of my favorite waterfall hikes!" },
            { id: 5, name: "Dragon's Tooth Trail", date: "Sep 10, 2025", rating: 5, review: "The Dragon's Tooth rock formation is incredible! Very steep and technical near the summit but the payoff is worth it. Trail has some challenging rocky sections with good opportunities for scrambling. Views from the top are expansive. Started early on a Sunday and still found parking. Bring gloves if you have them for the scramble sections. Epic hike!" }
        ];
    }

    // Statistics calculations
    calculateStats() {
        const hikesCompleted = this.completedHikes.length;
        const milesHiked = this.completedHikes.reduce((sum, hike) => sum + hike.distance, 0).toFixed(1);
        const reviewsWritten = this.reviews.length;
        const favoriteTrails = this.favorites.length;

        return { hikesCompleted, milesHiked, reviewsWritten, favoriteTrails };
    }

    // Favorites methods
    addFavorite(favorite) {
        const newId = this.favorites.length > 0 ? Math.max(...this.favorites.map(f => f.id)) + 1 : 1;
        favorite.id = newId;
        this.favorites.push(favorite);
        this.saveData();
    }

    updateFavorite(id, updatedFavorite) {
        const index = this.favorites.findIndex(f => f.id === id);
        if (index !== -1) {
            this.favorites[index] = { ...this.favorites[index], ...updatedFavorite };
            this.saveData();
        }
    }

    deleteFavorite(id) {
        this.favorites = this.favorites.filter(f => f.id !== id);
        this.saveData();
    }

    // Completed Hikes methods
    addHike(hike) {
        const newId = this.completedHikes.length > 0 ? Math.max(...this.completedHikes.map(h => h.id)) + 1 : 1;
        hike.id = newId;
        this.completedHikes.push(hike);
        this.saveData();
    }

    updateHike(id, updatedHike) {
        const index = this.completedHikes.findIndex(h => h.id === id);
        if (index !== -1) {
            this.completedHikes[index] = { ...this.completedHikes[index], ...updatedHike };
            this.saveData();
        }
    }

    deleteHike(id) {
        this.completedHikes = this.completedHikes.filter(h => h.id !== id);
        this.saveData();
    }

    // Reviews methods
    addReview(review) {
        const newId = this.reviews.length > 0 ? Math.max(...this.reviews.map(r => r.id)) + 1 : 1;
        review.id = newId;
        this.reviews.push(review);
        this.saveData();
    }

    updateReview(id, updatedReview) {
        const index = this.reviews.findIndex(r => r.id === id);
        if (index !== -1) {
            this.reviews[index] = { ...this.reviews[index], ...updatedReview };
            this.saveData();
        }
    }

    deleteReview(id) {
        this.reviews = this.reviews.filter(r => r.id !== id);
        this.saveData();
    }

    // Utility functions
    generateStars(rating) {
        return '★'.repeat(rating) + '☆'.repeat(5 - rating);
    }

    getDifficultyBadgeClass(difficulty) {
        if (difficulty === 'Easy') return 'bg-success';
        if (difficulty === 'Moderate') return 'bg-warning text-dark';
        return 'bg-danger';
    }
}
