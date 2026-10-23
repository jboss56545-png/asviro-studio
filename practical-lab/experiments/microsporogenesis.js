export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0">
        <div class="text-xs font-black text-slate-100 truncate">Microsporogenesis</div>
        <div class="text-[9px] text-slate-500 truncate">Class 12 Bio - Ch 1</div>
      </div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2.5 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Stage</div>
        <div class="text-[11px] font-black text-emerald-300" id="stageText">Microspore Mother Cell</div>
      </div>
      <div class="absolute top-2 right-2 bg-white/10 border border-white/10 rounded-xl px-2.5 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Progress</div>
        <div class="text-[11px] font-black text-cyan-300" id="progText">0%</div>
      </div>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 space-y-2.5" style="backdrop-filter:blur(20px);">
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Progress</label><span class="text-[11px] font-black text-emerald-400" id="sliderVal">0%</span></div>
        <input type="range" id="stageSlider" min="0" max="100" step="1" value="0" class="w-full accent-emerald-500">
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10">
        <div class="text-[9px] text-slate-400 leading-relaxed">
          <b class="text-emerald-400">Anther T.S.:</b> 4 microsporangia. Layers: Epidermis → Endothecium → Middle layer → <b class="text-amber-400">Tapetum</b>. Inside: <b>Microspore Mother Cell (2n)</b> → Meiosis → Tetrad → Pollen grains (n).
        </div>
      </div>
      <div class="grid grid-cols-2 gap-1.5">
        <button type="button" class="btn-play py-2.5 rounded-xl text-[10px] font-black bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 flex items-center justify-center gap-1"><i class="fa-solid fa-play text-[10px]"></i> Play</button>
        <button type="button" class="btn-step py-2.5 rounded-xl text-[10px] font-bold bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center gap-1"><i class="fa-solid fa-forward-step text-[10px]"></i> Step</button>
      </div>
    </div>
  `;
  host.appendChild(wrap);

  const canvas = wrap.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    W = rect.width; H = rect.height;
  }

  let progress = 0;
  let playing = false;
  let animId = null, lastT = 0;

  const STAGES = [
    { t: 0.00, label: 'Microspore Mother Cell' },
    { t: 0.20, label: 'Meiosis I begins' },
    { t: 0.40, label: 'Meiosis II' },
    { t: 0.60, label: 'Tetrad formed' },
    { t: 0.85, label: 'Microspores released' },
    { t: 1.00, label: 'Pollen grains (n)' }
  ];

  function stageLabel(p) {
    for (let i = STAGES.length - 1; i >= 0; i--) if (p >= STAGES[i].t) return STAGES[i].label;
    return STAGES[0].label;
  }

  function easeInOut(x) { return x < 0.5 ? 2*x*x : 1 - Math.pow(-2*x + 2, 2) / 2; }

  function drawBackground() {
    const g = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W,H) * 0.8);
    g.addColorStop(0, '#0f172a');
    g.addColorStop(1, '#030712');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  // An anther cross-section: 4 lobes (butterfly/4-circle shape)
  function drawAnther() {
    const cx = W / 2, cy = H / 2;
    const lobeR = Math.min(W, H) * 0.13;
    const offsetX = lobeR * 0.95;
    const offsetY = lobeR * 0.95;

    // Outer capsule (soft green)
    const capsuleR = lobeR * 1.6;
    const capGrad = ctx.createRadialGradient(cx - capsuleR * 0.3, cy - capsuleR * 0.3, capsuleR * 0.1, cx, cy, capsuleR * 1.8);
    capGrad.addColorStop(0, '#166534');
    capGrad.addColorStop(0.6, '#14532d');
    capGrad.addColorStop(1, '#052e16');
    ctx.fillStyle = capGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, capsuleR * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // 4 lobes
    const lobes = [[-1,-1],[1,-1],[-1,1],[1,1]];
    lobes.forEach(([dx, dy], i) => {
      const lx = cx + dx * offsetX;
      const ly = cy + dy * offsetY;

      // Layer 1: Epidermis (outer)
      ctx.fillStyle = '#22c55e';
      ctx.beginPath(); ctx.arc(lx, ly, lobeR, 0, Math.PI * 2); ctx.fill();
      // Layer 2: Endothecium
      ctx.fillStyle = '#16a34a';
      ctx.beginPath(); ctx.arc(lx, ly, lobeR * 0.85, 0, Math.PI * 2); ctx.fill();
      // Layer 3: Middle layer
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath(); ctx.arc(lx, ly, lobeR * 0.68, 0, Math.PI * 2); ctx.fill();
      // Layer 4: Tapetum (nutrition)
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.arc(lx, ly, lobeR * 0.52, 0, Math.PI * 2); ctx.fill();
      // Inner cavity (sporogenous)
      ctx.fillStyle = 'rgba(15,23,42,0.85)';
      ctx.beginPath(); ctx.arc(lx, ly, lobeR * 0.4, 0, Math.PI * 2); ctx.fill();

      // Cells inside
      drawLobeContents(lx, ly, lobeR * 0.4, i);
    });

    // Labels (optional small text on edges)
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Anther T.S. (4 microsporangia)', cx, cy + capsuleR * 1.9 + 12);

    // Small layer labels (points on right side)
    const lblR = lobeR * 1.15;
    const lx2 = cx + offsetX + lblR * 0.7;
    const ly2 = cy - offsetY - lblR * 0.5;
    ctx.strokeStyle = 'rgba(148,163,184,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx + offsetX, cy - offsetY);
    ctx.lineTo(W * 0.82, H * 0.12);
    ctx.stroke();
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'left';
    ctx.fillText('Epidermis', W * 0.82 + 4, H * 0.12 - 8);
    ctx.fillText('Endothecium', W * 0.82 + 4, H * 0.12 + 4);
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('Tapetum', W * 0.82 + 4, H * 0.12 + 16);
  }

  function drawLobeContents(cx, cy, R, lobeIdx) {
    const t = progress;
    // Phase 1: single MMC (large 2n cell)
    if (t < 0.18) {
      const g = ctx.createRadialGradient(cx-2, cy-2, 1, cx, cy, R*0.55);
      g.addColorStop(0, '#67e8f9');
      g.addColorStop(1, '#0891b2');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // "2n" label
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('2n', cx, cy);
    }
    // Phase 2: Meiosis I (two cells)
    else if (t < 0.38) {
      const phase = Math.min(1, (t - 0.18) / 0.2);
      // Split into two
      const sep = 6 + phase * R * 0.55;
      for (let i = 0; i < 2; i++) {
        const ox = (i - 0.5) * sep;
        const g = ctx.createRadialGradient(cx+ox-2, cy-2, 1, cx+ox, cy, R*0.4);
        g.addColorStop(0, '#a5f3fc');
        g.addColorStop(1, '#0e7490');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx + ox, cy, R * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    }
    // Phase 3: Meiosis II (4 cells - tetrad)
    else if (t < 0.6) {
      const phase = Math.min(1, (t - 0.38) / 0.22);
      const sep = 4 + phase * R * 0.4;
      const cells = [[-1,-1],[1,-1],[-1,1],[1,1]];
      cells.forEach(([dx, dy]) => {
        const px = cx + dx * sep;
        const py = cy + dy * sep;
        const g = ctx.createRadialGradient(px-1.5, py-1.5, 0.5, px, py, R*0.3);
        g.addColorStop(0, '#bef264');
        g.addColorStop(1, '#4d7c0f');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, R * 0.28, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });
    }
    // Phase 4: Microspores released (spread out)
    else {
      const phase = Math.min(1, (t - 0.6) / 0.4);
      const expand = 1 + phase * 0.8;
      const cells = [[-1,-1],[1,-1],[-1,1],[1,1]];
      cells.forEach(([dx, dy]) => {
        const px = cx + dx * R * 0.4 * expand;
        const py = cy + dy * R * 0.4 * expand;
        const r = R * 0.26 + Math.sin(performance.now() * 0.002 + dx + dy) * R * 0.02;
        // Pollen grain - with spiky wall
        const g = ctx.createRadialGradient(px-2, py-2, 0.5, px, py, r);
        g.addColorStop(0, '#fef9c3');
        g.addColorStop(0.5, '#facc15');
        g.addColorStop(1, '#a16207');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
        // Spikes (pollen wall texture)
        ctx.strokeStyle = 'rgba(120,53,15,0.6)';
        ctx.lineWidth = 0.8;
        for (let k = 0; k < 8; k++) {
          const ang = (k / 8) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(px + Math.cos(ang) * r * 0.85, py + Math.sin(ang) * r * 0.85);
          ctx.lineTo(px + Math.cos(ang) * r * 1.05, py + Math.sin(ang) * r * 1.05);
          ctx.stroke();
        }
      });
    }
  }

  function render() {
    drawBackground();
    drawAnther();
  }

  function updateUI() {
    wrap.querySelector('#stageText').textContent = stageLabel(progress);
    wrap.querySelector('#progText').textContent = Math.round(progress * 100) + '%';
    wrap.querySelector('#sliderVal').textContent = Math.round(progress * 100) + '%';
    wrap.querySelector('#stageSlider').value = Math.round(progress * 100);
  }

  function loop(t) {
    const dt = Math.min(0.05, (t - lastT) / 1000);
    lastT = t;
    if (playing) {
      progress += dt * 0.18;
      if (progress >= 1) { progress = 1; playing = false; setPlayBtn(false); }
      updateUI();
    }
    render();
    animId = requestAnimationFrame(loop);
  }

  function setPlayBtn(on) {
    const b = wrap.querySelector('.btn-play');
    b.innerHTML = on ? '<i class="fa-solid fa-pause text-[10px]"></i> Pause' : '<i class="fa-solid fa-play text-[10px]"></i> Play';
  }

  wrap.querySelector('.btn-play').addEventListener('click', () => {
    if (progress >= 1) progress = 0;
    playing = !playing;
    setPlayBtn(playing);
    updateUI();
  });
  wrap.querySelector('.btn-step').addEventListener('click', () => {
    playing = false; setPlayBtn(false);
    for (const s of STAGES) { if (s.t > progress + 0.001) { progress = s.t; break; } }
    if (progress >= 0.999) progress = 1;
    updateUI();
  });
  wrap.querySelector('#stageSlider').addEventListener('input', (e) => {
    progress = parseInt(e.target.value, 10) / 100;
    playing = false; setPlayBtn(false);
    updateUI();
  });
  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    progress = 0; playing = false; setPlayBtn(false); updateUI();
  });
  wrap.querySelector('.back-btn').addEventListener('click', () => window.goBack());

  let ro = null;
  if ('ResizeObserver' in window) {
    ro = new ResizeObserver(resize);
    ro.observe(canvas);
  }
  resize();
  updateUI();
  lastT = performance.now();
  animId = requestAnimationFrame(loop);

  return function cleanup() {
    if (animId) cancelAnimationFrame(animId);
    if (ro) ro.disconnect();
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    document.body.style.overflow = prevOverflow;
  };
}
