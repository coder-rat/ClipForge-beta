// media.js - Importing video/image/audio files and adding them to the timeline.
async function addFiles(fl) {
  audio();
  for (const f of fl) {
    const url = URL.createObjectURL(f),
      mid = ++uid;
    MED[mid] = f;
    if (f.type.startsWith("video")) {
      const v = document.createElement("video");
      v.src = url;
      v.playsInline = true;
      v.preload = "auto";
      await new Promise((r) => {
        v.onloadedmetadata = r;
        v.onerror = r;
      });
      if (!isFinite(v.duration) || !v.duration) {
        msg("Could not read " + esc(f.name));
        continue;
      }
      vids.add(v);
      push("video", v, v.duration, f.name, mid);
    } else if (f.type.startsWith("image")) {
      const i = new Image();
      i.src = url;
      await i.decode().catch(() => {});
      push("image", i, 5, f.name, mid);
    } else if (f.type.startsWith("audio")) {
      const a = new Audio();
      a.src = url;
      a.preload = "auto";
      await new Promise((r) => {
        a.onloadedmetadata = r;
        a.onerror = r;
      });
      if (!isFinite(a.duration) || !a.duration) {
        msg("Could not read " + esc(f.name));
        continue;
      }
      auds.push({ id: ++uid, name: f.name, mid, el: a, start: t, in: 0, out: a.duration, vol: 1 });
      sel = selT = null;
      selA = uid;
      ui();
    }
  }
}
function push(kind, el, d, name, mid) {
  const c = {
    id: ++uid,
    kind,
    el,
    name,
    mid,
    in: 0,
    out: d,
    speed: 1,
    vol: 1,
    fade: 0,
    f: { br: 100, co: 100, sa: 100, gr: 0, se: 0, bl: 0 },
  };
  clips.push(c);
  sel = c.id;
  selT = selA = null;
  ui();
}
const active = () => {
  for (const c of clips) if (t >= c.start && t < c.start + dur(c)) return c;
  return clips[clips.length - 1];
};
