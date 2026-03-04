const imgUrl = 'https://www.themoviedb.org/t/p/w1280'

var movieList = [];

class Movie {
  constructor(data) {
    this.data = data
  }

  checkLen() {
    console.log(movieList.length);
  }

  clearMovieList() {
    for (var i = 0; i < movieList.length; i++) {
      movieList[i].remove();
    }
  }

  getMovieCount() {
    return (this.data.results.length);
  }

  getName() {
    return (this.data.results[0].original_title);
  }

  getDate() {
    return (data.results[0].release_date);
  }

  getAbout() {
    return (this.data.results[0].overview);
  }

  getPopScore() {
    return (this.data.results[0].popularity);
  }

  getAllImages(x, y, z) {
    let img = createElement("img");
    movieList.push(img);
    if (this.data.results[z].poster_path != null) {
      img.attribute("src", imgUrl + this.data.results[z].poster_path);
    } else {
      img.attribute("src", "../Black_image.jpg");// change to bad jpeg
      img.style("height", "120px");
    }
    img.position(x, y);
    img.style("width", "80px");
    img.style("height", "120px");
    img.mousePressed(function () { loadMoviePage(data.results[z].id); });

  }

  getImage(x, y) {
    let img = createElement("img");
    img.attribute("src", imgUrl + this.data.results[0].poster_path);
    img.position(x - img.width, y);
    img.style("width", "80px");
    img.style("height", "120px");
    img.mousePressed(function () { loadMoviePage(data.results[0].id); });
  }

  getUserImage(x, y) {
    let img = createElement("img");
    if (this.data.results[0].poster_path != null) {
      img.attribute("src", imgUrl + this.data.results[0].poster_path);
    } else {
      img.attribute("src", "../Black_image.jpg");// change to bad jpeg
    }
    img.position(x, y);
    img.style("width", "250px");
    img.style("height", "500px");
    //onsole.log(data.results[0].id);
    img.mousePressed(() => { loadMoviePage(this.data.results[0].id); });

  }

  getBackground(x, y) {
    let img = createElement("img");
    img.attribute("src", imgUrl + this.data.results[0].poster_path);
    //img.opacity(0.5);
    img.style("width", "400px");
    img.position((x / 2) - width * 2, 0);
  }

  getBigImage(x, y) {
    let img = createElement("img");
    img.attribute("src", imgUrl + this.data.results[0].poster_path);
    img.style("width", "250px");

    img.position((x / 2) - width * 3, 105);
  }

}

function loadMovie(movieName, x, y) {
  let myMovie;
  data = loadJSON(`https://api.themoviedb.org/3/search/movie?query=${movieName}&api_key=` + TMDB_API_KEY, function (data) {
    myMovie = new Movie(data);
    myMovie.getImage(x, y);
  });
}

function loadMoviePage(id) {
  window.location.replace(`../moviePage/moviePage.html?data=${id}`);
}