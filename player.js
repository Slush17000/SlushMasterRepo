// Shared music player: loaded on every page. Pages are swapped in place (see soft navigation below) so audio keeps playing;
// playback is also saved in sessionStorage so a full page load can resume it.
(function () {
  "use strict";

  const MUSIC_BASE = "https://slush-tech-images.nyc3.digitaloceanspaces.com/Music";
  // Hand-maintained overrides (titles, artists, track order, display flags). Anything else in the Space is discovered
  // automatically; only folders/tracks listed here get custom data. `file` is the object name inside the folder.
  const CURATED = [
    { name: "Abiotic Factor", tracks: [
      { title: "AF Canaan", file: "AFCanaan.mp3" },
      { title: "AF Unfortunate Spacemen", file: "AFUnfortunateSpacemen.mp3" }
    ] },
    { name: "Black Ops", tracks: [
      { title: "BO1 Multiplayer", file: "BO1Multiplayer.mp3" },
      { title: "BO2 Multiplayer", file: "BO2Multiplayer.mp3" },
      { title: "BO3 Multiplayer", file: "BO3Multiplayer.mp3" },
      { title: "BO Zombies", file: "BOZombies.mp3" }
    ] },
    { name: "Dark Souls", tracks: [
      { title: "DS1 Character Creation", file: "DS1CharacterCreation.mp3" },
      { title: "DS1 Firelink", file: "DS1Firelink.mp3" },
      { title: "DS2 Majula", file: "DS2Majula.mp3" },
      { title: "DS3 Main Menu", file: "DS3MainMenu.mp3" }
    ] },
    { name: "Granny", tracks: [
      { title: "Granny Ambience", file: "GrannyAmbience.mp3" },
      { title: "Granny Main Menu", file: "GrannyMainMenu.mp3" }
    ] },
    { name: "Instrumentals", showArtist: true, tracks: [
      { title: "10 Toes Down", artist: "Chief Keef", file: "10ToesDown.mp3" },
      { title: "1600", artist: "Lil Uzi Vert", file: "1600.mp3" },
      { title: "Baby What's Wrong With You", artist: "Chief Keef", file: "BabyWhatsWrongWithYou.mp3" },
      { title: "Blew My High", artist: "Chief Keef", file: "BlewMyHigh.mp3" },
      { title: "Cold", artist: "Crossfade", file: "Cold.mp3" },
      { title: "Dat Loud", artist: "Chief Keef", file: "DatLoud.mp3" },
      { title: "Doritos Day", artist: "Chief Keef", file: "DoritosDay.mp3" },
      { title: "Foreigns", artist: "Chief Keef", file: "Foreigns.mp3" },
      { title: "Give Up the Goods", artist: "Mobb Deep", file: "GiveUpTheGoods.mp3" },
      { title: "Got Them Bands", artist: "Chief Keef", file: "GotThemBands.mp3" },
      { title: "Green Bean", artist: "Young Nudy", file: "GreenBean.mp3" },
      { title: "I Kno", artist: "Chief Keef", file: "IKno.mp3" },
      { title: "Know How I Rock", artist: "Tadoe", file: "KnowHowIRock.mp3" },
      { title: "Macaroni Time", artist: "Chief Keef", file: "MacaroniTime.mp3" },
      { title: "My Baby", artist: "Chief Keef", file: "MyBaby.mp3" },
      { title: "My Cup", artist: "Playboi Carti", file: "MyCup.mp3" },
      { title: "New Tank", artist: "Playboi Carti", file: "NewTank.mp3" },
      { title: "Ps & Qs", artist: "Lil Uzi Vert", file: "PsAndQs.mp3" },
      { title: "Rawlings", artist: "Chief Keef", file: "Rawlings.mp3" },
      { title: "Send It Up", artist: "Chief Keef", file: "SendItUp.mp3" },
      { title: "Wid Us", artist: "Capo", file: "WidUs.mp3" }
    ] },
    { name: "No I'm Not A Human", tracks: [
      { title: "NINAH Credits", file: "NINAHCredits.mp3" },
      { title: "NINAH Day", file: "NINAHDay.mp3" },
      { title: "NINAH Day Alt", file: "NINAHDayAlt.mp3" },
      { title: "NINAH Main Menu", file: "NINAHMainMenu.mp3" },
      { title: "NINAH Night", file: "NINAHNight.mp3" }
    ] },
    { name: "Almighty Fredi", group: "Slush Beats", detail: true, tracks: [
      { title: "Dim Fred 17", file: "DimFred17.mp3" },
      { title: "Flooded Fredi", file: "FloodedFredi.mp3" },
      { title: "Light Fred 17", file: "LightFred17.mp3" },
      { title: "Muha Freds", file: "MuhaFreds.mp3" },
      { title: "Truly Fredi", file: "TrulyFredi.mp3" }
    ] },
    { name: "Almighty Slush", group: "Slush Beats", detail: true, tracks: [
      { title: "Slush Lyfe", file: "SlushLyfe.mp3" },
      { title: "Slush's Doors Vs The World", file: "SlushsDoorsVsTheWorld.mp3" }
    ] },
    { name: "Geeb Files 1", group: "Slush Beats", detail: true, tracks: [
      { title: "C Fred 18", file: "CFred18.mp3" },
      { title: "Chalice Full of Malice", file: "ChaliceFullofMalice.mp3" },
      { title: "Chandelier", file: "Chandelier.mp3" },
      { title: "Come Forth", file: "ComeForth.mp3" },
      { title: "Cryogenic Slumber Party", file: "CryogenicSlumberParty.mp3" },
      { title: "Gamblers Fallacy", file: "GamblersFallacy.mp3" },
      { title: "Genesis", file: "Genesis.mp3" },
      { title: "Grog Pint", file: "GrogPint.mp3" },
      { title: "Pinnickel", file: "Pinnickel.mp3" },
      { title: "Pounder Protector", file: "PounderProtector.mp3" },
      { title: "RIP Lunch", file: "RIPLunch.mp3" },
      { title: "Regal", file: "Regal.mp3" },
      { title: "Semtex", file: "Semtex.mp3" },
      { title: "Spider Web", file: "SpiderWeb.mp3" },
      { title: "Thunderstrike", file: "Thunderstrike.mp3" },
      { title: "Tropping Tripics", file: "TroppingTripics.mp3" },
      { title: "Wock Tweak", file: "WockTweak.mp3" }
    ] },
    { name: "Geeb Files 2", group: "Slush Beats", detail: true, tracks: [
      { title: "Digital Doh", file: "DigitalDoh.mp3" },
      { title: "FKB", file: "FKB.mp3" },
      { title: "Fuming Forest", file: "FumingForest.mp3" },
      { title: "Fusion Reactor", file: "FusionReactor.mp3" },
      { title: "Novo Royale", file: "NovoRoyale.mp3" },
      { title: "Secret Sprite", file: "SecretSprite.mp3" }
    ] },
    // Ordered by the tracks' own track numbers rather than file name.
    { name: "Remixes", group: "Slush Beats", detail: true, tracks: [
      { title: "The World's Hardest Beat", file: "TheWorldsHardestBeat.mp3" },
      { title: "GHTR", file: "GHTR.mp3" },
      { title: "Aria Trap", file: "AriaTrap.mp3" }
    ] },
    { name: "Undertale", tracks: [
      { title: "Another Medium", file: "AnotherMedium.mp3" },
      { title: "Fallen Down", file: "FallenDown.mp3" }
    ] }
  ];
  const KEY = "slush-player";
  const LIBRARY_KEY = "slush-library";
  const SPACES_ROOT = "https://slush-tech-images.nyc3.digitaloceanspaces.com";
  const AUDIO_EXT = /\.(mp3|m4a|ogg|wav|flac|aac)$/i;
  // Folders inside these groups show full tag info (artist, album, year).
  const DETAIL_GROUPS = new Set(["Slush Beats"]);

  const onMusicPage = () => !!document.getElementById("musicPage");
  const trackOf = (t) => (t && FOLDERS[t.folder] && FOLDERS[t.folder].tracks[t.index]) || null;
  const byName = (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
  const curatedKey = (c, t) => `${c.group ? c.group + "/" : ""}${c.name}/${t.file}`;

  function autoTitle(file) {
    return file.replace(/\.[^.]+$/, "")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
      .replace(/(\d)([A-Z])/g, "$1 $2")
      .replace(/[_-]+/g, " ");
  }

  // Keys are relative to Music/: "Folder/file.mp3" or "Group/Folder/file.mp3".
  function buildLibrary(keys) {
    const found = new Map();
    keys.forEach((key) => {
      const segs = key.split("/");
      const file = segs.pop();
      const group = segs.length > 1 ? segs[0] : null;
      const name = segs.length === 0 ? "Misc" : segs.length === 1 ? segs[0] : segs.slice(1).join(" / ");
      const id = group ? `${group}/${name}` : name;
      if (!found.has(id)) found.set(id, { name, group, files: [] });
      found.get(id).files.push({ file, key });
    });

    return [...found.values()].map(({ name, group, files }) => {
      const cur = CURATED.find((c) => c.name === name && (c.group || null) === group);
      const order = new Map(cur ? cur.tracks.map((t, i) => [curatedKey(cur, t), i]) : []);
      const custom = new Map(cur ? cur.tracks.map((t) => [curatedKey(cur, t), t]) : []);
      const tracks = files
        .map(({ file, key }) => ({ ...(custom.get(key) || { title: autoTitle(file) }), file, key }))
        .sort((a, b) => {
          const ia = order.has(a.key) ? order.get(a.key) : Infinity;
          const ib = order.has(b.key) ? order.get(b.key) : Infinity;
          return ia !== ib ? ia - ib : byName(a.file, b.file);
        });
      return {
        name,
        group,
        detail: !!(cur && cur.detail) || (!!group && DETAIL_GROUPS.has(group)),
        showArtist: !!(cur && cur.showArtist),
        tracks
      };
    }).sort((a, b) => byName(a.group || a.name, b.group || b.name) || byName(a.name, b.name));
  }

  // Start from the last listing (or the curated data) so the page works before the Space has been queried.
  const FOLDERS = buildLibrary(CURATED.flatMap((c) => c.tracks.map((t) => curatedKey(c, t))));
  try {
    const cached = JSON.parse(sessionStorage.getItem(LIBRARY_KEY));
    if (Array.isArray(cached) && cached.length) { FOLDERS.length = 0; FOLDERS.push(...cached); }
  } catch (e) { /* storage unavailable or corrupt */ }

  function locate(key) {
    for (let i = 0; i < FOLDERS.length; i++) {
      const j = FOLDERS[i].tracks.findIndex((t) => t.key === key);
      if (j >= 0) return { folder: i, index: j };
    }
    return null;
  }

  function loadState() {
    try {
      const s = JSON.parse(sessionStorage.getItem(KEY));
      if (s && typeof s === "object") return s;
    } catch (e) { /* storage unavailable or corrupt */ }
    return {};
  }

  const state = Object.assign({ track: null, trackKey: null, time: 0, playing: false, savedAt: 0, expanded: false, volume: 1 }, loadState());
  state.track = state.trackKey ? locate(state.trackKey) : null;
  if (!state.track) state.trackKey = null;

  const syncsafe = (b, o) => (b[o] << 21) | (b[o + 1] << 14) | (b[o + 2] << 7) | b[o + 3];
  const be = (b, o, n) => { let v = 0; for (let i = 0; i < n; i++) v = v * 256 + b[o + i]; return v; };
  const latin1 = (b, s, e) => String.fromCharCode(...b.subarray(s, e));
  const hasId3 = (b) => b.length >= 10 && latin1(b, 0, 3) === "ID3";

  function removeUnsync(b) {
    const out = new Uint8Array(b.length);
    let n = 0;
    for (let i = 0; i < b.length; i++) {
      out[n++] = b[i];
      if (b[i] === 0xff && b[i + 1] === 0) i++;
    }
    return out.subarray(0, n);
  }

  // Minimal ID3v2.2/2.3/2.4 reader that returns the front-cover (or first) picture.
  function parseArt(buf) {
    let b = new Uint8Array(buf);
    if (!hasId3(b)) return null;
    const ver = b[3];
    const flags = b[5];
    b = b.subarray(0, Math.min(10 + syncsafe(b, 6), b.length));
    if (flags & 0x80) b = removeUnsync(b);
    const end = b.length;
    let pos = 10;
    if (flags & 0x40) pos += ver === 4 ? syncsafe(b, 10) : 4 + be(b, 10, 4);
    const idLen = ver === 2 ? 3 : 4;
    const hdr = ver === 2 ? 6 : 10;
    let best = null;

    while (pos + hdr <= end && b[pos] !== 0) {
      const id = latin1(b, pos, pos + idLen);
      const size = ver === 2 ? be(b, pos + 3, 3) : ver === 4 ? syncsafe(b, pos + 4) : be(b, pos + 4, 4);
      const frameFlags = ver > 2 ? b[pos + 9] : 0;
      let s = pos + hdr;
      const e = s + size;
      pos = e;
      if (e > end) break;
      if (id !== "APIC" && id !== "PIC") continue;

      if (ver === 4 && (frameFlags & 0x01)) s += 4;
      const enc = b[s++];
      let mime;
      if (ver === 2) {
        mime = latin1(b, s, s + 3).toLowerCase() === "png" ? "image/png" : "image/jpeg";
        s += 3;
      } else {
        let z = s;
        while (z < e && b[z] !== 0) z++;
        mime = latin1(b, s, z);
        s = z + 1;
      }
      const type = b[s++];
      if (enc === 1 || enc === 2) {
        while (s + 1 < e && !(b[s] === 0 && b[s + 1] === 0)) s += 2;
        s += 2;
      } else {
        while (s < e && b[s] !== 0) s++;
        s++;
      }
      if (s >= e) continue;
      if (!mime.startsWith("image/")) mime = b[s] === 0x89 ? "image/png" : "image/jpeg";

      const pic = { mime, data: b.subarray(s, e) };
      if (type === 3) return pic;
      best = best || pic;
    }
    return best;
  }

  // Only the ID3 tag at the start of the file is downloaded (needs CORS on the Space).
  async function fetchArt(url) {
    const head = await fetch(url, { headers: { Range: "bytes=0-9" } });
    if (!head.ok) throw new Error("fetch failed");
    let buf = await head.arrayBuffer();
    if (head.status === 206) {
      const h = new Uint8Array(buf);
      if (!hasId3(h)) return null;
      const r = await fetch(url, { headers: { Range: `bytes=0-${10 + syncsafe(h, 6) - 1}` } });
      if (!r.ok) throw new Error("fetch failed");
      buf = await r.arrayBuffer();
    }
    const pic = parseArt(buf);
    return pic ? URL.createObjectURL(new Blob([pic.data], { type: pic.mime })) : null;
  }

  const artCache = new Map();
  function artFor(url) {
    if (!artCache.has(url)) artCache.set(url, fetchArt(url));
    return artCache.get(url);
  }

  // Folders may be nested in the bucket (e.g. "Slush Beats/Remixes"), so encode each path segment.
  const trackUrl = (folderIdx, index) =>
    `${MUSIC_BASE}/${FOLDERS[folderIdx].tracks[index].key.split("/").map(encodeURIComponent).join("/")}`;

  const TAG_FIELDS = { TIT2: "title", TPE1: "artist", TALB: "album", TYER: "year", TDRC: "year", TT2: "title", TP1: "artist", TAL: "album", TYE: "year" };

  function decodeText(b) {
    if (!b.length) return "";
    const enc = b[0];
    let body = b.subarray(1);
    let label = "windows-1252";
    if (enc === 1 || enc === 2) {
      label = enc === 2 ? "utf-16be" : "utf-16le";
      if (body[0] === 0xff && body[1] === 0xfe) { label = "utf-16le"; body = body.subarray(2); }
      else if (body[0] === 0xfe && body[1] === 0xff) { label = "utf-16be"; body = body.subarray(2); }
    } else if (enc === 3) {
      label = "utf-8";
    }
    return new TextDecoder(label).decode(body).split("\0").filter(Boolean).join(", ").trim();
  }

  async function fetchRange(url, start, end) {
    const r = await fetch(url, { headers: { Range: `bytes=${start}-${end}` } });
    if (!r.ok) throw new Error("fetch failed");
    const b = new Uint8Array(await r.arrayBuffer());
    return r.status === 206 ? b : b.subarray(start, end + 1);
  }

  // Reads title/artist/album/year frames, skipping over large frames (cover art) instead of downloading them.
  async function readTags(url) {
    let buf = await fetchRange(url, 0, 32767);
    let bufStart = 0;
    if (!hasId3(buf)) return {};
    const ver = buf[3];
    const flags = buf[5];
    const end = 10 + syncsafe(buf, 6);
    const get = async (start, len) => {
      if (start < bufStart || start + len > bufStart + buf.length) {
        buf = await fetchRange(url, start, start + Math.max(len, 16384) - 1);
        bufStart = start;
      }
      return buf.subarray(start - bufStart, start - bufStart + len);
    };

    let pos = 10;
    if (flags & 0x40) pos += ver === 4 ? syncsafe(buf, 10) : 4 + be(buf, 10, 4);
    const idLen = ver === 2 ? 3 : 4;
    const hdr = ver === 2 ? 6 : 10;
    const out = {};
    while (pos + hdr <= end && !(out.title && out.artist && out.album && out.year)) {
      const h = await get(pos, hdr);
      if (h.length < hdr || h[0] === 0) break;
      const size = ver === 2 ? be(h, 3, 3) : ver === 4 ? syncsafe(h, 4) : be(h, 4, 4);
      const key = TAG_FIELDS[latin1(h, 0, idLen)];
      if (key && !out[key] && size > 1) {
        let body = await get(pos + hdr, size);
        if (ver === 4 && (h[9] & 0x01)) body = body.subarray(4);
        out[key] = decodeText(body);
      }
      pos += hdr + size;
    }
    if (out.year) out.year = out.year.slice(0, 4);
    return out;
  }

  const metaPromises = new Map();
  const metaDone = new Map();

  function resolvedMeta(folderIdx, index) {
    const t = FOLDERS[folderIdx].tracks[index];
    const tag = metaDone.get(trackUrl(folderIdx, index)) || {};
    return { title: tag.title || t.title, artist: tag.artist || t.artist || "", album: tag.album || "", year: tag.year || "" };
  }

  function metaFor(folderIdx, index) {
    const url = trackUrl(folderIdx, index);
    if (!metaPromises.has(url)) {
      metaPromises.set(url, readTags(url).catch(() => ({})).then((tag) => { metaDone.set(url, tag); }));
    }
    return metaPromises.get(url).then(() => resolvedMeta(folderIdx, index));
  }

  const fmt = (s) => {
    if (!isFinite(s)) return "0:00";
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  };
  const setFill = (input) => {
    const max = Number(input.max);
    input.style.setProperty("--fill", `${max > 0 ? (Number(input.value) / max) * 100 : 0}%`);
  };

  const el = document.createElement("section");
  el.className = "music-player";
  el.setAttribute("aria-label", "Music player");
  el.innerHTML = `
    <button class="player-toggle" id="playerToggle" type="button" aria-expanded="false" aria-controls="playerBody">
      <span class="player-label">Music Player</span>
      <span class="player-mini" id="playerMini">Nothing playing</span>
      <span class="player-chevron" aria-hidden="true">&#9650;</span>
    </button>
    <div class="player-body" id="playerBody" hidden>
      <div class="player-cover">
        <img id="playerArt" alt="" hidden>
        <div class="player-cover-fallback" id="playerArtFallback" aria-hidden="true">&#9835;</div>
      </div>
      <div class="player-main">
        <div>
          <div class="player-title" id="playerTitle">Nothing playing</div>
          <div class="player-album" id="playerAlbum">Select a track</div>
          <div class="player-album" id="playerExtra" hidden></div>
        </div>
        <div class="player-seek">
          <span id="playerCurrent">0:00</span>
          <input id="playerSeek" type="range" min="0" max="0" step="0.1" value="0" aria-label="Seek" disabled>
          <span id="playerDuration">0:00</span>
        </div>
        <div class="player-controls">
          <button class="player-btn" id="playerPrev" type="button" aria-label="Previous track" disabled><svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zM9.5 12 18 18V6z"/></svg></button>
          <button class="player-btn player-btn-main" id="playerPlay" type="button" aria-label="Play" disabled><svg viewBox="0 0 24 24" id="playerPlayIcon"><path d="M8 5v14l11-7z"/></svg></button>
          <button class="player-btn" id="playerNext" type="button" aria-label="Next track" disabled><svg viewBox="0 0 24 24"><path d="M16 6h2v12h-2zM6 18l8.5-6L6 6z"/></svg></button>
          <button class="player-btn" id="playerStop" type="button" aria-label="Stop" disabled><svg viewBox="0 0 24 24"><path d="M7 7h10v10H7z"/></svg></button>
          <input class="player-volume" id="playerVolume" type="range" min="0" max="1" step="0.01" value="1" aria-label="Volume">
        </div>
      </div>
    </div>`;
  const q = (id) => el.querySelector("#" + id);
  document.querySelector(".site-footer").before(el);

  // Off the music page the player is only shown while a track is loaded.
  function updateVisibility() {
    const show = onMusicPage() || !!state.track;
    el.hidden = !show;
    document.body.classList.toggle("has-player", show);
  }

  const audio = new Audio();
  // CORS-enabled loads are required for Web Audio to read the samples (falls back to plain playback on error).
  audio.crossOrigin = "anonymous";
  audio.preload = "metadata";
  audio.volume = Math.min(1, Math.max(0, Number(state.volume) || 0));

  const listeners = [];
  let lastSave = 0;
  let pendingSeek = null;
  let resumeArmed = false;

  // Web Audio graph (source -> gain -> analyser -> output) for the music page's equalizer. Once connected, volume moves
  // to the gain node so the analyser sees the level the listener actually hears.
  let ctx = null;
  let gainNode = null;
  let analyser = null;
  let graphBlocked = false;
  const graphListeners = [];

  function setVolume(v) {
    state.volume = v;
    if (gainNode) gainNode.gain.value = v; else audio.volume = v;
  }

  function wakeContext() {
    if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
  }

  function connectGraph() {
    if (analyser || graphBlocked || !ctx || ctx.state !== "running") return;
    try {
      const source = ctx.createMediaElementSource(audio);
      gainNode = ctx.createGain();
      gainNode.gain.value = state.volume;
      audio.volume = 1;
      const node = ctx.createAnalyser();
      node.fftSize = 2048;
      node.smoothingTimeConstant = 0.8;
      node.minDecibels = -90;
      node.maxDecibels = -15;
      source.connect(gainNode);
      gainNode.connect(node);
      node.connect(ctx.destination);
      analyser = node;
    } catch (e) {
      graphBlocked = true;
      return;
    }
    document.removeEventListener("pointerdown", wakeContext, true);
    document.removeEventListener("keydown", wakeContext, true);
    graphListeners.forEach((fn) => fn());
  }

  // A suspended context would silence the element once connected, so only connect when it is running.
  function tryConnect() {
    if (analyser || graphBlocked) return;
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        graphBlocked = true;
        return;
      }
      ctx.addEventListener("statechange", connectGraph);
      document.addEventListener("pointerdown", wakeContext, true);
      document.addEventListener("keydown", wakeContext, true);
    }
    if (ctx.state === "running") connectGraph(); else ctx.resume().catch(() => {});
  }

  function save() {
    state.time = state.track ? audio.currentTime || 0 : 0;
    state.playing = !!state.track && !audio.paused && !audio.ended;
    state.savedAt = Date.now();
    lastSave = state.savedAt;
    try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable */ }
  }

  const emit = () => listeners.forEach((fn) => fn(state.track));

  function setExpanded(on) {
    state.expanded = on;
    el.classList.toggle("is-expanded", on);
    q("playerBody").hidden = !on;
    q("playerToggle").setAttribute("aria-expanded", String(on));
  }

  function renderText() {
    const t = trackOf(state.track);
    const extra = q("playerExtra");
    extra.hidden = true;
    if (!t) {
      q("playerTitle").textContent = "Nothing playing";
      q("playerAlbum").textContent = "Select a track";
      q("playerMini").textContent = "Nothing playing";
      return;
    }
    const { folder: fi, index } = state.track;
    const folder = FOLDERS[fi];
    let title = t.title;
    let sub = folder.showArtist && t.artist ? t.artist : folder.name;
    if (folder.detail) {
      const m = resolvedMeta(fi, index);
      title = m.title;
      sub = m.artist || folder.name;
      extra.textContent = m.album;
      extra.hidden = !m.album;
    } else if (folder.showArtist) {
      sub = resolvedMeta(fi, index).artist || folder.name;
    }
    q("playerTitle").textContent = title;
    q("playerAlbum").textContent = sub;
    q("playerMini").textContent = `${title} - ${sub}`;
  }

  function renderTrack() {
    const t = trackOf(state.track);
    const folder = t && FOLDERS[state.track.folder];
    renderText();
    q("playerPrev").disabled = !t;
    q("playerPlay").disabled = !t;
    q("playerStop").disabled = !t;
    q("playerSeek").disabled = !t;
    q("playerNext").disabled = !t || state.track.index >= folder.tracks.length - 1;

    const seek = q("playerSeek");
    seek.max = 0;
    seek.value = 0;
    setFill(seek);
    q("playerCurrent").textContent = "0:00";
    q("playerDuration").textContent = "0:00";

    q("playerArt").hidden = true;
    q("playerArt").removeAttribute("src");
    q("playerArtFallback").hidden = false;
  }

  function loadTrack(track) {
    disarmResume();
    pendingSeek = null;
    state.track = track;
    state.trackKey = trackOf(track).key;
    const folder = FOLDERS[track.folder];
    const url = trackUrl(track.folder, track.index);
    audio.src = url;
    renderTrack();
    if (folder.detail || (folder.showArtist && !trackOf(track).artist)) {
      metaFor(track.folder, track.index).then(() => { if (state.track === track) renderText(); });
    }
    artFor(url).then((src) => {
      if (src && state.track === track) q("playerArt").src = src;
    }).catch(() => {});
  }

  function play(folderIdx, index) {
    loadTrack({ folder: folderIdx, index });
    audio.play().catch(() => {});
    setExpanded(true);
    save();
    emit();
  }

  function stop() {
    disarmResume();
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    state.track = null;
    state.trackKey = null;
    renderTrack();
    updateVisibility();
    save();
    emit();
  }

  function next() {
    const t = state.track;
    if (t && t.index < FOLDERS[t.folder].tracks.length - 1) play(t.folder, t.index + 1);
  }

  function onGesture(e) {
    if (el.contains(e.target)) return;
    if (e.type === "keydown" && e.key !== "Enter" && e.key !== " ") return;
    disarmResume();
    audio.play().catch(() => {});
  }

  function armResume() {
    if (resumeArmed) return;
    resumeArmed = true;
    document.addEventListener("pointerdown", onGesture, true);
    document.addEventListener("keydown", onGesture, true);
  }

  function disarmResume() {
    if (!resumeArmed) return;
    resumeArmed = false;
    document.removeEventListener("pointerdown", onGesture, true);
    document.removeEventListener("keydown", onGesture, true);
  }

  q("playerArt").addEventListener("load", () => {
    q("playerArt").hidden = false;
    q("playerArtFallback").hidden = true;
  });
  q("playerArt").addEventListener("error", () => {
    q("playerArt").hidden = true;
    q("playerArtFallback").hidden = false;
  });

  q("playerToggle").addEventListener("click", () => {
    setExpanded(!el.classList.contains("is-expanded"));
    save();
  });
  q("playerPlay").addEventListener("click", () => {
    disarmResume();
    if (audio.paused) audio.play().catch(() => {}); else audio.pause();
  });
  q("playerPrev").addEventListener("click", () => {
    const t = state.track;
    if (!t) return;
    if (audio.currentTime > 3 || t.index === 0) audio.currentTime = 0;
    else play(t.folder, t.index - 1);
  });
  q("playerNext").addEventListener("click", next);
  q("playerStop").addEventListener("click", stop);
  q("playerVolume").addEventListener("input", (e) => {
    setVolume(Number(e.target.value));
    setFill(e.target);
    save();
  });
  q("playerSeek").addEventListener("input", (e) => {
    audio.currentTime = Number(e.target.value);
    setFill(e.target);
  });

  audio.addEventListener("loadedmetadata", () => {
    const seek = q("playerSeek");
    seek.max = audio.duration;
    q("playerDuration").textContent = fmt(audio.duration);
    if (pendingSeek !== null) {
      if (Math.abs(audio.currentTime - pendingSeek) > 1) audio.currentTime = pendingSeek;
      pendingSeek = null;
    }
    setFill(seek);
  });
  audio.addEventListener("timeupdate", () => {
    const seek = q("playerSeek");
    seek.value = audio.currentTime;
    q("playerCurrent").textContent = fmt(audio.currentTime);
    setFill(seek);
    if (Date.now() - lastSave > 1000) save();
  });
  audio.addEventListener("play", () => {
    q("playerPlayIcon").innerHTML = '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>';
    q("playerPlay").setAttribute("aria-label", "Pause");
    tryConnect();
    save();
  });
  audio.addEventListener("pause", () => {
    q("playerPlayIcon").innerHTML = '<path d="M8 5v14l11-7z"/>';
    q("playerPlay").setAttribute("aria-label", "Play");
    save();
  });
  audio.addEventListener("ended", () => {
    const t = state.track;
    if (t && t.index < FOLDERS[t.folder].tracks.length - 1) next();
    else { audio.currentTime = 0; save(); }
  });
  audio.addEventListener("error", () => {
    if (state.track && audio.crossOrigin && !analyser) {
      // The Space isn't sending CORS headers for media: play normally and skip the visualizer.
      graphBlocked = true;
      const src = audio.src;
      audio.removeAttribute("crossorigin");
      audio.src = src;
      audio.play().catch(() => {});
      return;
    }
    if (state.track) q("playerMini").textContent = "Could not load track";
  });

  window.addEventListener("pagehide", save);
  document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });

  q("playerVolume").value = audio.volume;
  setFill(q("playerVolume"));
  setExpanded(!!state.expanded);
  updateVisibility();

  if (state.track) {
    const wasPlaying = state.playing;
    const elapsed = wasPlaying ? Math.max(0, (Date.now() - state.savedAt) / 1000) : 0;
    const resumeAt = (Number(state.time) || 0) + elapsed;
    loadTrack(state.track);
    pendingSeek = resumeAt;
    audio.currentTime = resumeAt;
    if (wasPlaying) audio.play().catch(armResume);
  } else {
    renderTrack();
  }

  // Library refresh: list Music/ in the Space so uploaded folders and files appear without code changes.
  const libraryListeners = [];

  async function listKeys() {
    const keys = [];
    let token = null;
    do {
      const params = new URLSearchParams({ "list-type": "2", prefix: "Music/" });
      if (token) params.set("continuation-token", token);
      const res = await fetch(`${SPACES_ROOT}/?${params}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Spaces listing failed: ${res.status}`);
      const xml = new DOMParser().parseFromString(await res.text(), "application/xml");
      xml.querySelectorAll("Contents > Key").forEach((n) => keys.push(n.textContent));
      const truncated = xml.querySelector("IsTruncated")?.textContent === "true";
      token = truncated ? xml.querySelector("NextContinuationToken")?.textContent : null;
    } while (token);
    return keys;
  }

  function applyLibrary(next) {
    FOLDERS.length = 0;
    FOLDERS.push(...next);
    try { sessionStorage.setItem(LIBRARY_KEY, JSON.stringify(FOLDERS)); } catch (e) { /* storage unavailable */ }
    if (state.trackKey) {
      const pos = locate(state.trackKey);
      if (!pos) {
        stop();
      } else {
        state.track.folder = pos.folder;
        state.track.index = pos.index;
        q("playerNext").disabled = pos.index >= FOLDERS[pos.folder].tracks.length - 1;
        save();
      }
    }
    libraryListeners.forEach((fn) => fn());
  }

  let refreshing = false;
  async function refreshLibrary() {
    if (refreshing) return;
    refreshing = true;
    try {
      const keys = (await listKeys()).filter((k) => AUDIO_EXT.test(k)).map((k) => k.slice("Music/".length));
      // An empty listing is treated as a failure so a hiccup never wipes the page.
      if (!keys.length) return;
      const next = buildLibrary(keys);
      if (JSON.stringify(next) !== JSON.stringify(FOLDERS)) applyLibrary(next);
    } catch (e) {
      console.error(e);
    } finally {
      refreshing = false;
    }
  }

  if (onMusicPage() || state.track) refreshLibrary();
  window.addEventListener("slush:pageload", () => { if (onMusicPage()) refreshLibrary(); });
  document.addEventListener("visibilitychange", () => { if (!document.hidden && onMusicPage()) refreshLibrary(); });
  setInterval(() => { if (!document.hidden && onMusicPage()) refreshLibrary(); }, 60000);

  window.SlushPlayer = {
    FOLDERS,
    element: el,
    analyser: () => analyser,
    graphBlocked: () => graphBlocked,
    onGraph: (fn) => {
      graphListeners.push(fn);
      return () => { const i = graphListeners.indexOf(fn); if (i >= 0) graphListeners.splice(i, 1); };
    },
    folderKey: (f) => (f.group ? `${f.group}/${f.name}` : f.name),
    onLibrary: (fn) => {
      libraryListeners.push(fn);
      return () => { const i = libraryListeners.indexOf(fn); if (i >= 0) libraryListeners.splice(i, 1); };
    },
    play,
    current: () => state.track,
    meta: metaFor,
    onChange: (fn) => {
      listeners.push(fn);
      return () => { const i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1); };
    }
  };

  // Soft navigation: fetch the next page and swap <main> in place so the audio element is never torn down.
  const dirOf = (path) => path.slice(0, path.lastIndexOf("/") + 1);
  const sitePath = (url) => /^https?:$/.test(url.protocol) && url.origin === location.origin && dirOf(url.pathname) === dirOf(location.pathname);
  let renderedPath = location.pathname;
  let navToken = 0;

  const waitFor = (node) => new Promise((resolve) => {
    node.addEventListener("load", resolve, { once: true });
    node.addEventListener("error", resolve, { once: true });
  });

  async function loadStyles(doc, base) {
    const have = new Set([...document.querySelectorAll('link[rel="stylesheet"]')].map((l) => l.href));
    const pending = [];
    doc.querySelectorAll('link[rel="stylesheet"]').forEach((l) => {
      const href = new URL(l.getAttribute("href"), base).href;
      if (have.has(href)) return;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      pending.push(waitFor(link));
      document.head.append(link);
    });
    await Promise.all(pending);
  }

  // Inline page scripts are wrapped so their top-level const/let don't clash when a page is visited twice.
  async function runScripts(doc) {
    for (const old of doc.body.querySelectorAll("script")) {
      const src = old.getAttribute("src");
      if (src) {
        if (/bootstrap|player\.js/.test(src)) continue;
        if ([...document.scripts].some((s) => s.getAttribute("src") === src)) continue;
        const s = document.createElement("script");
        s.src = src;
        const loaded = waitFor(s);
        document.body.append(s);
        await loaded;
      } else {
        const s = document.createElement("script");
        s.textContent = `(() => {\n${old.textContent}\n})();`;
        document.body.append(s);
        s.remove();
      }
    }
  }

  async function softNavigate(url, push) {
    const token = ++navToken;
    try {
      const res = await fetch(url.href);
      if (!res.ok) throw new Error("bad status");
      const doc = new DOMParser().parseFromString(await res.text(), "text/html");
      const newMain = doc.querySelector("main");
      if (!newMain || !doc.querySelector('script[src="player.js"]')) throw new Error("not a player page");
      await loadStyles(doc, url);
      if (token !== navToken) return;

      window.dispatchEvent(new Event("slush:pageleave"));
      document.title = doc.title;
      const icon = doc.querySelector('link[rel="icon"]');
      const curIcon = document.querySelector('link[rel="icon"]');
      if (icon && curIcon) curIcon.setAttribute("href", icon.getAttribute("href"));
      if (push) history.pushState(null, "", url.href);
      renderedPath = url.pathname;

      document.querySelector("main").replaceWith(document.adoptNode(newMain));
      document.querySelectorAll(".site-nav a").forEach((a) => {
        const here = new URL(a.getAttribute("href"), url).pathname === url.pathname;
        a.classList.toggle("is-current", here);
        if (here) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
      });
      const menu = document.getElementById("siteNavMenu");
      if (menu && menu.classList.contains("show") && window.bootstrap) window.bootstrap.Collapse.getOrCreateInstance(menu).hide();

      updateVisibility();
      await runScripts(doc);
      window.dispatchEvent(new Event("slush:pageload"));
    } catch (e) {
      if (token === navToken) location.href = url.href;
    }
  }

  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest("a[href]");
    if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
    const url = new URL(a.href, location.href);
    if (!sitePath(url) || !/\.html$/.test(url.pathname)) return;
    if (url.pathname === location.pathname) {
      if (!url.hash) e.preventDefault();
      return;
    }
    e.preventDefault();
    softNavigate(url, true);
  });

  window.addEventListener("popstate", () => {
    const url = new URL(location.href);
    if (url.pathname === renderedPath) return;
    if (sitePath(url)) softNavigate(url, false); else location.reload();
  });
})();
