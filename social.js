(function () {
  // Avatars are hotlinked from each platform; if one fails to load, fall back to the generic placeholder.
  function fallback(img) {
    img.parentElement.classList.add("social-avatar-empty");
    img.remove();
  }

  document.querySelectorAll(".social-avatar img").forEach(function (img) {
    img.addEventListener("error", function () { fallback(img); });
    if (img.complete && img.naturalWidth === 0) fallback(img);
  });
})();
