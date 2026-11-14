(function () {
  var clock = document.querySelector(".site-clock");
  if (!clock) return;

  var formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZoneName: "short"
  });

  function render() {
    var p = {};
    formatter.formatToParts(new Date()).forEach(function (part) {
      p[part.type] = part.value;
    });
    clock.textContent = p.weekday + ", " + p.month + " " + p.day + ", " + p.year +
      " \u00b7 " + p.hour + ":" + p.minute + ":" + p.second + " " + p.timeZoneName;
  }

  // Re-render on each second boundary so the display never lags the real clock.
  function schedule() {
    render();
    window.setTimeout(schedule, 1000 - (Date.now() % 1000) + 5);
  }

  schedule();
})();
