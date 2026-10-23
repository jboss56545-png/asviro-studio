export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">Oogenesis</div><div class="text-[9px] text-slate-500 truncate">Class 12 Bio - Ch 2</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Stage</div>
        <div class="text-[10px] font-black text-pink-300" id="stageText">Oogonium</div>
      </div>
      <div class="absolute top-2 right-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Progress</div>
        <div class="text-[10px] font-black text-cyan-300" id="progText">0%</div>
      </div>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 space-y-2" style="backdrop-filter:blur(20px);">
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-emerald-400 uppercase">Stage</label><span class="text-[11px] font-black text-emerald-400" id="sliderV">0%</span></div>
        <input type="range" id="stageSlider" min="0" max="100" step="1" value="0" class="w-full accent-emerald-500">
      </div>
      <div class="grid grid-cols-2 gap-1.5">
        <button type="button" class="btn-play py-2.5 rounded-xl text-[10px] font-black bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950">▶ Play</button>
        <button type="button" class="btn-step py-2.5 rounded-xl text-[10px] font-bold bg-white/5 border border-white/10 text-slate-300">⏭ Step</button>
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[9px] text-slate-400 leading-relaxed">
        <b class="text-pink-400">Oogenesis:</b> Oogonium (2n) → Primary oocyte (2n) → Meiosis I → 1 Secondary oocyte (n, large) + 1st polar body (n) → Meiosis II → 1 Ovum (n) + 2nd polar body (n). Unequal division — one big egg, small polar bodies.
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

  let progress = 0, playing = false;
  let animId = null, lastT = 0, phase = 0;

  const STAGES = [
    { t: 0.00, label: 'Oogonium (2n)' },
    { t: 0.15, label: 'Primary Oocyte (2n)' },
    { t: 0.35, label: 'Meiosis I' },
    { t: 0.55, label: 'Secondary Oocyte (n)' },
    { t: 0.75, label: 'Meiosis II' },
    { t: 0.92, label: 'Ovum (n) + Polar bodies' },
    { t: 1.00, label: 'Mature Ovum' }
  ];

  function stageLabel(p) {
    for (let i = STAGES.length - 1; i >= 0; i--) if (p >= STAGES[i].t) return STAGES[i].label;
    return STAGES[0].label;
  }

  function drawBackground() {
    const g = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W, H) * 0.8);
    g.addColorStop(0, '#1e1b2e'); g.addColorStop(1, '#030712');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  function drawFollicle(cx, cy, outerR, innerR, oocyteR, label, oocyteColor) {
    // Granulosa cells (outer layer)
    ctx.fillStyle = 'rgba(251,207,232,0.4)';
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.fill();
    // Individual granulosa cells
    ctx.strokeStyle = 'rgba(190,24,93,0.35)';
    ctx.lineWidth = 1;
    const numG = Math.floor(outerR / 4);
    for (let i = 0; i < numG; i++) {
      const a = (i / numG) * Math.PI * 2;
      const gr = outerR - 6;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * gr * 0.95, cy + Math.sin(a) * gr * 0.95, 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Antrum (fluid-filled cavity) for mature follicle
    if (innerR > 0) {
      ctx.fillStyle = 'rgba(251,191,36,0.15)';
      ctx.beginPath();
      ctx.arc(cx + outerR * 0.3, cy, innerR, 0, Math.PI * 2);
      ctx.fill();
    }
    // Oocyte
    const og = ctx.createRadialGradient(cx - oocyteR*0.3, cy - oocyteR*0.3, oocyteR*0.1, cx, cy, oocyteR);
    og.addColorStop(0, '#fce7f3');
    og.addColorStop(0.5, oocyteColor);
    og.addColorStop(1, '#9d174d');
    ctx.fillStyle = og;
    ctx.beginPath();
    ctx.arc(cx, cy, oocyteR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(157,23,77,0.7)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Label
    ctx.fillStyle = 'rgba(244,114,182,0.9)';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(label, cx, cy + outerR + 8);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawBackground();

    const cx = W / 2, cy = H / 2;
    const t = progress;

    if (t < 0.15) {
      // Oogonium - small simple cell
      drawFollicle(cx, cy, 50, 0, 25, 'Oogonium (2n)', '#ec4899');
    } else if (t < 0.35) {
      // Primary oocyte with zona pellucida
      drawFollicle(cx, cy, 75, 0, 30, 'Primary Oocyte (2n)', '#db2777');
    } else if (t < 0.55) {
      // Meiosis I
      drawFollicle(cx, cy, 85, 15, 30, 'Meiosis I', '#be185d');
      // Chromosome lines in oocyte
      ctx.strokeStyle = 'rgba(15,23,42,0.8)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + phase * 0.4;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * 6, cy + Math.sin(a) * 6);
        ctx.lineTo(cx + Math.cos(a) * 20, cy + Math.sin(a) * 20);
        ctx.stroke();
      }
    } else if (t < 0.75) {
      // Secondary oocyte + 1st polar body
      drawFollicle(cx - 15, cy, 90, 25, 32, 'Secondary Oocyte (n)', '#be185d');
      // Polar body (small, top right)
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(cx + 55, cy - 45, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(71,85,105,0.7)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = 'rgba(148,163,184,0.9)';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Polar body', cx + 55, cy - 60);
    } else if (t < 0.92) {
      // Meiosis II
      drawFollicle(cx - 15, cy, 95, 30, 33, 'Meiosis II', '#9d174d');
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath(); ctx.arc(cx + 55, cy - 45, 10, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(71,85,105,0.7)'; ctx.stroke();
    } else {
      // Mature ovum + 2 polar bodies
      drawFollicle(cx - 20, cy, 100, 35, 35, 'Ovum (n)', '#9d174d');
      // 2 polar bodies
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath(); ctx.arc(cx + 55, cy - 50, 9, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(71,85,105,0.7)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx + 70, cy + 40, 8, 0, Math.PI * 2); ctx.fill();
      ctx.stroke();
      // Corona radiata
      const ovumR = 35;
      ctx.strokeStyle = 'rgba(251,191,36,0.6)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 20; i++) {
        const a = (i / 20) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx - 20 + Math.cos(a) * ovumR, cy + Math.sin(a) * ovumR);
        ctx.lineTo(cx - 20 + Math.cos(a) * (ovumR + 12), cy + Math.sin(a) * (ovumR + 12));
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(251,191,36,0.9)';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Corona radiata', cx - 20, cy + ovumR + 25);
    }

    // Note about size difference
    ctx.fillStyle = 'rgba(251,191,36,0.7)';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Note: Ovum is large, polar bodies are small (unequal division)', W / 2, H - 15);
  }

  function loop(t) {
    const dt = Math.min(0.05, (t - lastT) / 1000);
    lastT = t;
    phase += 0.02;
    if (playing) {
      progress += dt * 0.16;
      if (progress >= 1) { progress = 1; playing = false; setPlay(false); }
      updateUI();
    }
    draw();
    animId = requestAnimationFrame(loop);
  }

  function updateUI() {
    wrap.querySelector('#stageText').textContent = stageLabel(progress);
    wrap.querySelector('#progText').textContent = Math.round(progress * 100) + '%';
    wrap.querySelector('#sliderV').textContent = Math.round(progress * 100) + '%';
    wrap.querySelector('#stageSlider').value = Math.round(progress * 100);
  }

  function setPlay(on) {
    wrap.querySelector('.btn-play').textContent = on ? '⏸ Pause' : '▶ Play';
  }

  wrap.querySelector('.btn-play').addEventListener('click', () => {
    if (progress >= 1) progress = 0;
    playing = !playing; setPlay(playing); updateUI();
  });
  wrap.querySelector('.btn-step').addEventListener('click', () => {
    playing = false; setPlay(false);
    for (const s of STAGES) { if (s.t > progress + 0.001) { progress = s.t; break; } }
    if (progress >= 0.999) progress = 1;
    updateUI();
  });
  wrap.querySelector('#stageSlider').addEventListener('input', e => {
    progress = parseInt(e.target.value, 10) / 100;
    playing = false; setPlay(false); updateUI();
  });
  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    progress = 0; playing = false; setPlay(false); updateUI();
  });
  wrap.querySelector('.back-btn').addEventListener('click', () => window.goBack());

  let ro = null;
  if ('ResizeObserver' in window) { ro = new ResizeObserver(resize); ro.observe(canvas); }
  resize(); updateUI();
  lastT = performance.now();
  animId = requestAnimationFrame(loop);
  return function cleanup() {
    if (animId) cancelAnimationFrame(animId);
    if (ro) ro.disconnect();
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    document.body.style.overflow = prevOverflow;
  };
}
