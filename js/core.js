// core.js - Core state, helpers, audio engine and filter presets.
const $ = (s) => document.querySelector(s),
  cv = $("#cv"),
  cx = cv.getContext("2d");
let clips = [],
  texts = [],
  auds = [],
  selA = null,
  restoring = true,
  fit = true,
  MED = {},
  SAVED = new Set(),
  sv,
  sel = null,
  selT = null,
  t = 0,
  playing = false,
  last = 0,
  zoom = 60,
  exporting = false,
  fill = false,
  uid = 0,
  AC,
  mon,
  dst,
  rec,
  chunks = [];
const vids = new Set(),
  esc = (s) => String(s).replace(/[&<>"]/g, (m) => "&#" + m.charCodeAt(0) + ";"),
  fmt = (s) => {
    s = Math.max(0, s);
    return Math.floor(s / 60) + ":" + (s % 60).toFixed(1).padStart(4, "0");
  },
  dur = (c) => (c.out - c.in) / c.speed,
  cl = () => clips.find((c) => c.id === sel),
  au = () => auds.find((a) => a.id === selA),
  tx = () => texts.find((x) => x.id === selT),
  total = () => {
    let s = 0;
    clips.forEach((c) => {
      c.start = s;
      s += dur(c);
    });
    return s;
  },
  msg = (h) => ($("#st").innerHTML = h);
function audio() {
  if (!AC) {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    mon = AC.createGain();
    mon.connect(AC.destination);
    dst = AC.createMediaStreamDestination();
  }
  if (AC.state === "running") return Promise.resolve();
  return Promise.race([AC.resume().catch(() => {}), new Promise((r) => setTimeout(r, 400))]);
}
function route(e) {
  if (e._g) return;
  audio();
  const s = AC.createMediaElementSource(e),
    g = AC.createGain();
  g.gain.value = e._vol === undefined ? 1 : e._vol;
  e.volume = 1;
  s.connect(g);
  g.connect(mon);
  g.connect(dst);
  e._g = g;
}
function setVol(e, v) {
  e._vol = v;
  if (e._g) {
    if (e._g.gain.value !== v) e._g.gain.value = v;
  } else e.volume = Math.min(1, v);
}
const PRE = {
  Normal: [100, 100, 100, 0, 0, 0],
  Vivid: [105, 115, 145, 0, 0, 0],
  "B&W": [100, 115, 100, 100, 0, 0],
  Vintage: [105, 90, 80, 0, 60, 0],
  Dreamy: [112, 90, 110, 0, 10, 2],
  Moody: [85, 125, 80, 0, 0, 0],
};
