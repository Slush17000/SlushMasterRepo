let error;
let newMovies;

function setup() {
  createCanvas(0, 0);

  // Navigation buttons
  let userPageButton = createButton("To User Page");
  userPageButton.position(10, 10);
  userPageButton.mousePressed(goToUserPage);

  // Input box/text fields
  const Mbutton = createButton("Load Scroovie");
  Mbutton.position(windowWidth / 2 - 450, windowHeight / 2 - 250);
  Mbutton.mousePressed(loadMovie);

  loadPerson = createInput();
  loadPerson.size(85);
  loadPerson.position(windowWidth / 2 - 345, windowHeight / 2 - 250);

  const group = createDiv();
  group.child(Mbutton);
  group.child(loadPerson);

  // "NEW MOVIES" text
  error = createP();
  newMovies = createP("NEW MOVIES");
  newMovies.position(windowWidth / 2 - 400, windowHeight / 2 + -225);
  newMovies.style("color", '#CBB677');
  newMovies.style('font-family', Font);
  newMovies.style("font-size", "36px");

  data = loadJSON("https://api.themoviedb.org/3/movie/now_playing?api_key=" + TMDB_API_KEY, (data) => {
    const myMovie = new Movie(data);
    arraySize = myMovie.getMovieCount();
    myMovie.clearMovieList();
    let depth = -100;
    let xPos = 400;
    for (let i = 0; i < arraySize; i++) {
      if (i % 8 == 0 && i != 0) {
        depth = depth + 150;
        xPos = 400;
      }
      myMovie.getAllImages(windowWidth / 2 - xPos, windowHeight / 2 + depth - 50, i);
      xPos -= 100;
    }
  });
}

function loadMovie() {
  newMovies.html("Showing Results For: \"" + loadPerson.value().toUpperCase() + "\"");
  newMovies.position(windowWidth / 2 - 400, windowHeight / 2 + -225);
  newMovies.style("color", '#FFFFFF');
  data = loadJSON(`https://api.themoviedb.org/3/search/movie?query=${loadPerson.value()}&api_key=` + TMDB_API_KEY, (data) => {
    const myMovie = new Movie(data);
    arraySize = myMovie.getMovieCount();
    myMovie.clearMovieList();
    let depth = - 100;
    let xPos = 400;
    if (arraySize == 0) {
      newMovies.html("No movies found matching that name");
      error.position(windowWidth / 2 - 400, windowHeight / 2 + -125);
      error.style("color", errorColor);
      error.style('font-family', Font);
      error.style("font-size", "36px")
    } else {
      error.html("");
    }
    for (let i = 0; i < arraySize; i++) {
      if (i % 8 == 0 && i != 0) {
        depth = depth + 150;
        xPos = 400;
      }
      myMovie.getAllImages(windowWidth / 2 - xPos, windowHeight / 2 + depth - 50, i);
      xPos -= 100;
    }
    myMovie.checkLen();
  });
}

function draw() {
  background(255);
  background(69, 0, 132);
}

