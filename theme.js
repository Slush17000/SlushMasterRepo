(function () {
  var KEY = "slush-theme";
  var MODE_KEY = "slush-color-mode";
  var COLOR_KEYS = ["slush-color-1", "slush-color-2"];
  var HEX = /^#[0-9a-f]{6}$/i;
  var root = document.documentElement;

  function read(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {}
  }

  function stored() {
    return read(KEY) === "light" ? "light" : "dark";
  }

  function apply(theme) {
    root.setAttribute("data-bs-theme", theme);
    var scheme = document.querySelector('meta[name="color-scheme"]');
    var color = document.querySelector('meta[name="theme-color"]');
    if (scheme) scheme.setAttribute("content", theme);
    if (color) color.setAttribute("content", theme === "light" ? "#ffffff" : "#000000");
  }

  function applyColorMode(mode) {
    root.setAttribute("data-color-mode", mode);
  }

  // Custom colors are inline overrides; without them the stylesheet defaults (white on dark, black on light) apply.
  function applyColors() {
    COLOR_KEYS.forEach(function (key, i) {
      var value = read(key);
      var prop = "--color-" + (i + 1);
      if (value && HEX.test(value)) root.style.setProperty(prop, value);
      else root.style.removeProperty(prop);
    });
  }

  apply(stored());
  applyColorMode(read(MODE_KEY) === "static" ? "static" : "animated");
  applyColors();

  function themeDefault() {
    return root.getAttribute("data-bs-theme") === "light" ? "#000000" : "#ffffff";
  }

  function bindToggle() {
    var button = document.getElementById("themeToggle");
    var colorButton = document.getElementById("colorToggle");
    var pickers = document.getElementById("colorPickers");
    var inputs = [document.getElementById("color1"), document.getElementById("color2")];

    function sync() {
      if (button) {
        var isLight = root.getAttribute("data-bs-theme") === "light";
        button.setAttribute("aria-pressed", String(isLight));
        button.textContent = isLight ? "Theme: Light" : "Theme: Dark";
      }
      var isStatic = root.getAttribute("data-color-mode") === "static";
      if (colorButton) {
        colorButton.setAttribute("aria-pressed", String(isStatic));
        colorButton.textContent = isStatic ? "Color Mode: Static" : "Color Mode: Animated RGB";
      }
      if (pickers) pickers.hidden = !isStatic;
      inputs.forEach(function (input, i) {
        if (!input) return;
        var value = read(COLOR_KEYS[i]);
        input.value = value && HEX.test(value) ? value : themeDefault();
      });
    }

    if (button && !button.dataset.bound) {
      button.dataset.bound = "1";
      button.addEventListener("click", function () {
        var next = root.getAttribute("data-bs-theme") === "light" ? "dark" : "light";
        apply(next);
        write(KEY, next);
        sync();
      });
    }

    if (colorButton && !colorButton.dataset.bound) {
      colorButton.dataset.bound = "1";
      colorButton.addEventListener("click", function () {
        var next = root.getAttribute("data-color-mode") === "static" ? "animated" : "static";
        applyColorMode(next);
        write(MODE_KEY, next);
        sync();
      });
    }

    inputs.forEach(function (input, i) {
      if (!input || input.dataset.bound) return;
      input.dataset.bound = "1";
      input.addEventListener("input", function () {
        write(COLOR_KEYS[i], input.value);
        applyColors();
      });
    });

    sync();
  }

  document.addEventListener("DOMContentLoaded", bindToggle);
  // Fired by player.js after it swaps in a new page without a full reload.
  window.addEventListener("slush:pageload", bindToggle);
})();
