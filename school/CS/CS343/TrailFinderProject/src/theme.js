const body = document.body;
const dark = document.getElementById("dark");
const light = document.getElementById("light");

function switchToDark(event) {
    event.preventDefault();
    body.classList.add("dark");
    body.classList.remove("light");
    localStorage.setItem("theme", "dark");
}

function switchToLight(event) {
    event.preventDefault();
    body.classList.add("light");
    body.classList.remove("dark");
    localStorage.setItem("theme", "light");
}

// Apply saved theme on page load
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
    body.classList.add("dark");
} else if (savedTheme === "light") {
    body.classList.add("light");
} else {
    // Default to light mode if no theme is saved or if "default" was previously saved
    body.classList.add("light");
    localStorage.setItem("theme", "light");
}

// Add event listeners if the elements exist
if (dark) dark.addEventListener("click", switchToDark);
if (light) light.addEventListener("click", switchToLight);
