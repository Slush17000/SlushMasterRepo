/**
 * Mock REST API for Trail Finder Application
 * Simulates a backend API for managing hiking trail data
 */

class TrailsAPI {
    constructor() {
        this.trails = [];
        this.reviews = [];
        this.loadTrails();
    }

    /**
     * Load trails from JSON file
     */
    async loadTrails() {
        try {
            console.log('Fetching trails from ./api/trails.json');
            const response = await fetch('./api/trails.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.trails = data.trails;
            this.reviews = data.reviews || [];
            console.log(`Loaded ${this.trails.length} trails and ${this.reviews.length} reviews`);
        } catch (error) {
            console.error('Error loading trails:', error);
        }
    }

    /**
     * GET /api/trails - Get all trails
     * @param {Object} filters - Optional filters (state, difficulty, maxCost, minLength, maxLength, tags)
     * @returns {Array} Filtered array of trails
     */
    getAllTrails(filters = {}) {
        let results = [...this.trails];

        // Filter by state
        if (filters.state) {
            results = results.filter(trail => {
                const state = trail.location.state || '';
                return state.toLowerCase() === filters.state.toLowerCase();
            });
        }

        // Filter by difficulty (exact match or range)
        if (filters.difficulty !== undefined) {
            if (Array.isArray(filters.difficulty)) {
                results = results.filter(trail => 
                    filters.difficulty.includes(trail.difficulty)
                );
            } else {
                results = results.filter(trail => 
                    trail.difficulty === filters.difficulty
                );
            }
        }

        // Filter by max cost
        if (filters.maxCost !== undefined) {
            results = results.filter(trail => trail.cost <= filters.maxCost);
        }

        // Filter by length range
        if (filters.minLength !== undefined) {
            results = results.filter(trail => trail.length >= filters.minLength);
        }
        if (filters.maxLength !== undefined) {
            results = results.filter(trail => trail.length <= filters.maxLength);
        }

        // Filter by type
        if (filters.type) {
            results = results.filter(trail => 
                trail.type.toLowerCase() === filters.type.toLowerCase()
            );
        }

        // Filter by tags (trail must have at least one matching tag)
        if (filters.tags && filters.tags.length > 0) {
            results = results.filter(trail => 
                filters.tags.some(tag => 
                    trail.tags.some(trailTag => 
                        trailTag.toLowerCase().includes(tag.toLowerCase())
                    )
                )
            );
        }

        // Search by keyword in name or description
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            results = results.filter(trail => {
                const city = trail.location.city || '';
                return trail.name.toLowerCase().includes(searchTerm) ||
                    trail.description.toLowerCase().includes(searchTerm) ||
                    city.toLowerCase().includes(searchTerm);
            });
        }

        // Sort results
        if (filters.sortBy) {
            results = this.sortTrails(results, filters.sortBy, filters.sortOrder);
        }

        // Pagination
        if (filters.limit) {
            const start = filters.offset || 0;
            results = results.slice(start, start + filters.limit);
        }

        return results;
    }

    /**
     * GET /api/trails/:id - Get trail by ID
     * @param {number} id - Trail ID
     * @returns {Object|null} Trail object or null if not found
     */
    getTrailById(id) {
        return this.trails.find(trail => trail.id === parseInt(id)) || null;
    }

    /**
     * GET /api/trails/search - Search trails by query
     * @param {string} query - Search query
     * @returns {Array} Matching trails
     */
    searchTrails(query) {
        const searchTerm = query.toLowerCase();
        return this.trails.filter(trail => {
            const city = trail.location.city || '';
            const state = trail.location.state || '';
            return trail.name.toLowerCase().includes(searchTerm) ||
                trail.description.toLowerCase().includes(searchTerm) ||
                city.toLowerCase().includes(searchTerm) ||
                state.toLowerCase().includes(searchTerm) ||
                trail.tags.some(tag => tag.toLowerCase().includes(searchTerm));
        });
    }

    /**
     * GET /api/trails/nearby - Get trails near a location
     * @param {string} state - State abbreviation or name
     * @param {number} maxDistance - Maximum distance in miles (simulated)
     * @returns {Array} Nearby trails
     */
    getNearbyTrails(state, maxDistance = 50) {
        // Since we don't have actual coordinates, we'll return trails from the same state
        return this.trails.filter(trail => {
            const trailState = trail.location.state || '';
            return trailState.toLowerCase().includes(state.toLowerCase());
        });
    }

