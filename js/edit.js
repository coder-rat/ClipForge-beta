// edit.js - Editing actions: split, delete, move clips.
function split() {
  const c = active();
  if (!c) return;
  const l = t - c.start;
  if (l < 0.1 || dur(c) - l < 0.1) return msg("Move the playhead inside a clip to split it.");
  const s = c.in + l * c.speed,
    n = { ...c, f: { ...c.f }, id: ++uid, in: s };
  c.out = s;
  clips.splice(clips.indexOf(c) + 1, 0, n);
  sel = n.id;
  selT = selA = null;
  ui();
}
function del() {
  if (selA) {
    auds.filter((a) => a.id === selA).forEach((a) => a.el.pause());
    auds = auds.filter((a) => a.id !== selA);
    selA = null;
  } else if (sel) {
    clips = clips.filter((c) => c.id !== sel);
    sel = null;
  } else if (selT) {
    texts = texts.filter((x) => x.id !== selT);
    selT = null;
  }
  t = Math.min(t, total());
  ui();
}
function move(d) {
  const i = clips.findIndex((c) => c.id === sel),
    j = i + d;
  if (i < 0 || j < 0 || j >= clips.length) return;
  [clips[i], clips[j]] = [clips[j], clips[i]];
  ui();
}
