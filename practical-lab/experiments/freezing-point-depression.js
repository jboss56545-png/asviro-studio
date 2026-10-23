export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">Freezing Point Depression</div><div class="text-[9px] text-slate-500 truncate">Class 12 Chem - Ch 1</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2.5 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">ΔTf</div>
        <div class="text-[11px] font-black text-cyan-300" id="rDT">0.00 °C</div>
      </div>
      <div class="absolute top-2 right-2 bg-white/10 border border-white/10 rounded-xl px-2.5 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">New FP</div>
        <div class="text-[11px] font-black text-blue-300" id="rFP">0.00 °C</div>
      </div>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 space-y-2.5" style="backdrop-filter:blur(20px);">
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-cyan-400 uppercase">Molality (m)</label><span class="text-[11px] font-black text-cyan-400" id="molV">0.50</span></div>
        <input type="range" id="molSlider" min="0" max="3" step="0.05" value="0.5" class="w-full accent-cyan-500">
      </div>
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-emerald-400 uppercase">Kf (°C·kg/mol)</label><span class="text-[11px] font-black text-emerald-400" id="kfV">1.86</span></div>
        <input type="range" id="kfSlider" min="0.5" max="20" step="0.01" value="1.86" class="w-full accent-emerald-500">
      </div>
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-amber-400 uppercase">Van't Hoff factor (i)</label><span class="text-[11px] font-black text-amber-400" id="iV">1.0</span></div>
        <input type="range" id="iSlider" min="0.5" max="4" step="0.1" value="1" class="w-full accent-amber-500">
      </div>
      <div class="grid grid-cols-3 gap-1.5">
        <button type="button" class="mtog py-2 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300" data-m="0">Water</button>
        <button type="button" class="mtog py-2 rounded-xl text-[9px] font-bold bg-white/5 border border-white/10 text-slate-300" data-m="1">Benzene</button>
        <button type="button" class="mtog py-2 rounded-xl text-[9px] font-bold bg-white/5 border border-white/10 text-slate-300" data-m="2">Camphor</button>
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[9px] text-slate-400 leading-relaxed">
        <b class="text-cyan-400">Formula:</b> ΔT<sub>f</sub> = i × K<sub>f</sub> × m. Adding solute <b>lowers</b> freezing point. Water Kf=1.86, Benzene Kf=5.12, Camphor Kf=40. Used to make antifreeze, salt on icy roads.
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

  let m = 0.5, kf = 1.86, i = 1, mode = 0;
  let animId = null, phase = 0;

  const solvents = [
    { name: 'Water', fp: 0, kf: 1.86 },
    { name: 'Benzene', fp: 5.5, kf: 5.12 },
    { name: 'Camphor', fp: 179, kf: 40 }
  ];

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#0f172a'); bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const sol = solvents[mode];
    const dTf = i * sol.kf * m;
    const newFP = sol.fp - dTf;

    // Two beakers
    const bw = W * 0.32, bh = H * 0.55;
    const cy = H * 0.5;

    // Left: pure solvent
    drawBeaker(W * 0.27, cy, bw, bh, sol.name + ' (pure)', sol.fp, false, 0);
    // Right: solution
    drawBeaker(W * 0.73, cy, bw, bh, 'Solution', newFP, true, dTf);

    // Center arrow
    const ax = W * 0.5, ay = cy;
    ctx.strokeStyle = 'rgba(34,211,238,0.7)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(ax - 15, ay); ctx.lineTo(ax + 15, ay);
    ctx.stroke();
    ctx.fillStyle = 'rgba(34,211,238,0.9)';
    ctx.beginPath();
    ctx.moveTo(ax + 15, ay);
    ctx.lineTo(ax + 7, ay - 5);
    ctx.lineTo(ax + 7, ay + 5);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#22d3ee';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+ solute', ax, ay - 12);
  }

  function drawBeaker(cx, cy, bw, bh, label, temp, isSolution, dTf) {
    const bx = cx - bw / 2;
    const by = cy - bh / 2;

    // Beaker
    ctx.strokeStyle = 'rgba(148,163,184,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bx, by); ctx.lineTo(bx, by + bh);
    ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by);
    ctx.stroke();

    // Liquid
    const liquidY = by + bh * 0.35;
    const lg = ctx.createLinearGradient(0, liquidY, 0, by + bh);
    if (isSolution) {
      lg.addColorStop(0, 'rgba(251,113,133,0.4)');
      lg.addColorStop(1, 'rgba(190,24,93,0.8)');
    } else {
      lg.addColorStop(0, 'rgba(34,211,238,0.4)');
      lg.addColorStop(1, 'rgba(6,182,212,0.8)');
    }
    ctx.fillStyle = lg;
    ctx.fillRect(bx + 2, liquidY, bw - 4, by + bh - liquidY - 2);

    // Ice crystals forming on top (if freezing)
    const freezeIntensity = Math.max(0, Math.min(1, (dTf / 5)));
    if (isSolution) {
      const crystals = Math.round(5 + freezeIntensity * 15);
      for (let k = 0; k < crystals; k++) {
        const seed = k * 3.7;
        const cx2 = bx + 10 + ((Math.sin(seed) * 0.5 + 0.5) * (bw - 20));
        const cy2 = liquidY + 3 + Math.sin(seed * 2 + phase) * 3;
        // Small ice crystal
        ctx.strokeStyle = 'rgba(200,230,255,0.8)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let j = 0; j < 3; j++) {
          const ang = (j / 3) * Math.PI * 2 + phase * 0.5;
          ctx.moveTo(cx2, cy2);
          ctx.lineTo(cx2 + Math.cos(ang) * 3, cy2 + Math.sin(ang) * 3);
        }
        ctx.stroke();
      }
    }

    // Temperature label
    ctx.fillStyle = isSolution ? '#22d3ee' : '#94a3b8';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(temp.toFixed(2) + ' °C', cx, by - 15);

    // Beaker label
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText(label, cx, by + bh + 18);

    // ΔTf below
    if (isSolution && dTf > 0.01) {
      ctx.fillStyle = '#22d3ee';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('ΔTf = ' + dTf.toFixed(2) + ' °C', cx, by + bh + 36);
    }

    // Thermometer
    const thX = cx + bw / 2 + 18;
    const thY = by - 20;
    const thH = 60, thW = 8;
    ctx.fillStyle = 'rgba(148,163,184,0.3)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(thX - thW / 2, thY, thW, thH, thW / 2);
    else ctx.rect(thX - thW / 2, thY, thW, thH);
    ctx.fill();
    ctx.fillStyle = isSolution ? '#22d3ee' : '#94a3b8';
    ctx.beginPath();
    ctx.arc(thX, thY + thH + 5, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  function loop() { phase += 0.02; draw(); animId = requestAnimationFrame(loop); }

  function update() {
    const sol = solvents[mode];
    const dTf = i * sol.kf * m;
    const newFP = sol.fp - dTf;
    wrap.querySelector('#rDT').textContent = dTf.toFixed(2) + ' °C';
    wrap.querySelector('#rFP').textContent = newFP.toFixed(2) + ' °C';
    wrap.querySelector('#molV').textContent = m.toFixed(2);
    wrap.querySelector('#kfV').textContent = kf.toFixed(2);
    wrap.querySelector('#iV').textContent = i.toFixed(1);
  }

  wrap.querySelector('#molSlider').addEventListener('input', e => { m = parseFloat(e.target.value); update(); });
  wrap.querySelector('#kfSlider').addEventListener('input', e => {
    kf = parseFloat(e.target.value);
    // Find closest solvent based on kf
    update();
  });
  wrap.querySelector('#iSlider').addEventListener('input', e => { i = parseFloat(e.target.value); update(); });

  function setMode(mm) {
    mode = mm;
    kf = solvents[mm].kf;
    wrap.querySelector('#kfSlider').value = kf;
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
    m = 0.5; i = 1;
    wrap.querySelector('#molSlider').value = 0.5;
    wrap.querySelector('#iSlider').value = 1;
    setMode(0);
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
