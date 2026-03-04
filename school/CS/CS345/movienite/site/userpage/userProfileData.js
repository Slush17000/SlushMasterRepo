class User {

    constructor(email, firstName, lastName, password, keyval = new Keyval(KEYVAL_API_KEY)) {
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.password = password;
        this.favoriteMovies = [];
        this.reviews = [];
        this.ratings = [];
        this.movieWatchlist = [];
        this.seenMovies = [];

        // Check if the key already exists in the key-value store
        keyval.get(email, (data) => {
            if (!data) {
                // If the key doesn't exist, set the key-value pair
                keyval.set(email, this.createJSONlayout());
            }
        });
    }

    //Return a new User if the user exists, otherwise return null
    static loadUser(username, callback, keyval = new Keyval(KEYVAL_API_KEY)) {
        keyval.get(username, (data) => {
            if (data) {
                data = JSON.parse(data);
                const user = new User(data.email, data.firstName, data.lastName, data.password);
                user.setReviewsFromData(data.reviews);
                user.setRatingsFromData(data.ratings);
                user.setFavoriteMovies(data.favoriteMovies);
                user.setSeenMovies(data.seenMovies);
                user.setMovieWatchlist(data.movieWatchlist);
                // Call the callback with the user object
                callback(user);
            } else {
                // Call the callback with null when there's an issue with keyval.get
                callback(null);
            }
        });
    }

    setReviewsFromData(reviewsData) {
        // If reviewsData is truthy (not null or undefined), map and create Review objects
        // If reviewsData is falsy (null, undefined, or an empty array), set reviews to an empty array
        this.reviews = reviewsData ? reviewsData.map(review => new Review(review.movie, review.review)) : [];
    }

    setRatingsFromData(ratingsData) {
        // If ratingsData is truthy (not null or undefined), map and create Rating objects
        // If ratingsData is falsy (null, undefined, or an empty array), set ratings to an empty array
        this.ratings = ratingsData ? ratingsData.map(rating => new Rating(rating.movie, rating.rating)) : [];
    }

    update(keyval = new Keyval(KEYVAL_API_KEY)) {
        keyval.set(this.email, this.createJSONlayout());
    }

    createJSONlayout() {
        let userJSON = {
            "firstName": this.firstName,
            "lastName": this.lastName,
            "email": this.email,
            "password": this.password,
            "seenMovies": this.seenMovies,
            "movieWatchlist": this.movieWatchlist,
            "favoriteMovies": this.favoriteMovies,
            "reviews": this.reviews,
            "ratings": this.ratings
        }
        return JSON.stringify(userJSON);
    }

    //ADD AND REMOVE FUNCTIONS 
    addReview(review) {
        this.reviews.push(review);
        this.update();
    }

    removeReview(index) {
        this.reviews.splice(index, 1);
        this.update();
    }

    addRating(rating) {
        this.ratings.push(rating);
        this.update();
    }

    removeRating(index) {
        this.ratings.splice(index, 1);
        this.update();
    }

    addMovie(movie, category) {
        switch (category) {
            case "favorite":
                if (this.movieWatchlist.includes(movie)) {
                    this.removeMovie(movie(), "Watchlist");
                }
                if (this.favoriteMovies.includes(movie)) {
                    break;
                }
                if (!this.seenMovies.includes(movie)) {
                    this.addMovie(movie, "seen");
                }
                this.favoriteMovies.push(movie);
                this.update();
                break;
            case "seen":
                if (this.movieWatchlist.includes(movie)) {
                    this.removeMovie(movie, "Watchlist");
                }
                if (this.seenMovies.includes(movie)) {
                    break;
                }
                this.seenMovies.push(movie);
                this.update();
                break;
            case "Watchlist":
                if (this.movieWatchlist.includes(movie)) {
                    break;
                }
                this.movieWatchlist.push(movie);
                this.update();
                break;
            default:
                break;
        }
    }

    removeMovie(movie, category) {
        let index;
        switch (category) {
            case "favorite":
                index = this.searchMovie(movie, this.favoriteMovies);
                if (index !== -1) {
                    this.favoriteMovies.splice(index, 1);
                    this.update();
                }
                break;
            case "seen":
                index = this.searchMovie(movie, this.seenMovies);
                if (index !== -1) {
                    this.seenMovies.splice(index, 1);
                    this.update();
                }
                break;
            case "Watchlist":
                index = this.searchMovie(movie, this.movieWatchlist);
                if (index !== -1) {
                    this.movieWatchlist.splice(index, 1);
                    this.update();
                }
                break;
            default:
                break;
        }
    }

    searchMovie(movie, arr) {
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] == movie) {
                return i;
            }
        }
        return -1;
    }

    //SETTERS
    setFriends(friends) {
        this.friends = friends;
        this.update();
    }

    setReviews(reviews) {
        this.reviews = reviews;
        this.update();

    }

    setRatings(ratings) {
        this.ratings = ratings;
        this.update();

    }

    setFavoriteMovies(favoriteMovies) {
        this.favoriteMovies = favoriteMovies;
        this.update();
    }

    setSeenMovies(seenMovies) {
        this.seenMovies = seenMovies;
        this.update();
    }

    setMovieWatchlist(movieWatchlist) {
        this.movieWatchlist = movieWatchlist;
        this.update();
    }

    //GETTERS
    getFirstName() {
        return this.firstName;
    }

    getLastName() {
        return this.lastName;
    }

    getEmail() {
        return this.email;
    }

    getPassword() {
        return this.password;
    }

    getReviews() {
        return this.reviews;
    }

    getRatings() {
        return this.ratings;
    }

    getFavoriteMovies() {
        return this.favoriteMovies;
    }

    getSeenMovies() {
        return this.seenMovies;
    }

    getMovieWatchlist() {
        return this.movieWatchlist;
    }
}