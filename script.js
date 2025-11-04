// ======== Variabel utama ========
const canvasArea = document.getElementById("canvas");
const drawCanvas = document.getElementById("drawCanvas");
const ctx = drawCanvas.getContext("2d");
const elementsLayer = document.getElementById("elements-layer");
const petunjuk = document.getElementById("petunjuk");
const divKunci = document.getElementById("canvasKunci");

drawCanvas.width = canvasArea.offsetWidth;
drawCanvas.height = canvasArea.offsetHeight;

// update ukuran saat window resize
window.addEventListener("resize", () => {
  const img = ctx.getImageData(0, 0, drawCanvas.width, drawCanvas.height);
  drawCanvas.width = canvasArea.offsetWidth;
  drawCanvas.height = canvasArea.offsetHeight;
  ctx.putImageData(img, 0, 0);
});

let mode = "elemen";
let drawing = false, startX, startY;
let currentColor = "#2a4d8f", currentSize = 2;
let lines = [];

// ===== Tombol & Toolbar =====
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
  if (divKunci.style.display === "none" || divKunci.style.display === "") {
    divKunci.style.display = "block";
    btnKunci.textContent = "🙈 Sembunyikan Kunci Jawaban";
  } else {
    divKunci.style.display = "none";
    btnKunci.textContent = "👁️ Tampilkan Kunci Jawaban";
  }
};
colorPicker.onchange = e => currentColor = e.target.value;
sizePicker.onchange = e => currentSize = parseInt(e.target.value);

// ===== Mode handler =====
function setMode(m) {
  mode = m;
  btnElemen.classList.toggle("active", m === "elemen");
  btnDraw.classList.toggle("active", m === "draw");
  drawCanvas.style.pointerEvents = (m === "draw") ? "auto" : "none";
}

// ======= DRAW MODE =======
function getPointerPos(e) {
  const rect = drawCanvas.getBoundingClientRect();
  const x = e.clientX ?? e.touches?.[0].clientX;
  const y = e.clientY ?? e.touches?.[0].clientY;
  return { x: x - rect.left, y: y - rect.top };
}

function handleDrawStart(pos) {
  drawing = true;
  startX = pos.x;
  startY = pos.y;
}

function handleDrawMove(pos) {
  if (!drawing) return;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(pos.x, pos.y);
  ctx.strokeStyle = currentColor;
  ctx.lineWidth = currentSize;
  ctx.lineCap = "round";
  ctx.stroke();
  startX = pos.x;
  startY = pos.y;
}

function handleDrawEnd() {
  if (!drawing) return;
  drawing = false;
  // simpan snapshot
  lines.push(ctx.getImageData(0, 0, drawCanvas.width, drawCanvas.height));
}

function redrawAll() {
  ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
  for (let snap of lines) ctx.putImageData(snap, 0, 0);
}

// Event Canvas (desktop & mobile)
["mousedown", "mousemove", "mouseup", "touchstart", "touchmove", "touchend"].forEach(evt => {
  drawCanvas.addEventListener(evt, e => {
    if (mode !== "draw") return;
    e.preventDefault();
    const pos = getPointerPos(e);
    if (evt === "mousedown" || evt === "touchstart") handleDrawStart(pos);
    else if (evt === "mousemove" || evt === "touchmove") handleDrawMove(pos);
    else if (evt === "mouseup" || evt === "touchend") handleDrawEnd(pos);
  }, { passive: false });
});

// ======= DRAG & DROP ELEMEN =======
document.querySelectorAll(".elemen").forEach(el => {
  el.setAttribute("draggable", true); // <— penting agar drag berfungsi

  // --- Mouse ---
  el.addEventListener("dragstart", e => {
    e.dataTransfer.setData("id", el.id);
  });

  // --- Touch ---
  el.addEventListener("touchstart", e => {
    e.preventDefault();
  });
  el.addEventListener("touchend", e => {
    e.preventDefault();
    const rect = elementsLayer.getBoundingClientRect();
    const x = e.changedTouches[0].clientX - rect.left - 50;
    const y = e.changedTouches[0].clientY - rect.top - 50;
    if (petunjuk) petunjuk.style.display = "none";
    createDrop(el, x, y);
  });
});

elementsLayer.addEventListener("dragover", e => e.preventDefault());
elementsLayer.addEventListener("drop", e => {
  e.preventDefault();
  const id = e.dataTransfer.getData("id");
  const el = document.getElementById(id);
  const rect = elementsLayer.getBoundingClientRect();
  const x = e.clientX - rect.left - 50;
  const y = e.clientY - rect.top - 50;
  if (petunjuk) petunjuk.style.display = "none";
  createDrop(el, x, y);
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
  return clone;
}

// ======= DRAG & RESIZE =======
function makeDraggable(el) {
  let dragging = false, ox, oy;

  el.addEventListener("mousedown", e => {
    if (e.target.classList.contains("resize-handle")) return;
    dragging = true;
    ox = e.clientX - el.offsetLeft;
    oy = e.clientY - el.offsetTop;
  });
  document.addEventListener("mousemove", e => {
    if (!dragging) return;
    el.style.left = e.clientX - ox + "px";
    el.style.top = e.clientY - oy + "px";
  });
  document.addEventListener("mouseup", () => dragging = false);

  // Touch
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

  handle.addEventListener("mousedown", e => {
    e.preventDefault();
    resizing = true;
    sx = e.clientX;
    sy = e.clientY;
    sw = el.offsetWidth;
    sh = el.offsetHeight;
  });
  document.addEventListener("mousemove", e => {
    if (!resizing) return;
    el.style.width = Math.max(60, sw + e.clientX - sx) + "px";
    el.style.height = Math.max(60, sh + e.clientY - sy) + "px";
  });
  document.addEventListener("mouseup", () => resizing = false);

  // Touch
  handle.addEventListener("touchstart", e => {
    e.preventDefault();
    const t = e.touches[0];
    resizing = true;
    sx = t.clientX;
    sy = t.clientY;
    sw = el.offsetWidth;
    sh = el.offsetHeight;
  });
  document.addEventListener("touchmove", e => {
    if (!resizing) return;
    const t = e.touches[0];
    el.style.width = Math.max(60, sw + t.clientX - sx) + "px";
    el.style.height = Math.max(60, sh + t.clientY - sy) + "px";
  });
  document.addEventListener("touchend", () => resizing = false);
}

// ===== Inisialisasi =====
setMode("elemen");
