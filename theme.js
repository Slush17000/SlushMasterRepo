(function () {
  var KEY = "slush-theme";
  var root = document.documentElement;

  function stored() {
    try {
      return localStorage.getItem(KEY) === "light" ? "light" : "dark";
    } catch (e) {
      return "dark";
    }
  }

  function apply(theme) {
    root.setAttribute("data-bs-theme", theme);
    var scheme = document.querySelector('meta[name="color-scheme"]');
    var color = document.querySelector('meta[name="theme-color"]');
    if (scheme) scheme.setAttribute("content", theme);
    if (color) color.setAttribute("content", theme === "light" ? "#ffffff" : "#000000");
  }

  apply(stored());

  function bindToggle() {
    var button = document.getElementById("themeToggle");
    if (!button) return;

    function sync() {
      var isLight = root.getAttribute("data-bs-theme") === "light";
      button.setAttribute("aria-pressed", String(isLight));
      button.textContent = isLight ? "Theme: Light" : "Theme: Dark";
    }

    button.addEventListener("click", function () {
      var next = root.getAttribute("data-bs-theme") === "light" ? "dark" : "light";
      apply(next);
      try {
        localStorage.setItem(KEY, next);
      } catch (e) {}
      sync();
    });

    sync();
  }

  document.addEventListener("DOMContentLoaded", bindToggle);
  // Fired by player.js after it swaps in a new page without a full reload.
  window.addEventListener("slush:pageload", bindToggle);
})();
