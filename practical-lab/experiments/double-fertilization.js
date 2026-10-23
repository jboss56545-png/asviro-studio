export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-slate-800 bg-slate-900 shrink-0">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-slate-950 border border-slate-800 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold">
        <i class="fa-solid fa-arrow-left text-[10px]"></i> Back
      </button>
      <div class="flex-1 text-center min-w-0">
        <div class="text-xs font-black text-slate-100 truncate">Double Fertilization</div>
        <div class="text-[9px] text-slate-500 truncate">Class 12 Bio - Ch 1</div>
      </div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 flex items-center justify-center">
        <i class="fa-solid fa-rotate-left text-xs"></i>
      </button>
    </div>

    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full touch-none"></canvas>

      <div class="absolute top-2 left-2 bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1.5 pointer-events-none">
        <div class="text-[8px] text-slate-500 uppercase font-bold">Stage</div>
        <div class="text-[11px] font-black text-emerald-300" id="stageText">Idle</div>
      </div>
      <div class="absolute top-2 right-2 bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1.5 pointer-events-none">
        <div class="text-[8px] text-slate-500 uppercase font-bold">Progress</div>
        <div class="text-[11px] font-black text-cyan-300" id="progText">0%</div>
      </div>
    </div>

    <div class="bg-slate-900 border-t border-slate-800 p-3 shrink-0 max-h-[40vh] overflow-y-auto space-y-2.5">
      <div class="bg-slate-950/60 rounded-xl p-3 border border-slate-800">
        <div class="text-[10px] font-black text-slate-100 mb-1.5">Steps in Double Fertilization:</div>
        <ol class="text-[10px] text-slate-400 leading-relaxed space-y-1 list-decimal list-inside">
          <li>Pollen lands on stigma → germinates</li>
          <li>Pollen tube grows through style</li>
          <li>Two male gametes released into embryo sac</li>
          <li><b class="text-emerald-400">Syngamy:</b> Gamete 1 + Egg → Zygote (2n)</li>
          <li><b class="text-amber-400">Triple fusion:</b> Gamete 2 + 2 Polar nuclei → Endosperm (3n)</li>
        </ol>
      </div>

      <div class="grid grid-cols-2 gap-1.5">
        <button type="button" class="btn-play py-3 rounded-xl text-[10px] font-black bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 flex items-center justify-center gap-1.5">
          <i class="fa-solid fa-play text-[11px]"></i> Play Animation
        </button>
        <button type="button" class="btn-step py-3 rounded-xl text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center gap-1.5">
          <i class="fa-solid fa-forward-step text-[11px]"></i> Step
        </button>
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
    W = rect.width;
    H = rect.height;
  }

  let progress = 0;       // 0 to 1
  let playing = false;
  let animId = null;
  let lastT = 0;

  // Layout constants (relative)
  function layout() {
    // computed on the fly based on W, H
  }

  const STAGES = [
    { t: 0.00, label: 'Idle' },
    { t: 0.05, label: 'Pollen on stigma' },
    { t: 0.25, label: 'Pollen tube growing' },
    { t: 0.55, label: 'Gametes released' },
    { t: 0.75, label: 'Syngamy' },
    { t: 0.95, label: 'Triple fusion' },
    { t: 1.00, label: 'Zygote + Endosperm' }
  ];

  function getStage(p) {
    for (let i = STAGES.length - 1; i >= 0; i--) {
      if (p >= STAGES[i].t) return STAGES[i].label;
    }
    return 'Idle';
  }

  function drawBackground() {
    // gradient
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0a0f1a');
    g.addColorStop(1, '#030712');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function drawStyle() {
    // Style of the pistil (vertical tube going down from stigma at top)
    const sx = W / 2;
    const topY = H * 0.05;
    const botY = H * 0.82;
    const tubeW = 20;

    // outer style
    ctx.fillStyle = '#166534';
    ctx.beginPath();
    ctx.roundRect
      ? ctx.roundRect(sx - tubeW, topY, tubeW * 2, botY - topY, 8)
      : ctx.rect(sx - tubeW, topY, tubeW * 2, botY - topY);
    ctx.fill();

    // inner hollow (pollen tube will pass through)
    ctx.fillStyle = '#052e16';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(sx - 8, topY + 4, 16, botY - topY - 8, 6);
    } else {
      ctx.rect(sx - 8, topY + 4, 16, botY - topY - 8);
    }
    ctx.fill();
  }

  function drawStigma() {
    // Stigma (purple head) on top
    const sx = W / 2;
    const sy = H * 0.05;

    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.arc(sx, sy, 32, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#c084fc';
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(sx + Math.cos(a) * 26, sy + Math.sin(a) * 26, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // pollen grain on stigma (appears after 0.05)
    if (progress >= 0.05) {
      const pollenR = progress > 0.15 ? 8 : 10;
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(sx + 8, sy + 4, pollenR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // germinating pollen - small dot inside
      if (progress > 0.1) {
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(sx + 8, sy + 4, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Label
    ctx.fillStyle = '#c084fc';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Stigma', sx, sy - 46);
  }

  function drawPollenTube() {
    // Pollen tube grows from stigma down to ovary (progress 0.15 to 0.55)
    if (progress < 0.15) return;
    const sx = W / 2;
    const topY = H * 0.05 + 20;
    const botY = H * 0.82;
    const growth = Math.min(1, (progress - 0.15) / 0.4);
    const endY = topY + (botY - topY - 20) * growth;

    // Tube
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx + 8, topY);
    ctx.lineTo(sx + 8, endY);
    ctx.stroke();

    // Glow
    ctx.strokeStyle = 'rgba(251,191,36,0.35)';
    ctx.lineWidth = 12;
    ctx.stroke();

    // Growing tip
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(sx + 8, endY, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawEmbryoSac() {
    // Ovary at bottom with embryo sac
    const cx = W / 2;
    const cy = H * 0.87;
    const rx = 90;
    const ry = 55;

    // Ovary outer
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Embryo sac (inner)
    ctx.fillStyle = 'rgba(5,46,22,0.7)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx - 14, ry - 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Egg cell (left)
    const eggX = cx - 32;
    const eggY = cy - 4;
    const eggFused = progress >= 0.75;
    ctx.fillStyle = eggFused ? '#10b981' : '#22d3ee';
    ctx.beginPath();
    ctx.arc(eggX, eggY, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Polar nuclei (center-right) - 2 nuclei
    const p1X = cx + 14;
    const p1Y = cy - 10;
    const p2X = cx + 34;
    const p2Y = cy + 6;
    const polFused = progress >= 0.95;
    ctx.fillStyle = polFused ? '#f59e0b' : '#94a3b8';
    ctx.beginPath();
    ctx.arc(p1X, p1Y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(p2X, p2Y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Labels
    ctx.fillStyle = eggFused ? '#10b981' : '#22d3ee';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(eggFused ? 'Zygote (2n)' : 'Egg', eggX, eggY - 26);

    ctx.fillStyle = polFused ? '#f59e0b' : '#94a3b8';
    ctx.fillText(polFused ? 'Endosperm (3n)' : 'Polar nuclei', cx + 26, cy - 30);
  }

  function drawGametes() {
    // Two male gametes released into embryo sac (progress 0.55+)
    if (progress < 0.55) return;
    const cx = W / 2;
    const cy = H * 0.87;
    const sx = W / 2 + 8; // pollen tube x
    const tubeEndY = H * 0.82;

    // Gamete 1 -> Egg
    const eggX = cx - 32;
    const eggY = cy - 4;
    const t1 = Math.min(1, Math.max(0, (progress - 0.55) / 0.2));
    const g1x = sx + (eggX - sx) * t1;
    const g1y = tubeEndY + (eggY - tubeEndY) * t1;

    // Gamete 2 -> Polar nuclei
    const p1X = cx + 14;
    const p1Y = cy - 10;
    const t2 = Math.min(1, Math.max(0, (progress - 0.55) / 0.4));
    const g2x = sx + (p1X - sx) * t2;
    const g2y = tubeEndY + (p1Y - tubeEndY) * t2;

    // Draw gamete 1 (before fusion at 0.75)
    if (progress < 0.75) {
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(g1x, g1y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Draw gamete 2 (before fusion at 0.95)
    if (progress < 0.95) {
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(g2x, g2y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  function drawFusionEffects() {
    // Syngamy effect (progress ~0.75)
    if (progress >= 0.72 && progress < 0.85) {
      const cx = W / 2 - 32;
      const cy = H * 0.87 - 4;
      const burst = (progress - 0.72) / 0.13;
      ctx.strokeStyle = `rgba(16,185,129,${1 - burst})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, 15 + burst * 25, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Triple fusion effect (progress ~0.95)
    if (progress >= 0.92 && progress < 1.0) {
      const cx = W / 2 + 24;
      const cy = H * 0.87 - 2;
      const burst = (progress - 0.92) / 0.08;
      ctx.strokeStyle = `rgba(245,158,11,${1 - burst})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, 20 + burst * 30, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function render() {
    drawBackground();
    drawStyle();
    drawEmbryoSac();
    drawPollenTube();
    drawGametes();
    drawStigma();
    drawFusionEffects();
  }

  function updateProgressUI() {
    wrap.querySelector('#stageText').textContent = getStage(progress);
    wrap.querySelector('#progText').textContent = Math.round(progress * 100) + '%';
  }

  let playSpeed = 0.15; // per second

  function loop(t) {
    const dt = Math.min(0.05, (t - lastT) / 1000);
    lastT = t;
    if (playing) {
      progress += dt * playSpeed;
      if (progress >= 1) {
        progress = 1;
        playing = false;
        setPlayBtn(false);
      }
      updateProgressUI();
    }
    render();
    animId = requestAnimationFrame(loop);
  }

  function setPlayBtn(isPlaying) {
    const b = wrap.querySelector('.btn-play');
    if (isPlaying) {
      b.innerHTML = '<i class="fa-solid fa-pause text-[11px]"></i> Pause';
    } else {
      b.innerHTML = '<i class="fa-solid fa-play text-[11px]"></i> Play Animation';
    }
  }

  wrap.querySelector('.btn-play').addEventListener('click', () => {
    if (progress >= 1) progress = 0;
    playing = !playing;
    setPlayBtn(playing);
    updateProgressUI();
  });

  wrap.querySelector('.btn-step').addEventListener('click', () => {
    playing = false;
    setPlayBtn(false);
    // Jump to next stage
    for (let i = 0; i < STAGES.length; i++) {
      if (STAGES[i].t > progress + 0.001) {
        progress = STAGES[i].t;
        break;
      }
    }
    if (progress >= 0.999) progress = 1;
    updateProgressUI();
  });

  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    progress = 0;
    playing = false;
    setPlayBtn(false);
    updateProgressUI();
  });

  wrap.querySelector('.back-btn').addEventListener('click', () => window.goBack());

  let ro = null;
  if ('ResizeObserver' in window) {
    ro = new ResizeObserver(() => { resize(); layout(); });
    ro.observe(canvas);
  }
  resize();
  layout();
  lastT = performance.now();
  animId = requestAnimationFrame(loop);

  return function cleanup() {
    if (animId) cancelAnimationFrame(animId);
    if (ro) ro.disconnect();
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    document.body.style.overflow = prevOverflow;
  };
}
