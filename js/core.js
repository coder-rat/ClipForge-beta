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
    AC = new AudioContext();
    mon = AC.createGain();
    mon.connect(AC.destination);
    dst = AC.createMediaStreamDestination();
  }
  if (AC.state !== "running") AC.resume();
}
const PRE = {
  Normal: [100, 100, 100, 0, 0, 0],
  Vivid: [105, 115, 145, 0, 0, 0],
  "B&W": [100, 115, 100, 100, 0, 0],
  Vintage: [105, 90, 80, 0, 60, 0],
  Dreamy: [112, 90, 110, 0, 10, 2],
  Moody: [85, 125, 80, 0, 0, 0],
};
