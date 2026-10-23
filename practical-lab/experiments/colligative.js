export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">Colligative Properties</div><div class="text-[9px] text-slate-500 truncate">Class 12 Chem - Ch 1</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 max-h-[45vh] overflow-y-auto space-y-2.5" style="backdrop-filter:blur(20px);">
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-emerald-400 uppercase">Molality (m)</label><span class="text-[11px] font-black text-emerald-400" id="mV">0.5</span></div>
        <input type="range" id="mSlider" min="0" max="3" step="0.05" value="0.5" class="w-full accent-emerald-500">
      </div>
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-amber-400 uppercase">Van't Hoff factor i</label><span class="text-[11px] font-black text-amber-400" id="iV">1.0</span></div>
        <input type="range" id="iSlider" min="0.5" max="4" step="0.1" value="1" class="w-full accent-amber-500">
      </div>
      <div class="grid grid-cols-2 gap-1.5">
        <div class="bg-white/5 rounded-xl p-2 border border-white/10">
          <div class="text-[8px] text-slate-500 uppercase font-bold">ΔTb (elevation)</div>
          <div class="text-sm font-black text-rose-300" id="rDTb">0.00 °C</div>
          <div class="text-[8px] text-slate-500">BP rises</div>
        </div>
        <div class="bg-white/5 rounded-xl p-2 border border-white/10">
          <div class="text-[8px] text-slate-500 uppercase font-bold">ΔTf (depression)</div>
          <div class="text-sm font-black text-cyan-300" id="rDTf">0.00 °C</div>
          <div class="text-[8px] text-slate-500">FP drops</div>
        </div>
        <div class="bg-white/5 rounded-xl p-2 border border-white/10">
          <div class="text-[8px] text-slate-500 uppercase font-bold">π (osmotic)</div>
          <div class="text-sm font-black text-purple-300" id="rPi">0.0 atm</div>
          <div class="text-[8px] text-slate-500">at 25°C</div>
        </div>
        <div class="bg-white/5 rounded-xl p-2 border border-white/10">
          <div class="text-[8px] text-slate-500 uppercase font-bold">VP lowering</div>
          <div class="text-sm font-black text-amber-300" id="rVP">0.00</div>
          <div class="text-[8px] text-slate-500">kPa</div>
        </div>
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[9px] text-slate-400 leading-relaxed">
        <b class="text-emerald-400">Colligative properties</b> depend only on <b>number</b> of solute particles, not their nature. Kb(water)=0.512, Kf(water)=1.86.
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

  let m = 0.5, i = 1;
  let animId = null, phase = 0;

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#0f172a'); bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const dTb = i * 0.512 * m;
    const dTf = i * 1.86 * m;
    const pi = i * m * 0.0821 * 298; // atm

    // Left: boiling point (thermometer + bubbles)
    const leftX = W * 0.27;
    const rightX = W * 0.73;
    const cy = H * 0.5;

    drawThermoScene(leftX, cy, 100 + dTb, dTb, 'Boiling Point', '#fb7185');
    drawThermoScene(rightX, cy, 0 - dTf, dTf, 'Freezing Point', '#22d3ee');

    // Center info
    ctx.fillStyle = 'rgba(148,163,184,0.4)';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('vs pure water', W / 2, cy - 100);
  }

  function drawThermoScene(cx, cy, temp, delta, label, color) {
    // Beaker
    const bw = W * 0.32, bh = H * 0.4;
    const bx = cx - bw / 2;
    const by = cy - bh / 2 + 20;

    ctx.strokeStyle = 'rgba(148,163,184,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx, by + bh);
    ctx.lineTo(bx + bw, by + bh);
    ctx.lineTo(bx + bw, by);
    ctx.stroke();

    const liquidY = by + bh * 0.4;
    const lg = ctx.createLinearGradient(0, liquidY, 0, by + bh);
    lg.addColorStop(0, color + '80');
    lg.addColorStop(1, color + 'CC');
    ctx.fillStyle = lg;
    ctx.fillRect(bx + 2, liquidY, bw - 4, by + bh - liquidY - 2);

    // Bubbles rising
    const bubbleCount = Math.round(Math.min(20, delta * 8));
    for (let k = 0; k < bubbleCount; k++) {
      const seed = k * 5.3;
      const bubX = bx + 10 + ((Math.sin(seed) * 0.5 + 0.5) * (bw - 20));
      const t = ((phase * 30 + seed * 10) % (liquidY - by - 20));
      const bubY = by + bh - 10 - t;
      const r = 2 + (Math.sin(seed * 2) * 0.5 + 0.5) * 2;
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath();
      ctx.arc(bubX, bubY, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Thermometer above beaker
    const thX = cx;
    const thY = by - 55;
    const thH = 40, thW = 8;
    ctx.fillStyle = 'rgba(148,163,184,0.3)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(thX - thW / 2, thY, thW, thH, thW / 2);
    else ctx.rect(thX - thW / 2, thY, thW, thH);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(thX, thY + thH + 5, 6, 0, Math.PI * 2);
    ctx.fill();

    // Mercury based on temp
    let level = 0;
    if (label === 'Boiling Point') level = Math.max(0, Math.min(1, (temp - 95) / 15));
    else level = Math.max(0, Math.min(1, (temp + 10) / 15));
    const mh = level * thH;
    ctx.fillStyle = color;
    ctx.fillRect(thX - thW / 2 + 2, thY + thH - mh, thW - 4, mh);

    // Temp text
    ctx.fillStyle = color;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(temp.toFixed(2) + ' °C', cx, thY - 14);

    // Label
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText(label, cx, by + bh + 20);

    // Δ text
    ctx.fillStyle = color;
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText((label === 'Boiling Point' ? '+' : '-') + delta.toFixed(2) + ' °C', cx, by + bh + 36);
  }

  function loop() { phase += 0.016; draw(); animId = requestAnimationFrame(loop); }

  function update() {
    const dTb = i * 0.512 * m;
    const dTf = i * 1.86 * m;
    const pi = i * m * 0.0821 * 298;
    const vpLower = m * i * 0.02;
    wrap.querySelector('#mV').textContent = m.toFixed(2);
    wrap.querySelector('#iV').textContent = i.toFixed(1);
    wrap.querySelector('#rDTb').textContent = dTb.toFixed(3) + ' °C';
    wrap.querySelector('#rDTf').textContent = dTf.toFixed(3) + ' °C';
    wrap.querySelector('#rPi').textContent = pi.toFixed(2) + ' atm';
    wrap.querySelector('#rVP').textContent = vpLower.toFixed(3);
  }

  wrap.querySelector('#mSlider').addEventListener('input', e => { m = parseFloat(e.target.value); update(); });
  wrap.querySelector('#iSlider').addEventListener('input', e => { i = parseFloat(e.target.value); update(); });

  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    m = 0.5; i = 1;
    wrap.querySelector('#mSlider').value = 0.5;
    wrap.querySelector('#iSlider').value = 1;
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
