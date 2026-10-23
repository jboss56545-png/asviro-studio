export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">Electrochemical Series</div><div class="text-[9px] text-slate-500 truncate">Class 12 Chem - Ch 2</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Cell EMF</div>
        <div class="text-[10px] font-black text-emerald-300" id="rEMF">0.00 V</div>
      </div>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 max-h-[42vh] overflow-y-auto space-y-2" style="backdrop-filter:blur(20px);">
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-emerald-400 uppercase">Cathode (higher E°)</label><span class="text-[11px] font-black text-emerald-400" id="cathName">Cu²⁺/Cu</span></div>
        <input type="range" id="cathSlider" min="0" max="9" step="1" value="6" class="w-full accent-emerald-500">
      </div>
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-cyan-400 uppercase">Anode (lower E°)</label><span class="text-[11px] font-black text-cyan-400" id="anodeName">Zn²⁺/Zn</span></div>
        <input type="range" id="anodeSlider" min="0" max="9" step="1" value="2" class="w-full accent-cyan-500">
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[9px] text-slate-400 leading-relaxed">
        <b class="text-emerald-400">EMF = E°(cathode) − E°(anode).</b> Zyada positive E° = strong oxidant, easily reduced. Lithium pe top (most reactive), gold pe bottom (least reactive).
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

  const SERIES = [
    { ion: 'Li⁺/Li', E: -3.04, color: '#dc2626' },
    { ion: 'K⁺/K', E: -2.93, color: '#ea580c' },
    { ion: 'Ca²⁺/Ca', E: -2.87, color: '#f59e0b' },
    { ion: 'Na⁺/Na', E: -2.71, color: '#eab308' },
    { ion: 'Mg²⁺/Mg', E: -2.37, color: '#84cc16' },
    { ion: 'Zn²⁺/Zn', E: -0.76, color: '#22c55e' },
    { ion: 'Fe²⁺/Fe', E: -0.44, color: '#10b981' },
    { ion: 'Cu²⁺/Cu', E: 0.34, color: '#14b8a6' },
    { ion: 'Ag⁺/Ag', E: 0.80, color: '#0ea5e9' },
    { ion: 'Au³⁺/Au', E: 1.50, color: '#a855f7' }
  ];

  let cath = 6, anode = 5;
  let animId = null, phase = 0;

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#0f172a'); bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const chartX = 60;
    const chartY = 40;
    const chartW = W - chartX - 30;
    const chartH = H - 80;
    const rowH = chartH / SERIES.length;

    // Axis
    ctx.strokeStyle = 'rgba(148,163,184,0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(chartX, chartY);
    ctx.lineTo(chartX, chartY + chartH);
    ctx.stroke();
    // Zero line
    ctx.strokeStyle = 'rgba(148,163,184,0.35)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    const zeroY = chartY + chartH / 2;
    ctx.moveTo(chartX, zeroY);
    ctx.lineTo(chartX + chartW, zeroY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Bars
    SERIES.forEach((s, i) => {
      const y = chartY + i * rowH + rowH * 0.5;
      const barH = rowH * 0.7;
      const pct = (s.E + 3.5) / 5.5; // -3.5 to +2
      const barW = chartW * pct;
      const barColor = s.color;
      // Bar
      ctx.fillStyle = barColor + '55';
      ctx.fillRect(chartX, y - barH / 2, barW, barH);
      ctx.strokeStyle = barColor;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(chartX, y - barH / 2, barW, barH);

      // Ion name
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(s.ion, chartX - 6, y);

      // E value
      ctx.fillStyle = barColor;
      ctx.textAlign = 'left';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText(s.E.toFixed(2) + ' V', chartX + barW + 6, y);

      // Highlight cathode/anode
      if (i === cath) {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.strokeRect(chartX - 2, y - barH / 2 - 1, barW + 4, barH + 2);
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('CATHODE', chartX + barW + 50, y);
      }
      if (i === anode) {
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 3;
        ctx.strokeRect(chartX - 2, y - barH / 2 - 1, barW + 4, barH + 2);
        ctx.fillStyle = '#22d3ee';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('ANODE', chartX + barW + 50, y);
      }
    });

    // Zero label
    ctx.fillStyle = 'rgba(148,163,184,0.6)';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('E° = 0 (SHE)', chartX + chartW * 0.5, zeroY - 8);
  }

  function loop() { phase += 0.02; draw(); animId = requestAnimationFrame(loop); }

  function update() {
    const emf = SERIES[cath].E - SERIES[anode].E;
    wrap.querySelector('#rEMF').textContent = Math.max(0, emf).toFixed(2) + ' V';
    wrap.querySelector('#cathName').textContent = SERIES[cath].ion;
    wrap.querySelector('#anodeName').textContent = SERIES[anode].ion;
  }

  wrap.querySelector('#cathSlider').addEventListener('input', e => {
    cath = parseInt(e.target.value, 10);
    if (cath === anode) anode = (cath + 1) % SERIES.length;
    wrap.querySelector('#anodeSlider').value = anode;
    update();
  });
  wrap.querySelector('#anodeSlider').addEventListener('input', e => {
    anode = parseInt(e.target.value, 10);
    if (anode === cath) cath = (anode + 1) % SERIES.length;
    wrap.querySelector('#cathSlider').value = cath;
    update();
  });
  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    cath = 6; anode = 5;
    wrap.querySelector('#cathSlider').value = 6;
    wrap.querySelector('#anodeSlider').value = 5;
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
