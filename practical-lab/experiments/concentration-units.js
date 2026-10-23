export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0">
        <div class="text-xs font-black text-slate-100 truncate">Concentration Units Lab</div>
        <div class="text-[9px] text-slate-500 truncate">Class 12 Chem - Ch 1</div>
      </div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 max-h-[52vh] overflow-y-auto space-y-2.5" style="backdrop-filter:blur(20px);">
      <div class="grid grid-cols-2 gap-2">
        <div>
          <div class="flex justify-between mb-1"><label class="text-[9px] font-bold text-emerald-400 uppercase">Solute (g)</label><span class="text-[10px] font-black text-emerald-400" id="mSoluteV">5.0</span></div>
          <input type="range" id="mSolute" min="0.5" max="50" step="0.5" value="5" class="w-full accent-emerald-500">
        </div>
        <div>
          <div class="flex justify-between mb-1"><label class="text-[9px] font-bold text-cyan-400 uppercase">Solvent (g)</label><span class="text-[10px] font-black text-cyan-400" id="mSolventV">100</span></div>
          <input type="range" id="mSolvent" min="20" max="500" step="5" value="100" class="w-full accent-cyan-500">
        </div>
        <div>
          <div class="flex justify-between mb-1"><label class="text-[9px] font-bold text-purple-400 uppercase">Molar mass (g/mol)</label><span class="text-[10px] font-black text-purple-400" id="mmV">58.5</span></div>
          <input type="range" id="mm" min="10" max="200" step="1" value="58.5" class="w-full accent-purple-500">
        </div>
        <div>
          <div class="flex justify-between mb-1"><label class="text-[9px] font-bold text-amber-400 uppercase">Density (g/mL)</label><span class="text-[10px] font-black text-amber-400" id="densV">1.05</span></div>
          <input type="range" id="dens" min="0.5" max="2" step="0.01" value="1.05" class="w-full accent-amber-500">
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div class="bg-white/5 rounded-xl p-2 border border-white/10">
          <div class="text-[8px] text-slate-500 uppercase font-bold">Molarity (M)</div>
          <div class="text-sm font-black text-emerald-300" id="rMolarity">0.00</div>
          <div class="text-[8px] text-slate-500">mol/L</div>
        </div>
        <div class="bg-white/5 rounded-xl p-2 border border-white/10">
          <div class="text-[8px] text-slate-500 uppercase font-bold">Molality (m)</div>
          <div class="text-sm font-black text-cyan-300" id="rMolality">0.00</div>
          <div class="text-[8px] text-slate-500">mol/kg</div>
        </div>
        <div class="bg-white/5 rounded-xl p-2 border border-white/10">
          <div class="text-[8px] text-slate-500 uppercase font-bold">Mole fraction</div>
          <div class="text-sm font-black text-purple-300" id="rMoleFrac">0.00</div>
          <div class="text-[8px] text-slate-500">xsolute</div>
        </div>
        <div class="bg-white/5 rounded-xl p-2 border border-white/10">
          <div class="text-[8px] text-slate-500 uppercase font-bold">Mass %</div>
          <div class="text-sm font-black text-amber-300" id="rMassPct">0.0</div>
          <div class="text-[8px] text-slate-500">% w/w</div>
        </div>
        <div class="bg-white/5 rounded-xl p-2 border border-white/10">
          <div class="text-[8px] text-slate-500 uppercase font-bold">ppm</div>
          <div class="text-sm font-black text-rose-300" id="rPpm">0</div>
          <div class="text-[8px] text-slate-500">parts per million</div>
        </div>
        <div class="bg-white/5 rounded-xl p-2 border border-white/10">
          <div class="text-[8px] text-slate-500 uppercase font-bold">Normality</div>
          <div class="text-sm font-black text-blue-300" id="rNormality">0.00</div>
          <div class="text-[8px] text-slate-500">N (assume 1 eq)</div>
        </div>
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[9px] text-slate-400 leading-relaxed">
        <b class="text-emerald-400">Note:</b> Molarity = mol solute / L solution. Molality = mol solute / kg solvent. Mole fraction = mol solute / total mol.
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

  let mSolute = 5, mSolvent = 100, mm = 58.5, dens = 1.05;
  let animId = null, phase = 0;

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Bg gradient
    const bg = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W,H) * 0.8);
    bg.addColorStop(0, '#0f172a');
    bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Beaker
    const bx = W / 2 - 70;
    const by = H * 0.15;
    const bw = 140;
    const bh = H * 0.7;

    // Beaker outline
    ctx.strokeStyle = 'rgba(148,163,184,0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx, by + bh);
    ctx.lineTo(bx + bw, by + bh);
    ctx.lineTo(bx + bw, by);
    ctx.stroke();

    // Liquid level (fill based on solvent)
    const fillFrac = Math.min(0.9, mSolvent / 500);
    const liquidH = bh * fillFrac;
    const liquidY = by + bh - liquidH;

    // Liquid gradient
    const lg = ctx.createLinearGradient(0, liquidY, 0, by + bh);
    const conc = Math.min(1, mSolute / 50);
    lg.addColorStop(0, `rgba(${Math.round(80 + conc * 100)}, ${Math.round(200 - conc * 80)}, 255, 0.5)`);
    lg.addColorStop(1, `rgba(${Math.round(50 + conc * 150)}, ${Math.round(150 - conc * 80)}, 220, 0.85)`);
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.rect(bx + 1, liquidY, bw - 2, liquidH);
    ctx.fill();

    // Liquid surface wave
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = bx + 1; x < bx + bw; x += 4) {
      const y = liquidY + Math.sin((x + phase * 30) * 0.1) * 1.5;
      if (x === bx + 1) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Dissolved solute particles (moving)
    const numParticles = Math.round(mSolute * 2);
    for (let i = 0; i < numParticles; i++) {
      const seed = i * 7.13;
      const px = bx + 15 + ((Math.sin(seed) * 0.5 + 0.5) * (bw - 30));
      const py = liquidY + 20 + ((Math.cos(seed * 1.7) * 0.5 + 0.5) * (liquidH - 30));
      const float = Math.sin(phase * 2 + i) * 2;
      ctx.fillStyle = `rgba(${Math.round(150 + conc * 100)}, ${Math.round(80 + conc * 60)}, 200, 0.85)`;
      ctx.beginPath();
      ctx.arc(px, py + float, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Beaker label
    ctx.fillStyle = 'rgba(148,163,184,0.7)';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Solution', W / 2, by + bh + 18);
  }

  function updateReadouts() {
    const nSolute = mSolute / mm;
    const nSolvent = mSolvent / 18.015; // water
    const totalMass = mSolute + mSolvent;
    const volume = totalMass / dens; // mL
    const volumeL = volume / 1000;

    const molarity = volumeL > 0 ? nSolute / volumeL : 0;
    const molality = mSolvent > 0 ? nSolute / (mSolvent / 1000) : 0;
    const moleFrac = (nSolute + nSolvent) > 0 ? nSolute / (nSolute + nSolvent) : 0;
    const massPct = totalMass > 0 ? (mSolute / totalMass) * 100 : 0;
    const ppm = totalMass > 0 ? (mSolute / totalMass) * 1e6 : 0;

    wrap.querySelector('#rMolarity').textContent = molarity.toFixed(3);
    wrap.querySelector('#rMolality').textContent = molality.toFixed(3);
    wrap.querySelector('#rMoleFrac').textContent = moleFrac.toFixed(4);
    wrap.querySelector('#rMassPct').textContent = massPct.toFixed(2);
    wrap.querySelector('#rPpm').textContent = Math.round(ppm).toLocaleString();
    wrap.querySelector('#rNormality').textContent = molarity.toFixed(3);
  }

  function loop(t) {
    phase += 0.016;
    draw();
    animId = requestAnimationFrame(loop);
  }

  const $mSolute = wrap.querySelector('#mSolute');
  const $mSolvent = wrap.querySelector('#mSolvent');
  const $mm = wrap.querySelector('#mm');
  const $dens = wrap.querySelector('#dens');

  $mSolute.addEventListener('input', () => {
    mSolute = parseFloat($mSolute.value);
    wrap.querySelector('#mSoluteV').textContent = mSolute.toFixed(1);
    updateReadouts();
  });
  $mSolvent.addEventListener('input', () => {
    mSolvent = parseFloat($mSolvent.value);
    wrap.querySelector('#mSolventV').textContent = mSolvent;
    updateReadouts();
  });
  $mm.addEventListener('input', () => {
    mm = parseFloat($mm.value);
    wrap.querySelector('#mmV').textContent = mm;
    updateReadouts();
  });
  $dens.addEventListener('input', () => {
    dens = parseFloat($dens.value);
    wrap.querySelector('#densV').textContent = dens.toFixed(2);
    updateReadouts();
  });

  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    mSolute = 5; mSolvent = 100; mm = 58.5; dens = 1.05;
    $mSolute.value = 5; $mSolvent.value = 100; $mm.value = 58.5; $dens.value = 1.05;
    wrap.querySelector('#mSoluteV').textContent = '5.0';
    wrap.querySelector('#mSolventV').textContent = '100';
    wrap.querySelector('#mmV').textContent = '58.5';
    wrap.querySelector('#densV').textContent = '1.05';
    updateReadouts();
  });
  wrap.querySelector('.back-btn').addEventListener('click', () => window.goBack());

  let ro = null;
  if ('ResizeObserver' in window) { ro = new ResizeObserver(resize); ro.observe(canvas); }
  resize();
  updateReadouts();
  animId = requestAnimationFrame(loop);

  return function cleanup() {
    if (animId) cancelAnimationFrame(animId);
    if (ro) ro.disconnect();
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    document.body.style.overflow = prevOverflow;
  };
}
