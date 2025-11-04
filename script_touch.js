const canvasArea = document.getElementById("canvas");
const drawCanvas = document.getElementById("drawCanvas");
const ctx = drawCanvas.getContext("2d");
const elementsLayer = document.getElementById("elements-layer");
const petunjuk = document.getElementById("petunjuk");
const divKunci = document.getElementById("canvasKunci");

drawCanvas.width = canvasArea.offsetWidth;
drawCanvas.height = canvasArea.offsetHeight;

let mode = "elemen";
let drawing = false, startX, startY;
let currentColor = "#2a4d8f", currentSize = 2;
let lines = [];

// Toolbar
const btnElemen = document.getElementById("modeElemen");
const btnDraw = document.getElementById("modeDraw");
const btnUndo = document.getElementById("undo");
const btnKunci = document.getElementById("toggleKunci");
const colorPicker = document.getElementById("colorPicker");
const sizePicker = document.getElementById("sizePicker");

btnElemen.onclick = () => setMode("elemen");
btnDraw.onclick = () => setMode("draw");
btnUndo.onclick = () => { lines.pop(); redrawAll(); };
btnKunci.onclick = () => {
  divKunci.style.display = divKunci.style.display === "none" || divKunci.style.display === "" ? "block" : "none";
  btnKunci.textContent = divKunci.style.display === "block" ? "🙈 Sembunyikan Kunci Jawaban" : "👁️ Tampilkan Kunci Jawaban";
};
colorPicker.onchange = e => currentColor = e.target.value;
sizePicker.onchange = e => currentSize = parseInt(e.target.value);

// Mode handler
function setMode(m) {
  mode = m;
  btnElemen.classList.toggle("active", m === "elemen");
  btnDraw.classList.toggle("active", m === "draw");
  drawCanvas.style.pointerEvents = (m === "draw") ? "auto" : "none";
}

// DRAW MODE (touch only)
function getTouchPos(e) {
  const rect = drawCanvas.getBoundingClientRect();
  const t = e.touches[0];
  return { x: t.clientX - rect.left, y: t.clientY - rect.top };
}

drawCanvas.addEventListener("touchstart", e => {
  if (mode !== "draw") return;
  e.preventDefault();
  const pos = getTouchPos(e);
  drawing = true;
  startX = pos.x; startY = pos.y;
});
drawCanvas.addEventListener("touchmove", e => {
  if (!drawing || mode !== "draw") return;
  e.preventDefault();
  const pos = getTouchPos(e);
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(pos.x, pos.y);
  ctx.strokeStyle = currentColor;
  ctx.lineWidth = currentSize;
  ctx.lineCap = "round";
  ctx.stroke();
  startX = pos.x; startY = pos.y;
});
drawCanvas.addEventListener("touchend", e => {
  if (mode === "draw") {
    drawing = false;
    lines.push(ctx.getImageData(0, 0, drawCanvas.width, drawCanvas.height));
  }
});
function redrawAll() {
  ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
  for (let snap of lines) ctx.putImageData(snap, 0, 0);
}

// DRAG DROP (touch)
document.querySelectorAll(".elemen").forEach(el => {
  el.addEventListener("touchend", e => {
    e.preventDefault();
    const rect = elementsLayer.getBoundingClientRect();
    const x = e.changedTouches[0].clientX - rect.left - 50;
    const y = e.changedTouches[0].clientY - rect.top - 50;
    petunjuk.style.display = "none";
    createDrop(el, x, y);
  });
});

function createDrop(el, x, y) {
  const clone = document.createElement("div");
  clone.className = "resizable";
  clone.style.left = x + "px";
  clone.style.top = y + "px";
  clone.style.width = "100px";
  clone.style.height = "100px";
  const img = document.createElement("img");
  img.src = el.querySelector("img").src;
  clone.appendChild(img);
  const handle = document.createElement("div");
  handle.className = "resize-handle";
  clone.appendChild(handle);
  elementsLayer.appendChild(clone);
  makeDraggable(clone);
  makeResizable(clone, handle);
}

function makeDraggable(el) {
  let dragging = false, ox, oy;
  el.addEventListener("touchstart", e => {
    if (e.target.classList.contains("resize-handle")) return;
    const t = e.touches[0];
    dragging = true;
    ox = t.clientX - el.offsetLeft;
    oy = t.clientY - el.offsetTop;
  });
  document.addEventListener("touchmove", e => {
    if (!dragging) return;
    const t = e.touches[0];
    el.style.left = t.clientX - ox + "px";
    el.style.top = t.clientY - oy + "px";
  });
  document.addEventListener("touchend", () => dragging = false);
}

function makeResizable(el, handle) {
  let resizing = false, sx, sy, sw, sh;
  handle.addEventListener("touchstart", e => {
    e.preventDefault();
    const t = e.touches[0];
    resizing = true;
    sx = t.clientX; sy = t.clientY;
    sw = el.offsetWidth; sh = el.offsetHeight;
  });
  document.addEventListener("touchmove", e => {
    if (!resizing) return;
    const t = e.touches[0];
    el.style.width = Math.max(60, sw + t.clientX - sx) + "px";
    el.style.height = Math.max(60, sh + t.clientY - sy) + "px";
  });
  document.addEventListener("touchend", () => resizing = false);
}

setMode("elemen");
