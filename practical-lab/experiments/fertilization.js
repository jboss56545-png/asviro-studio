export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">Fertilization</div><div class="text-[9px] text-slate-500 truncate">Class 12 Bio - Ch 2</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Stage</div>
        <div class="text-[10px] font-black text-pink-300" id="stageText">Sperm approaching</div>
      </div>
      <div class="absolute top-2 right-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Progress</div>
        <div class="text-[10px] font-black text-cyan-300" id="progText">0%</div>
      </div>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 space-y-2" style="backdrop-filter:blur(20px);">
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-pink-400 uppercase">Stage</label><span class="text-[11px] font-black text-pink-400" id="sliderV">0%</span></div>
        <input type="range" id="stageSlider" min="0" max="100" step="1" value="0" class="w-full accent-pink-500">
      </div>
      <div class="grid grid-cols-2 gap-1.5">
        <button type="button" class="btn-play py-2.5 rounded-xl text-[10px] font-black bg-gradient-to-r from-pink-500 to-rose-500 text-slate-950">▶ Play</button>
        <button type="button" class="btn-step py-2.5 rounded-xl text-[10px] font-bold bg-white/5 border border-white/10 text-slate-300">⏭ Step</button>
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[9px] text-slate-400 leading-relaxed">
        <b class="text-pink-400">Fertilization:</b> Sperm penetrates corona radiata → zona pellucida → acrosomal reaction → cortical reaction (block to polyspermy) → fusion of nuclei → Zygote (2n).
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
    { t: 0.00, label: 'Sperm approaching' },
    { t: 0.20, label: 'Corona radiata penetration' },
    { t: 0.40, label: 'Zona pellucida binding' },
    { t: 0.55, label: 'Acrosomal reaction' },
    { t: 0.70, label: 'Membrane fusion' },
    { t: 0.85, label: 'Cortical reaction' },
    { t: 1.00, label: 'Zygote formed (2n)' }
  ];

  function stageLabel(p) {
    for (let i = STAGES.length - 1; i >= 0; i--) if (p >= STAGES[i].t) return STAGES[i].label;
    return STAGES[0].label;
  }

  function drawEgg(cx, cy, R) {
    // Zona pellucida (outer)
    ctx.strokeStyle = 'rgba(251,191,36,0.6)';
    ctx.lineWidth = 8;
    ctx.beginPath(); ctx.arc(cx, cy, R + 8, 0, Math.PI * 2); ctx.stroke();
    // Corona radiata (spiky cells)
    const numC = 30;
    ctx.fillStyle = 'rgba(251,207,232,0.7)';
    for (let i = 0; i < numC; i++) {
      const a = (i / numC) * Math.PI * 2;
      const dx = Math.cos(a) * (R + 18);
      const dy = Math.sin(a) * (R + 18);
      ctx.beginPath();
      ctx.ellipse(cx + dx, cy + dy, 5, 3.5, a, 0, Math.PI * 2);
      ctx.fill();
    }
    // Egg cell (main body)
    const g = ctx.createRadialGradient(cx - R*0.3, cy - R*0.3, R*0.1, cx, cy, R);
    g.addColorStop(0, '#fce7f3');
    g.addColorStop(0.6, '#f472b6');
    g.addColorStop(1, '#9d174d');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
    // Nucleus
    ctx.fillStyle = 'rgba(168,85,247,0.6)';
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.35, 0, Math.PI * 2); ctx.fill();
    // Nucleolus
    ctx.fillStyle = '#a855f7';
    ctx.beginPath(); ctx.arc(cx - R * 0.1, cy - R * 0.1, R * 0.12, 0, Math.PI * 2); ctx.fill();
  }

  function drawSperm(x, y, angle, tailPhase, showAcrosome, stuck) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    // Tail (wavy)
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    for (let s = 0; s < 20; s++) {
      const tx = -8 - s * 3;
      const ty = Math.sin(tailPhase + s * 0.6) * 4;
      ctx.lineTo(tx, ty);
    }
    ctx.stroke();
    // Head (oval)
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Acrosome (cap)
    if (showAcrosome) {
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.ellipse(4, 0, 4, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#1e1b2e'); bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const cx = W / 2 + 40, cy = H / 2;
    const R = Math.min(W, H) * 0.18;

    // Egg
    drawEgg(cx, cy, R);

    const t = progress;

    // Sperm path: comes from left, penetrates
    let spermX, spermY, angle, showAcrosome = false, stuck = false;
    if (t < 0.4) {
      const tt = t / 0.4;
      spermX = cx - R - 200 + tt * (R + 130);
      spermY = cy + Math.sin(tt * Math.PI * 4) * 20;
      angle = 0;
    } else if (t < 0.55) {
      const tt = (t - 0.4) / 0.15;
      spermX = cx - R - 70 + tt * 30;
      spermY = cy + Math.sin(tt * Math.PI * 2) * 5;
      angle = 0;
      showAcrosome = true;
    } else if (t < 0.7) {
      const tt = (t - 0.55) / 0.15;
      spermX = cx - R - 40 + tt * 25;
      spermY = cy;
      angle = 0;
      showAcrosome = true;
      stuck = true;
    } else {
      const tt = (t - 0.7) / 0.3;
      spermX = cx - R - 15 + tt * (R - 5);
      spermY = cy;
      angle = 0;
      showAcrosome = false;
    }

    // Draw other sperm (blocked)
    if (t > 0.85) {
      // Other sperm bouncing off zona
      for (let i = 0; i < 4; i++) {
        const a = -Math.PI * 0.6 - i * 0.3 + Math.sin(phase * 2 + i) * 0.15;
        const sx = cx + Math.cos(a) * (R + 25);
        const sy = cy + Math.sin(a) * (R + 25);
        drawSperm(sx, sy, a + Math.PI, phase * 3 + i * 2, false, false);
      }
    } else if (t > 0.2) {
      // Other sperm approaching
      for (let i = 0; i < 3; i++) {
        const sx = cx - R - 150 - i * 50 + Math.sin(phase * 2 + i) * 10;
        const sy = cy - 40 + i * 40;
        drawSperm(sx, sy, 0, phase * 4 + i * 2, false, false);
      }
    }

    // Main sperm
    drawSperm(spermX, spermY, angle, phase * 5, showAcrosome, stuck);

    // Cortical reaction — burst at membrane
    if (t > 0.85 && t < 0.95) {
      const bt = (t - 0.85) / 0.1;
      ctx.strokeStyle = `rgba(251,191,36,${0.9 - bt * 0.7})`;
      ctx.lineWidth = 3;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const r1 = R + 10;
        const r2 = R + 10 + bt * 40;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
        ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
        ctx.stroke();
      }
    }

    // Zygote — two nuclei merge
    if (t > 0.9) {
      const mt = (t - 0.9) / 0.1;
      // Two pronuclei coming together
      const nDist = 30 * (1 - mt);
      ctx.fillStyle = 'rgba(168,85,247,0.8)';
      ctx.beginPath(); ctx.arc(cx - nDist/2, cy, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(244,114,182,0.9)';
      ctx.beginPath(); ctx.arc(cx + nDist/2, cy, 8, 0, Math.PI * 2); ctx.fill();
      if (mt > 0.9) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ZYGOTE', cx, cy + R + 50);
      }
    }

    // Labels
    ctx.fillStyle = 'rgba(148,163,184,0.7)';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Corona radiata', cx, cy + R + 30);
    ctx.fillText('Zona pellucida', cx, cy - R - 50);
  }

  function loop(t) {
    const dt = Math.min(0.05, (t - lastT) / 1000);
    lastT = t;
    phase += 0.03;
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
