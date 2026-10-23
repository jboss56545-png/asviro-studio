export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">Solubility Curve</div><div class="text-[9px] text-slate-500 truncate">Class 12 Chem - Ch 1</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2.5 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Temp</div>
        <div class="text-[11px] font-black text-amber-300" id="rT">25 °C</div>
      </div>
      <div class="absolute top-2 right-2 bg-white/10 border border-white/10 rounded-xl px-2.5 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Solubility</div>
        <div class="text-[11px] font-black text-cyan-300" id="rS">0 g/100g</div>
      </div>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 space-y-2.5" style="backdrop-filter:blur(20px);">
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-amber-400 uppercase">Temperature (°C)</label><span class="text-[11px] font-black text-amber-400" id="tV">25</span></div>
        <input type="range" id="tSlider" min="0" max="100" step="1" value="25" class="w-full accent-amber-500">
      </div>
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-cyan-400 uppercase">Water in beaker (g)</label><span class="text-[11px] font-black text-cyan-400" id="wV">100</span></div>
        <input type="range" id="wSlider" min="20" max="200" step="5" value="100" class="w-full accent-cyan-500">
      </div>
      <div class="grid grid-cols-3 gap-1.5">
        <button type="button" class="mtog py-2 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300" data-m="0">KNO₃</button>
        <button type="button" class="mtog py-2 rounded-xl text-[9px] font-bold bg-white/5 border border-white/10 text-slate-300" data-m="1">NaCl</button>
        <button type="button" class="mtog py-2 rounded-xl text-[9px] font-bold bg-white/5 border border-white/10 text-slate-300" data-m="2">Ce₂(SO₄)₃</button>
      </div>
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-rose-400 uppercase">Solute added (g)</label><span class="text-[11px] font-black text-rose-400" id="solV">0</span></div>
        <input type="range" id="solSlider" min="0" max="300" step="1" value="0" class="w-full accent-rose-500">
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[9px] text-slate-400 leading-relaxed" id="infoBox">
        <b class="text-emerald-400">Solubility curve:</b> Shows maximum solute that can dissolve at each temperature. Above curve = <b>supersaturated</b>, on curve = <b>saturated</b>, below = <b>unsaturated</b>. KNO₃ increases sharply with T.
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

  let temp = 25, water = 100, solute = 0, mode = 0;
  let animId = null, phase = 0;

  function solubilityAt(t, m) {
    if (m === 0) return 20 + Math.pow(t, 1.55) * 0.06 * 40; // KNO3
    if (m === 1) return 35 + t * 0.15; // NaCl
    return 90 - t * 0.75; // Ce2(SO4)3
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#0f172a'); bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Graph
    const gx = 50, gy = 30, gw = W - 100, gh = H - 100;

    // Grid
    ctx.strokeStyle = 'rgba(148,163,184,0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const px = gx + (i / 10) * gw;
      ctx.beginPath(); ctx.moveTo(px, gy); ctx.lineTo(px, gy + gh); ctx.stroke();
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
    ctx.fillText('Temperature (°C) →', gx + gw / 2, gy + gh + 22);
    ctx.save();
    ctx.translate(gx - 22, gy + gh / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Solubility (g/100g water)', 0, 0);
    ctx.restore();

    // X axis ticks
    ctx.font = '8px sans-serif';
    for (let i = 0; i <= 5; i++) {
      const px = gx + (i / 5) * gw;
      ctx.fillText(String(Math.round(i * 20)), px, gy + gh + 10);
    }
    // Y axis ticks
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const py = gy + gh - (i / 5) * gh;
      ctx.fillText(String(Math.round(i * 40)), gx - 6, py);
    }
    ctx.textAlign = 'center';

    // Draw all curves faintly
    const colors = ['#10b981', '#fbbf24', '#a855f7'];
    for (let mm = 0; mm < 3; mm++) {
      ctx.strokeStyle = mm === mode ? colors[mm] : 'rgba(100,116,139,0.2)';
      ctx.lineWidth = mm === mode ? 3 : 1;
      ctx.beginPath();
      for (let i = 0; i <= 100; i++) {
        const t = i;
        const s = Math.max(0, Math.min(200, solubilityAt(t, mm)));
        const px = gx + (t / 100) * gw;
        const py = gy + gh - (s / 200) * gh;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Current point
    const sNow = solubilityAt(temp, mode);
    const px = gx + (temp / 100) * gw;
    const py = gy + gh - (Math.max(0, Math.min(200, sNow)) / 200) * gh;
    ctx.fillStyle = colors[mode];
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Dashed guide lines
    ctx.strokeStyle = colors[mode] + '66';
    ctx.setLineDash([4, 3]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px, py); ctx.lineTo(px, gy + gh);
    ctx.moveTo(px, py); ctx.lineTo(gx, py);
    ctx.stroke();
    ctx.setLineDash([]);

    // Current point label
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'left';
    const labelX = Math.min(px + 10, gx + gw - 100);
    const labelY = Math.max(py - 15, gy + 12);
    ctx.fillText('T=' + temp + '°C, S=' + sNow.toFixed(1) + 'g', labelX, labelY);

    // Saturation state
    const conc = (solute / water) * 100;
    let state, stateColor;
    if (conc > sNow + 0.5) {
      state = 'Supersaturated (precipitate)';
      stateColor = '#f43f5e';
    } else if (conc > sNow - 0.5) {
      state = 'Saturated';
      stateColor = '#fbbf24';
    } else {
      state = 'Unsaturated';
      stateColor = '#10b981';
    }
    // State badge
    const badgeW = 180, badgeH = 24;
    const bx2 = W / 2 - badgeW / 2, by2 = gy - 22;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(bx2, by2, badgeW, badgeH, 12);
    else ctx.rect(bx2, by2, badgeW, badgeH);
    ctx.fill();
    ctx.strokeStyle = stateColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = stateColor;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state, W / 2, by2 + badgeH / 2);
  }

  function loop() { phase += 0.016; draw(); animId = requestAnimationFrame(loop); }

  function update() {
    const sNow = solubilityAt(temp, mode);
    wrap.querySelector('#rT').textContent = temp + ' °C';
    wrap.querySelector('#rS').textContent = sNow.toFixed(1) + ' g/100g';
    wrap.querySelector('#tV').textContent = temp;
    wrap.querySelector('#wV').textContent = water;
    wrap.querySelector('#solV').textContent = solute;
    const conc = (solute / water) * 100;
    const box = wrap.querySelector('#infoBox');
    if (conc > sNow + 0.5) {
      box.innerHTML = '<b class="text-rose-400">Supersaturated:</b> ' + conc.toFixed(1) + ' g per 100g water. Excess solute will precipitate out at bottom.';
    } else if (conc > sNow - 0.5) {
      box.innerHTML = '<b class="text-amber-400">Saturated:</b> ' + conc.toFixed(1) + ' g per 100g water. Solution holds maximum solute at this temp.';
    } else {
      box.innerHTML = '<b class="text-emerald-400">Unsaturated:</b> ' + conc.toFixed(1) + ' g per 100g water. More solute can still dissolve.';
    }
  }

  wrap.querySelector('#tSlider').addEventListener('input', e => { temp = parseFloat(e.target.value); update(); });
  wrap.querySelector('#wSlider').addEventListener('input', e => { water = parseFloat(e.target.value); update(); });
  wrap.querySelector('#solSlider').addEventListener('input', e => { solute = parseFloat(e.target.value); update(); });

  function setMode(mm) {
    mode = mm;
    wrap.querySelectorAll('.mtog').forEach((b, idx) => {
      const on = idx === mm;
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
    temp = 25; water = 100; solute = 0;
    wrap.querySelector('#tSlider').value = 25;
    wrap.querySelector('#wSlider').value = 100;
    wrap.querySelector('#solSlider').value = 0;
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
