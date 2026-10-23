// timeline.js - Timeline drawing, inspector panel (trim, speed, filters, text) and scrubbing.
function renderTL() {
  save();
  const T = total(),
    inn = $("#in");
  const tw = $("#tl").clientWidth,
    S = Math.max(T, 1, ...auds.map((a) => a.start + a.out - a.in), ...texts.map((x) => x.start + x.dur));
  if (fit) {
    zoom = Math.max(0.5, Math.min(200, (tw - 24) / S));
    $("#zm").value = zoom;
  }
  inn.style.width = fit ? "100%" : Math.max(S * zoom + 300, tw) + "px";
  let h = "";
  const st = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600].find((v) => v * zoom >= 44) || 1200;
  for (let s = 0; s <= S; s += st)
    h += `<i class="tk" style="left:${s * zoom}px">${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}</i>`;
  clips.forEach(
    (c) =>
      (h += `<div class="blk ${c.kind === "image" ? "img" : ""} ${c.id === sel ? "sel" : ""}" data-id="${c.id}" style="left:${c.start * zoom}px;width:${Math.max(8, dur(c) * zoom)}px">${esc(c.name)}</div>`),
  );
  texts.forEach(
    (x) =>
      (h += `<div class="blk tb ${x.id === selT ? "sel" : ""}" data-t="${x.id}" style="left:${x.start * zoom}px;width:${Math.max(8, x.dur * zoom)}px">${esc(x.text)}</div>`),
  );
  auds.forEach(
    (a) =>
      (h += `<div class="blk au ${a.id === selA ? "sel" : ""}" data-a="${a.id}" style="left:${a.start * zoom}px;width:${Math.max(8, (a.out - a.in) * zoom)}px">${esc(a.name)}</div>`),
  );
  inn.innerHTML = h + '<div class="ph" id="ph"></div>';
  updatePH();
}
const R = (lab, k, min, max, st, v, s, o) =>
  `<label class="r"><span>${lab}</span><b>${(+v).toFixed(st < 1 ? 2 : 0)}</b><input type="range" min="${min}" max="${max}" step="${st}" value="${v}" data-k="${k}"${s ? ` data-s="${s}"` : ""}${o ? ` data-o="${o}"` : ""}></label>`;
function renderInsp() {
  const el = $("#insp"),
    c = cl(),
    x = tx();
  if (c) {
    const v = c.kind === "video",
      D = v ? c.el.duration : 30;
    el.innerHTML =
      `<h3>${esc(c.name)}</h3>` +
      (v
        ? R("Trim start (s)", "in", 0, D, 0.05, c.in) +
          R("Trim end (s)", "out", 0, D, 0.05, c.out) +
          R("Speed ×", "speed", 0.25, 4, 0.05, c.speed) +
          R("Volume", "vol", 0, 1.5, 0.05, c.vol)
        : R("Duration (s)", "out", 0.5, 30, 0.1, c.out)) +
      R("Fade in/out (s)", "fade", 0, 2, 0.1, c.fade) +
      '<h4>Filters</h4><div class="pre">' +
      Object.keys(PRE)
        .map((n) => `<button data-p="${n}">${n}</button>`)
        .join("") +
      "</div>" +
      R("Brightness", "br", 0, 200, 1, c.f.br, "f") +
      R("Contrast", "co", 0, 200, 1, c.f.co, "f") +
      R("Saturation", "sa", 0, 300, 1, c.f.sa, "f") +
      R("Grayscale", "gr", 0, 100, 1, c.f.gr, "f") +
      R("Sepia", "se", 0, 100, 1, c.f.se, "f") +
      R("Blur (px)", "bl", 0, 20, 0.5, c.f.bl, "f");
  } else if (au()) {
    const a = au();
    el.innerHTML =
      `<h3>${esc(a.name)}</h3>` +
      R("Volume", "vol", 0, 1.5, 0.05, a.vol, "", "a") +
      R("Trim start (s)", "in", 0, a.el.duration, 0.05, a.in, "", "a") +
      R("Trim end (s)", "out", 0, a.el.duration, 0.05, a.out, "", "a") +
      `<label class="r"><span>Starts on timeline (s)</span><input type="number" step="0.1" min="0" value="${a.start}" data-k="start" data-o="a"></label>`;
  } else if (x) {
    el.innerHTML =
      `<h3>Text overlay</h3><textarea rows="3" data-k="text" data-o="t">${esc(x.text)}</textarea>` +
      R("Size", "size", 16, 200, 1, x.size, "", "t") +
      R("Vertical position %", "y", 5, 95, 1, x.y, "", "t") +
      `<label class="r"><span>Color</span><input type="color" value="${x.color}" data-k="color" data-o="t"></label>` +
      `<label class="r"><span>Start (s)</span><input type="number" step="0.1" min="0" value="${x.start}" data-k="start" data-o="t"></label>` +
      `<label class="r"><span>Duration (s)</span><input type="number" step="0.1" min="0.2" value="${x.dur}" data-k="dur" data-o="t"></label>`;
  } else
    el.innerHTML =
      '<small style="color:var(--m)">Select a clip or text block on the timeline to edit trim, speed, volume and filters.</small>';
}
const ui = () => {
  total();
  renderTL();
  renderInsp();
};

$("#insp").addEventListener("input", (e) => {
  const i = e.target,
    k = i.dataset.k;
  if (!k) return;
  const o = i.dataset.o === "t" ? tx() : i.dataset.o === "a" ? au() : cl();
  if (!o) return;
  const g = i.dataset.s ? o[i.dataset.s] : o;
  g[k] = i.type === "range" || i.type === "number" ? +i.value : i.value;
  if (o.kind === "video" || o.el instanceof HTMLAudioElement) {
    if (k === "in" && o.in > o.out - 0.1) {
      o.in = o.out - 0.1;
      i.value = o.in;
    }
    if (k === "out" && o.out < o.in + 0.1) {
      o.out = o.in + 0.1;
      i.value = o.out;
    }
  }
  if (i.type === "range") i.previousElementSibling.textContent = (+i.value).toFixed(i.step < 1 ? 2 : 0);
  renderTL();
});
$("#insp").addEventListener("click", (e) => {
  const n = e.target.dataset.p,
    c = cl();
  if (!n || !c) return;
  const [a, b, s, g, se, bl] = PRE[n];
  c.f = { br: a, co: b, sa: s, gr: g, se, bl };
  renderInsp();
});

const inn = $("#in");
let drag = false;
function scrub(e) {
  const r = inn.getBoundingClientRect();
  t = Math.max(0, Math.min(total(), (e.clientX - r.left) / zoom));
}
inn.addEventListener("pointerdown", (e) => {
  const b = e.target.closest(".blk");
  if (b) {
    sel = selT = selA = null;
    if (b.dataset.id) sel = +b.dataset.id;
    else if (b.dataset.t) selT = +b.dataset.t;
    else selA = +b.dataset.a;
    renderTL();
    renderInsp();
  }
  drag = true;
  inn.setPointerCapture(e.pointerId);
  scrub(e);
});
inn.addEventListener("pointermove", (e) => {
  if (drag) scrub(e);
});
inn.addEventListener("pointerup", () => (drag = false));
