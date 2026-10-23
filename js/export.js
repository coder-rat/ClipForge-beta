// export.js - Export to MP4 / WebM (MediaRecorder) and GIF, plus the download link.
function deliver(blob, fn, note) {
  const u = URL.createObjectURL(blob);
  msg(
    `Done! <a href="${u}" download="${esc(fn)}">Click here to save ${esc(fn)}</a> (${(blob.size / 1048576).toFixed(1)} MB)${note || ""}`,
  );
  try {
    const a = document.createElement("a");
    a.href = u;
    a.download = fn;
    a.click();
  } catch (e) {}
}
async function exportGif(name) {
  audio();
  setPlay(false);
  exporting = true;
  $("#exp").disabled = true;
  try {
    const T = total(),
      fps = Math.max(2, Math.min(10, Math.floor(300 / T))),
      n = Math.max(1, Math.ceil(T * fps)),
      gw = Math.min(cv.width, 480),
      gh = Math.round((gw * cv.height) / cv.width),
      gc = document.createElement("canvas");
    gc.width = gw;
    gc.height = gh;
    const g = gc.getContext("2d", { willReadFrequently: true }),
      fr = [];
    for (let i = 0; i < n; i++) {
      t = Math.min(i / fps, T - 0.001);
      sync();
      const c = active();
      if (c && c.kind === "video" && c.el.seeking)
        await new Promise((r) => {
          c.el.addEventListener("seeked", r, { once: true });
          setTimeout(r, 1500);
        });
      await new Promise((r) => setTimeout(r, 30));
      draw();
      g.drawImage(cv, 0, 0, gw, gh);
      fr.push(quant(g.getImageData(0, 0, gw, gh).data, gw, gh));
      msg("Building GIF… " + Math.round(((i + 1) / n) * 100) + "%");
    }
    t = 0;
    deliver(
      new Blob([gifBytes(fr, gw, gh, Math.round(100 / fps))], { type: "image/gif" }),
      name + ".gif",
      "",
    );
  } catch (e) {
    msg("GIF export failed: " + esc(e.message));
  }
  exporting = false;
  $("#exp").disabled = false;
}
function endExp() {
  msg("Finalizing video…");
  setTimeout(() => {
    try {
      if (rec.state !== "inactive") {
        try {
          rec.requestData();
        } catch (e) {}
        rec.stop();
      } else rec.onstop();
    } catch (e) {
      rec.onstop();
    }
    setTimeout(() => rec.onstop(), 3000);
  }, 400);
}
function exportVid(name, fmt) {
  if (!clips.length) return msg("Add a clip first.");
  audio();
  setPlay(false);
  t = 0;
  sync();
  const vs = cv.captureStream(30);
  dst.stream.getAudioTracks().forEach((k) => vs.addTrack(k));
  const L =
      fmt === "mp4"
        ? ["video/mp4;codecs=avc1.640028,mp4a.40.2", "video/mp4;codecs=avc1,mp4a.40.2", "video/mp4"]
        : [],
    W = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"],
    mt = L.concat(W).find((m) => MediaRecorder.isTypeSupported(m)),
    ext = mt && mt.includes("mp4") ? "mp4" : "webm";
  rec = new MediaRecorder(vs, mt ? { mimeType: mt, videoBitsPerSecond: 8e6 } : {});
  chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  let done = false,
    rerr;
  const fin = () => {
    if (done) return;
    done = true;
    exporting = false;
    mon.gain.value = 1;
    $("#exp").disabled = false;
    const blob = new Blob(chunks, { type: mt || "video/webm" });
    if (blob.size < 500) {
      if (fmt === "mp4") {
        msg("MP4 recording came back empty, retrying as WebM…");
        setTimeout(() => exportVid(name, "webm"), 300);
        return;
      }
      msg(
        "Export produced an empty file (" +
          esc(rerr || "the browser returned no video data") +
          "). Try the GIF format, or reload the page and try again.",
      );
      return;
    }
    deliver(
      blob,
      name + "." + ext,
      fmt === "mp4" && ext !== "mp4" ? " (your browser cannot make MP4, so this is WebM)" : "",
    );
  };
  rec.onstop = fin;
  rec.onerror = (e) => {
    rerr = e.error && e.error.message;
    fin();
  };
  exporting = true;
  $("#exp").disabled = true;
  mon.gain.value = 0;
  rec.start(250);
  setTimeout(() => setPlay(true), 500);
}
