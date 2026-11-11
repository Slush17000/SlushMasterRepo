(function () {
  var API = "https://abacus.jasoncameron.dev";
  var NAMESPACE = "slush17000-tech";
  var KEY = "site-views";
  var COUNTED = "slush-view-counted";
  var PLACEHOLDER = "-----";

  var footer = document.querySelector(".site-footer");
  if (!footer || footer.querySelector(".view-counter")) return;

  var counter = document.createElement("p");
  counter.className = "view-counter";
  counter.setAttribute("role", "status");
  counter.innerHTML = 'This site has been viewed <span class="view-counter-digits" aria-hidden="true"></span> <span class="view-counter-unit">times</span>';
  footer.append(counter);
  var digits = counter.querySelector(".view-counter-digits");
  var unit = counter.querySelector(".view-counter-unit");

  function render(text) {
    digits.textContent = "";
    for (var i = 0; i < text.length; i++) {
      var span = document.createElement("span");
      span.className = "view-digit";
      span.style.setProperty("--i", i);
      span.textContent = text[i];
      digits.append(span);
    }
  }

  function show(value) {
    var end = value.toLocaleString("en-US");
    unit.textContent = value === 1 ? "time" : "times";
    counter.setAttribute("aria-label", "This site has been viewed " + end + " " + unit.textContent);
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || value < 2) {
      render(end);
      return;
    }
    var start = performance.now();
    var duration = 1200;
    (function tick(now) {
      var t = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - t, 3);
      render(Math.round(value * eased).toLocaleString("en-US"));
      if (t < 1) requestAnimationFrame(tick);
    })(start);
  }

  function counted() {
    try { return sessionStorage.getItem(COUNTED) === "1"; } catch (e) { return false; }
  }

  function markCounted() {
    try { sessionStorage.setItem(COUNTED, "1"); } catch (e) {}
  }

  // Count one view per browser session; local dev and file:// previews are read-only.
  var isLocal = /^(localhost|127\.0\.0\.1|\[::1\]|)$/.test(location.hostname);
  var action = counted() || isLocal ? "get" : "hit";

  render(PLACEHOLDER);
  fetch(API + "/" + action + "/" + NAMESPACE + "/" + KEY)
    .then(function (res) {
      if (res.status === 404) return { value: 0 };
      if (!res.ok) throw new Error("bad status");
      return res.json();
    })
    .then(function (data) {
      var value = Number(data && data.value);
      if (!isFinite(value)) throw new Error("bad value");
      if (action === "hit") markCounted();
      show(value);
    })
    .catch(function () {
      render("--");
      counter.setAttribute("aria-label", "Site view count unavailable");
    });
})();
