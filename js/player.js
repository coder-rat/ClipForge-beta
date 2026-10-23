// player.js - Playback clock, canvas rendering (video, filters, text) and play/pause.
function syncA() {
  auds.forEach((a) => {
    const e = a.el,
      d = a.out - a.in,
      l = a.in + t - a.start;
    e._g.gain.value = a.vol;
    if (playing && t >= a.start && t < a.start + d) {
      if (e.paused) e.play().catch(() => {});
      if (Math.abs(e.currentTime - l) > 0.35) e.currentTime = l;
    } else if (!e.paused) e.pause();
  });
}
function sync() {
  syncA();
  const c = active();
  vids.forEach((v) => {
    if (!c || v !== c.el) v.pause();
  });
  if (!c || c.kind !== "video") return;
  const v = c.el,
    l = c.in + (t - c.start) * c.speed;
  v._g.gain.value = c.vol;
  v.playbackRate = c.speed;
  if (playing) {
    if (v.paused) v.play().catch(() => {});
    if (Math.abs(v.currentTime - l) > 0.35) v.currentTime = l;
  } else {
    v.pause();
    if (Math.abs(v.currentTime - l) > 0.02) v.currentTime = l;
  }
}
function draw() {
  const W = cv.width,
    H = cv.height;
  cx.filter = "none";
  cx.globalAlpha = 1;
  cx.fillStyle = "#000";
  cx.fillRect(0, 0, W, H);
  const c = active();
  if (!c) {
    cx.fillStyle = "#777";
    cx.font = `${W / 32}px system-ui`;
    cx.textAlign = "center";
    cx.fillText("Import a video or image to start", W / 2, H / 2);
    return;
  }
  const e = c.el,
    w = e.videoWidth || e.naturalWidth,
    h = e.videoHeight || e.naturalHeight;
  if (w && h) {
    const k = fill ? Math.max(W / w, H / h) : Math.min(W / w, H / h),
      dw = w * k,
      dh = h * k,
      lt = t - c.start,
      d = dur(c),
      f = c.f;
    let a = 1;
    if (c.fade > 0) a = Math.min(1, lt / c.fade, (d - lt) / c.fade);
    cx.globalAlpha = Math.max(0, Math.min(1, a));
    cx.filter = `brightness(${f.br}%) contrast(${f.co}%) saturate(${f.sa}%) grayscale(${f.gr}%) sepia(${f.se}%) blur(${f.bl}px)`;
    cx.drawImage(e, (W - dw) / 2, (H - dh) / 2, dw, dh);
    cx.filter = "none";
    cx.globalAlpha = 1;
  }
  texts.forEach((x) => {
    if (t < x.start || t > x.start + x.dur) return;
    const fs = (x.size * W) / 1280,
      ls = x.text.split("\n");
    cx.font = `800 ${fs}px system-ui,Segoe UI,sans-serif`;
    cx.textAlign = "center";
    cx.textBaseline = "middle";
    cx.lineJoin = "round";
    cx.lineWidth = fs / 6;
    cx.strokeStyle = "rgba(0,0,0,.85)";
    cx.fillStyle = x.color;
    ls.forEach((s, i) => {
      const y = (H * x.y) / 100 + (i - (ls.length - 1) / 2) * fs * 1.15;
      cx.strokeText(s, W / 2, y);
      cx.fillText(s, W / 2, y);
    });
  });
}
function loop(n) {
  const dt = (n - last) / 1000;
  last = n;
  if (playing) {
    t += Math.min(dt, 0.25);
    const T = total();
    if (t >= T) {
      t = T;
      setPlay(false);
      if (exporting) endExp();
    }
    if (exporting && playing) msg("Exporting… " + Math.round((t / T) * 100) + "% (keep this tab visible)");
  }
  sync();
  draw();
  updatePH();
  requestAnimationFrame(loop);
}
function updatePH() {
  const p = $("#ph");
  if (p) {
    const x = t * zoom;
    p.style.left = x + "px";
    const s = $("#tl");
    if (playing && (x > s.scrollLeft + s.clientWidth - 40 || x < s.scrollLeft)) s.scrollLeft = x - 40;
  }
  $("#rd").textContent = fmt(t) + " / " + fmt(total());
}
function setPlay(p) {
  if (p) {
    if (!clips.length) return;
    audio();
    if (t >= total() - 0.01) t = 0;
  }
  playing = p;
  $("#play").textContent = p ? "Pause" : "Play";
}
