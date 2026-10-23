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
        <div class="text-xs font-black text-slate-100 truncate">Coulomb's Law Lab</div>
        <div class="text-[9px] text-slate-500">Class 12 Physics - Ch 1</div>
      </div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 flex items-center justify-center">
        <i class="fa-solid fa-rotate-left text-xs"></i>
      </button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full touch-none"></canvas>
      <div class="absolute top-2 left-2 bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1.5">
        <div class="text-[8px] text-slate-500 uppercase font-bold">Distance</div>
        <div class="text-[11px] font-black text-amber-300" id="rDist">0</div>
      </div>
      <div class="absolute top-2 right-2 bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1.5">
        <div class="text-[8px] text-slate-500 uppercase font-bold">Force</div>
        <div class="text-[11px] font-black text-cyan-300" id="rForce">0</div>
      </div>
      <div class="absolute bottom-2 left-2 bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1.5">
        <div class="text-[8px] text-slate-500 uppercase font-bold">Type</div>
        <div class="text-[11px] font-black text-slate-500" id="rType">-</div>
      </div>
    </div>
    <div class="bg-slate-900 border-t border-slate-800 shrink-0 max-h-[40vh] overflow-y-auto p-3 space-y-2.5">
      <div>
        <div class="flex justify-between mb-1">
          <label class="text-[10px] font-bold text-rose-400 uppercase">q1</label>
          <span class="text-[11px] font-black text-rose-400" id="q1Val">+2.0 uC</span>
        </div>
        <input type="range" id="q1Slider" min="-5" max="5" step="0.5" value="2" class="w-full accent-rose-500">
      </div>
      <div>
        <div class="flex justify-between mb-1">
          <label class="text-[10px] font-bold text-cyan-400 uppercase">q2</label>
          <span class="text-[11px] font-black text-cyan-400" id="q2Val">-2.0 uC</span>
        </div>
        <input type="range" id="q2Slider" min="-5" max="5" step="0.5" value="-2" class="w-full accent-cyan-500">
      </div>
      <div class="grid grid-cols-3 gap-1.5">
        <button type="button" class="tog tog-force py-2 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">Force</button>
        <button type="button" class="tog tog-field py-2 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">Field</button>
        <button type="button" class="tog tog-line py-2 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">Measure</button>
      </div>
    </div>
  `;
  host.appendChild(wrap);

  const canvas = wrap.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0;
  const R = 22;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    W = rect.width;
    H = rect.height;
  }

  let q1 = 2, q2 = -2;
  let showForce = true, showField = true, showLine = true;
  let animId = null;

  const A = { x: 0, y: 0 };
  const B = { x: 0, y: 0 };

  function initPos() {
    A.x = W * 0.28; A.y = H * 0.5;
    B.x = W * 0.72; B.y = H * 0.5;
  }

  function dist() { return Math.hypot(B.x - A.x, B.y - A.y); }
  function force() { return 8000 * Math.abs(q1 * q2) / Math.pow(Math.max(dist(), 40), 2); }

  function drawGrid() {
    ctx.strokeStyle = 'rgba(100,116,139,0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  }

  function drawField() {
    if (!showField) return;
    const charges = [{ x: A.x, y: A.y, q: q1 }, { x: B.x, y: B.y, q: q2 }];
    ctx.lineWidth = 1.2;
    charges.forEach(c => {
      if (Math.abs(c.q) < 0.1) return;
      const col = c.q > 0 ? 'rgba(244,63,94,0.4)' : 'rgba(34,211,238,0.4)';
      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * Math.PI * 2;
        let x = c.x + Math.cos(ang) * (R + 2);
        let y = c.y + Math.sin(ang) * (R + 2);
        ctx.strokeStyle = col;
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let s = 0; s < 150; s++) {
          let ex = 0, ey = 0;
          charges.forEach(o => {
            if (Math.abs(o.q) < 0.1) return;
            const rx = x - o.x, ry = y - o.y;
            const r2 = rx * rx + ry * ry;
            const r = Math.sqrt(r2);
            if (r < 8) return;
            const sgn = o.q > 0 ? 1 : -1;
            const m = Math.abs(o.q) * 40 / (r2 + 20);
            ex += sgn * m * rx / (r + 0.1);
            ey += sgn * m * ry / (r + 0.1);
          });
          const len = Math.hypot(ex, ey);
          if (len < 0.001) break;
          x += (ex / len) * 6;
          y += (ey / len) * 6;
          if (x < -20 || x > W + 20 || y < -20 || y > H + 20) break;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    });
  }

  function drawCharge(c, q) {
    const neutral = Math.abs(q) < 0.1;
    const pos = q > 0;
    const scale = neutral ? 0.85 : (0.75 + Math.min(1, Math.abs(q) / 5) * 0.45);
    const r = R * scale;
    const col = neutral ? '100,116,139' : (pos ? '244,63,94' : '34,211,238');

    const g1 = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, r * 2.2);
    g1.addColorStop(0, 'rgba(' + col + ',0.4)');
    g1.addColorStop(1, 'rgba(' + col + ',0)');
    ctx.fillStyle = g1;
    ctx.beginPath(); ctx.arc(c.x, c.y, r * 2.2, 0, Math.PI * 2); ctx.fill();

    const g2 = ctx.createRadialGradient(c.x - r*0.3, c.y - r*0.3, 0, c.x, c.y, r);
    if (neutral) { g2.addColorStop(0, '#94a3b8'); g2.addColorStop(1, '#475569'); }
    else if (pos) { g2.addColorStop(0, '#fb7185'); g2.addColorStop(1, '#e11d48'); }
    else { g2.addColorStop(0, '#67e8f9'); g2.addColorStop(1, '#0891b2'); }
    ctx.fillStyle = g2;
    ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    if (neutral) {
      ctx.fillStyle = '#0f172a';
      ctx.beginPath(); ctx.arc(c.x, c.y, 2.5, 0, Math.PI * 2); ctx.fill();
    } else if (pos) {
      ctx.beginPath();
      ctx.moveTo(c.x - 7, c.y); ctx.lineTo(c.x + 7, c.y);
      ctx.moveTo(c.x, c.y - 7); ctx.lineTo(c.x, c.y + 7);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(c.x - 7, c.y); ctx.lineTo(c.x + 7, c.y);
      ctx.stroke();
    }

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(neutral ? '0' : (q > 0 ? '+' + q : '' + q), c.x, c.y + r + 14);
  }

  function arrow(x1, y1, x2, y2, color, w) {
    const dx = x2 - x1, dy = y2 - y1;
    const l = Math.hypot(dx, dy);
    if (l < 8) return;
    const a = Math.atan2(dy, dx);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    const h = 10;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - h * Math.cos(a - Math.PI/6), y2 - h * Math.sin(a - Math.PI/6));
    ctx.lineTo(x2 - h * Math.cos(a + Math.PI/6), y2 - h * Math.sin(a + Math.PI/6));
    ctx.closePath();
    ctx.fill();
  }

  function drawForce() {
    if (!showForce) return;
    if (Math.abs(q1) < 0.1 || Math.abs(q2) < 0.1) return;
    const attract = (q1 * q2) < 0;
    const F = force();
    const len = Math.min(120, 30 + Math.sqrt(F) * 4);
    const dx = B.x - A.x, dy = B.y - A.y;
    const d = Math.hypot(dx, dy);
    if (d < 1) return;
    const ux = dx / d, uy = dy / d;
    const c = attract ? '#f43f5e' : '#22d3ee';
    if (attract) {
      arrow(A.x + ux*R, A.y + uy*R, A.x + ux*(R+len), A.y + uy*(R+len), c, 2.5);
      arrow(B.x - ux*R, B.y - uy*R, B.x - ux*(R+len), B.y - uy*(R+len), c, 2.5);
    } else {
      arrow(A.x - ux*R, A.y - uy*R, A.x - ux*(R+len), A.y - uy*(R+len), c, 2.5);
      arrow(B.x + ux*R, B.y + uy*R, B.x + ux*(R+len), B.y + uy*(R+len), c, 2.5);
    }
  }

  function drawMeasure() {
    if (!showLine) return;
    ctx.strokeStyle = 'rgba(251,191,36,0.7)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.stroke();
    ctx.setLineDash([]);
    const mx = (A.x + B.x) / 2;
    const my = (A.y + B.y) / 2;
    const text = Math.round(dist()) + ' px';
    ctx.font = 'bold 11px sans-serif';
    const tw = ctx.measureText(text).width;
    ctx.fillStyle = 'rgba(15,23,42,0.9)';
    ctx.fillRect(mx - tw/2 - 6, my - 10, tw + 12, 20);
    ctx.fillStyle = '#fbbf24';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, mx, my);
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    drawGrid();
    drawField();
    drawMeasure();
    drawForce();
    drawCharge(A, q1);
    drawCharge(B, q2);
  }

  function loop() {
    render();
    animId = requestAnimationFrame(loop);
  }

  const rDist = wrap.querySelector('#rDist');
  const rForce = wrap.querySelector('#rForce');
  const rType = wrap.querySelector('#rType');

  function updateReadouts() {
    rDist.textContent = Math.round(dist()) + ' px';
    rForce.textContent = force().toFixed(0) + ' N';
    if (Math.abs(q1) < 0.1 || Math.abs(q2) < 0.1) {
      rType.textContent = '-';
      rType.className = 'text-[11px] font-black text-slate-500';
    } else if ((q1 * q2) < 0) {
      rType.textContent = 'Attractive';
      rType.className = 'text-[11px] font-black text-cyan-400';
    } else {
      rType.textContent = 'Repulsive';
      rType.className = 'text-[11px] font-black text-rose-400';
    }
  }

  let drag = null, ox = 0, oy = 0;

  function ptr(e) {
    const rect = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX - rect.left, y: t.clientY - rect.top };
  }
  function onDown(e) {
    const p = ptr(e);
    if (Math.hypot(p.x - A.x, p.y - A.y) < R + 18) { drag = A; ox = p.x - A.x; oy = p.y - A.y; }
    else if (Math.hypot(p.x - B.x, p.y - B.y) < R + 18) { drag = B; ox = p.x - B.x; oy = p.y - B.y; }
    if (drag && e.cancelable) e.preventDefault();
  }
  function onMove(e) {
    if (!drag) return;
    if (e.cancelable) e.preventDefault();
    const p = ptr(e);
    let nx = Math.max(R, Math.min(W - R, p.x - ox));
    let ny = Math.max(R, Math.min(H - R, p.y - oy));
    drag.x = nx; drag.y = ny;
    updateReadouts();
  }
  function onUp() { drag = null; }

  canvas.addEventListener('mousedown', onDown);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
  canvas.addEventListener('touchstart', onDown, { passive: false });
  window.addEventListener('touchmove', onMove, { passive: false });
  window.addEventListener('touchend', onUp);

  const q1S = wrap.querySelector('#q1Slider');
  const q2S = wrap.querySelector('#q2Slider');
  const q1V = wrap.querySelector('#q1Val');
  const q2V = wrap.querySelector('#q2Val');

  function refresh() {
    q1 = parseFloat(q1S.value);
    q2 = parseFloat(q2S.value);
    q1V.textContent = (q1 > 0 ? '+' : '') + q1.toFixed(1) + ' uC';
    q2V.textContent = (q2 > 0 ? '+' : '') + q2.toFixed(1) + ' uC';
    updateReadouts();
  }
  q1S.addEventListener('input', refresh);
  q2S.addEventListener('input', refresh);

  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    q1S.value = 2; q2S.value = -2; initPos(); refresh();
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
  bindTog('.tog-force', () => showForce, v => showForce = v);
  bindTog('.tog-field', () => showField, v => showField = v);
  bindTog('.tog-line', () => showLine, v => showLine = v);

  let ro = null;
  if ('ResizeObserver' in window) {
    ro = new ResizeObserver(() => { resize(); });
    ro.observe(canvas);
  }
  resize();
  initPos();
  refresh();
  animId = requestAnimationFrame(loop);

  return function cleanup() {
    if (animId) cancelAnimationFrame(animId);
    if (ro) ro.disconnect();
    document.body.style.overflow = prevOverflow;
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
  };
}
