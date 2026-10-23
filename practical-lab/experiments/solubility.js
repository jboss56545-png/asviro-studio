export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">Solubility Explorer</div><div class="text-[9px] text-slate-500 truncate">Class 12 Chem - Ch 1</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2.5 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Temp</div>
        <div class="text-[11px] font-black text-amber-300" id="rTemp">25 °C</div>
      </div>
      <div class="absolute top-2 right-2 bg-white/10 border border-white/10 rounded-xl px-2.5 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Dissolved</div>
        <div class="text-[11px] font-black text-cyan-300" id="rDis">0 g</div>
      </div>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 space-y-2.5" style="backdrop-filter:blur(20px);">
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-amber-400 uppercase">Temperature (°C)</label><span class="text-[11px] font-black text-amber-400" id="tV">25</span></div>
        <input type="range" id="temp" min="0" max="100" step="1" value="25" class="w-full accent-amber-500">
      </div>
      <div class="grid grid-cols-3 gap-1.5">
        <button type="button" class="mtog py-2 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300" data-m="0">KNO₃</button>
        <button type="button" class="mtog py-2 rounded-xl text-[9px] font-bold bg-white/5 border border-white/10 text-slate-300" data-m="1">NaCl</button>
        <button type="button" class="mtog py-2 rounded-xl text-[9px] font-bold bg-white/5 border border-white/10 text-slate-300" data-m="2">Ce₂(SO₄)₃</button>
      </div>
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-cyan-400 uppercase">Add solute (g)</label><span class="text-[11px] font-black text-cyan-400" id="addV">0</span></div>
        <input type="range" id="add" min="0" max="150" step="1" value="0" class="w-full accent-cyan-500">
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[9px] text-slate-400 leading-relaxed">
        <b class="text-emerald-400">Solubility:</b> Max solute that dissolves at given temperature. Excess → saturated solution with precipitate at bottom. <b class="text-amber-400">Most solids: ↑ temp = ↑ solubility</b> (KNO₃). Some decrease (Ce₂(SO₄)₃).
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

  let temp = 25, solute = 0, mode = 0;
  let animId = null, phase = 0;

  // Solubility curves (g per 100g water)
  function solubilityAt(t) {
    if (mode === 0) return 20 + Math.pow(t, 1.6) * 0.045 * 60; // KNO3 sharp increase
    if (mode === 1) return 35 + t * 0.02 * 5; // NaCl nearly flat
    return 60 - t * 0.5; // Ce2(SO4)3 decreases
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#0f172a'); bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Graph on right side
    const gx = W * 0.55, gy = H * 0.1, gw = W * 0.38, gh = H * 0.75;

    // Grid
    ctx.strokeStyle = 'rgba(148,163,184,0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const px = gx + (i / 5) * gw;
      ctx.beginPath(); ctx.moveTo(px, gy); ctx.lineTo(px, gy + gh); ctx.stroke();
      const py = gy + (i / 5) * gh;
      ctx.beginPath(); ctx.moveTo(gx, py); ctx.lineTo(gx + gw, py); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = 'rgba(148,163,184,0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + gh); ctx.lineTo(gx + gw, gy + gh);
    ctx.stroke();

    // Draw all 3 curves faintly
    const colors = ['#10b981', '#fbbf24', '#a855f7'];
    for (let mm = 0; mm < 3; mm++) {
      ctx.strokeStyle = mm === mode ? colors[mm] : 'rgba(100,116,139,0.25)';
      ctx.lineWidth = mm === mode ? 2.5 : 1;
      ctx.beginPath();
      for (let i = 0; i <= 100; i++) {
        const t = i;
        let s;
        if (mm === 0) s = 20 + Math.pow(t, 1.6) * 0.045 * 60;
        else if (mm === 1) s = 35 + t * 0.02 * 5;
        else s = 60 - t * 0.5;
        const px = gx + (t / 100) * gw;
        const py = gy + gh - (s / 100) * gh;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Current point on curve
    const sNow = solubilityAt(temp);
    const px = gx + (temp / 100) * gw;
    const py = gy + gh - (Math.max(0, Math.min(100, sNow)) / 100) * gh;
    ctx.fillStyle = colors[mode];
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Temp (°C) →', gx + gw / 2, gy + gh + 18);
    ctx.save();
    ctx.translate(gx - 20, gy + gh / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('g / 100g water', 0, 0);
    ctx.restore();

    // Left: beaker
    const bx = W * 0.08, by = H * 0.15, bw = W * 0.38, bh = H * 0.7;
    ctx.strokeStyle = 'rgba(148,163,184,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx, by + bh);
    ctx.lineTo(bx + bw, by + bh);
    ctx.lineTo(bx + bw, by);
    ctx.stroke();

    const liquidY = by + bh * 0.35;
    const lg = ctx.createLinearGradient(0, liquidY, 0, by + bh);
    lg.addColorStop(0, 'rgba(34,211,238,0.5)');
    lg.addColorStop(1, 'rgba(6,182,212,0.85)');
    ctx.fillStyle = lg;
    ctx.fillRect(bx + 2, liquidY, bw - 4, by + bh - liquidY - 2);

    // Water surface wave
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = bx + 2; x < bx + bw; x += 4) {
      const y = liquidY + Math.sin((x + phase * 20) * 0.08) * 1.5;
      if (x === bx + 2) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Dissolved particles (float around)
    const dissolved = Math.min(solute, sNow);
    const numPart = Math.round(dissolved * 0.5);
    for (let i = 0; i < numPart; i++) {
      const seed = i * 3.7;
      const dx = bx + 10 + ((Math.sin(seed * 1.1) * 0.5 + 0.5) * (bw - 20));
      const dy = liquidY + 10 + ((Math.cos(seed * 1.3) * 0.5 + 0.5) * (by + bh - liquidY - 20));
      ctx.fillStyle = 'rgba(167,139,250,0.85)';
      ctx.beginPath();
      ctx.arc(dx, dy + Math.sin(phase * 2 + i) * 2, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Undissolved solute at bottom (precipitate)
    const precipitate = Math.max(0, solute - sNow);
    const precipH = Math.min(60, precipitate * 0.5);
    if (precipH > 1) {
      ctx.fillStyle = 'rgba(251,191,36,0.9)';
      ctx.beginPath();
      ctx.moveTo(bx + 4, by + bh - 2);
      for (let i = 0; i <= 20; i++) {
        const px2 = bx + 4 + (i / 20) * (bw - 8);
        const py2 = by + bh - 2 - precipH * (0.6 + 0.4 * Math.sin(i * 0.7));
        ctx.lineTo(px2, py2);
      }
      ctx.lineTo(bx + bw - 4, by + bh - 2);
      ctx.closePath();
      ctx.fill();
    }

    // Beaker label
    ctx.fillStyle = 'rgba(148,163,184,0.7)';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Solution', bx + bw / 2, by + bh + 18);
  }

  function loop() { phase += 0.016; draw(); animId = requestAnimationFrame(loop); }

  function update() {
    const sNow = solubilityAt(temp);
    const dissolved = Math.min(solute, sNow);
    const precip = Math.max(0, solute - sNow);
    wrap.querySelector('#rTemp').textContent = temp + ' °C';
    wrap.querySelector('#rDis').textContent = dissolved.toFixed(0) + ' g';
    wrap.querySelector('#tV').textContent = temp;
    wrap.querySelector('#addV').textContent = solute;
  }

  wrap.querySelector('#temp').addEventListener('input', e => { temp = parseFloat(e.target.value); update(); });
  wrap.querySelector('#add').addEventListener('input', e => { solute = parseFloat(e.target.value); update(); });

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
    update();
  }
  wrap.querySelectorAll('.mtog').forEach(b => b.addEventListener('click', () => setMode(parseInt(b.dataset.m, 10))));

  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    temp = 25; solute = 0;
    wrap.querySelector('#temp').value = 25;
    wrap.querySelector('#add').value = 0;
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
