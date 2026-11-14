// Fetches public Duolingo stats and writes duolingo.json for the Professional page.
// Exits non-zero on any failure so the previous duolingo.json is left untouched.
const fs = require("fs");
const path = require("path");

const USERNAME = "Slush17000";
const COURSE_ID = "DUOLINGO_DE_EN";
const URL = "https://www.duolingo.com/2017-06-30/users?username=" + encodeURIComponent(USERNAME);

async function main() {
  const res = await fetch(URL, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error("Duolingo responded with " + res.status);
  const data = await res.json();
  const user = data && data.users && data.users[0];
  if (!user) throw new Error("User not found in response");

  const course = (user.courses || []).find(function (c) { return c.id === COURSE_ID; });
  const streak = Number(user.streak);
  const germanXp = course ? Number(course.xp) : NaN;
  if (!Number.isFinite(streak) || !Number.isFinite(germanXp)) throw new Error("Missing streak or German XP");

  const out = {
    streak: streak,
    germanXp: germanXp,
    updated: new Date().toISOString().slice(0, 10)
  };
  fs.writeFileSync(path.join(__dirname, "..", "duolingo.json"), JSON.stringify(out, null, 2) + "\n");
  console.log("Wrote duolingo.json", out);
}

main().catch(function (err) {
  console.error(err.message);
  process.exit(1);
});
