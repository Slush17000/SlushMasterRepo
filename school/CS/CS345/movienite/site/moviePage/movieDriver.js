let movie;
let myPos = 50; //adjust height of all text
let myColor = "#CBB677"; // adjust color
let myFont = Font;
let data;
let cast;
let rating;
let review;

function preload() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    const dataValue = urlParams.get('data');

    data = loadJSON('https://api.themoviedb.org/3/movie/' + dataValue + '?api_key=' + TMDB_API_KEY);
    cast = loadJSON('https://api.themoviedb.org/3/movie/' + dataValue + '/credits?api_key=' + TMDB_API_KEY);
}

function setup() {
    Title = createP();
    rect(200, 1500, 1500);

    const Watchlist = createButton("Add To Watch List");
    Watchlist.position(30, 600);
    Watchlist.mousePressed(addToWatchlist);
    const removeW = createButton("Remove From Watch List");
    removeW.position(30, 500);
    removeW.mousePressed(removeFromWatchlist);

    const seen = createButton("Add To Seen");
    seen.position(30, 630);
    seen.mousePressed(addToSeen);
    const removeS = createButton("Remove From Seen");
    removeS.position(30, 530);
    removeS.mousePressed(removeFromSeen);

    const favorites = createButton("Add To Favorite");
    favorites.position(30, 660);
    favorites.mousePressed(addToFavorites);
    const removeF = createButton("Remove From Favorite");
    removeF.position(30, 560);
    removeF.mousePressed(removeFromFavorites);

    ratingText = createP("Rate this movie 0 - 5 stars!");
    ratingText.position(30, 400);
    ratingText.style("font-size", "24px");
    ratingText.style("color", myColor);
    const ratingB = createButton("Add Rating");
    rating = createInput();
    rating.position(30, 450);
    rating.style("width", "160px");
    rating.attribute("type", "number");
    rating.attribute("step", "0.1");
    rating.attribute("min", "0.1");
    rating.attribute("max", "5");
    ratingB.position(200, 450);
    ratingB.mousePressed(addRating);

    reviewText = createP("Write a review!");
    reviewText.position(30, 150);
    reviewText.style("font-size", "24px");
    reviewText.style("color", myColor);
    review = createInput();
    review.position(30, 200);
    review.style("width", "300px");
    review.style("height", "100px");
    const reviewB = createButton("Add Review");
    reviewB.position(30, 307);
    reviewB.mousePressed(addReview);

    //navigation buttons
    let userPageButton = createButton("To User Page");
    userPageButton.position(10, 10);
    userPageButton.mousePressed(goToUserPage);
    let homePageButton = createButton("To Home Page");
    homePageButton.position(10, 40);
    homePageButton.mousePressed(goToHomePage);

    let img = createElement("img");
    console.log(data);
    if (data.poster_path != null) {
        img.attribute("src", imgUrl + data.poster_path);
        console.log(data.poster_path);

    } else {
        img.attribute("src", "../Black_image.jpg");// change to bad jpeg
    }
    //img.attribute("src", imgUrl + data.poster_path);
    img.style("width", "250px");
    img.style("height", "375px");
    img.style("width", "250px");
    img.position((windowWidth / 2) - width * 3, 105);
    console.log((width / 2) - 150 + img.width);

    myTitle = data.title;
    if (myTitle.length > 40) {
        myTitle = myTitle.substring(0, 35) + "...";
    }
    Title = createP(myTitle);
    Title.position((windowWidth / 2) - width * 3, 5);
    Title.style('font-family', Font);
    Title.style("font-size", "50px");
    Title.style('color', textColor);

    Release = createP("Date: " + data.release_date);
    Release.position(windowWidth / 2 - 40, myPos + 10);
    Release.style('font-family', Font);
    Release.style("font-size", "46px");
    Release.style('color', textColor);

    AboutTitle = createP("Summary: ")
    AboutTitle.position(windowWidth / 2 - 40, myPos + 60);
    AboutTitle.style('font-family', Font);
    AboutTitle.style("font-size", "46px");
    AboutTitle.style('color', textColor);

    //About = createP(data.overview);
    myAbout = data.overview;
    if (myAbout.length > 400) {
        myAbout = myAbout.substring(0, 400) + "...";
    }
    About = createP(myAbout);
    About.position(windowWidth / 2 - 40, myPos + 130);
    About.style('font-family', Font);
    About.style('max-width', '600px');
    About.style("font-size", "30px");
    About.style('color', textColor);

    displayCast(300, 550);
}

function addToWatchlist() {
    User.loadUser(localStorage.getItem('user'), (user) => {
        user.addMovie(data.id, "Watchlist");
        console.log(user);
    });
}

function removeFromWatchlist() {
    User.loadUser(localStorage.getItem('user'), (user) => {
        user.removeMovie(data.id, "Watchlist");
        console.log(user);
    });
}

function addToSeen() {
    User.loadUser(localStorage.getItem('user'), (user) => {
        user.addMovie(data.id, "seen");
        console.log(user);
    });
}

function removeFromSeen() {
    User.loadUser(localStorage.getItem('user'), (user) => {
        user.removeMovie(data.id, "seen");
        console.log(user);
    });
}

function addToFavorites() {
    User.loadUser(localStorage.getItem('user'), (user) => {
        user.addMovie(data.id, "favorite");
        console.log(user);
    });
}

function removeFromFavorites() {
    User.loadUser(localStorage.getItem('user'), (user) => {
        user.removeMovie(data.id, "favorite");
        console.log(user);
    });
}

function addRating() {
    if (rating.value() > 5 || rating.value() < 0) {
        error = createP("Please enter a rating between 0 and 5");
    } else {
        User.loadUser(localStorage.getItem('user'), (user) => {
            user.addRating(new Rating(data.original_title, rating.value()));
            console.log(user);
        });
    }
}

function addReview() {
    User.loadUser(localStorage.getItem('user'), (user) => {
        user.addReview(new Review(data.original_title, review.value()));
        console.log(user);
    });
}

function displayCast(x, y) {
    let movieCast = cast.cast;
    let actorName;
    console.log(movieCast);
    castTitle = createP("Cast:");
    castTitle.style('font-family', Font);
    castTitle.style('color', textColor);
    castTitle.style("font-size", "36px");
    castTitle.position(x - 62, y - 75);
    for (let i = 0; i < 11; i++) {
        let temp = new Actor(movieCast[i]);
        temp.getImage((x - 62) + (i * 115), y);
        actorName = temp.getName();
        console.log(actorName);
        actorNameText = createP(actorName);
        actorNameText.style('font-family', Font);
        actorNameText.style('color', textColor);
        actorNameText.style("font-size", "20px");
        actorNameText.style('max-width', '110px');
        actorNameText.position((x - 62) + (i * 115), y + 155);
    }
}