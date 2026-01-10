const body = document.body;
const osDefault = document.getElementById("default");
const dark = document.getElementById("dark");
const light = document.getElementById("light");

function switchToDefault(event) {
    event.preventDefault();
    body.classList.remove("light");
    body.classList.remove("dark");
}

function switchToDark(event) {
    event.preventDefault();
    body.classList.add("dark");
    body.classList.remove("light");
}

function switchToLight(event) {
    event.preventDefault();
    body.classList.add("light");
    body.classList.remove("dark");
}

osDefault.addEventListener("click", switchToDefault)
dark.addEventListener("click", switchToDark)
light.addEventListener("click", switchToLight)
