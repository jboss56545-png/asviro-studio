export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">Molar Conductivity</div><div class="text-[9px] text-slate-500 truncate">Class 12 Chem - Ch 2</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Λm</div>
        <div class="text-[10px] font-black text-emerald-300" id="rL">0</div>
      </div>
      <div class="absolute top-2 right-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Type</div>
        <div class="text-[10px] font-black text-cyan-300" id="rT">Strong</div>
      </div>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 max-h-[40vh] overflow-y-auto space-y-2" style="backdrop-filter:blur(20px);">
      <div class="grid grid-cols-2 gap-1.5">
        <button type="button" class="ttog py-2 rounded-xl text-[10px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300" data-t="0">Strong (KCl)</button>
        <button type="button" class="ttog py-2 rounded-xl text-[10px] font-bold bg-white/5 border border-white/10 text-slate-300" data-t="1">Weak (CH₃COOH)</button>
      </div>
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-amber-400 uppercase">Conc (M)</label><span class="text-[11px] font-black text-amber-400" id="cV">0.10</span></div>
        <input type="range" id="cSlider" min="0.001" max="1" step="0.001" value="0.1" class="w-full accent-amber-500">
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[9px] text-slate-400 leading-relaxed">
        <b class="text-emerald-400">Strong:</b> Λm vs √c linear, slight decrease. <b class="text-amber-400">Weak:</b> Λm very low, sharp increase on dilution (dissociation α↑).
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

  let type = 0, conc = 0.1;
  let animId = null, phase = 0;

  function computeLm() {
    if (type === 0) return 150 - 95 * Math.sqrt(conc);
    return 390 * Math.sqrt(conc / 0.1) * (0.3 + 0.7 * Math.sqrt(conc / 1));
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#0f172a'); bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const pad = 40;
    const chartX = pad + 20, chartY = pad, chartW = W - chartX - pad, chartH = H - chartY - pad - 30;
    const maxL = 200;

    ctx.strokeStyle = 'rgba(148,163,184,0.08)'; ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const px = chartX + (i / 10) * chartW;
      ctx.beginPath(); ctx.moveTo(px, chartY); ctx.lineTo(px, chartY + chartH); ctx.stroke();
      const py = chartY + (i / 10) * chartH;
      ctx.beginPath(); ctx.moveTo(chartX, py); ctx.lineTo(chartX + chartW, py); ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(148,163,184,0.5)'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(chartX, chartY); ctx.lineTo(chartX, chartY + chartH);
    ctx.lineTo(chartX + chartW, chartY + chartH);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('√c →', chartX + chartW / 2, chartY + chartH + 22);
    ctx.save();
    ctx.translate(chartX - 25, chartY + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Λm →', 0, 0);
    ctx.restore();

    // Draw curve
    ctx.strokeStyle = type === 0 ? '#10b981' : '#fbbf24'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= 100; i++) {
      const c = i / 100;
      let lm;
      if (type === 0) lm = 150 - 95 * Math.sqrt(c);
      else lm = 390 * Math.sqrt(c / 0.1) * (0.3 + 0.7 * Math.sqrt(c / 1));
      const px = chartX + c * chartW;
      const py = chartY + chartH - (Math.min(maxL, lm) / maxL) * chartH;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Current
    const lmNow = computeLm();
    const px = chartX + conc * chartW;
    const py = chartY + chartH - (Math.min(maxL, lmNow) / maxL) * chartH;
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(type === 0 ? 'Strong electrolyte' : 'Weak electrolyte', chartX + 10, chartY + 15);
  }

  function loop() { phase += 0.02; draw(); animId = requestAnimationFrame(loop); }

  function update() {
    wrap.querySelector('#rL').textContent = computeLm().toFixed(1);
    wrap.querySelector('#rT').textContent = type === 0 ? 'Strong' : 'Weak';
    wrap.querySelector('#cV').textContent = conc.toFixed(3);
  }

  wrap.querySelectorAll('.ttog').forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      type = idx;
      wrap.querySelectorAll('.ttog').forEach((b, i) => {
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
  wrap.querySelector('#cSlider').addEventListener('input', e => { conc = parseFloat(e.target.value); update(); });
  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    type = 0; conc = 0.1;
    wrap.querySelector('#cSlider').value = 0.1;
    wrap.querySelectorAll('.ttog').forEach((b, i) => {
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
