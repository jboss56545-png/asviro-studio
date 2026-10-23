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
        <div class="text-xs font-black text-slate-100 truncate">Seed & Fruit Development</div>
        <div class="text-[9px] text-slate-500 truncate">Class 12 Bio - Ch 1</div>
      </div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 flex items-center justify-center">
        <i class="fa-solid fa-rotate-left text-xs"></i>
      </button>
    </div>

    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full touch-none"></canvas>

      <div class="absolute top-2 left-2 bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1.5 pointer-events-none max-w-[55%]">
        <div class="text-[8px] text-slate-500 uppercase font-bold">Stage</div>
        <div class="text-[11px] font-black text-emerald-300 truncate" id="stageText">Fertilized Ovule</div>
      </div>
      <div class="absolute top-2 right-2 bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1.5 pointer-events-none">
        <div class="text-[8px] text-slate-500 uppercase font-bold">Progress</div>
        <div class="text-[11px] font-black text-cyan-300" id="progText">0%</div>
      </div>

      <div class="absolute bottom-2 left-2 bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1.5 pointer-events-none">
        <div class="text-[8px] text-cyan-400 uppercase font-bold">Ovule to Seed</div>
        <div class="text-[10px] font-bold text-slate-300" id="leftLabel">Ovule</div>
      </div>
      <div class="absolute bottom-2 right-2 bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1.5 pointer-events-none">
        <div class="text-[8px] text-orange-400 uppercase font-bold">Ovary to Fruit</div>
        <div class="text-[10px] font-bold text-slate-300" id="rightLabel">Ovary</div>
      </div>
    </div>

    <div class="bg-slate-900 border-t border-slate-800 p-3 shrink-0 max-h-[42vh] overflow-y-auto space-y-2.5">
      <div>
        <div class="flex justify-between mb-1">
          <label class="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Development Timeline</label>
          <span class="text-[11px] font-black text-emerald-400" id="sliderVal">0%</span>
        </div>
        <input type="range" id="stageSlider" min="0" max="100" step="1" value="0" class="w-full accent-emerald-500">
      </div>

      <div class="bg-slate-950/60 rounded-xl p-3 border border-slate-800">
        <div class="text-[10px] font-black text-slate-100 mb-1.5">What happens?</div>
        <ol class="text-[10px] text-slate-400 leading-relaxed space-y-0.5 list-decimal list-inside">
          <li><b class="text-cyan-400">Zygote</b> divides mitotically</li>
          <li>Develops through <b>proembryo</b> stages</li>
          <li>Reaches <b>globular</b> → <b>heart</b> → <b>torpedo</b> shape</li>
          <li><b>Cotyledons</b> (seed leaves) form</li>
          <li>Ovule coat hardens into <b>seed coat</b></li>
          <li>Ovary wall thickens into <b>pericarp</b></li>
          <li>Ovary grows and ripens into <b>fruit</b></li>
        </ol>
      </div>

      <div class="grid grid-cols-3 gap-1.5">
        <button type="button" class="btn-play py-2.5 rounded-xl text-[10px] font-black bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 flex items-center justify-center gap-1">
          <i class="fa-solid fa-play text-[10px]"></i> Play
        </button>
        <button type="button" class="btn-step py-2.5 rounded-xl text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center gap-1">
          <i class="fa-solid fa-forward-step text-[10px]"></i> Step
        </button>
        <button type="button" class="btn-labels py-2.5 rounded-xl text-[10px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center gap-1">
          <i class="fa-solid fa-tag text-[10px]"></i> Labels
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

  let progress = 0;
  let playing = false;
  let animId = null;
  let lastT = 0;
  let showLabels = true;

  const STAGES = [
    { t: 0.00, label: 'Fertilized Ovule' },
    { t: 0.12, label: 'Proembryo (2-cell)' },
    { t: 0.24, label: 'Globular Embryo' },
    { t: 0.40, label: 'Heart-shaped Embryo' },
    { t: 0.55, label: 'Torpedo Stage' },
    { t: 0.72, label: 'Mature Embryo' },
    { t: 0.88, label: 'Seed Coat Formation' },
    { t: 1.00, label: 'Ripe Seed + Fruit' }
  ];

  function getStageLabel(p) {
    for (let i = STAGES.length - 1; i >= 0; i--) {
      if (p >= STAGES[i].t) return STAGES[i].label;
    }
    return STAGES[0].label;
  }

  // ---------- Drawing ----------
  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0a0f1a');
    g.addColorStop(1, '#030712');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // divider
    ctx.strokeStyle = 'rgba(100,116,139,0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawArrow(x1, y1, x2, y2) {
    ctx.fillStyle = 'rgba(148,163,184,0.4)';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x2 - 4, y2 - 4);
    ctx.lineTo(x2 + 4, y2 - 4);
    ctx.closePath();
    ctx.fill();
  }

  // -------- LEFT: Ovule to Seed --------
  function drawOvuleToSeed() {
    const cx = W * 0.25;
    const cy = H * 0.5;

    // Ovule size grows slightly then shrinks as it matures into a hard seed
    const ovuleR = 50 + Math.sin(progress * Math.PI) * 8;

    // Ovule wall (integuments -> seed coat)
    // Color shifts from green to brown as it matures
    const coatProgress = Math.min(1, progress / 0.88);
    const coatR = Math.round(34 + coatProgress * 90);
    const coatG = Math.round(140 - coatProgress * 60);
    const coatB = Math.round(60 - coatProgress * 20);
    const coatColor = 'rgb(' + coatR + ',' + coatG + ',' + coatB + ')';

    // Outer coat
    ctx.fillStyle = coatColor;
    ctx.beginPath();
    ctx.arc(cx, cy, ovuleR, 0, Math.PI * 2);
    ctx.fill();

    // Texture/thickness — draw ring lines as it matures
    if (progress > 0.5) {
      const thick = (progress - 0.5) / 0.5;
      ctx.strokeStyle = 'rgba(0,0,0,' + (0.25 * thick) + ')';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, ovuleR - 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, ovuleR - 7, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Inner cavity (nucellus/endosperm)
    ctx.fillStyle = 'rgba(5,46,22,0.5)';
    ctx.beginPath();
    ctx.arc(cx, cy, ovuleR * 0.78, 0, Math.PI * 2);
    ctx.fill();

    // ----- Embryo development inside -----
    drawEmbryo(cx, cy, ovuleR);

    // Labels
    if (showLabels) {
      ctx.fillStyle = 'rgba(148,163,184,0.75)';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (progress < 0.5) {
        ctx.fillText('Ovule', cx, cy - ovuleR - 14);
        ctx.fillText('Integuments', cx, cy + ovuleR + 14);
      } else {
        ctx.fillStyle = 'rgba(251,191,36,0.9)';
        ctx.fillText('Seed Coat', cx, cy - ovuleR - 14);
      }
    }
  }

  function drawEmbryo(cx, cy, ovuleR) {
    const innerR = ovuleR * 0.7;

    if (progress < 0.12) {
      // Zygote - single cell
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.arc(cx, cy + innerR * 0.2, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (progress < 0.24) {
      // Proembryo 2-4 cells
      const cells = progress < 0.18 ? 2 : 4;
      const positions = cells === 2
        ? [[-6, innerR * 0.2], [6, innerR * 0.2]]
        : [[-8, innerR * 0.15], [8, innerR * 0.15], [-3, innerR * 0.3], [3, innerR * 0.3]];
      positions.forEach(p => {
        ctx.fillStyle = '#22d3ee';
        ctx.beginPath();
        ctx.arc(cx + p[0], cy + p[1], 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    } else if (progress < 0.40) {
      // Globular embryo
      const size = 12 + (progress - 0.24) * 40;
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.arc(cx, cy + innerR * 0.2, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Small dots inside
      ctx.fillStyle = 'rgba(15,23,42,0.5)';
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * size * 0.4, cy + innerR * 0.2 + Math.sin(a) * size * 0.4, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (progress < 0.55) {
      // Heart-shaped embryo
      const size = 18;
      const cyH = cy + innerR * 0.2;
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      // Heart using bezier curves
      ctx.moveTo(cx, cyH + size * 0.6);
      ctx.bezierCurveTo(cx - size * 1.2, cyH - size * 0.4, cx - size * 0.5, cyH - size * 1.1, cx, cyH - size * 0.3);
      ctx.bezierCurveTo(cx + size * 0.5, cyH - size * 1.1, cx + size * 1.2, cyH - size * 0.4, cx, cyH + size * 0.6);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (progress < 0.72) {
      // Torpedo stage - elongated with 2 cotyledons visible
      const size = 20 + (progress - 0.55) * 30;
      const cyT = cy + innerR * 0.2;

      // Main body
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.ellipse(cx, cyT, size * 1.3, size * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Two cotyledon lobes
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.ellipse(cx - size * 0.7, cyT - 4, size * 0.5, size * 0.32, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx + size * 0.7, cyT - 4, size * 0.5, size * 0.32, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (showLabels) {
        ctx.fillStyle = 'rgba(16,185,129,0.9)';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Cotyledons', cx, cyT - 32);
      }
    } else {
      // Mature embryo
      const size = 26;
      const cyM = cy + innerR * 0.2;

      // Body
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.ellipse(cx, cyM, size * 1.5, size * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Two cotyledons (green)
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.ellipse(cx - size * 0.8, cyM - 5, size * 0.65, size * 0.4, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx + size * 0.8, cyM - 5, size * 0.65, size * 0.4, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Radicle (root tip) - small triangle at bottom
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.moveTo(cx, cyM + size * 0.8);
      ctx.lineTo(cx - 5, cyM + size * 0.4);
      ctx.lineTo(cx + 5, cyM + size * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Plumule (shoot tip) at top center
      ctx.fillStyle = '#84cc16';
      ctx.beginPath();
      ctx.arc(cx, cyM - size * 0.5, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (showLabels) {
        ctx.fillStyle = 'rgba(234,179,8,0.9)';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Radicle', cx, cyM + size * 1.3);
      }
    }
  }

  // -------- RIGHT: Ovary to Fruit --------
  function drawOvaryToFruit() {
    const cx = W * 0.75;
    const cy = H * 0.5;

    // Ovary grows over time
    const growth = Math.min(1, progress);
    const rx = 45 + growth * 55;
    const ry = 60 + growth * 70;

    // Color shift: green -> yellow -> orange/red
    let r, g, b;
    if (progress < 0.5) {
      const t = progress / 0.5;
      r = Math.round(20 + t * 100);
      g = Math.round(130 + t * 40);
      b = Math.round(30 + t * 0);
    } else if (progress < 0.75) {
      const t = (progress - 0.5) / 0.25;
      r = Math.round(120 + t * 100);
      g = Math.round(170 - t * 40);
      b = Math.round(30 + t * 20);
    } else {
      const t = (progress - 0.75) / 0.25;
      r = Math.round(220 + t * 20);
      g = Math.round(130 - t * 80);
      b = Math.round(50 - t * 20);
    }

    const fruitColor = 'rgb(' + r + ',' + g + ',' + b + ')';

    // Ovary/fruit body
    const g1 = ctx.createRadialGradient(cx - rx * 0.3, cy - ry * 0.3, 5, cx, cy, rx);
    g1.addColorStop(0, 'rgb(' + Math.min(255, r + 40) + ',' + Math.min(255, g + 40) + ',' + (b + 30) + ')');
    g1.addColorStop(1, fruitColor);

    ctx.fillStyle = g1;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.ellipse(cx - rx * 0.35, cy - ry * 0.4, rx * 0.25, ry * 0.3, -0.4, 0, Math.PI * 2);
    ctx.fill();

    // Cross-section at end (show seeds inside) - when progress > 0.85
    if (progress > 0.85) {
      const t = Math.min(1, (progress - 0.85) / 0.15);
      ctx.globalAlpha = t;
      // Cut in half - draw dark inner
      ctx.fillStyle = 'rgba(120,53,15,0.85)';
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx * 0.8, ry * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();

      // Seeds inside (small ovals)
      ctx.fillStyle = '#78350f';
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const sx = cx + Math.cos(angle) * rx * 0.5;
        const sy = cy + Math.sin(angle) * ry * 0.55;
        ctx.beginPath();
        ctx.ellipse(sx, sy, 8, 12, angle, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // Stem at top
    ctx.strokeStyle = '#166534';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, cy - ry);
    ctx.lineTo(cx, cy - ry - 18);
    ctx.stroke();

    // Small leaf
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(cx + 18, cy - ry - 12, 12, 6, -0.4, 0, Math.PI * 2);
    ctx.fill();

    // Labels
    if (showLabels) {
      ctx.fillStyle = 'rgba(148,163,184,0.85)';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (progress < 0.4) {
        ctx.fillText('Ovary', cx, cy - ry - 30);
        ctx.fillText('(immature)', cx, cy - ry - 20);
      } else if (progress < 0.85) {
        ctx.fillText('Developing Fruit', cx, cy - ry - 30);
      } else {
        ctx.fillStyle = 'rgba(251,191,36,0.9)';
        ctx.fillText('Ripe Fruit', cx, cy - ry - 30);
        ctx.fillStyle = 'rgba(120,53,15,1)';
        ctx.fillText('Seeds', cx, cy + ry + 14);
      }
    }
  }

  function drawCenterFlow() {
    // Small arrow in the middle to show relationship
    const midX = W / 2;
    const midY = H * 0.15;
    ctx.fillStyle = 'rgba(100,116,139,0.5)';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Fertilized ovule inside ovary', midX, midY);
  }

  function render() {
    drawBackground();
    drawCenterFlow();
    drawOvuleToSeed();
    drawOvaryToFruit();
  }

  function updateUI() {
    wrap.querySelector('#stageText').textContent = getStageLabel(progress);
    wrap.querySelector('#progText').textContent = Math.round(progress * 100) + '%';
    wrap.querySelector('#sliderVal').textContent = Math.round(progress * 100) + '%';

    // Left / right labels
    if (progress < 0.5) {
      wrap.querySelector('#leftLabel').textContent = 'Ovule';
    } else if (progress < 0.88) {
      wrap.querySelector('#leftLabel').textContent = 'Seed (forming)';
    } else {
      wrap.querySelector('#leftLabel').textContent = 'Seed (mature)';
    }

    if (progress < 0.4) {
      wrap.querySelector('#rightLabel').textContent = 'Ovary';
    } else if (progress < 0.85) {
      wrap.querySelector('#rightLabel').textContent = 'Fruit (growing)';
    } else {
      wrap.querySelector('#rightLabel').textContent = 'Ripe Fruit';
    }
  }

  function loop(t) {
    const dt = Math.min(0.05, (t - lastT) / 1000);
    lastT = t;
    if (playing) {
      progress += dt * 0.18;
      if (progress >= 1) {
        progress = 1;
        playing = false;
        setPlayBtn(false);
      }
      updateUI();
      const sl = wrap.querySelector('#stageSlider');
      if (sl) sl.value = Math.round(progress * 100);
    }
    render();
    animId = requestAnimationFrame(loop);
  }

  function setPlayBtn(isPlaying) {
    const b = wrap.querySelector('.btn-play');
    if (isPlaying) {
      b.innerHTML = '<i class="fa-solid fa-pause text-[10px]"></i> Pause';
    } else {
      b.innerHTML = '<i class="fa-solid fa-play text-[10px]"></i> Play';
    }
  }

  // Slider
  const slider = wrap.querySelector('#stageSlider');
  slider.addEventListener('input', () => {
    progress = parseInt(slider.value, 10) / 100;
    playing = false;
    setPlayBtn(false);
    updateUI();
  });

  // Play button
  wrap.querySelector('.btn-play').addEventListener('click', () => {
    if (progress >= 1) {
      progress = 0;
      slider.value = 0;
      updateUI();
    }
    playing = !playing;
    setPlayBtn(playing);
  });

  // Step button
  wrap.querySelector('.btn-step').addEventListener('click', () => {
    playing = false;
    setPlayBtn(false);
    for (let i = 0; i < STAGES.length; i++) {
      if (STAGES[i].t > progress + 0.001) {
        progress = STAGES[i].t;
        slider.value = Math.round(progress * 100);
        break;
      }
    }
    if (progress >= 0.999) progress = 1;
    updateUI();
  });

  // Labels toggle
  const labelsBtn = wrap.querySelector('.btn-labels');
  labelsBtn.addEventListener('click', () => {
    showLabels = !showLabels;
    labelsBtn.classList.toggle('bg-emerald-500/20', showLabels);
    labelsBtn.classList.toggle('border-emerald-500/40', showLabels);
    labelsBtn.classList.toggle('text-emerald-300', showLabels);
    labelsBtn.classList.toggle('bg-slate-800', !showLabels);
    labelsBtn.classList.toggle('border-slate-700', !showLabels);
    labelsBtn.classList.toggle('text-slate-300', !showLabels);
  });

  // Reset
  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    progress = 0;
    playing = false;
    setPlayBtn(false);
    slider.value = 0;
    updateUI();
  });

  wrap.querySelector('.back-btn').addEventListener('click', () => window.goBack());

  // Init
  let ro = null;
  if ('ResizeObserver' in window) {
    ro = new ResizeObserver(() => { resize(); });
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
