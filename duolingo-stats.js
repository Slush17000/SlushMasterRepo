(function () {
  var target = document.getElementById("duolingo-stats");
  if (!target) return;

  fetch("duolingo.json", { cache: "no-cache" })
    .then(function (res) {
      if (!res.ok) throw new Error("bad status");
      return res.json();
    })
    .then(function (data) {
      var streak = Number(data.streak);
      var xp = Number(data.germanXp);
      if (!isFinite(streak) || !isFinite(xp)) throw new Error("bad data");
      target.textContent = "Duolingo streak: " + streak.toLocaleString("en-US") + (streak === 1 ? " day" : " days") +
        " · German XP: " + xp.toLocaleString("en-US");
      target.hidden = false;
    })
    .catch(function () {});
})();
