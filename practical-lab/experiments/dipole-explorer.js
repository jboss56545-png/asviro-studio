export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-slate-800 bg-slate-900 shrink-0">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-slate-950 border border-slate-800 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold">
        <i class="fa-solid fa-arrow-left text-[10px]"></i> Back
      </button>
      <div class="flex-1 text-center min-w-0">
        <div class="text-xs font-black text-slate-100 truncate">Dipole Explorer</div>
        <div class="text-[9px] text-slate-500">Class 12 Physics - Ch 1</div>
      </div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 flex items-center justify-center">
        <i class="fa-solid fa-rotate-left text-xs"></i>
      </button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full touch-none"></canvas>
      <div class="absolute top-2 left-2 bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1.5">
        <div class="text-[8px] text-slate-500 uppercase font-bold">Moment p</div>
        <div class="text-[11px] font-black text-amber-300" id="rP">0</div>
      </div>
      <div class="absolute top-2 right-2 bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1.5">
        <div class="text-[8px] text-slate-500 uppercase font-bold">Angle</div>
        <div class="text-[11px] font-black text-cyan-300" id="rAngle">0</div>
      </div>
      <div class="absolute bottom-2 left-2 bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1.5">
        <div class="text-[8px] text-slate-500 uppercase font-bold">Axial E</div>
        <div class="text-[11px] font-black text-rose-300" id="rAxial">0</div>
      </div>
      <div class="absolute bottom-2 right-2 bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1.5">
        <div class="text-[8px] text-slate-500 uppercase font-bold">Equatorial E</div>
        <div class="text-[11px] font-black text-purple-300" id="rEq">0</div>
      </div>
    </div>
    <div class="bg-slate-900 border-t border-slate-800 shrink-0 max-h-[40vh] overflow-y-auto p-3 space-y-2.5">
      <div>
        <div class="flex justify-between mb-1">
          <label class="text-[10px] font-bold text-rose-400 uppercase">Charge q (uC)</label>
          <span class="text-[11px] font-black text-rose-400" id="qVal">+2.0</span>
        </div>
        <input type="range" id="qSlider" min="0.5" max="5" step="0.5" value="2" class="w-full accent-rose-500">
      </div>
      <div>
        <div class="flex justify-between mb-1">
          <label class="text-[10px] font-bold text-cyan-400 uppercase">Separation 2a</label>
          <span class="text-[11px] font-black text-cyan-400" id="sepVal">140</span>
        </div>
        <input type="range" id="sepSlider" min="60" max="260" step="10" value="140" class="w-full accent-cyan-500">
      </div>
      <div class="grid grid-cols-3 gap-1.5">
        <button type="button" class="tog tog-field py-2 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">Field</button>
        <button type="button" class="tog tog-moment py-2 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">Moment</button>
        <button type="button" class="tog tog-points py-2 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">Points</button>
      </div>
    </div>
  `;
  host.appendChild(wrap);

  const canvas = wrap.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    W = rect.width;
    H = rect.height;
  }

  let q = 2, sep = 140, angle = 0;
  let showField = true, showMoment = true, showPoints = true;
  let animId = null;

  const center = { x: 0, y: 0 };

  function pos() {
    const h = sep / 2;
    const dx = Math.cos(angle) * h;
    const dy = Math.sin(angle) * h;
    return {
      p: { x: center.x + dx, y: center.y + dy },
      n: { x: center.x - dx, y: center.y - dy }
    };
  }

  function drawGrid() {
    ctx.strokeStyle = 'rgba(100,116,139,0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  }

  function drawField() {
    if (!showField) return;
    const c = pos();
    ctx.lineWidth = 1;
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      let x = c.p.x + Math.cos(a) * 16;
      let y = c.p.y + Math.sin(a) * 16;
      ctx.strokeStyle = 'rgba(244,63,94,0.4)';
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let s = 0; s < 180; s++) {
        let ex = 0, ey = 0;
        let rx = x - c.p.x, ry = y - c.p.y;
        let r2 = rx*rx + ry*ry, r = Math.sqrt(r2);
        if (r > 4) { const m = 400 / (r2 + 40); ex += m * rx / r; ey += m * ry / r; }
        rx = x - c.n.x; ry = y - c.n.y;
        r2 = rx*rx + ry*ry; r = Math.sqrt(r2);
        if (r > 4) { const m = -400 / (r2 + 40); ex += m * rx / r; ey += m * ry / r; }
        const len = Math.hypot(ex, ey);
        if (len < 0.001) break;
        x += (ex / len) * 5;
        y += (ey / len) * 5;
        if (x < -20 || x > W + 20 || y < -20 || y > H + 20) break;
        if (Math.hypot(x - c.n.x, y - c.n.y) < 16) { ctx.lineTo(c.n.x, c.n.y); break; }
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  function drawCharge(c, pos) {
    const r = 16;
    const col = pos ? '244,63,94' : '34,211,238';
    const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, r * 2);
    g.addColorStop(0, 'rgba(' + col + ',0.45)');
    g.addColorStop(1, 'rgba(' + col + ',0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(c.x, c.y, r * 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = pos ? '#e11d48' : '#0891b2';
    ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (pos) {
      ctx.moveTo(c.x - 5, c.y); ctx.lineTo(c.x + 5, c.y);
      ctx.moveTo(c.x, c.y - 5); ctx.lineTo(c.x, c.y + 5);
    } else {
      ctx.moveTo(c.x - 5, c.y); ctx.lineTo(c.x + 5, c.y);
    }
    ctx.stroke();
  }

  function drawMoment() {
    if (!showMoment) return;
    const c = pos();
    const p = q * sep;
    const len = 40 + Math.min(60, p * 6);
    const ux = Math.cos(angle), uy = Math.sin(angle);
    const sx = c.n.x + ux * 22, sy = c.n.y + uy * 22;
    const ex = sx + ux * len, ey = sy + uy * len;
    ctx.strokeStyle = '#fbbf24';
    ctx.fillStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    const a = Math.atan2(uy, ux);
    const h = 12;
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - h * Math.cos(a - Math.PI/6), ey - h * Math.sin(a - Math.PI/6));
    ctx.lineTo(ex - h * Math.cos(a + Math.PI/6), ey - h * Math.sin(a + Math.PI/6));
    ctx.closePath();
    ctx.fill();
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('p', ex + ux * 14, ey + uy * 14);
  }

  function drawPoints() {
    if (!showPoints) return;
    const ux = Math.cos(angle), uy = Math.sin(angle);
    const rd = sep * 1.8;
    const ax = center.x + ux * rd, ay = center.y + uy * rd;
    const ex = center.x + uy * rd, ey = center.y - ux * rd;

    ctx.fillStyle = 'rgba(244,63,94,0.15)';
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(ax, ay, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('A', ax, ay);

    ctx.fillStyle = 'rgba(168,85,247,0.15)';
    ctx.strokeStyle = '#a855f7';
    ctx.beginPath(); ctx.arc(ex, ey, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#a855f7';
    ctx.fillText('E', ex, ey);
  }

  function drawCenter() {
    ctx.fillStyle = 'rgba(148,163,184,0.3)';
    ctx.beginPath(); ctx.arc(center.x, center.y, 3, 0, Math.PI * 2); ctx.fill();
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    drawGrid();
    drawField();
    drawPoints();
    drawMoment();
    const c = pos();
    drawCharge(c.p, true);
    drawCharge(c.n, false);
    drawCenter();
  }

  function loop() { render(); animId = requestAnimationFrame(loop); }

  const rP = wrap.querySelector('#rP');
  const rAngle = wrap.querySelector('#rAngle');
  const rAxial = wrap.querySelector('#rAxial');
  const rEq = wrap.querySelector('#rEq');

  function updateReadouts() {
    const p = q * sep;
    rP.textContent = (p / 100).toFixed(2);
    const deg = ((angle * 180 / Math.PI) % 360 + 360) % 360;
    rAngle.textContent = Math.round(deg) + ' deg';
    const rd = sep * 1.8;
    const k = 8000;
    const aE = 2 * k * p / Math.pow(rd, 3) * 1000;
    const eE = k * p / Math.pow(rd, 3) * 1000;
    rAxial.textContent = aE.toFixed(1);
    rEq.textContent = eE.toFixed(1);
  }

  let drag = false, startA = 0, startT = 0;

  function ptr(e) {
    const rect = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX - rect.left, y: t.clientY - rect.top };
  }
  function onDown(e) {
    const p = ptr(e);
    if (Math.hypot(p.x - center.x, p.y - center.y) < 150) {
      drag = true;
      startA = angle;
      startT = Math.atan2(p.y - center.y, p.x - center.x);
      if (e.cancelable) e.preventDefault();
    }
  }
  function onMove(e) {
    if (!drag) return;
    if (e.cancelable) e.preventDefault();
    const p = ptr(e);
    const t = Math.atan2(p.y - center.y, p.x - center.x);
    angle = startA + (t - startT);
    updateReadouts();
  }
  function onUp() { drag = false; }

  canvas.addEventListener('mousedown', onDown);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
  canvas.addEventListener('touchstart', onDown, { passive: false });
  window.addEventListener('touchmove', onMove, { passive: false });
  window.addEventListener('touchend', onUp);

  const qS = wrap.querySelector('#qSlider');
  const sepS = wrap.querySelector('#sepSlider');
  const qV = wrap.querySelector('#qVal');
  const sepV = wrap.querySelector('#sepVal');

  function refresh() {
    q = parseFloat(qS.value);
    sep = parseFloat(sepS.value);
    qV.textContent = '+' + q.toFixed(1);
    sepV.textContent = sep;
    updateReadouts();
  }
  qS.addEventListener('input', refresh);
  sepS.addEventListener('input', refresh);

  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    qS.value = 2; sepS.value = 140; angle = 0; refresh();
  });
  wrap.querySelector('.back-btn').addEventListener('click', () => window.goBack());

  function bindTog(sel, get, set) {
    const b = wrap.querySelector(sel);
    b.addEventListener('click', () => {
      const v = !get();
      set(v);
      b.classList.toggle('bg-emerald-500/20', v);
      b.classList.toggle('border-emerald-500/40', v);
      b.classList.toggle('text-emerald-300', v);
      b.classList.toggle('bg-slate-800', !v);
      b.classList.toggle('border-slate-700', !v);
      b.classList.toggle('text-slate-300', !v);
    });
  }
  bindTog('.tog-field', () => showField, v => showField = v);
  bindTog('.tog-moment', () => showMoment, v => showMoment = v);
  bindTog('.tog-points', () => showPoints, v => showPoints = v);

  let ro = null;
  if ('ResizeObserver' in window) {
    ro = new ResizeObserver(() => {
      resize();
      center.x = W / 2;
      center.y = H / 2;
    });
    ro.observe(canvas);
  }
  resize();
  center.x = W / 2;
  center.y = H / 2;
  refresh();
  animId = requestAnimationFrame(loop);

  return function cleanup() {
    if (animId) cancelAnimationFrame(animId);
    if (ro) ro.disconnect();
    document.body.style.overflow = prevOverflow;
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
  };
}
