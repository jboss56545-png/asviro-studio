export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">Derivative as Slope</div><div class="text-[9px] text-slate-500 truncate">Class 12 Math - Ch 5</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2.5 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">f(x) at x₀</div>
        <div class="text-[11px] font-black text-emerald-300" id="rFx">0.00</div>
      </div>
      <div class="absolute top-2 right-2 bg-white/10 border border-white/10 rounded-xl px-2.5 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">f'(x₀) slope</div>
        <div class="text-[11px] font-black text-cyan-300" id="rFp">0.00</div>
      </div>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 space-y-2.5" style="backdrop-filter:blur(20px);">
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-emerald-400 uppercase">Point x₀</label><span class="text-[11px] font-black text-emerald-400" id="xV">1.00</span></div>
        <input type="range" id="xSlider" min="-3" max="3" step="0.05" value="1" class="w-full accent-emerald-500">
      </div>
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-amber-400 uppercase">Secant h</label><span class="text-[11px] font-black text-amber-400" id="hV">1.00</span></div>
        <input type="range" id="hSlider" min="0.01" max="2" step="0.01" value="1" class="w-full accent-amber-500">
      </div>
      <div class="grid grid-cols-4 gap-1.5">
        <button type="button" class="fbtn py-2 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300" data-f="0">x²</button>
        <button type="button" class="fbtn py-2 rounded-xl text-[9px] font-bold bg-white/5 border border-white/10 text-slate-300" data-f="1">x³</button>
        <button type="button" class="fbtn py-2 rounded-xl text-[9px] font-bold bg-white/5 border border-white/10 text-slate-300" data-f="2">sin x</button>
        <button type="button" class="fbtn py-2 rounded-xl text-[9px] font-bold bg-white/5 border border-white/10 text-slate-300" data-f="3">eˣ</button>
      </div>
      <div class="grid grid-cols-2 gap-1.5">
        <button type="button" class="tog tog-secant py-2 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">Show Secant</button>
        <button type="button" class="tog tog-tangent py-2 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">Show Tangent</button>
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[9px] text-slate-400 leading-relaxed">
        <b class="text-cyan-400">Derivative</b> = slope of tangent at point. As h → 0, secant becomes tangent. f'(x) = lim(h→0) [f(x+h) − f(x)]/h
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
    { f: x => x*x, fp: x => 2*x, label: 'f(x) = x²', range: 3, ymax: 9 },
    { f: x => x*x*x, fp: x => 3*x*x, label: 'f(x) = x³', range: 2, ymax: 8 },
    { f: x => Math.sin(x), fp: x => Math.cos(x), label: 'f(x) = sin(x)', range: Math.PI * 1.2, ymax: 1.5 },
    { f: x => Math.exp(x), fp: x => Math.exp(x), label: 'f(x) = eˣ', range: 2, ymax: 8 }
  ];

  let fi = 0;
  let x0 = 1;
  let hVal = 1;
  let showSecant = true, showTangent = true;
  let animId = null;

  const X_MIN = -3.5, X_MAX = 3.5;
  const Y_MIN = -2, Y_MAX = 9;

  function w2s(x, y) {
    return {
      x: ((x - X_MIN) / (X_MAX - X_MIN)) * W,
      y: H - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * H
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
    for (let x = Math.ceil(X_MIN); x <= X_MAX; x++) {
      const p1 = w2s(x, Y_MIN), p2 = w2s(x, Y_MAX);
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
    }
    for (let y = Math.ceil(Y_MIN); y <= Y_MAX; y++) {
      const p1 = w2s(X_MIN, y), p2 = w2s(X_MAX, y);
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = 'rgba(148,163,184,0.4)';
    ctx.lineWidth = 1.5;
    const ox = w2s(0, 0);
    ctx.beginPath(); ctx.moveTo(0, ox.y); ctx.lineTo(W, ox.y); ctx.stroke();
    if (ox.x > 0 && ox.x < W) {
      ctx.beginPath(); ctx.moveTo(ox.x, 0); ctx.lineTo(ox.x, H); ctx.stroke();
    }

    const fn = FUNCS[fi];
    // Draw curve
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    const steps = 300;
    for (let i = 0; i <= steps; i++) {
      const x = X_MIN + (i / steps) * (X_MAX - X_MIN);
      const y = fn.f(x);
      if (y < Y_MIN - 1 || y > Y_MAX + 1) continue;
      const p = w2s(x, y);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();

    // Point x0
    const y0 = fn.f(x0);
    const p0 = w2s(x0, y0);

    // Tangent line
    if (showTangent) {
      const slope = fn.fp(x0);
      const dxT = 3;
      const xt1 = x0 - dxT, yt1 = y0 - slope * dxT;
      const xt2 = x0 + dxT, yt2 = y0 + slope * dxT;
      const pt1 = w2s(xt1, yt1), pt2 = w2s(xt2, yt2);
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(pt1.x, pt1.y); ctx.lineTo(pt2.x, pt2.y); ctx.stroke();

      // Slope triangle
      ctx.strokeStyle = 'rgba(34,211,238,0.35)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      const tdx = 0.5;
      const tdy = slope * tdx;
      const ptA = w2s(x0, y0);
      const ptB = w2s(x0 + tdx, y0);
      const ptC = w2s(x0 + tdx, y0 + tdy);
      ctx.beginPath();
      ctx.moveTo(ptA.x, ptA.y); ctx.lineTo(ptB.x, ptB.y); ctx.lineTo(ptC.x, ptC.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Secant line (from x0 to x0+h)
    if (showSecant && hVal > 0.02) {
      const x1 = x0 + hVal;
      const y1 = fn.f(x1);
      const slope = (y1 - y0) / hVal;
      const dxS = 3;
      const xs1 = x0 - dxS, ys1 = y0 - slope * dxS;
      const xs2 = x0 + dxS, ys2 = y0 + slope * dxS;
      const ps1 = w2s(xs1, ys1), ps2 = w2s(xs2, ys2);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(ps1.x, ps1.y); ctx.lineTo(ps2.x, ps2.y); ctx.stroke();
      ctx.setLineDash([]);

      // Secant point
      const p1 = w2s(x1, y1);
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath(); ctx.arc(p1.x, p1.y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'white'; ctx.lineWidth = 1.5; ctx.stroke();
    }

    // Point (x0, f(x0))
    ctx.fillStyle = '#22d3ee';
    ctx.beginPath(); ctx.arc(p0.x, p0.y, 7, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke();

    // Label
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(fn.label, W / 2, 20);
  }

  function loop() { draw(); animId = requestAnimationFrame(loop); }

  function update() {
    const fn = FUNCS[fi];
    const y0 = fn.f(x0);
    const slope = fn.fp(x0);
    wrap.querySelector('#rFx').textContent = y0.toFixed(2);
    wrap.querySelector('#rFp').textContent = slope.toFixed(2);
    wrap.querySelector('#xV').textContent = x0.toFixed(2);
    wrap.querySelector('#hV').textContent = hVal.toFixed(2);
  }

  wrap.querySelector('#xSlider').addEventListener('input', e => { x0 = parseFloat(e.target.value); update(); });
  wrap.querySelector('#hSlider').addEventListener('input', e => { hVal = parseFloat(e.target.value); update(); });

  wrap.querySelectorAll('.fbtn').forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      fi = idx;
      wrap.querySelectorAll('.fbtn').forEach((b, i) => {
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

  function setTogUI(sel, on) {
    const b = wrap.querySelector(sel);
    b.classList.toggle('bg-emerald-500/20', on);
    b.classList.toggle('border-emerald-500/40', on);
    b.classList.toggle('text-emerald-300', on);
    b.classList.toggle('bg-white/5', !on);
    b.classList.toggle('border-white/10', !on);
    b.classList.toggle('text-slate-300', !on);
  }
  wrap.querySelector('.tog-secant').addEventListener('click', () => { showSecant = !showSecant; setTogUI('.tog-secant', showSecant); });
  wrap.querySelector('.tog-tangent').addEventListener('click', () => { showTangent = !showTangent; setTogUI('.tog-tangent', showTangent); });

  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    x0 = 1; hVal = 1;
    wrap.querySelector('#xSlider').value = 1;
    wrap.querySelector('#hSlider').value = 1;
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
