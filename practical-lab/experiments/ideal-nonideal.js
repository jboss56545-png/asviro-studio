export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">Ideal vs Non-Ideal</div><div class="text-[9px] text-slate-500 truncate">Class 12 Chem - Ch 1</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 space-y-2.5" style="backdrop-filter:blur(20px);">
      <div class="grid grid-cols-2 gap-1.5">
        <button type="button" class="mtog py-2.5 rounded-xl text-[10px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300" data-m="0">Ideal</button>
        <button type="button" class="mtog py-2.5 rounded-xl text-[10px] font-bold bg-white/5 border border-white/10 text-slate-300" data-m="1">Non-Ideal</button>
      </div>
      <div class="grid grid-cols-2 gap-1.5">
        <button type="button" class="ntog py-2 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300" data-n="pos">+ Deviation</button>
        <button type="button" class="ntog py-2 rounded-xl text-[9px] font-bold bg-white/5 border border-white/10 text-slate-300" data-n="neg">− Deviation</button>
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[9px] text-slate-400 leading-relaxed" id="infoBox">
        <b class="text-emerald-400">Ideal Solution:</b> Follows Raoult's law. ΔH<sub>mix</sub> = 0, ΔV<sub>mix</sub> = 0. A-B interactions = A-A = B-B. Example: Benzene + Toluene.
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

  let mode = 0;       // 0 = ideal, 1 = non-ideal
  let type = 'pos';   // 'pos' or 'neg'
  let animId = null;

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#0f172a'); bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const gx = 60, gy = 40, gw = W - 120, gh = H - 100;

    // Grid
    ctx.strokeStyle = 'rgba(148,163,184,0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const px = gx + (i / 10) * gw;
      ctx.beginPath(); ctx.moveTo(px, gy); ctx.lineTo(px, gy + gh); ctx.stroke();
    }
    for (let i = 0; i <= 10; i++) {
      const py = gy + (i / 10) * gh;
      ctx.beginPath(); ctx.moveTo(gx, py); ctx.lineTo(gx + gw, py); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = 'rgba(148,163,184,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + gh); ctx.lineTo(gx + gw, gy + gh);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('x(B) →', gx + gw / 2, gy + gh + 25);
    ctx.save();
    ctx.translate(gx - 25, gy + gh / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Vapour Pressure →', 0, 0);
    ctx.restore();

    // P(A) line — straight from P°(A) to 0
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(gx, gy + gh - 0.8 * gh);
    ctx.lineTo(gx + gw, gy + gh - 0.2 * gh);
    ctx.stroke();

    // P(B) line — straight from 0.3 to 0
    ctx.strokeStyle = '#fb7185';
    ctx.beginPath();
    ctx.moveTo(gx, gy + gh - 0.3 * gh);
    ctx.lineTo(gx + gw, gy + gh - 0.9 * gh);
    ctx.stroke();

    // Total line — varies based on mode
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const xB = i / 40;
      const paVal = (1 - xB) * 0.8; // pa at xA = 1-xB
      const pbVal = xB * 0.9;
      let total = paVal + pbVal;
      // Ideal: linear interpolation
      // Non-ideal pos dev: above
      // Non-ideal neg dev: below
      if (mode === 1) {
        if (type === 'pos') {
          // positive deviation: higher than ideal
          const ideal = (1 - xB) * 0.8 + xB * 0.9;
          total = ideal + Math.sin(xB * Math.PI) * 0.25;
        } else {
          const ideal = (1 - xB) * 0.8 + xB * 0.9;
          total = ideal - Math.sin(xB * Math.PI) * 0.25;
        }
      }
      const px = gx + xB * gw;
      const py = gy + gh - total * gh * 0.65;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Labels
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#22d3ee';
    ctx.fillText('P(A)', gx + 8, gy + gh - 0.8 * gh - 8);
    ctx.fillStyle = '#fb7185';
    ctx.fillText('P(B)', gx + gw - 30, gy + gh - 0.9 * gh - 8);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#fbbf24';
    let totalLabel = 'Total = P(A)+P(B)';
    if (mode === 1 && type === 'pos') totalLabel = 'Total (positive deviation)';
    else if (mode === 1 && type === 'neg') totalLabel = 'Total (negative deviation)';
    ctx.fillText(totalLabel, gx + gw, gy + 15);
  }

  function loop() { draw(); animId = requestAnimationFrame(loop); }

  function setMode(m) {
    mode = m;
    wrap.querySelectorAll('.mtog').forEach((b, i) => {
      const on = i === m;
      b.classList.toggle('bg-emerald-500/20', on);
      b.classList.toggle('border-emerald-500/40', on);
      b.classList.toggle('text-emerald-300', on);
      b.classList.toggle('bg-white/5', !on);
      b.classList.toggle('border-white/10', !on);
      b.classList.toggle('text-slate-300', !on);
    });
    // hide/show n buttons
    const nBtns = wrap.querySelectorAll('.ntog');
    nBtns.forEach(b => b.style.display = m === 1 ? '' : 'none');
    updateInfo();
  }
  function setType(t) {
    type = t;
    wrap.querySelectorAll('.ntog').forEach(b => {
      const on = b.dataset.n === t;
      b.classList.toggle('bg-emerald-500/20', on);
      b.classList.toggle('border-emerald-500/40', on);
      b.classList.toggle('text-emerald-300', on);
      b.classList.toggle('bg-white/5', !on);
      b.classList.toggle('border-white/10', !on);
      b.classList.toggle('text-slate-300', !on);
    });
    updateInfo();
  }
  function updateInfo() {
    const box = wrap.querySelector('#infoBox');
    if (mode === 0) {
      box.innerHTML = '<b class="text-emerald-400">Ideal Solution:</b> Follows Raoult\'s law. ΔH<sub>mix</sub> = 0, ΔV<sub>mix</sub> = 0. A-B interactions = A-A = B-B. Example: Benzene + Toluene.';
    } else if (type === 'pos') {
      box.innerHTML = '<b class="text-emerald-400">Positive Deviation:</b> A-B interactions <b>weaker</b> than A-A / B-B. Vapour pressure <b>higher</b> than expected. ΔH<sub>mix</sub> > 0 (endothermic). Example: Ethanol + Acetone, Ethanol + Water.';
    } else {
      box.innerHTML = '<b class="text-emerald-400">Negative Deviation:</b> A-B interactions <b>stronger</b> than A-A / B-B. Vapour pressure <b>lower</b> than expected. ΔH<sub>mix</sub> < 0 (exothermic). Example: Chloroform + Acetone, HNO₃ + Water.';
    }
  }

  wrap.querySelectorAll('.mtog').forEach(b => {
    b.addEventListener('click', () => setMode(parseInt(b.dataset.m, 10)));
  });
  wrap.querySelectorAll('.ntog').forEach(b => {
    b.addEventListener('click', () => setType(b.dataset.n));
  });

  wrap.querySelector('.reset-btn').addEventListener('click', () => { setMode(0); setType('pos'); });
  wrap.querySelector('.back-btn').addEventListener('click', () => window.goBack());

  let ro = null;
  if ('ResizeObserver' in window) { ro = new ResizeObserver(resize); ro.observe(canvas); }
  resize();
  setMode(0);
  animId = requestAnimationFrame(loop);

  return function cleanup() {
    if (animId) cancelAnimationFrame(animId);
    if (ro) ro.disconnect();
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    document.body.style.overflow = prevOverflow;
  };
}
