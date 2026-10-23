export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">Gastrulation</div><div class="text-[9px] text-slate-500 truncate">Class 12 Bio - Ch 2</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Stage</div>
        <div class="text-[10px] font-black text-pink-300" id="stageText">Blastula</div>
      </div>
      <div class="absolute top-2 right-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Layers</div>
        <div class="text-[10px] font-black text-cyan-300" id="layerText">1</div>
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
        <b class="text-pink-400">Gastrulation:</b> Blastula → Gastrula. 3 germ layers form: <b class="text-cyan-400">Ectoderm</b> (outer), <b class="text-pink-400">Mesoderm</b> (middle), <b class="text-emerald-400">Endoderm</b> (inner). Archenteron = primitive gut cavity, blastopore = opening.
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
    { t: 0.00, label: 'Blastula', layers: 1 },
    { t: 0.20, label: 'Invagination starts', layers: 2 },
    { t: 0.40, label: 'Blastopore forming', layers: 2 },
    { t: 0.55, label: 'Archenteron forming', layers: 2 },
    { t: 0.70, label: 'Mesoderm appearing', layers: 3 },
    { t: 0.85, label: '3 germ layers', layers: 3 },
    { t: 1.00, label: 'Gastrula complete', layers: 3 }
  ];

  function stageInfo(p) {
    for (let i = STAGES.length - 1; i >= 0; i--) if (p >= STAGES[i].t) return STAGES[i];
    return STAGES[0];
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#1e1b2e'); bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const cx = W / 2, cy = H / 2;
    const R = Math.min(W, H) * 0.28;
    const t = progress;

    // Blastula (hollow ball) with blastocoel
    if (t < 0.2) {
      // Outer single cell layer
      const numCells = 30;
      for (let i = 0; i < numCells; i++) {
        const a = (i / numCells) * Math.PI * 2;
        const px = cx + Math.cos(a) * R;
        const py = cy + Math.sin(a) * R;
        ctx.fillStyle = '#db2777';
        ctx.beginPath(); ctx.arc(px, py, 10, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      // Blastocoel (cavity)
      const bg2 = ctx.createRadialGradient(cx, cy, 3, cx, cy, R - 10);
      bg2.addColorStop(0, 'rgba(59,130,246,0.35)');
      bg2.addColorStop(1, 'rgba(30,64,175,0.15)');
      ctx.fillStyle = bg2;
      ctx.beginPath(); ctx.arc(cx, cy, R - 10, 0, Math.PI * 2); ctx.fill();
      // Label
      ctx.fillStyle = '#3b82f6';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Blastocoel', cx, cy);
    } else {
      // Gastrulation — invagination creates 3 layers
      const invagProgress = Math.min(1, (t - 0.2) / 0.6);

      // Outer ectoderm (still single-cell ring)
      const numCells = 30;
      for (let i = 0; i < numCells; i++) {
        const a = (i / numCells) * Math.PI * 2;
        // Bottom cells start to invaginate
        let r = R;
        let py = cy + Math.sin(a) * r;
        if (Math.sin(a) > 0.6 && invagProgress > 0) {
          // Push inward for invagination at bottom
          const push = invagProgress * (sin2(a) * 0.4) * R;
          r = R - push;
        }
        const px = cx + Math.cos(a) * R;
        py = cy + Math.sin(a) * r;
        ctx.fillStyle = '#22d3ee'; // Ectoderm
        ctx.beginPath(); ctx.arc(px, py, 10, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Archenteron cavity (primitive gut)
      if (invagProgress > 0.2) {
        const archR = R * (0.3 + invagProgress * 0.4);
        const archGrad = ctx.createRadialGradient(cx, cy + R * 0.2, 3, cx, cy + R * 0.2, archR);
        archGrad.addColorStop(0, 'rgba(16,185,129,0.5)');
        archGrad.addColorStop(1, 'rgba(5,150,105,0.2)');
        ctx.fillStyle = archGrad;
        ctx.beginPath();
        ctx.ellipse(cx, cy + R * 0.15, archR * 0.7, archR * 0.9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(16,185,129,0.7)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Blastopore (opening at bottom)
      if (invagProgress > 0.3) {
        const bpAlpha = Math.min(1, (invagProgress - 0.3) / 0.3);
        ctx.fillStyle = `rgba(0,0,0,${bpAlpha * 0.8})`;
        ctx.beginPath();
        ctx.ellipse(cx, cy + R + 5, 20, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(251,191,36,${bpAlpha})`;
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('Blastopore', cx, cy + R + 20);
      }

      // Mesoderm (middle layer) — appears at 0.7+
      if (t > 0.65) {
        const mt = Math.min(1, (t - 0.65) / 0.2);
        // Draw mesoderm cells between ectoderm and endoderm
        const numM = 20;
        for (let i = 0; i < numM; i++) {
          const a = (i / numM) * Math.PI * 2;
          const mr = R - 18 - mt * 8;
          const px = cx + Math.cos(a) * mr;
          const py = cy + Math.sin(a) * mr;
          ctx.fillStyle = `rgba(236,72,153,${0.5 + mt * 0.5})`;
          ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = 'rgba(0,0,0,0.3)';
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      // Endoderm label
      if (t > 0.85) {
        // Endoderm = inner lining of archenteron
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('Endoderm', cx + R + 20, cy + 15);
        ctx.fillStyle = '#ec4899';
        ctx.fillText('Mesoderm', cx + R + 20, cy);
        ctx.fillStyle = '#22d3ee';
        ctx.fillText('Ectoderm', cx + R + 20, cy - 15);
      }
    }

    // Stage label
    ctx.fillStyle = 'rgba(148,163,184,0.85)';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(stageInfo(progress).label, cx, H - 15);
  }

  function sin2(x) { return Math.sin(x) * Math.sin(x); }

  function loop(t) {
    const dt = Math.min(0.05, (t - lastT) / 1000);
    lastT = t;
    phase += 0.03;
    if (playing) {
      progress += dt * 0.14;
      if (progress >= 1) { progress = 1; playing = false; setPlay(false); }
      updateUI();
    }
    draw();
    animId = requestAnimationFrame(loop);
  }

  function updateUI() {
    const info = stageInfo(progress);
    wrap.querySelector('#stageText').textContent = info.label;
    wrap.querySelector('#layerText').textContent = info.layers;
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
