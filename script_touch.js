const canvasArea = document.getElementById("canvas");
const drawCanvas = document.getElementById("drawCanvas");
const ctx = drawCanvas.getContext("2d");
const elementsLayer = document.getElementById("elements-layer");
const petunjuk = document.getElementById("petunjuk");
const divKunci = document.getElementById("canvasKunci");

drawCanvas.width = canvasArea.offsetWidth;
drawCanvas.height = canvasArea.offsetHeight;

let mode = "elemen"; // elemen / draw
let drawing = false, startX, startY;
let currentColor = "#2a4d8f", currentSize = 2;
let lines = [];

// Toolbar buttons
const btnDraw = document.getElementById("modeDraw");
const btnClick = document.getElementById("modeClick");
const btnUndo = document.getElementById("undo");
const btnKunci = document.getElementById("toggleKunci");

btnDraw.onclick = () => setMode("draw");
btnClick.onclick = () => setMode("elemen");
btnUndo.onclick = () => { lines.pop(); redrawAll(); };
btnKunci.onclick = () => {
  divKunci.style.display = divKunci.style.display === "block" ? "none" : "block";
  btnKunci.textContent = divKunci.style.display === "block" ? "🙈 Sembunyikan Kunci Jawaban" : "👁️ Tampilkan Kunci Jawaban";
};

function setMode(m) {
  mode = m;
  btnDraw.classList.toggle("active", m === "draw");
  btnClick.classList.toggle("active", m === "elemen");
  drawCanvas.style.pointerEvents = (m === "draw") ? "auto" : "none";
}

// DRAW MODE (touch)
function getTouchPos(e) {
  const rect = drawCanvas.getBoundingClientRect();
  const t = e.touches[0];
  return { x: t.clientX - rect.left, y: t.clientY - rect.top };
}

drawCanvas.addEventListener("touchstart", e => {
  if (mode !== "draw") return;
  e.preventDefault();
  const pos = getTouchPos(e);
  drawing = true; startX = pos.x; startY = pos.y;
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

// DRAG & DROP (touch)
document.querySelectorAll(".elemen").forEach(el => {
  el.addEventListener("touchstart", e => {
    if (mode !== "elemen") return;
    e.preventDefault();
    const t = e.touches[0];
    const rect = elementsLayer.getBoundingClientRect();
    const clone = document.createElement("div");
    clone.className = "resizable";
    clone.style.left = t.clientX - rect.left - 50 + "px";
    clone.style.top = t.clientY - rect.top - 50 + "px";
    clone.style.width = "100px";
    clone.style.height = "100px";

    const img = document.createElement("img");
    img.src = el.querySelector("img").src;
    clone.appendChild(img);

    const handle = document.createElement("div");
    handle.className = "resize-handle";
    clone.appendChild(handle);

    elementsLayer.appendChild(clone);
    petunjuk.style.display = "none";

    makeDraggable(clone);
    makeResizable(clone, handle);
  });
});

function makeDraggable(el) {
  let offsetX = 0, offsetY = 0, dragging = false;

  el.addEventListener("touchstart", e => {
    if (e.target.classList.contains("resize-handle")) return;
    const t = e.touches[0];
    offsetX = t.clientX - el.offsetLeft;
    offsetY = t.clientY - el.offsetTop;
    dragging = true;
    el.style.zIndex = 9999;
  });

  el.addEventListener("touchmove", e => {
    if (!dragging) return;
    e.preventDefault();
    const t = e.touches[0];
    el.style.left = t.clientX - offsetX + "px";
    el.style.top = t.clientY - offsetY + "px";
  });

  el.addEventListener("touchend", () => {
    dragging = false;
    el.style.zIndex = 5;
  });
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

  handle.addEventListener("touchmove", e => {
    if (!resizing) return;
    e.preventDefault();
    const t = e.touches[0];
    el.style.width = Math.max(60, sw + t.clientX - sx) + "px";
    el.style.height = Math.max(60, sh + t.clientY - sy) + "px";
  });

  handle.addEventListener("touchend", () => resizing = false);
}

setMode("elemen");
