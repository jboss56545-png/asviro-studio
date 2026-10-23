export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">Riemann Sum → Integral</div><div class="text-[9px] text-slate-500 truncate">Class 12 Math - Ch 7</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2.5 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Riemann Sum</div>
        <div class="text-[11px] font-black text-amber-300" id="rSum">0</div>
      </div>
      <div class="absolute top-2 right-2 bg-white/10 border border-white/10 rounded-xl px-2.5 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Exact ∫</div>
        <div class="text-[11px] font-black text-emerald-300" id="rExact">0</div>
      </div>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 space-y-2.5" style="backdrop-filter:blur(20px);">
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-amber-400 uppercase">Rectangles (n)</label><span class="text-[11px] font-black text-amber-400" id="nV">4</span></div>
        <input type="range" id="nSlider" min="1" max="100" step="1" value="4" class="w-full accent-amber-500">
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <div class="flex justify-between mb-1"><label class="text-[9px] font-bold text-emerald-400">a (lower)</label><span class="text-[10px] font-black text-emerald-400" id="aV">0.0</span></div>
          <input type="range" id="aSlider" min="-3" max="2" step="0.1" value="0" class="w-full accent-emerald-500">
        </div>
        <div>
          <div class="flex justify-between mb-1"><label class="text-[9px] font-bold text-cyan-400">b (upper)</label><span class="text-[10px] font-black text-cyan-400" id="bV">2.0</span></div>
          <input type="range" id="bSlider" min="-2" max="3" step="0.1" value="2" class="w-full accent-cyan-500">
        </div>
      </div>
      <div class="grid grid-cols-3 gap-1.5">
        <button type="button" class="rmode py-2 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300" data-r="0">Left</button>
        <button type="button" class="rmode py-2 rounded-xl text-[9px] font-bold bg-white/5 border border-white/10 text-slate-300" data-r="1">Mid</button>
        <button type="button" class="rmode py-2 rounded-xl text-[9px] font-bold bg-white/5 border border-white/10 text-slate-300" data-r="2">Right</button>
      </div>
      <div class="grid grid-cols-4 gap-1.5">
        <button type="button" class="fbtn py-2 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300" data-f="0">x²</button>
        <button type="button" class="fbtn py-2 rounded-xl text-[9px] font-bold bg-white/5 border border-white/10 text-slate-300" data-f="1">sin x+2</button>
        <button type="button" class="fbtn py-2 rounded-xl text-[9px] font-bold bg-white/5 border border-white/10 text-slate-300" data-f="2">x³</button>
        <button type="button" class="fbtn py-2 rounded-xl text-[9px] font-bold bg-white/5 border border-white/10 text-slate-300" data-f="3">√x</button>
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[9px] text-slate-400 leading-relaxed">
        <b class="text-emerald-400">Riemann Sum:</b> As n → ∞, sum of rectangles = exact area under curve = ∫ᵃᵇ f(x) dx. Midpoint method converges fastest.
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
    { f: x => x*x, integral: (a, b) => (b*b*b - a*a*a) / 3, label: 'f(x) = x²', ymax: 6 },
    { f: x => Math.sin(x) + 2, integral: (a, b) => -Math.cos(b) + Math.cos(a) + 2 * (b - a), label: 'f(x) = sin(x) + 2', ymax: 4 },
    { f: x => x*x*x, integral: (a, b) => (Math.pow(b, 4) - Math.pow(a, 4)) / 4, label: 'f(x) = x³', ymax: 8 },
    { f: x => Math.sqrt(Math.max(0, x)), integral: (a, b) => (2/3) * (Math.pow(Math.max(0, b), 1.5) - Math.pow(Math.max(0, a), 1.5)), label: 'f(x) = √x', ymax: 3 }
  ];

  let fi = 0;
  let n = 4;
  let a = 0, b = 2;
  let rMode = 0;
  let animId = null;

  const X_MIN = -3.5, X_MAX = 3.5;

  function getYMax() { return FUNCS[fi].ymax; }

  function w2s(x, y) {
    const ymax = getYMax();
    return {
      x: ((x - X_MIN) / (X_MAX - X_MIN)) * W,
      y: H - ((y + 1) / (ymax + 1)) * H
    };
  }

  function computeSum() {
    const fn = FUNCS[fi];
    const dx = (b - a) / n;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      let xi;
      if (rMode === 0) xi = a + i * dx;
      else if (rMode === 1) xi = a + (i + 0.5) * dx;
      else xi = a + (i + 1) * dx;
      sum += fn.f(xi) * dx;
    }
    return sum;
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
      const p1 = w2s(x, -1), p2 = w2s(x, getYMax());
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
    }
    for (let y = 0; y <= Math.ceil(getYMax()); y++) {
      const p1 = w2s(X_MIN, y), p2 = w2s(X_MAX, y);
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = 'rgba(148,163,184,0.4)';
    ctx.lineWidth = 1.5;
    const ox = w2s(0, 0);
    ctx.beginPath(); ctx.moveTo(0, ox.y); ctx.lineTo(W, ox.y); ctx.stroke();
    if (ox.x > 0 && ox.x < W) { ctx.beginPath(); ctx.moveTo(ox.x, 0); ctx.lineTo(ox.x, H); ctx.stroke(); }

    const fn = FUNCS[fi];
    const dx = (b - a) / n;

    // Rectangles
    const rFill = 'rgba(16,185,129,0.35)';
    const rStroke = 'rgba(16,185,129,0.9)';
    for (let i = 0; i < n; i++) {
      let xi;
      if (rMode === 0) xi = a + i * dx;
      else if (rMode === 1) xi = a + (i + 0.5) * dx;
      else xi = a + (i + 1) * dx;
      const y = fn.f(xi);
      if (y < 0) continue;
      const xL = a + i * dx;
      const xR = a + (i + 1) * dx;
      const p1 = w2s(xL, 0);
      const p2 = w2s(xR, y);
      const rectW = p2.x - p1.x;
      const rectH = p1.y - p2.y;
      ctx.fillStyle = rFill;
      ctx.fillRect(p1.x, p2.y, rectW, rectH);
      ctx.strokeStyle = rStroke;
      ctx.lineWidth = 1;
      ctx.strokeRect(p1.x, p2.y, rectW, rectH);
    }

    // Curve
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    const steps = 300;
    for (let i = 0; i <= steps; i++) {
      const x = X_MIN + (i / steps) * (X_MAX - X_MIN);
      const y = fn.f(x);
      if (y < -1 || y > getYMax() + 0.5) continue;
      const p = w2s(x, y);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();

    // a, b markers
    const pa = w2s(a, -1); const pb = w2s(b, -1);
    ctx.strokeStyle = 'rgba(251,191,36,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pa.x, pa.y - 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pb.x, pb.y); ctx.lineTo(pb.x, pb.y - 8); ctx.stroke();
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('a', pa.x, pa.y + 10);
    ctx.fillText('b', pb.x, pb.y + 10);

    // Formula
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(fn.label, W / 2, 20);
  }

  function loop() { draw(); animId = requestAnimationFrame(loop); }

  function update() {
    const sum = computeSum();
    const fn = FUNCS[fi];
    const exact = fn.integral(a, b);
    wrap.querySelector('#rSum').textContent = sum.toFixed(4);
    wrap.querySelector('#rExact').textContent = exact.toFixed(4);
    wrap.querySelector('#nV').textContent = n;
    wrap.querySelector('#aV').textContent = a.toFixed(1);
    wrap.querySelector('#bV').textContent = b.toFixed(1);
  }

  wrap.querySelector('#nSlider').addEventListener('input', e => { n = parseInt(e.target.value); update(); });
  wrap.querySelector('#aSlider').addEventListener('input', e => { a = parseFloat(e.target.value); if (a >= b) b = a + 0.1; update(); });
  wrap.querySelector('#bSlider').addEventListener('input', e => { b = parseFloat(e.target.value); if (b <= a) a = b - 0.1; update(); });

  wrap.querySelectorAll('.rmode').forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      rMode = idx;
      wrap.querySelectorAll('.rmode').forEach((b2, i) => {
        const on = i === idx;
        b2.classList.toggle('bg-emerald-500/20', on);
        b2.classList.toggle('border-emerald-500/40', on);
        b2.classList.toggle('text-emerald-300', on);
        b2.classList.toggle('bg-white/5', !on);
        b2.classList.toggle('border-white/10', !on);
        b2.classList.toggle('text-slate-300', !on);
      });
      update();
    });
  });

  wrap.querySelectorAll('.fbtn').forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      fi = idx;
      wrap.querySelectorAll('.fbtn').forEach((b2, i) => {
        const on = i === idx;
        b2.classList.toggle('bg-emerald-500/20', on);
        b2.classList.toggle('border-emerald-500/40', on);
        b2.classList.toggle('text-emerald-300', on);
        b2.classList.toggle('bg-white/5', !on);
        b2.classList.toggle('border-white/10', !on);
        b2.classList.toggle('text-slate-300', !on);
      });
      update();
    });
  });

  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    n = 4; a = 0; b = 2;
    wrap.querySelector('#nSlider').value = 4;
    wrap.querySelector('#aSlider').value = 0;
    wrap.querySelector('#bSlider').value = 2;
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
