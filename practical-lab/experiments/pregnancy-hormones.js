export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">Pregnancy Hormones</div><div class="text-[9px] text-slate-500 truncate">Class 12 Bio - Ch 2</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Week</div>
        <div class="text-[10px] font-black text-pink-300" id="rWeek">4</div>
      </div>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 space-y-2" style="backdrop-filter:blur(20px);">
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-pink-400 uppercase">Week of pregnancy</label><span class="text-[11px] font-black text-pink-400" id="wV">Week 4</span></div>
        <input type="range" id="wSlider" min="1" max="40" step="1" value="4" class="w-full accent-pink-500">
      </div>
      <div class="grid grid-cols-2 gap-1.5">
        <button type="button" class="tog tog-hcg py-2 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">hCG</button>
        <button type="button" class="tog tog-prog py-2 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">Progesterone</button>
        <button type="button" class="tog tog-estro py-2 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">Estrogen</button>
        <button type="button" class="tog tog-hpl py-2 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">hPL</button>
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[9px] text-slate-400 leading-relaxed">
        <b class="text-pink-400">Key Hormones:</b> <span class="text-emerald-400">hCG</span> (maintains corpus luteum) peaks at week 8-10, then falls. <span class="text-purple-400">Progesterone</span> stays high throughout. <span class="text-amber-400">Estrogen</span> rises continuously. <span class="text-cyan-400">hPL</span> (human placental lactogen) rises in 2nd/3rd trimester.
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

  let week = 4;
  let showHCG = true, showProg = true, showEstro = true, showHPL = true;
  let animId = null, phase = 0;

  // Hormone curves — realistic Gaussian patterns
  function hCG(w) { return 100 * Math.exp(-Math.pow((w - 9) / 3.5, 2)); }
  function progesterone(w) { return 20 + 70 * (1 / (1 + Math.exp(-(w - 10) * 0.5))); }
  function estrogen(w) { return 15 + 85 * (1 / (1 + Math.exp(-(w - 22) * 0.3))); }
  function hPL(w) { return 5 + 60 * (1 / (1 + Math.exp(-(w - 25) * 0.4))); }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#1e1b2e'); bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const pad = 40;
    const chartX = pad + 15, chartY = pad - 10;
    const chartW = W - chartX - pad, chartH = H - chartY - pad - 20;
    const maxV = 120;

    // Trimester backgrounds
    const trimesters = [
      { s: 1, e: 13, c: 'rgba(244,63,94,0.06)', label: '1st Trimester' },
      { s: 14, e: 27, c: 'rgba(34,211,238,0.06)', label: '2nd' },
      { s: 28, e: 40, c: 'rgba(168,85,247,0.06)', label: '3rd' }
    ];
    trimesters.forEach(tr => {
      const x1 = chartX + ((tr.s - 1) / 39) * chartW;
      const x2 = chartX + ((tr.e - 1) / 39) * chartW;
      ctx.fillStyle = tr.c;
      ctx.fillRect(x1, chartY, x2 - x1, chartH);
      ctx.fillStyle = 'rgba(148,163,184,0.6)';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(tr.label, (x1 + x2) / 2, chartY + 3);
    });

    // Grid
    ctx.strokeStyle = 'rgba(148,163,184,0.06)';
    ctx.lineWidth = 1;
    for (let w = 1; w <= 40; w += 4) {
      const x = chartX + ((w - 1) / 39) * chartW;
      ctx.beginPath(); ctx.moveTo(x, chartY); ctx.lineTo(x, chartY + chartH); ctx.stroke();
    }
    for (let v = 0; v <= maxV; v += 30) {
      const y = chartY + chartH - (v / maxV) * chartH;
      ctx.beginPath(); ctx.moveTo(chartX, y); ctx.lineTo(chartX + chartW, y); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = 'rgba(148,163,184,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(chartX, chartY); ctx.lineTo(chartX, chartY + chartH);
    ctx.lineTo(chartX + chartW, chartY + chartH);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let w = 4; w <= 40; w += 8) {
      const x = chartX + ((w - 1) / 39) * chartW;
      ctx.fillText('W' + w, x, chartY + chartH + 5);
    }
    ctx.save();
    ctx.translate(chartX - 25, chartY + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textBaseline = 'middle';
    ctx.fillText('Level →', 0, 0);
    ctx.restore();

    // Curves
    const curves = [
      { fn: hCG, color: '#10b981', show: showHCG, label: 'hCG' },
      { fn: progesterone, color: '#a855f7', show: showProg, label: 'Progesterone' },
      { fn: estrogen, color: '#f59e0b', show: showEstro, label: 'Estrogen' },
      { fn: hPL, color: '#22d3ee', show: showHPL, label: 'hPL' }
    ];

    curves.forEach(c => {
      if (!c.show) return;
      ctx.strokeStyle = c.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let w = 1; w <= 40; w += 0.3) {
        const x = chartX + ((w - 1) / 39) * chartW;
        const y = chartY + chartH - (Math.min(maxV, c.fn(w)) / maxV) * chartH;
        if (w === 1) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });

    // Current week marker
    const cx = chartX + ((week - 1) / 39) * chartW;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(cx, chartY); ctx.lineTo(cx, chartY + chartH);
    ctx.stroke();
    ctx.setLineDash([]);
    // Marker dot
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(cx, chartY - 14, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(week), cx, chartY - 14);

    // Legend
    let lx = pad;
    let ly = H - 15;
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    curves.forEach(c => {
      if (!c.show) return;
      ctx.fillStyle = c.color;
      ctx.beginPath(); ctx.arc(lx + 4, ly, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(c.label, lx + 10, ly);
      lx += 60;
    });
  }

  function loop() { phase += 0.02; draw(); animId = requestAnimationFrame(loop); }

  function update() {
    wrap.querySelector('#rWeek').textContent = week;
    wrap.querySelector('#wV').textContent = 'Week ' + week;
  }

  wrap.querySelector('#wSlider').addEventListener('input', e => { week = parseInt(e.target.value, 10); update(); });

  function setTog(sel, on, setter) {
    const b = wrap.querySelector(sel);
    b.classList.toggle('bg-emerald-500/20', on);
    b.classList.toggle('border-emerald-500/40', on);
    b.classList.toggle('text-emerald-300', on);
    b.classList.toggle('bg-white/5', !on);
    b.classList.toggle('border-white/10', !on);
    b.classList.toggle('text-slate-300', !on);
  }
  wrap.querySelector('.tog-hcg').addEventListener('click', () => { showHCG = !showHCG; setTog('.tog-hcg', showHCG); });
  wrap.querySelector('.tog-prog').addEventListener('click', () => { showProg = !showProg; setTog('.tog-prog', showProg); });
  wrap.querySelector('.tog-estro').addEventListener('click', () => { showEstro = !showEstro; setTog('.tog-estro', showEstro); });
  wrap.querySelector('.tog-hpl').addEventListener('click', () => { showHPL = !showHPL; setTog('.tog-hpl', showHPL); });

  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    week = 4;
    wrap.querySelector('#wSlider').value = 4;
    showHCG = showProg = showEstro = showHPL = true;
    setTog('.tog-hcg', true); setTog('.tog-prog', true); setTog('.tog-estro', true); setTog('.tog-hpl', true);
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
