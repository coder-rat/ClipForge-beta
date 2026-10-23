// storage.js - Autosave and restore of the project in IndexedDB.
const DB = new Promise((res, rej) => {
  try {
    const r = indexedDB.open("clipforge", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("s");
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  } catch (e) {
    rej(e);
  }
});
DB.catch(() => {});
const dbPut = async (k, v) => {
  const d = await DB;
  return new Promise((res, rej) => {
    const q = d.transaction("s", "readwrite").objectStore("s").put(v, k);
    q.onsuccess = res;
    q.onerror = () => rej(q.error);
  });
};
const dbGet = async (k) => {
  const d = await DB;
  return new Promise((res, rej) => {
    const q = d.transaction("s").objectStore("s").get(k);
    q.onsuccess = () => res(q.result);
    q.onerror = () => rej(q.error);
  });
};
function save() {
  if (restoring) return;
  clearTimeout(sv);
  sv = setTimeout(async () => {
    try {
      const mids = [...new Set([...clips, ...auds].map((c) => c.mid))],
        strip = ({ el, ...r }) => r;
      for (const m of mids)
        if (!SAVED.has(m)) {
          await dbPut("m" + m, MED[m]);
          SAVED.add(m);
        }
      await dbPut("proj", {
        clips: clips.map(strip),
        auds: auds.map(strip),
        texts,
        mids,
        uid,
        ar: $("#ar").value,
        fill,
      });
    } catch (e) {
      msg("Autosave skipped: local storage is full or unavailable.");
    }
  }, 700);
}
async function restore() {
  try {
    const p = await dbGet("proj");
    if (p && p.mids.length) {
      msg("Restoring your last project…");
      const E = {};
      for (const m of p.mids) {
        const f = await dbGet("m" + m);
        if (!f) continue;
        clips = [];
        auds = [];
        await addFiles([f]);
        const x = clips[0] || auds[0];
        if (x) {
          E[m] = { el: x.el, mid: m };
          MED[m] = f;
          SAVED.add(m);
        }
      }
      const fx = (c) => ({ ...c, ...E[c.mid] });
      clips = p.clips.filter((c) => E[c.mid]).map(fx);
      auds = p.auds.filter((c) => E[c.mid]).map(fx);
      texts = p.texts;
      uid = Math.max(uid, p.uid || 0);
      const [w, h] = p.ar.split("x");
      cv.width = +w;
      cv.height = +h;
      $("#ar").value = p.ar;
      fill = $("#fill").checked = !!p.fill;
      sel = clips.length ? clips[0].id : null;
      selA = selT = null;
      msg("Project restored from local storage.");
    }
  } catch (e) {}
  restoring = false;
  ui();
}
$("#newP").onclick = () => {
  if (!confirm("Clear the project and all saved data?")) return;
  restoring = true;
  DB.then((d) => d.close()).catch(() => {});
  const q = indexedDB.deleteDatabase("clipforge");
  q.onsuccess = q.onblocked = () => location.reload();
};
