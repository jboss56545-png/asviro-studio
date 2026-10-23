export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">E from V</div><div class="text-[9px] text-slate-500 truncate">Class 12 Physics - Ch 2</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">V at x₀</div>
        <div class="text-[10px] font-black text-emerald-300" id="rV">0.00 V</div>
      </div>
      <div class="absolute top-2 right-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">E = −dV/dx</div>
        <div class="text-[10px] font-black text-cyan-300" id="rE">0.00</div>
      </div>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 space-y-2" style="backdrop-filter:blur(20px);">
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-emerald-400 uppercase">Position x₀</label><span class="text-[11px] font-black text-emerald-400" id="xV">1.0</span></div>
        <input type="range" id="xSlider" min="0.3" max="3" step="0.05" value="1" class="w-full accent-emerald-500">
      </div>
      <div class="grid grid-cols-2 gap-1.5">
        <button type="button" class="ftog py-2 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300" data-f="0">V = kq/r</button>
        <button type="button" class="ftog py-2 rounded-xl text-[9px] font-bold bg-white/5 border border-white/10 text-slate-300" data-f="1">V = kx²</button>
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[9px] text-slate-400 leading-relaxed">
        <b class="text-emerald-400">E = −dV/dx:</b> Electric field high potential se low ki taraf point karta hai. Slope zyada = field zyada.
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
    W = rect.width; H = rect.height;
  }

  const FUNCS = [
    { v: x => 2 / x, dv: x => -2 / (x * x), label: 'V = kq/r', range: [0.3, 3] },
    { v: x => 0.5 * x * x, dv: x => x, label: 'V = kx²', range: [0, 3] }
  ];

  let fi = 0, xVal = 1;
  let animId = null;

  const X_MIN = 0, X_MAX = 3;
  const Y_MIN = -1, Y_MAX = 4;

  function w2s(x, y) {
    return {
      x: ((x - X_MIN) / (X_MAX - X_MIN)) * W * 0.92 + W * 0.04,
      y: H * 0.9 - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * H * 0.8
    };
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#0f172a'); bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(148,163,184,0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= 3; x += 0.5) {
      const p1 = w2s(x, Y_MIN), p2 = w2s(x, Y_MAX);
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
    }
    for (let y = -1; y <= 4; y += 1) {
      const p1 = w2s(X_MIN, y), p2 = w2s(X_MAX, y);
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = 'rgba(148,163,184,0.4)';
    ctx.lineWidth = 1.5;
    const o = w2s(0, 0);
    ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(W, o.y); ctx.stroke();
    if (o.y > 0 && o.y < H) { ctx.beginPath(); ctx.moveTo(o.x, 0); ctx.lineTo(o.x, H); ctx.stroke(); }

    const fn = FUNCS[fi];

    // V curve
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= 200; i++) {
      const x = fn.range[0] + (i / 200) * (fn.range[1] - fn.range[0]);
      const y = fn.v(x);
      if (y < Y_MIN || y > Y_MAX) continue;
      const p = w2s(x, y);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();

    // Current point + tangent
    const yV = fn.v(xVal);
    if (yV >= Y_MIN && yV <= Y_MAX) {
      const p = w2s(xVal, yV);
      const slope = fn.dv(xVal);
      const pt1 = w2s(xVal - 0.3, yV - slope * 0.3);
      const pt2 = w2s(xVal + 0.3, yV + slope * 0.3);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      ctx.beginPath(); ctx.moveTo(pt1.x, pt1.y); ctx.lineTo(pt2.x, pt2.y); ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#10b981';
      ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke();
    }

    // E arrow
    const eVal = -fn.dv(xVal);
    const arrowY = o.y + 30;
    ctx.strokeStyle = '#22d3ee';
    ctx.fillStyle = '#22d3ee';
    ctx.lineWidth = 2.5;
    if (Math.abs(eVal) > 0.05) {
      const arrowLen = Math.min(60, Math.abs(eVal) * 25);
      const dir = eVal > 0 ? 1 : -1;
      const ax = W / 2, ay = arrowY;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + dir * arrowLen, ay); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ax + dir * arrowLen, ay);
      ctx.lineTo(ax + dir * arrowLen - dir * 8, ay - 5);
      ctx.lineTo(ax + dir * arrowLen - dir * 8, ay + 5);
      ctx.closePath(); ctx.fill();
    }

    // Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(fn.label, 20, 20);
    ctx.textAlign = 'right';
    ctx.fillText('x →', W - 12, o.y - 12);
  }

  function loop() { draw(); animId = requestAnimationFrame(loop); }

  function update() {
    const fn = FUNCS[fi];
    const v = fn.v(xVal);
    const e = -fn.dv(xVal);
    wrap.querySelector('#rV').textContent = v.toFixed(2) + ' V';
    wrap.querySelector('#rE').textContent = e.toFixed(2);
    wrap.querySelector('#xV').textContent = xVal.toFixed(2);
  }

  wrap.querySelector('#xSlider').addEventListener('input', e => { xVal = parseFloat(e.target.value); update(); });

  wrap.querySelectorAll('.ftog').forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      fi = idx;
      xVal = fi === 0 ? 1 : 1.5;
      wrap.querySelector('#xSlider').value = xVal;
      wrap.querySelectorAll('.ftog').forEach((b, i) => {
        const on = i === idx;
        b.classList.toggle('bg-emerald-500/20', on);
        b.classList.toggle('border-emerald-500/40', on);
        b.classList.toggle('text-emerald-300', on);
        b.classList.toggle('bg-white/5', !on);
        b.classList.toggle('border-white/10', !on);
        b.classList.toggle('text-slate-300', !on);
      });
      update();
    });
  });

  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    fi = 0; xVal = 1;
    wrap.querySelector('#xSlider').value = 1;
    wrap.querySelectorAll('.ftog').forEach((b, i) => {
      const on = i === 0;
      b.classList.toggle('bg-emerald-500/20', on);
      b.classList.toggle('border-emerald-500/40', on);
      b.classList.toggle('text-emerald-300', on);
      b.classList.toggle('bg-white/5', !on);
      b.classList.toggle('border-white/10', !on);
      b.classList.toggle('text-slate-300', !on);
    });
    update();
  });
  wrap.querySelector('.back-btn').addEventListener('click', () => window.goBack());

  let ro = null;
  if ('ResizeObserver' in window) { ro = new ResizeObserver(resize); ro.observe(canvas); }
  resize(); update();
  animId = requestAnimationFrame(loop);

  return function cleanup() {
    if (animId) cancelAnimationFrame(animId);
    if (ro) ro.disconnect();
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    document.body.style.overflow = prevOverflow;
  };
}
