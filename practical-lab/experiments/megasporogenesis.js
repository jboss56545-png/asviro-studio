export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0">
        <div class="text-xs font-black text-slate-100 truncate">Megasporogenesis</div>
        <div class="text-[9px] text-slate-500 truncate">Class 12 Bio - Ch 1</div>
      </div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2.5 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Stage</div>
        <div class="text-[11px] font-black text-emerald-300" id="stageText">Megaspore Mother Cell</div>
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
          <b class="text-emerald-400">Ovule T.S.:</b> Layers: Funicle, Integuments, Micropyle, Nucellus. Inside: <b>Megaspore Mother Cell (2n)</b> → Meiosis → 4 megaspores → 1 functional → 8-nucleate Embryo sac.
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
  let W = 0, H = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    W = rect.width; H = rect.height;
  }

  let progress = 0, playing = false, animId = null, lastT = 0;

  const STAGES = [
    { t: 0.00, label: 'Megaspore Mother Cell (2n)' },
    { t: 0.20, label: 'Meiosis I' },
    { t: 0.38, label: 'Meiosis II — 4 megaspores' },
    { t: 0.55, label: '3 degenerate' },
    { t: 0.72, label: 'Free nuclear divisions' },
    { t: 0.90, label: '8-nucleate embryo sac' },
    { t: 1.00, label: '7-celled, 8-nucleate' }
  ];

  function stageLabel(p) {
    for (let i = STAGES.length - 1; i >= 0; i--) if (p >= STAGES[i].t) return STAGES[i].label;
    return STAGES[0].label;
  }

  function drawBackground() {
    const g = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W,H) * 0.8);
    g.addColorStop(0, '#0f172a');
    g.addColorStop(1, '#030712');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function drawOvule() {
    const cx = W / 2, cy = H / 2;
    const ovR = Math.min(W, H) * 0.34;

    // Funicle (stalk coming from bottom)
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, cy + ovR * 1.3);
    ctx.lineTo(cx, cy + ovR * 1.9);
    ctx.stroke();

    // Outer integument
    const og = ctx.createRadialGradient(cx - ovR*0.3, cy - ovR*0.3, ovR*0.1, cx, cy, ovR);
    og.addColorStop(0, '#22c55e');
    og.addColorStop(0.7, '#166534');
    og.addColorStop(1, '#052e16');
    ctx.fillStyle = og;
    ctx.beginPath();
    ctx.ellipse(cx, cy, ovR, ovR * 1.15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Inner integument
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.ellipse(cx, cy, ovR * 0.9, ovR * 1.05, 0, 0, Math.PI * 2);
    ctx.fill();

    // Nucellus
    const ng = ctx.createRadialGradient(cx - ovR*0.2, cy - ovR*0.2, ovR*0.05, cx, cy, ovR*0.8);
    ng.addColorStop(0, '#dcfce7');
    ng.addColorStop(1, '#86efac');
    ctx.fillStyle = ng;
    ctx.beginPath();
    ctx.ellipse(cx, cy, ovR * 0.78, ovR * 0.92, 0, 0, Math.PI * 2);
    ctx.fill();

    // Micropyle (small opening at top)
    ctx.fillStyle = 'rgba(15,23,42,0.85)';
    ctx.beginPath();
    ctx.ellipse(cx, cy - ovR * 1.1, ovR * 0.08, ovR * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(251,191,36,0.9)';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Micropyle', cx + ovR * 0.5, cy - ovR * 1.0);
    ctx.strokeStyle = 'rgba(251,191,36,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx + ovR * 0.1, cy - ovR * 1.05);
    ctx.lineTo(cx + ovR * 0.45, cy - ovR * 1.0);
    ctx.stroke();

    // Labels for layers (left side)
    ctx.textAlign = 'right';
    ctx.fillStyle = '#86efac';
    ctx.fillText('Outer integument', cx - ovR * 1.05, cy - ovR * 0.4);
    ctx.fillStyle = '#bbf7d0';
    ctx.fillText('Inner integument', cx - ovR * 1.05, cy - ovR * 0.2);
    ctx.fillStyle = '#065f46';
    ctx.fillText('Nucellus', cx - ovR * 0.9, cy + ovR * 0.1);

    // Draw inner content
    drawEmbryoSacContent(cx, cy, ovR);
  }

  function drawEmbryoSacContent(cx, cy, ovR) {
    const t = progress;
    const nucleus = { x: cx, y: cy + ovR * 0.05 };

    if (t < 0.18) {
      // MMC - single large cell
      const g = ctx.createRadialGradient(nucleus.x - 3, nucleus.y - 3, 1, nucleus.x, nucleus.y, ovR * 0.28);
      g.addColorStop(0, '#fef3c7');
      g.addColorStop(1, '#d97706');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(nucleus.x, nucleus.y, ovR * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#78350f';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('2n', nucleus.x, nucleus.y);
    }
    else if (t < 0.38) {
      // Meiosis I - two cells
      const phase = Math.min(1, (t - 0.18) / 0.2);
      const sep = 4 + phase * ovR * 0.15;
      for (let i = 0; i < 2; i++) {
        const ox = (i - 0.5) * sep * 2;
        const g = ctx.createRadialGradient(nucleus.x + ox - 2, nucleus.y - 2, 0.5, nucleus.x + ox, nucleus.y, ovR * 0.16);
        g.addColorStop(0, '#fef3c7');
        g.addColorStop(1, '#d97706');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(nucleus.x + ox, nucleus.y, ovR * 0.14, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    else if (t < 0.55) {
      // 4 megaspores in a row
      const phase = Math.min(1, (t - 0.38) / 0.17);
      for (let i = 0; i < 4; i++) {
        const ox = (i - 1.5) * ovR * 0.15;
        const alpha = 1;
        const g = ctx.createRadialGradient(nucleus.x + ox - 2, nucleus.y - 2, 0.5, nucleus.x + ox, nucleus.y, ovR * 0.1);
        g.addColorStop(0, '#fef3c7');
        g.addColorStop(1, '#d97706');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(nucleus.x + ox, nucleus.y, ovR * 0.09, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    else if (t < 0.72) {
      // 3 degenerate (fade out), 1 functional (chalazal end - bottom)
      const phase = Math.min(1, (t - 0.55) / 0.17);
      // 3 degenerating (micropylar end - top)
      for (let i = 0; i < 3; i++) {
        const ox = (i - 1) * ovR * 0.15;
        ctx.globalAlpha = 1 - phase * 0.9;
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(nucleus.x + ox, nucleus.y - ovR * 0.15, ovR * 0.07 * (1 - phase * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // 1 functional (bottom)
      const g = ctx.createRadialGradient(nucleus.x - 3, nucleus.y + ovR * 0.15 - 3, 1, nucleus.x, nucleus.y + ovR * 0.15, ovR * 0.15);
      g.addColorStop(0, '#fef3c7');
      g.addColorStop(1, '#d97706');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(nucleus.x, nucleus.y + ovR * 0.15, ovR * 0.13, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    else {
      // 8-nucleate embryo sac - oval shape inside
      const phase = Math.min(1, (t - 0.72) / 0.28);
      const sacW = ovR * 0.55 * (0.7 + phase * 0.3);
      const sacH = ovR * 0.7 * (0.7 + phase * 0.3);

      // Embryo sac outline
      ctx.strokeStyle = 'rgba(217,119,6,0.5)';
      ctx.setLineDash([4, 3]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(nucleus.x, nucleus.y, sacW, sacH, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Micropylar end (top): 2 synergids + 1 egg
      const eggY = nucleus.y - sacH * 0.6;
      // Synergid 1
      drawCell(nucleus.x - sacW * 0.35, eggY, ovR * 0.09, '#a7f3d0');
      // Synergid 2
      drawCell(nucleus.x + sacW * 0.35, eggY, ovR * 0.09, '#a7f3d0');
      // Egg cell (center, bigger)
      drawCell(nucleus.x, eggY + ovR * 0.08, ovR * 0.12, '#fef3c7');

      // Central cell: 2 polar nuclei
      drawCell(nucleus.x - ovR * 0.08, nucleus.y + ovR * 0.05, ovR * 0.09, '#fcd34d');
      drawCell(nucleus.x + ovR * 0.08, nucleus.y + ovR * 0.05, ovR * 0.09, '#fcd34d');

      // Chalazal end (bottom): 3 antipodals
      const antY = nucleus.y + sacH * 0.6;
      for (let i = 0; i < 3; i++) {
        const ox = (i - 1) * sacW * 0.3;
        drawCell(nucleus.x + ox, antY, ovR * 0.08, '#c4b5fd');
      }

      // Labels at end (100%)
      if (t > 0.92) {
        ctx.fillStyle = 'rgba(167,243,208,0.9)';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Synergids', nucleus.x - sacW * 0.35, eggY - ovR * 0.15);
        ctx.fillStyle = 'rgba(254,243,199,0.95)';
        ctx.fillText('Egg', nucleus.x, eggY + ovR * 0.22);
        ctx.fillStyle = 'rgba(252,211,77,0.95)';
        ctx.fillText('Polar nuclei', nucleus.x, nucleus.y - ovR * 0.08);
        ctx.fillStyle = 'rgba(196,181,253,0.95)';
        ctx.fillText('Antipodals', nucleus.x, antY + ovR * 0.15);
      }
    }
  }

  function drawCell(x, y, r, color) {
    const g = ctx.createRadialGradient(x - r*0.3, y - r*0.3, r*0.1, x, y, r);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.5, color);
    g.addColorStop(1, shade(color, -40));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  function shade(hex, amt) {
    // hex to rgb
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    r = Math.max(0, Math.min(255, r + amt));
    g = Math.max(0, Math.min(255, g + amt));
    b = Math.max(0, Math.min(255, b + amt));
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
  }

  function render() {
    drawBackground();
    drawOvule();
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
      progress += dt * 0.15;
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
    playing = !playing; setPlayBtn(playing); updateUI();
  });
  wrap.querySelector('.btn-step').addEventListener('click', () => {
    playing = false; setPlayBtn(false);
    for (const s of STAGES) { if (s.t > progress + 0.001) { progress = s.t; break; } }
    if (progress >= 0.999) progress = 1;
    updateUI();
  });
  wrap.querySelector('#stageSlider').addEventListener('input', (e) => {
    progress = parseInt(e.target.value, 10) / 100;
    playing = false; setPlayBtn(false); updateUI();
  });
  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    progress = 0; playing = false; setPlayBtn(false); updateUI();
  });
  wrap.querySelector('.back-btn').addEventListener('click', () => window.goBack());

  let ro = null;
  if ('ResizeObserver' in window) {
    ro = new ResizeObserver(resize); ro.observe(canvas);
  }
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
