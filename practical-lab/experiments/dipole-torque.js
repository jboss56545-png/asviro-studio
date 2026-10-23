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
        <div class="text-xs font-black text-slate-100 truncate">Torque on Dipole</div>
        <div class="text-[9px] text-slate-500 truncate">Class 12 Physics - Ch 1</div>
      </div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 flex items-center justify-center">
        <i class="fa-solid fa-rotate-left text-xs"></i>
      </button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full" style="touch-action:none"></canvas>
      <div class="absolute top-2 left-2 bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1.5 pointer-events-none">
        <div class="text-[8px] text-slate-500 uppercase font-bold">Angle</div>
        <div class="text-[11px] font-black text-amber-300" id="rAngle">0 deg</div>
      </div>
      <div class="absolute top-2 right-2 bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1.5 pointer-events-none">
        <div class="text-[8px] text-slate-500 uppercase font-bold">Torque t</div>
        <div class="text-[11px] font-black text-rose-300" id="rTorque">0</div>
      </div>
      <div class="absolute bottom-2 left-2 bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1.5 pointer-events-none">
        <div class="text-[8px] text-slate-500 uppercase font-bold">Energy U</div>
        <div class="text-[11px] font-black text-cyan-300" id="rPE">0</div>
      </div>
      <div class="absolute bottom-2 right-2 bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1.5 pointer-events-none">
        <div class="text-[8px] text-slate-500 uppercase font-bold">Formula</div>
        <div class="text-[10px] font-black text-emerald-300">pE sin0</div>
      </div>
    </div>
    <div class="bg-slate-900 border-t border-slate-800 p-3 shrink-0 space-y-2.5">
      <div>
        <div class="flex justify-between mb-1">
          <label class="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Angle theta</label>
          <span class="text-[11px] font-black text-amber-400" id="angleVal">0 deg</span>
        </div>
        <input type="range" id="angleSlider" min="0" max="360" step="1" value="0" class="w-full accent-amber-500">
      </div>
      <div>
        <div class="flex justify-between mb-1">
          <label class="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Field E</label>
          <span class="text-[11px] font-black text-emerald-400" id="eVal">40</span>
        </div>
        <input type="range" id="eSlider" min="10" max="100" step="5" value="40" class="w-full accent-emerald-500">
      </div>
      <div class="grid grid-cols-2 gap-1.5">
        <button type="button" class="tog tog-osc py-2 rounded-xl text-[9px] font-bold bg-slate-800 border border-slate-700 text-slate-300">Auto-Oscillate</button>
        <button type="button" class="tog tog-torque py-2 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">Show Torque</button>
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

  let angleDeg = 0;
  let E = 40;
  let autoOsc = false;
  let showTorque = true;
  let oscDir = 1;
  let animId = null;
  let lastT = 0;

  const P = 1.0;
  const DL = 70;

  function drawField() {
    const step = 44;
    const arrowStep = 60;
    const aSize = 6;
    const intensity = E / 100;
    const alpha = 0.15 + intensity * 0.5;
    ctx.strokeStyle = `rgba(34,211,238,${alpha})`;
    ctx.fillStyle = `rgba(34,211,238,${alpha})`;
    ctx.lineWidth = 1.4;
    for (let x = step/2; x < W; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0); ctx.lineTo(x, H);
      ctx.stroke();
      for (let y = arrowStep/2; y < H; y += arrowStep) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - aSize, y - aSize);
        ctx.moveTo(x, y);
        ctx.lineTo(x + aSize, y - aSize);
        ctx.stroke();
      }
    }
  }

  function drawArrow(x1, y1, x2, y2, color, w) {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len < 8) return;
    const ang = Math.atan2(dy, dx);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    const hLen = 10;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - hLen * Math.cos(ang - Math.PI/6), y2 - hLen * Math.sin(ang - Math.PI/6));
    ctx.lineTo(x2 - hLen * Math.cos(ang + Math.PI/6), y2 - hLen * Math.sin(ang + Math.PI/6));
    ctx.closePath();
    ctx.fill();
  }

  function dipolePoints(cx, cy) {
    const theta = angleDeg * Math.PI / 180;
    const px = Math.sin(theta);
    const py = -Math.cos(theta);
    const half = DL / 2;
    return {
      px, py,
      pos: { x: cx + px * half, y: cy + py * half },
      neg: { x: cx - px * half, y: cy - py * half }
    };
  }

  function drawDipole(cx, cy) {
    const d = dipolePoints(cx, cy);

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(d.neg.x, d.neg.y);
    ctx.lineTo(d.pos.x, d.pos.y);
    ctx.stroke();

    // Positive charge
    const pg = ctx.createRadialGradient(d.pos.x - 4, d.pos.y - 4, 2, d.pos.x, d.pos.y, 16);
    pg.addColorStop(0, '#fb7185');
    pg.addColorStop(1, '#e11d48');
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.arc(d.pos.x, d.pos.y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+', d.pos.x, d.pos.y + 1);

    // Negative charge
    const ng = ctx.createRadialGradient(d.neg.x - 4, d.neg.y - 4, 2, d.neg.x, d.neg.y, 16);
    ng.addColorStop(0, '#67e8f9');
    ng.addColorStop(1, '#0891b2');
    ctx.fillStyle = ng;
    ctx.beginPath();
    ctx.arc(d.neg.x, d.neg.y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#0f172a';
    ctx.fillText('-', d.neg.x, d.neg.y - 1);

    // p label
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('p', cx + d.px * (DL/2 + 24), cy + d.py * (DL/2 + 24));
  }

  function drawForces(cx, cy) {
    const d = dipolePoints(cx, cy);
    const fLen = 40 + (E - 10) * 0.6;
    drawArrow(d.pos.x, d.pos.y, d.pos.x, d.pos.y - fLen, '#f43f5e', 2.5);
    drawArrow(d.neg.x, d.neg.y, d.neg.x, d.neg.y + fLen, '#22d3ee', 2.5);
  }

  function drawTorqueArc(cx, cy) {
    if (!showTorque) return;
    const tau = P * E * Math.sin(angleDeg * Math.PI / 180);
    if (Math.abs(tau) < 0.5) return;
    ctx.strokeStyle = 'rgba(244,63,94,0.75)';
    ctx.lineWidth = 3;
    const arcR = 48;
    const startA = -Math.PI / 2;
    const endA = startA + Math.PI * 0.7;
    ctx.beginPath();
    ctx.arc(cx, cy, arcR, startA, endA);
    ctx.stroke();
    const ex = cx + Math.cos(endA) * arcR;
    const ey = cy + Math.sin(endA) * arcR;
    ctx.fillStyle = 'rgba(244,63,94,0.9)';
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - 10, ey - 3);
    ctx.lineTo(ex - 3, ey - 10);
    ctx.closePath();
    ctx.fill();
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    drawField();
    const cx = W / 2, cy = H / 2;
    ctx.fillStyle = 'rgba(148,163,184,0.4)';
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();
    drawTorqueArc(cx, cy);
    drawForces(cx, cy);
    drawDipole(cx, cy);
  }

  function updateReadouts() {
    const theta = angleDeg * Math.PI / 180;
    const tau = P * E * Math.sin(theta);
    const U = -P * E * Math.cos(theta);
    wrap.querySelector('#rAngle').textContent = Math.round(angleDeg) + ' deg';
    wrap.querySelector('#angleVal').textContent = Math.round(angleDeg) + ' deg';
    wrap.querySelector('#rTorque').textContent = Math.abs(tau).toFixed(1);
    wrap.querySelector('#rPE').textContent = U.toFixed(1);
  }

  function loop(t) {
    const dt = Math.min(0.05, (t - lastT) / 1000);
    lastT = t;
    if (autoOsc) {
      angleDeg += oscDir * dt * 45;
      if (angleDeg > 360) { angleDeg = 360; oscDir = -1; }
      if (angleDeg < 0) { angleDeg = 0; oscDir = 1; }
      wrap.querySelector('#angleSlider').value = Math.round(angleDeg);
    }
    render();
    updateReadouts();
    animId = requestAnimationFrame(loop);
  }

  const angleSlider = wrap.querySelector('#angleSlider');
  const eSlider = wrap.querySelector('#eSlider');
  angleSlider.addEventListener('input', () => {
    angleDeg = parseFloat(angleSlider.value);
    autoOsc = false;
    setTogUI('.tog-osc', false);
  });
  eSlider.addEventListener('input', () => {
    E = parseFloat(eSlider.value);
    wrap.querySelector('#eVal').textContent = E;
  });

  function setTogUI(sel, on) {
    const b = wrap.querySelector(sel);
    if (!b) return;
    b.classList.toggle('bg-emerald-500/20', on);
    b.classList.toggle('border-emerald-500/40', on);
    b.classList.toggle('text-emerald-300', on);
    b.classList.toggle('bg-slate-800', !on);
    b.classList.toggle('border-slate-700', !on);
    b.classList.toggle('text-slate-300', !on);
  }

  wrap.querySelector('.tog-osc').addEventListener('click', () => {
    autoOsc = !autoOsc;
    setTogUI('.tog-osc', autoOsc);
  });
  wrap.querySelector('.tog-torque').addEventListener('click', () => {
    showTorque = !showTorque;
    setTogUI('.tog-torque', showTorque);
  });
  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    angleDeg = 0; E = 40; autoOsc = false;
    angleSlider.value = 0; eSlider.value = 40;
    wrap.querySelector('#eVal').textContent = '40';
    setTogUI('.tog-osc', false);
  });
  wrap.querySelector('.back-btn').addEventListener('click', () => window.goBack());

  let ro = null;
  if ('ResizeObserver' in window) {
    ro = new ResizeObserver(() => resize());
    ro.observe(canvas);
  }
  resize();
  lastT = performance.now();
  animId = requestAnimationFrame(loop);

  return function cleanup() {
    if (animId) cancelAnimationFrame(animId);
    if (ro) ro.disconnect();
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    document.body.style.overflow = prevOverflow;
  };
}
