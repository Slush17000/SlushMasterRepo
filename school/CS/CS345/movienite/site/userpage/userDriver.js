let ratingsDD;
let removeRatingButton;
let reviewsDD;
let removeReviewButton;

function setup() {

    let username = localStorage.getItem("user");
    User.loadUser(username, (user) => {
        if (user) {
            console.log(user);
            updateUI(user);
        } else {
            console.error("Error loading user or user not found.");
        }
    });

    //navigation buttons
    let homePageButton = createButton("To Home Page");
    homePageButton.position(10, 10);
    homePageButton.mousePressed(goToHomePage);
}

function loadUserMovie(movieName, x, y) {

    data = loadJSON('https://api.themoviedb.org/3/movie/' + movieName + '?api_key=' + TMDB_API_KEY, (data) => {
        console.log(data);
        let img = createElement("img");
        if (data.poster_path != null) {
            img.attribute("src", imgUrl + data.poster_path);
        } else {
            img.attribute("src", "../Black_image.jpg");// change to bad jpeg
        }
        img.position(x, y);
        img.style("width", "80px");
        img.style("height", "120px");
        //onsole.log(data.results[0].id);
        img.mousePressed(() => { loadMoviePage(data.id); });
    });
}

function loadMoviePage(id) {
    window.location.replace(`../moviePage/moviePage.html?data=${id}`);
}

function display(arr, x, y) {
    //console.log(arr);
    if (arr.length <= 0) {
        emptyList = createP("Nothing has been added here yet");
        emptyList.position(x + 10, y + 100);
    } else {
        for (let i = 0; i < Math.min(arr.length, 14); i++) {
            //console.log(arr[i]);
            loadUserMovie(arr[i], x + 15 + (i * 100), y + 70);
        }
    }
}

function displayReviews(arr, x, y) {
    //console.log(arr);
    if (arr.length <= 0) {
        emptyList = createP("Nothing has been added here yet");
        emptyList.position(x + 10, y + 100);
    } else {
        for (let i = 0; i < Math.min(arr.length, 5); i++) {
            let str = arr[i].getMovie() + ": " + arr[i].getReview();
            if (str.length > 95) {
                str = str.substring(0, 95) + "...";
            }
            let review = createP(str);
            review.position(x + 10, y + (i * 27) + 40);
            review.style("color", userColor);
            review.style('font-family', Font);
            review.style("font-size", "24px");
        }
    }
}

function displayRatings(arr, x, y) {
    //console.log(arr);
    if (arr.length <= 0) {
        emptyList = createP("Nothing has been added here yet");
        emptyList.position(x + 10, y + 100);
    } else {
        for (let i = 0; i < Math.min(arr.length, 5); i++) {
            let str = arr[i].getMovie() + ": " + arr[i].getRating() + " stars";
            let rating = createP(str);
            rating.position(x + 10, y + (i * 27) + 40);
            rating.style("color", userColor);
            rating.style('font-family', Font);
            rating.style("font-size", "24px")
        }
    }
}

function displayRecentlyWatched(arr, x, y) {
    if (arr.length <= 0) {
        emptyList = createP("Nothing has been added here yet");
        emptyList.position(x + 10, y + 100);
    } else {
        const startIndex = Math.max(0, arr.length - 4);

        for (let i = startIndex; i < arr.length; i++) {
            //console.log(arr[i]);
            loadUserMovie(arr[i], x + 15 + ((i - startIndex) * 100), y + 70);
        }
    }
}

function removeUserRating(temp) {
    temp.removeRating(ratingsDD.value());
    location.reload();
}

function removeUserReview(temp) {
    temp.removeReview(reviewsDD.value());
    location.reload();
}

function updateUI(temp) {
    //title    
    let title = createP(temp.getFirstName() + "'s Profile");
    title.position(windowWidth / 2 - 90, 20);
    title.style("color", textColor);
    title.style("font-size", "36px");

    //Creates and Displys User Information
    let leftXPos = 50;
    let nameYPos = 100;
    let emailYPos = 125;
    let name = createP("Name: " + temp.getFirstName() + " " + temp.getLastName());
    let email = createP("Email: " + temp.getEmail());
    name.position(leftXPos, nameYPos);
    email.position(leftXPos, emailYPos);
    name.style("color", textColor);
    email.style("color", textColor);
    email.style('font-family', Font);
    name.style('font-family', Font);
    name.style("font-size", "24px");
    email.style("font-size", "24px");

    let favMovies = createP("Favorite Movies: ");
    let favMoviesYPos = 180;
    favMovies.position(leftXPos, favMoviesYPos);
    favMovies.style("color", textColor);
    favMovies.style('font-family', Font);
    favMovies.style("font-size", "24px");
    display(temp.getFavoriteMovies(), leftXPos, favMoviesYPos);

    let movieWatchlist = createP("Movie Watch List: ");
    let movieWatchlistYPos = 380;
    movieWatchlist.position(leftXPos, movieWatchlistYPos);
    movieWatchlist.style("color", textColor);
    movieWatchlist.style('font-family', Font);
    movieWatchlist.style("font-size", "24px");
    display(temp.getMovieWatchlist(), leftXPos, movieWatchlistYPos);

    let recentlyWatched = createP("Recently Watched: ");
    let recentlyWatchedYPos = 580;
    recentlyWatched.position(leftXPos, recentlyWatchedYPos);
    recentlyWatched.style("color", textColor);
    recentlyWatched.style('font-family', Font);
    recentlyWatched.style("font-size", "24px");
    displayRecentlyWatched(temp.getSeenMovies(), leftXPos, recentlyWatchedYPos);

    let reviews = createP("Reviews: ");
    let reviewsYPos = 780;
    reviews.position(leftXPos, reviewsYPos);
    reviews.style("color", textColor);
    reviews.style('font-family', Font);
    reviews.style("font-size", "24px");
    displayReviews(temp.getReviews(), leftXPos, reviewsYPos);

    let ratings = createP("Ratings: ");
    let ratingsYPos = 580;
    ratings.position(500, ratingsYPos);
    ratings.style("color", textColor);
    ratings.style('font-family', Font);
    ratings.style("font-size", "24px");
    displayRatings(temp.getRatings(), 500, ratingsYPos);

    if (temp.getRatings().length > 0) {
        let tempRatings = temp.getRatings();
        ratingsDD = createSelect();
        ratingsDD.position(1145, 640);
        removeRatingButton = createButton("Remove Rating");
        removeRatingButton.mousePressed(() => { removeUserRating(temp) });
        removeRatingButton.position(1355, 660);
        for (let i = 0; i < tempRatings.length && i < 5; i++) {
            ratingsDD.option(tempRatings[i].getMovie(), i);
        }
    }

    if (temp.getReviews().length > 0) {
        let tempReviews = temp.getReviews();
        reviewsDD = createSelect();
        reviewsDD.position(1145, 840);
        removeReviewButton = createButton("Remove Review");
        removeReviewButton.mousePressed(() => { removeUserReview(temp) });
        removeReviewButton.position(1350, 860);
        for (let i = 0; i < tempReviews.length && i < 5; i++) {
            reviewsDD.option(tempReviews[i].getMovie(), i);
        }
    }

    name.position(leftXPos, nameYPos);
    email.position(leftXPos, emailYPos);
    favMovies.position(leftXPos, favMoviesYPos);
    reviews.position(leftXPos, reviewsYPos);
    recentlyWatched.position(leftXPos, recentlyWatchedYPos);
    movieWatchlist.position(leftXPos, movieWatchlistYPos);

}

function draw() {

}