    /**
     * GET /api/states - Get unique list of states with trail counts
     * @returns {Array} Array of state objects with counts
     */
    getStates() {
        const stateCounts = {};
        this.trails.forEach(trail => {
            const state = trail.location.state || 'Unknown';
            stateCounts[state] = (stateCounts[state] || 0) + 1;
        });

        return Object.entries(stateCounts).map(([state, count]) => ({
            state,
            trailCount: count
        })).sort((a, b) => b.trailCount - a.trailCount);
    }

    /**
     * GET /api/tags - Get unique list of all tags with usage counts
     * @returns {Array} Array of tag objects with counts
     */
    getTags() {
        const tagCounts = {};
        this.trails.forEach(trail => {
            trail.tags.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        });

        return Object.entries(tagCounts).map(([tag, count]) => ({
            tag,
            count
        })).sort((a, b) => b.count - a.count);
    }

    /**
     * GET /api/stats - Get API statistics
     * @returns {Object} Statistics object
     */
    getStats() {
        const difficulties = [0, 0, 0, 0, 0, 0]; // Count for each difficulty level
        let totalLength = 0;
        let totalCost = 0;
        let freeTrails = 0;

        this.trails.forEach(trail => {
            difficulties[trail.difficulty]++;
            totalLength += trail.length;
            totalCost += trail.cost;
            if (trail.cost === 0) freeTrails++;
        });

        return {
            totalTrails: this.trails.length,
            averageLength: (totalLength / this.trails.length).toFixed(2),
            averageCost: (totalCost / this.trails.length).toFixed(2),
            freeTrails,
            difficultyDistribution: {
                easy: difficulties[1] + difficulties[2],
                moderate: difficulties[3],
                hard: difficulties[4] + difficulties[5]
            },
            states: this.getStates().length
        };
    }

    /**
     * Helper function to sort trails
     * @param {Array} trails - Array of trails to sort
     * @param {string} sortBy - Field to sort by
     * @param {string} sortOrder - 'asc' or 'desc'
     * @returns {Array} Sorted trails
     */
    sortTrails(trails, sortBy, sortOrder = 'asc') {
        const sorted = [...trails].sort((a, b) => {
            let aVal, bVal;

            switch (sortBy) {
                case 'name':
                    aVal = a.name.toLowerCase();
                    bVal = b.name.toLowerCase();
                    break;
                case 'length':
                    aVal = a.length;
                    bVal = b.length;
                    break;
                case 'difficulty':
                    aVal = a.difficulty;
                    bVal = b.difficulty;
                    break;
                case 'cost':
                    aVal = a.cost;
                    bVal = b.cost;
                    break;
                default:
                    return 0;
            }

            if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return sorted;
    }

    /**
     * Helper to get difficulty label
     * @param {number} difficulty - Difficulty level (0-5)
     * @returns {string} Difficulty label
     */
    static getDifficultyLabel(difficulty) {
        const labels = {
            0: 'Very Easy',
            1: 'Easy',
            2: 'Easy-Moderate',
            3: 'Moderate',
            4: 'Hard',
            5: 'Very Hard'
        };
        return labels[difficulty] || 'Unknown';
    }

    /**
     * Helper to get difficulty badge class
     * @param {number} difficulty - Difficulty level (0-5)
     * @returns {string} Bootstrap badge class
     */
    static getDifficultyBadgeClass(difficulty) {
        if (difficulty <= 2) return 'bg-success';
        if (difficulty === 3) return 'bg-warning text-dark';
        return 'bg-danger';
    }

    /**
     * GET /api/reviews - Get all reviews
     * @param {Object} options - Optional filters (trailId, limit, sortBy)
     * @returns {Array} Array of reviews
     */
    getReviews(options = {}) {
        let results = [...this.reviews];

        // Filter by trail ID
        if (options.trailId) {
            results = results.filter(review => review.trailId === parseInt(options.trailId));
        }

        // Sort by date (most recent first by default)
        results.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Limit results
        if (options.limit) {
            results = results.slice(0, options.limit);
        }

        return results;
    }

    /**
     * GET /api/trails/top-rated - Get top rated trails
     * @param {number} limit - Number of trails to return
     * @returns {Array} Array of top rated trails
     */
    getTopRatedTrails(limit = 5) {
        return [...this.trails]
            .sort((a, b) => b.rating - a.rating)
            .slice(0, limit);
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrailsAPI;
}
