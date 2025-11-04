const canvasArea = document.getElementById("canvas");
const drawCanvas = document.getElementById("drawCanvas");
const ctx = drawCanvas.getContext("2d");
const elementsLayer = document.getElementById("elements-layer");
const petunjuk = document.getElementById("petunjuk");

function resizeCanvas() {
  drawCanvas.width = canvasArea.offsetWidth;
  drawCanvas.height = canvasArea.offsetHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

let mode = "draw";
let drawing = false;
let startX, startY;
let lines = [];
let tempStart = null;

// Tombol
const btnDraw = document.getElementById("modeDraw");
const btnClick = document.getElementById("modeClick");
const btnUndo = document.getElementById("undo");

btnDraw.classList.add("active");
btnDraw.onclick = () => setMode("draw");
btnClick.onclick = () => setMode("click");
btnUndo.onclick = undoLine;

// ====================================================
// MODE HANDLER
// ====================================================
function setMode(m) {
  mode = m;
  btnDraw.classList.toggle("active", m === "draw");
  btnClick.classList.toggle("active", m === "click");

  drawing = false;
  tempStart = null;

  drawCanvas.ontouchstart = null;
  drawCanvas.ontouchmove = null;
  drawCanvas.ontouchend = null;

  if (m === "draw") {
    activateDrawMode();
    drawCanvas.style.pointerEvents = "auto";
    elementsLayer.style.pointerEvents = "none";
    drawCanvas.style.zIndex = 5;
    elementsLayer.style.zIndex = 4;
  }

  if (m === "click") {
    activateClickMode();
    drawCanvas.style.pointerEvents = "none";
    elementsLayer.style.pointerEvents = "auto";
    drawCanvas.style.zIndex = 4;
    elementsLayer.style.zIndex = 5;
  }

  drawCanvas.style.cursor = m === "draw" ? "crosshair" : "pointer";
}

// ====================================================
// UNDO GARIS
// ====================================================
function undoLine() {
  lines.pop();
  redrawAll();
}

// ====================================================
// MODE GAMBAR (TOUCH)
// ====================================================
function activateDrawMode() {
  drawCanvas.ontouchstart = (e) => {
    e.preventDefault();
    drawing = true;
    const rect = drawCanvas.getBoundingClientRect();
    const touch = e.touches[0];
    startX = touch.clientX - rect.left;
    startY = touch.clientY - rect.top;
  };

  drawCanvas.ontouchmove = (e) => {
    if (!drawing) return;
    const rect = drawCanvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    redrawAll();
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#2a4d8f";
    ctx.lineWidth = 3;
    ctx.stroke();
  };

  drawCanvas.ontouchend = (e) => {
    if (!drawing) return;
    drawing = false;
    const rect = drawCanvas.getBoundingClientRect();
    const touch = e.changedTouches[0];
    const endX = touch.clientX - rect.left;
    const endY = touch.clientY - rect.top;
    lines.push({ x1: startX, y1: startY, x2: endX, y2: endY });
    redrawAll();
  };
}

// ====================================================
// MODE KLIK / DOT-TO-DOT (TOUCH)
// ====================================================
function activateClickMode() {
  drawCanvas.ontouchstart = (e) => {
    e.preventDefault();
    const rect = drawCanvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    if (!tempStart) {
      tempStart = { x, y };
      drawPoint(x, y, "#ff0000");
    } else {
      lines.push({ x1: tempStart.x, y1: tempStart.y, x2: x, y2: y });
      tempStart = null;
      redrawAll();
    }
  };
}

// ====================================================
// UTILITAS
// ====================================================
function drawPoint(x, y, color) {
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function redrawAll() {
  ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
  for (let l of lines) {
    ctx.beginPath();
    ctx.moveTo(l.x1, l.y1);
    ctx.lineTo(l.x2, l.y2);
    ctx.strokeStyle = "#2a4d8f";
    ctx.lineWidth = 3;
    ctx.stroke();
  }
}

// ====================================================
// DRAG & DROP ELEMEN (TOUCH FIX)
// ====================================================
document.querySelectorAll(".elemen").forEach((el) => {
  el.addEventListener("touchstart", (e) => {
    e.preventDefault(); // penting agar tidak muncul menu download
    e.currentTarget.dataset.touchId = e.currentTarget.id;

    // simpan posisi awal sentuhan
    const touch = e.touches[0];
    el.dataset.startX = touch.clientX - el.offsetLeft;
    el.dataset.startY = touch.clientY - el.offsetTop;
  });
});

elementsLayer.addEventListener("touchmove", (e) => {
  e.preventDefault();
});

elementsLayer.addEventListener("touchend", (e) => {
  e.preventDefault();
  const touch = e.changedTouches[0];
  const targetId = touch.target.dataset.touchId;
  if (!targetId) return;

  const draggedEl = document.getElementById(targetId);
  if (!draggedEl) return;

  if (petunjuk) petunjuk.style.display = "none";

  const rect = elementsLayer.getBoundingClientRect();
  const x = touch.clientX - rect.left - 50;
  const y = touch.clientY - rect.top - 50;

  const clone = document.createElement("div");
  clone.classList.add("resizable");
  clone.style.left = `${x}px`;
  clone.style.top = `${y}px`;
  clone.style.width = "100px";
  clone.style.height = "100px";

  const img = document.createElement("img");
  img.src = draggedEl.querySelector("img").src;
  img.alt = "elemen";
  clone.appendChild(img);

  const handle = document.createElement("div");
  handle.classList.add("resize-handle");
  clone.appendChild(handle);

  elementsLayer.appendChild(clone);

  makeDraggable(clone);
  makeResizable(clone, handle);
});

// ====================================================
// DRAG & RESIZE (TOUCH)
// ====================================================
function makeDraggable(el) {
  let isDragging = false;
  let offsetX = 0, offsetY = 0;

  el.addEventListener("touchstart", (e) => {
    e.preventDefault();
    if (e.target.classList.contains("resize-handle")) return;
    isDragging = true;
    const touch = e.touches[0];
    offsetX = touch.clientX - el.offsetLeft;
    offsetY = touch.clientY - el.offsetTop;
    el.style.zIndex = 10;
  });

  el.addEventListener("touchmove", (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    let newX = touch.clientX - elementsLayer.getBoundingClientRect().left - offsetX;
    let newY = touch.clientY - elementsLayer.getBoundingClientRect().top - offsetY;
    newX = Math.max(0, Math.min(newX, elementsLayer.offsetWidth - el.offsetWidth));
    newY = Math.max(0, Math.min(newY, elementsLayer.offsetHeight - el.offsetHeight));
    el.style.left = `${newX}px`;
    el.style.top = `${newY}px`;
  });

  el.addEventListener("touchend", () => {
    isDragging = false;
    el.style.zIndex = 5;
  });
}

function makeResizable(el, handle) {
  let isResizing = false;
  let startX, startY, startW, startH;

  handle.addEventListener("touchstart", (e) => {
    e.preventDefault();
    e.stopPropagation();
    isResizing = true;
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    startW = parseInt(window.getComputedStyle(el).width, 10);
    startH = parseInt(window.getComputedStyle(el).height, 10);
  });

  handle.addEventListener("touchmove", (e) => {
    if (!isResizing) return;
    const touch = e.touches[0];
    let newW = startW + (touch.clientX - startX);
    let newH = startH + (touch.clientY - startY);
    newW = Math.max(60, newW);
    newH = Math.max(60, newH);
    el.style.width = newW + "px";
    el.style.height = newH + "px";
  });

  handle.addEventListener("touchend", () => {
    isResizing = false;
  });
}

// ====================================================
// Tampilkan / Sembunyikan Kunci Jawaban
// ====================================================
const btnKunci = document.getElementById("toggleKunci");
const divKunci = document.getElementById("canvasKunci");

btnKunci.onclick = () => {
  if (divKunci.style.display === "none" || divKunci.style.display === "") {
    divKunci.style.display = "block";
    btnKunci.textContent = "🙈 Sembunyikan Kunci Jawaban";
  } else {
    divKunci.style.display = "none";
    btnKunci.textContent = "👁️ Tampilkan Kunci Jawaban";
  }
};

// Jalankan mode awal
setMode("draw");
