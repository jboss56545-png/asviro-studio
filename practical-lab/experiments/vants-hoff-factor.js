export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">Van't Hoff Factor</div><div class="text-[9px] text-slate-500 truncate">Class 12 Chem - Ch 1</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2.5 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">i = ?</div>
        <div class="text-[11px] font-black text-emerald-300" id="rI">1.00</div>
      </div>
      <div class="absolute top-2 right-2 bg-white/10 border border-white/10 rounded-xl px-2.5 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Effective particles</div>
        <div class="text-[11px] font-black text-cyan-300" id="rN">1</div>
      </div>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 max-h-[48vh] overflow-y-auto space-y-2.5" style="backdrop-filter:blur(20px);">
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-emerald-400 uppercase">Solute type</label><span class="text-[11px] font-black text-emerald-400" id="typeName">Non-electrolyte</span></div>
        <div class="grid grid-cols-4 gap-1.5">
          <button type="button" class="mtog py-2 rounded-xl text-[8px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300" data-m="0">None</button>
          <button type="button" class="mtog py-2 rounded-xl text-[8px] font-bold bg-white/5 border border-white/10 text-slate-300" data-m="1">NaCl</button>
          <button type="button" class="mtog py-2 rounded-xl text-[8px] font-bold bg-white/5 border border-white/10 text-slate-300" data-m="2">CaCl₂</button>
          <button type="button" class="mtog py-2 rounded-xl text-[8px] font-bold bg-white/5 border border-white/10 text-slate-300" data-m="3">Acetic acid</button>
        </div>
      </div>
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-cyan-400 uppercase">Degree of dissociation α</label><span class="text-[11px] font-black text-cyan-400" id="alphaV">0.00</span></div>
        <input type="range" id="alphaSlider" min="0" max="1" step="0.01" value="0" class="w-full accent-cyan-500">
      </div>
      <div class="grid grid-cols-2 gap-1.5">
        <div class="bg-white/5 rounded-xl p-2 border border-white/10">
          <div class="text-[8px] text-slate-500 uppercase font-bold">Observed mass</div>
          <div class="text-xs font-black text-emerald-300" id="rObsM">100.0 g</div>
        </div>
        <div class="bg-white/5 rounded-xl p-2 border border-white/10">
          <div class="text-[8px] text-slate-500 uppercase font-bold">Normal mass (i=1)</div>
          <div class="text-xs font-black text-amber-300" id="rNormM">100.0 g</div>
        </div>
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[9px] text-slate-400 leading-relaxed">
        <b class="text-emerald-400">Van't Hoff factor (i):</b> Ratio of observed to calculated colligative property. <b>Non-electrolyte:</b> i = 1. <b>Dissociation:</b> i > 1 (NaCl → 2 ions, i=2 at complete). <b>Association:</b> i < 1 (Acetic acid dimerizes).
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

  // Solute definitions
  const solutes = [
    { name: 'Non-electrolyte', n: 1, type: 'none' },     // i = 1
    { name: 'NaCl', n: 2, type: 'dissoc' },               // i = 1 + α (n=2)
    { name: 'CaCl₂', n: 3, type: 'dissoc' },              // i = 1 + 2α (n=3)
    { name: 'Acetic acid', n: 2, type: 'assoc' }          // i = 1 - α/2 (dimerization)
  ];

  let mode = 0, alpha = 0;
  let animId = null, phase = 0;
  let particles = [];

  function initParticles() {
    particles = [];
    // Initial: solid blob at bottom
    for (let k = 0; k < 30; k++) {
      particles.push({
        x: W/2 + (Math.random() - 0.5) * 40,
        y: H * 0.7 + Math.random() * 20,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: 3,
        type: 'solute'
      });
    }
  }

  function computeI() {
    const s = solutes[mode];
    if (s.type === 'none') return 1;
    if (s.type === 'dissoc') return 1 + (s.n - 1) * alpha;
    if (s.type === 'assoc') return 1 - alpha/2;
    return 1;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#0f172a'); bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const s = solutes[mode];
    const iVal = computeI();

    // Beaker
    const bw = W * 0.5, bh = H * 0.7;
    const bx = W/2 - bw/2, by = H * 0.1;

    ctx.strokeStyle = 'rgba(148,163,184,0.5)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(bx, by); ctx.lineTo(bx, by + bh);
    ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by);
    ctx.stroke();

    // Liquid
    const liquidY = by + bh * 0.4;
    const lg = ctx.createLinearGradient(0, liquidY, 0, by + bh);
    lg.addColorStop(0, 'rgba(34,211,238,0.3)');
    lg.addColorStop(1, 'rgba(6,182,212,0.7)');
    ctx.fillStyle = lg;
    ctx.fillRect(bx + 2, liquidY, bw - 4, by + bh - liquidY - 2);

    // Surface
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = bx + 2; x < bx + bw; x += 4) {
      const y = liquidY + Math.sin((x + phase * 20) * 0.08) * 1.5;
      if (x === bx + 2) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Dissolved particles based on mode + alpha
    if (s.type === 'none') {
      // Just solute molecules (blue)
      drawMolecules(liquidY, by + bh, bw, 20, '#a78bfa', 1);
    } else if (s.type === 'dissoc') {
      // Undissociated portion
      const undissoc = 20 * (1 - alpha);
      const dissoc = 20 * alpha;
      drawMolecules(liquidY, by + bh, bw, undissoc, '#a78bfa', 1);
      // Dissociated ions
      for (let k = 0; k < dissoc; k++) {
        const seed = k * 3.7;
        const px = bx + 15 + ((Math.sin(seed * 1.1) * 0.5 + 0.5) * (bw - 30));
        const py = liquidY + 15 + ((Math.cos(seed * 1.3) * 0.5 + 0.5) * (by + bh - liquidY - 30));
        const float = Math.sin(phase * 2 + k) * 3;
        // Cation
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(px - 8, py + float, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 1;
        ctx.stroke();
        // Plus sign
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(px - 10, py + float);
        ctx.lineTo(px - 6, py + float);
        ctx.moveTo(px - 8, py + float - 2);
        ctx.lineTo(px - 8, py + float + 2);
        ctx.stroke();

        // Anion(s)
        const nAnions = s.n - 1;
        for (let a = 0; a < nAnions; a++) {
          const ax = px + 10 + a * 12;
          ctx.fillStyle = '#22d3ee';
          ctx.beginPath();
          ctx.arc(ax, py + float + a*3, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#155e75';
          ctx.lineWidth = 1;
          ctx.stroke();
          // Minus sign
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(ax - 2.5, py + float + a*3);
          ctx.lineTo(ax + 2.5, py + float + a*3);
          ctx.stroke();
        }
      }
    } else if (s.type === 'assoc') {
      // Dimerization: 2 molecules → 1 dimer
      const dimers = 10 * alpha;
      const monomers = 20 - dimers * 2;
      // Monomers
      drawMolecules(liquidY, by + bh, bw, monomers, '#a78bfa', 1);
      // Dimers
      for (let k = 0; k < dimers; k++) {
        const seed = k * 5.3;
        const px = bx + 20 + ((Math.sin(seed * 1.1) * 0.5 + 0.5) * (bw - 40));
        const py = liquidY + 20 + ((Math.cos(seed * 1.3) * 0.5 + 0.5) * (by + bh - liquidY - 30));
        const float = Math.sin(phase * 1.5 + k) * 2;
        ctx.fillStyle = '#c084fc';
        ctx.beginPath();
        ctx.arc(px - 5, py + float, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px + 5, py + float, 4, 0, Math.PI * 2);
        ctx.fill();
        // Link
        ctx.strokeStyle = '#7e22ce';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(px - 5, py + float);
        ctx.lineTo(px + 5, py + float);
        ctx.stroke();
      }
    }

    // Particle count label
    const totalParticles = Math.round(20 * iVal);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Effective particles: ' + totalParticles, W/2, by + bh + 22);

    // i value big display
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('i = ' + iVal.toFixed(3), W/2, by - 18);

    // Solute name
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText(s.name, W/2, by - 42);
  }

  function drawMolecules(top, bottom, bw, count, color, r) {
    const bx = W/2 - bw/2;
    for (let k = 0; k < count; k++) {
      const seed = k * 7.13;
      const px = bx + 15 + ((Math.sin(seed * 1.1) * 0.5 + 0.5) * (bw - 30));
      const py = top + 15 + ((Math.cos(seed * 1.3) * 0.5 + 0.5) * (bottom - top - 30));
      const float = Math.sin(phase * 2 + k) * 2;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(px, py + float, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(88,28,135,0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function loop() { phase += 0.02; draw(); animId = requestAnimationFrame(loop); }

  function update() {
    const iVal = computeI();
    wrap.querySelector('#rI').textContent = iVal.toFixed(3);
    wrap.querySelector('#rN').textContent = Math.round(20 * iVal);
    wrap.querySelector('#alphaV').textContent = alpha.toFixed(2);
    wrap.querySelector('#typeName').textContent = solutes[mode].name;
    // Observed vs normal mass
    const normalM = 100;
    const observedM = 100 / iVal;
    wrap.querySelector('#rObsM').textContent = observedM.toFixed(1) + ' g';
    wrap.querySelector('#rNormM').textContent = normalM.toFixed(1) + ' g';
  }

  wrap.querySelector('#alphaSlider').addEventListener('input', e => { alpha = parseFloat(e.target.value); update(); });

  function setMode(mm) {
    mode = mm;
    alpha = 0;
    wrap.querySelector('#alphaSlider').value = 0;
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

  wrap.querySelector('.reset-btn').addEventListener('click', () => { alpha = 0; wrap.querySelector('#alphaSlider').value = 0; setMode(mode); });
  wrap.querySelector('.back-btn').addEventListener('click', () => window.goBack());

  let ro = null;
  if ('ResizeObserver' in window) { ro = new ResizeObserver(() => { resize(); initParticles(); }); ro.observe(canvas); }
  resize(); initParticles(); update();
  animId = requestAnimationFrame(loop);

  return function cleanup() {
    if (animId) cancelAnimationFrame(animId);
    if (ro) ro.disconnect();
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    document.body.style.overflow = prevOverflow;
  };
}
