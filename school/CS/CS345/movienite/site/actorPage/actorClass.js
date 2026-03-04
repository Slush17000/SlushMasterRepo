
const picURL = 'https://www.themoviedb.org/t/p/w300_and_h450_bestv2';

class Actor {

  constructor(data) {
    this.data = data;
  }

  getName() {
    return (this.data.name);
  }

  getScore() {
    return (this.data.popularity);
  }

  getImage(x, y) {
    let img = createElement("img");
    if (this.data.profile_path != null) {
      img.attribute("src", picURL + this.data.profile_path);
    } else {
      img.attribute("src", "../Black_image.jpg");
      img.style("height", "165px");
    }
    img.position(x, y);
    img.style("width", "110px");
  }
}