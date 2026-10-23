export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">Inverse Functions</div><div class="text-[9px] text-slate-500 truncate">Class 12 Math - Ch 1</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2.5 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">f(x)</div>
        <div class="text-[11px] font-black text-emerald-300" id="rFx">0</div>
      </div>
      <div class="absolute top-2 right-2 bg-white/10 border border-white/10 rounded-xl px-2.5 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">f⁻¹(x)</div>
        <div class="text-[11px] font-black text-cyan-300" id="rGx">0</div>
      </div>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 space-y-2.5" style="backdrop-filter:blur(20px);">
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-emerald-400 uppercase">Input x</label><span class="text-[11px] font-black text-emerald-400" id="xV">2.0</span></div>
        <input type="range" id="xSlider" min="-4" max="4" step="0.1" value="2" class="w-full accent-emerald-500">
      </div>
      <div class="grid grid-cols-3 gap-1.5">
        <button type="button" class="ftog py-2 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300" data-f="0">x + 1</button>
        <button type="button" class="ftog py-2 rounded-xl text-[9px] font-bold bg-white/5 border border-white/10 text-slate-300" data-f="1">2x</button>
        <button type="button" class="ftog py-2 rounded-xl text-[9px] font-bold bg-white/5 border border-white/10 text-slate-300" data-f="2">x³</button>
      </div>
      <div class="grid grid-cols-2 gap-1.5">
        <div class="bg-white/5 rounded-xl p-2 border border-white/10">
          <div class="text-[8px] text-slate-500 uppercase font-bold">f⁻¹(f(x))</div>
          <div class="text-xs font-black text-amber-300" id="rRound">0</div>
        </div>
        <div class="bg-white/5 rounded-xl p-2 border border-white/10">
          <div class="text-[8px] text-slate-500 uppercase font-bold">f(f⁻¹(x))</div>
          <div class="text-xs font-black text-amber-300" id="rRound2">0</div>
        </div>
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[9px] text-slate-400 leading-relaxed">
        <b class="text-emerald-400">Inverse:</b> f⁻¹ reverses f. f(f⁻¹(x)) = f⁻¹(f(x)) = x. Graph mein f aur f⁻¹ line y = x pe mirror images hote hain.
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
    { f: x => x + 1, fp: x => x - 1, label: 'f(x) = x + 1', inv: 'f⁻¹(x) = x − 1' },
    { f: x => 2 * x, fp: x => x / 2, label: 'f(x) = 2x', inv: 'f⁻¹(x) = x/2' },
    { f: x => x * x * x, fp: x => Math.cbrt(x), label: 'f(x) = x³', inv: 'f⁻¹(x) = ∛x' }
  ];

  let fi = 0;
  let xVal = 2;
  let animId = null;

  const RANGE = 4;

  function w2s(x, y) {
    const scale = Math.min(W, H) / (RANGE * 2.4);
    return { x: W/2 + x * scale, y: H/2 - y * scale };
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#0f172a'); bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Grid
    const scale = Math.min(W, H) / (RANGE * 2.4);
    ctx.strokeStyle = 'rgba(148,163,184,0.08)';
    ctx.lineWidth = 1;
    for (let i = -RANGE; i <= RANGE; i++) {
      const p1 = w2s(i, -RANGE), p2 = w2s(i, RANGE);
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
      const q1 = w2s(-RANGE, i), q2 = w2s(RANGE, i);
      ctx.beginPath(); ctx.moveTo(q1.x, q1.y); ctx.lineTo(q2.x, q2.y); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = 'rgba(148,163,184,0.4)';
    ctx.lineWidth = 1.5;
    const o = w2s(0, 0);
    ctx.beginPath(); ctx.moveTo(o.x - RANGE * scale, o.y); ctx.lineTo(o.x + RANGE * scale, o.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(o.x, o.y - RANGE * scale); ctx.lineTo(o.x, o.y + RANGE * scale); ctx.stroke();

    // y = x line (dashed)
    ctx.strokeStyle = 'rgba(148,163,184,0.35)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    const p1 = w2s(-RANGE, -RANGE), p2 = w2s(RANGE, RANGE);
    ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(148,163,184,0.5)';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const yLinePos = w2s(RANGE - 0.5, RANGE - 0.5);
    ctx.fillText('y = x', yLinePos.x + 5, yLinePos.y - 8);

    const fn = FUNCS[fi];

    // Draw f(x) in emerald
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    const steps = 200;
    for (let i = 0; i <= steps; i++) {
      const x = -RANGE + (i / steps) * (RANGE * 2);
      const y = fn.f(x);
      if (y < -RANGE || y > RANGE) continue;
      const p = w2s(x, y);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();

    // Draw f⁻¹(x) in cyan
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const x = -RANGE + (i / steps) * (RANGE * 2);
      const y = fn.fp(x);
      if (y < -RANGE || y > RANGE) continue;
      const p = w2s(x, y);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();

    // Current point on f
    const yF = fn.f(xVal);
    if (yF >= -RANGE && yF <= RANGE) {
      const pF = w2s(xVal, yF);
      ctx.fillStyle = '#10b981';
      ctx.beginPath(); ctx.arc(pF.x, pF.y, 6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke();

      // Point on f⁻¹
      const pInv = w2s(yF, xVal);
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath(); ctx.arc(pInv.x, pInv.y, 6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke();

      // Mirror connector (dashed perpendicular to y=x)
      ctx.strokeStyle = 'rgba(251,191,36,0.5)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(pF.x, pF.y); ctx.lineTo(pInv.x, pInv.y); ctx.stroke();
      ctx.setLineDash([]);
    }

    // Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#10b981';
    ctx.fillText(fn.label, W * 0.25, 20);
    ctx.fillStyle = '#22d3ee';
    ctx.fillText(fn.inv, W * 0.75, 20);
  }

  function loop() { draw(); animId = requestAnimationFrame(loop); }

  function update() {
    const fn = FUNCS[fi];
    const y = fn.f(xVal);
    wrap.querySelector('#rFx').textContent = y.toFixed(2);
    wrap.querySelector('#rGx').textContent = fn.fp(xVal).toFixed(2);
    wrap.querySelector('#xV').textContent = xVal.toFixed(1);
    // Verify
    const roundTrip = fn.fp(fn.f(xVal));
    const roundTrip2 = fn.f(fn.fp(xVal));
    wrap.querySelector('#rRound').textContent = roundTrip.toFixed(2);
    wrap.querySelector('#rRound2').textContent = roundTrip2.toFixed(2);
  }

  wrap.querySelector('#xSlider').addEventListener('input', e => { xVal = parseFloat(e.target.value); update(); });

  wrap.querySelectorAll('.ftog').forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      fi = idx;
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
    xVal = 2; fi = 0;
    wrap.querySelector('#xSlider').value = 2;
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
