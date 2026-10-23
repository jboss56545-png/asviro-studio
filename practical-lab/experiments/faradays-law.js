export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">Faraday's Laws</div><div class="text-[9px] text-slate-500 truncate">Class 12 Chem - Ch 2</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Mass deposited</div>
        <div class="text-[10px] font-black text-emerald-300" id="rMass">0 g</div>
      </div>
      <div class="absolute top-2 right-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Charge Q</div>
        <div class="text-[10px] font-black text-cyan-300" id="rQ">0 C</div>
      </div>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 max-h-[44vh] overflow-y-auto space-y-2" style="backdrop-filter:blur(20px);">
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-emerald-400 uppercase">Current I (A)</label><span class="text-[11px] font-black text-emerald-400" id="iV">2.0</span></div>
        <input type="range" id="iSlider" min="0.1" max="10" step="0.1" value="2" class="w-full accent-emerald-500">
      </div>
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-amber-400 uppercase">Time t (s)</label><span class="text-[11px] font-black text-amber-400" id="tV">60</span></div>
        <input type="range" id="tSlider" min="5" max="600" step="5" value="60" class="w-full accent-amber-500">
      </div>
      <div class="grid grid-cols-3 gap-1.5">
        <button type="button" class="mtog py-2 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300" data-m="0">Ag</button>
        <button type="button" class="mtog py-2 rounded-xl text-[9px] font-bold bg-white/5 border border-white/10 text-slate-300" data-m="1">Cu</button>
        <button type="button" class="mtog py-2 rounded-xl text-[9px] font-bold bg-white/5 border border-white/10 text-slate-300" data-m="2">Zn</button>
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[9px] text-slate-400 leading-relaxed">
        <b class="text-emerald-400">Faraday's 1st Law:</b> m = Z·I·t = (M·I·t)/(n·F). Where F = 96485 C/mol, n = valency.
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

  const METALS = [
    { name: 'Ag', M: 107.87, n: 1, color: '#e5e7eb' },
    { name: 'Cu', M: 63.55, n: 2, color: '#d97706' },
    { name: 'Zn', M: 65.38, n: 2, color: '#94a3b8' }
  ];
  let I = 2, T = 60, mode = 0;
  let animId = null, phase = 0;
  let depositParticles = [];

  function initParticles() {
    depositParticles = [];
    for (let k = 0; k < 25; k++) {
      depositParticles.push({ x: Math.random(), y: Math.random(), r: 1 + Math.random() * 2 });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#0f172a'); bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const cx = W / 2, cy = H / 2;
    const cellW = Math.min(W * 0.75, 320);
    const cellH = Math.min(H * 0.72, 240);
    const bx = cx - cellW / 2, by = cy - cellH / 2;

    // Electrolytic cell (beaker)
    ctx.strokeStyle = 'rgba(148,163,184,0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx, by + cellH);
    ctx.lineTo(bx + cellW, by + cellH);
    ctx.lineTo(bx + cellW, by);
    ctx.stroke();

    // Electrolyte liquid
    const liquidTop = by + cellH * 0.25;
    const lg = ctx.createLinearGradient(0, liquidTop, 0, by + cellH);
    lg.addColorStop(0, 'rgba(59,130,246,0.35)');
    lg.addColorStop(1, 'rgba(30,64,175,0.75)');
    ctx.fillStyle = lg;
    ctx.fillRect(bx + 3, liquidTop, cellW - 6, cellH - liquidTop - 3);

    // Surface wave
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = bx + 3; x < bx + cellW; x += 4) {
      const y = liquidTop + Math.sin((x + phase * 20) * 0.08) * 1.5;
      if (x === bx + 3) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Electrodes
    const electrodeW = 16;
    const electrodeH = cellH * 0.55;
    const electrodeY = by + cellH * 0.15;

    // Cathode (left, -)
    const cathodeX = bx + cellW * 0.22;
    ctx.fillStyle = '#334155';
    ctx.fillRect(cathodeX - electrodeW/2, electrodeY, electrodeW, electrodeH);
    ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.5;
    ctx.strokeRect(cathodeX - electrodeW/2, electrodeY, electrodeW, electrodeH);

    // Anode (right, +)
    const anodeX = bx + cellW * 0.78;
    ctx.fillStyle = '#334155';
    ctx.fillRect(anodeX - electrodeW/2, electrodeY, electrodeW, electrodeH);
    ctx.strokeStyle = '#0f172a';
    ctx.strokeRect(anodeX - electrodeW/2, electrodeY, electrodeW, electrodeH);

    // Deposited metal on cathode (grows with charge)
    const charge = I * T;
    const metal = METALS[mode];
    const molMetal = (charge * metal.M) / (metal.n * 96485);
    const massMg = molMetal * 1000; // mg
    const depositThickness = Math.min(20, massMg * 0.05);
    if (depositThickness > 0.3) {
      ctx.fillStyle = metal.color;
      // Left side of cathode
      ctx.fillRect(cathodeX - electrodeW/2 - depositThickness, electrodeY, depositThickness, electrodeH);
      // Right side of cathode
      ctx.fillRect(cathodeX + electrodeW/2, electrodeY, depositThickness, electrodeH);

      // Bumpy texture
      const numBumps = Math.floor(depositThickness * 4);
      for (let i = 0; i < numBumps; i++) {
        const py = electrodeY + (i / numBumps) * electrodeH;
        const pr = 1.5 + Math.sin(phase * 2 + i) * 0.5;
        ctx.beginPath();
        ctx.arc(cathodeX - electrodeW/2 - depositThickness * 0.5, py, pr, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Ions moving (particles)
    for (let k = 0; k < 12; k++) {
      const t = ((phase * 0.5 + k / 12) % 1);
      const px = cathodeX + (anodeX - cathodeX) * (1 - t);
      const py = electrodeY + 30 + ((k * 17) % (electrodeH - 60));
      ctx.fillStyle = mode === 0 ? 'rgba(251,191,36,0.7)' : mode === 1 ? 'rgba(217,119,6,0.7)' : 'rgba(148,163,184,0.7)';
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // + and − labels
    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('−', cathodeX, by + 20);
    ctx.fillStyle = '#22d3ee';
    ctx.fillText('+', anodeX, by + 20);

    // Cathode/Anode labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('Cathode', cathodeX, by + cellH + 15);
    ctx.fillText('Anode', anodeX, by + cellH + 15);

    // Battery
    const midX = (cathodeX + anodeX) / 2;
    const batteryY = by - 25;
    ctx.strokeStyle = 'rgba(148,163,184,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cathodeX, by);
    ctx.lineTo(cathodeX, batteryY);
    ctx.lineTo(midX - 15, batteryY);
    ctx.moveTo(anodeX, by);
    ctx.lineTo(anodeX, batteryY);
    ctx.lineTo(midX + 15, batteryY);
    ctx.stroke();
    // Battery symbol
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(midX - 15, batteryY - 8); ctx.lineTo(midX - 15, batteryY + 8);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(midX - 5, batteryY - 4); ctx.lineTo(midX - 5, batteryY + 4);
    ctx.moveTo(midX + 5, batteryY - 8); ctx.lineTo(midX + 5, batteryY + 8);
    ctx.moveTo(midX + 15, batteryY - 4); ctx.lineTo(midX + 15, batteryY + 4);
    ctx.stroke();
    // Label
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('DC', midX, batteryY - 20);
  }

  function loop() { phase += 0.02; draw(); animId = requestAnimationFrame(loop); }

  function update() {
    const charge = I * T;
    const metal = METALS[mode];
    const massMg = (charge * metal.M) / (metal.n * 96485) * 1000;
    wrap.querySelector('#rMass').textContent = massMg.toFixed(2) + ' mg';
    wrap.querySelector('#rQ').textContent = charge.toFixed(0) + ' C';
    wrap.querySelector('#iV').textContent = I.toFixed(1);
    wrap.querySelector('#tV').textContent = T;
  }

  wrap.querySelector('#iSlider').addEventListener('input', e => { I = parseFloat(e.target.value); update(); });
  wrap.querySelector('#tSlider').addEventListener('input', e => { T = parseFloat(e.target.value); update(); });
  wrap.querySelectorAll('.mtog').forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      mode = idx;
      wrap.querySelectorAll('.mtog').forEach((b, i) => {
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
    I = 2; T = 60; mode = 0;
    wrap.querySelector('#iSlider').value = 2;
    wrap.querySelector('#tSlider').value = 60;
    wrap.querySelectorAll('.mtog').forEach((b, i) => {
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
  resize(); initParticles(); update();
  animId = requestAnimationFrame(loop);
  return function cleanup() {
    if (animId) cancelAnimationFrame(animId);
    if (ro) ro.disconnect();
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    document.body.style.overflow = prevOverflow;
  };
}
