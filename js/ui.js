// ui.js - Buttons, keyboard shortcuts and other event wiring.
$("#file").onchange = (e) => {
  addFiles([...e.target.files]);
  e.target.value = "";
};
addEventListener("dragover", (e) => e.preventDefault());
addEventListener("drop", (e) => {
  e.preventDefault();
  addFiles([...e.dataTransfer.files]);
});
$("#addT").onclick = () => {
  const x = { id: ++uid, text: "Your text", start: t, dur: 3, size: 64, y: 82, color: "#ffffff" };
  texts.push(x);
  selT = x.id;
  sel = selA = null;
  ui();
};
$("#ar").onchange = (e) => {
  const [w, h] = e.target.value.split("x");
  cv.width = +w;
  cv.height = +h;
  save();
};
$("#fill").onchange = (e) => {
  fill = e.target.checked;
  save();
};
$("#zm").oninput = (e) => {
  fit = false;
  $("#fit").checked = false;
  zoom = +e.target.value;
  renderTL();
};
$("#fit").onchange = (e) => {
  fit = e.target.checked;
  renderTL();
};
addEventListener("resize", () => {
  if (fit) renderTL();
});
$("#play").onclick = () => setPlay(!playing);
$("#home").onclick = () => {
  t = 0;
  $("#tl").scrollLeft = 0;
};
$("#split").onclick = split;
$("#del").onclick = del;
$("#ml").onclick = () => move(-1);
$("#mr").onclick = () => move(1);
$("#exp").onclick = () => {
  if (!clips.length) return msg("Add a clip first.");
  $("#dlg").showModal();
};
$("#cancel").onclick = () => $("#dlg").close();
$("#go").onclick = () => {
  const n =
      $("#fn")
        .value.replace(/[\/\\:*?"<>|]+/g, "")
        .trim() || "my-video",
    f = $("#fmt").value;
  $("#dlg").close();
  if (f === "gif") exportGif(n);
  else exportVid(n, f);
};
addEventListener("keydown", (e) => {
  if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  if (e.code === "Space") {
    e.preventDefault();
    setPlay(!playing);
  } else if (e.key === "s" || e.key === "S") split();
  else if (e.key === "Delete" || e.key === "Backspace") del();
  else if (e.key === "ArrowLeft") t = Math.max(0, t - 0.1);
  else if (e.key === "ArrowRight") t = Math.min(total(), t + 0.1);
});
function recenter(full) {
  scrollTo(0, 0);
  [document.documentElement, document.body, $("main"), $(".stage"), $("header"), $("#bot")].forEach((e) => {
    if (e) {
      e.scrollLeft = 0;
      e.scrollTop = 0;
    }
  });
  if (full) {
    document.querySelectorAll("aside").forEach((a) => {
      a.scrollLeft = 0;
      a.scrollTop = 0;
    });
    $("#tl").scrollTop = 0;
    msg("View recentered.");
  }
}
$("#rc").onclick = () => recenter(true);
addEventListener(
  "scroll",
  (e) => {
    const el = e.target;
    if (
      innerWidth > 860 &&
      (el === document ||
        el === document.documentElement ||
        el === document.body ||
        el.id === "bot" ||
        el.tagName === "MAIN" ||
        el.tagName === "HEADER" ||
        (el.classList && el.classList.contains("stage")))
    )
      recenter();
  },
  true,
);
addEventListener("pointerup", () => {
  if (innerWidth > 860) recenter();
});
