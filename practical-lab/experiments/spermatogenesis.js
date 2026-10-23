export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">Spermatogenesis</div><div class="text-[9px] text-slate-500 truncate">Class 12 Bio - Ch 2</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Stage</div>
        <div class="text-[10px] font-black text-emerald-300" id="stageText">Spermatogonium</div>
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
        <b class="text-emerald-400">Spermatogenesis:</b> Spermatogonium (2n) → Primary spermatocyte (2n) → Meiosis I → 2 Secondary spermatocytes (n) → Meiosis II → 4 Spermatids (n) → Spermatozoa. FSH + Testosterone control.
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
    { t: 0.00, label: 'Spermatogonium (2n)' },
    { t: 0.15, label: 'Primary Spermatocyte (2n)' },
    { t: 0.35, label: 'Meiosis I' },
    { t: 0.50, label: '2 Secondary Spermatocytes (n)' },
    { t: 0.65, label: 'Meiosis II' },
    { t: 0.80, label: '4 Spermatids (n)' },
    { t: 0.92, label: 'Spermiogenesis' },
    { t: 1.00, label: 'Spermatozoa (n)' }
  ];

  function stageLabel(p) {
    for (let i = STAGES.length - 1; i >= 0; i--) if (p >= STAGES[i].t) return STAGES[i].label;
    return STAGES[0].label;
  }

  function drawBackground() {
    const g = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W, H) * 0.8);
    g.addColorStop(0, '#0f172a'); g.addColorStop(1, '#030712');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  function drawSeminiferousTubule() {
    // Curved tubule shape
    const cx = W / 2, cy = H / 2;
    const tubuleW = W * 0.8;
    const tubuleH = H * 0.6;

    // Outer layer (basement membrane)
    ctx.strokeStyle = 'rgba(251,146,60,0.4)';
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.ellipse(cx, cy, tubuleW * 0.5, tubuleH * 0.5, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Sertoli cells (large pale cells on periphery)
    const sertoliPositions = [];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      sertoliPositions.push({ x: cx + Math.cos(a) * tubuleW * 0.38, y: cy + Math.sin(a) * tubuleH * 0.38 });
    }
    sertoliPositions.forEach(s => {
      ctx.fillStyle = 'rgba(253,224,171,0.5)';
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, 22, 30, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(180,130,30,0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }

  function drawCell(x, y, r, color, label, isPrimary) {
    const g = ctx.createRadialGradient(x - r*0.3, y - r*0.3, r*0.1, x, y, r);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.4, color);
    g.addColorStop(1, shadeColor(color, -50));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (label) {
      ctx.fillStyle = 'rgba(15,23,42,0.9)';
      ctx.font = 'bold ' + Math.max(7, r * 0.5) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x, y);
    }
  }

  function shadeColor(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
    r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
    return '#' + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawBackground();
    drawSeminiferousTubule();

    const cx = W / 2, cy = H / 2;
    const t = progress;

    // Draw based on progress
    if (t < 0.15) {
      // Single spermatogonium (2n, big)
      drawCell(cx, cy, 32, '#22d3ee', '2n', true);
    } else if (t < 0.35) {
      // Primary spermatocyte (bigger)
      const scale = 1 + (t - 0.15) / 0.2 * 0.3;
      drawCell(cx, cy, 32 * scale, '#0ea5e9', '2n', true);
    } else if (t < 0.5) {
      // Meiosis I - chromosomes visible
      const split = (t - 0.35) / 0.15;
      drawCell(cx, cy, 32, '#0ea5e9', '2n', true);
      // Chromosome lines
      ctx.strokeStyle = 'rgba(15,23,42,0.8)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + phase * 0.5;
        const r1 = 8, r2 = 22;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
        ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
        ctx.stroke();
      }
    } else if (t < 0.65) {
      // 2 secondary spermatocytes
      const sep = 55;
      drawCell(cx - sep, cy, 24, '#a855f7', 'n', false);
      drawCell(cx + sep, cy, 24, '#a855f7', 'n', false);
    } else if (t < 0.8) {
      // Meiosis II - 4 spermatids
      const sep = 45;
      drawCell(cx - sep, cy - sep * 0.5, 20, '#ec4899', 'n', false);
      drawCell(cx + sep, cy - sep * 0.5, 20, '#ec4899', 'n', false);
      drawCell(cx - sep, cy + sep * 0.5, 20, '#ec4899', 'n', false);
      drawCell(cx + sep, cy + sep * 0.5, 20, '#ec4899', 'n', false);
    } else if (t < 0.92) {
      // Spermiogenesis - shape change
      const phase2 = (t - 0.8) / 0.12;
      const sep = 45;
      const positions = [[-sep, -sep*0.5], [sep, -sep*0.5], [-sep, sep*0.5], [sep, sep*0.5]];
      positions.forEach((pos, i) => {
        // Head oval
        const headR = 20 - phase2 * 12;
        ctx.fillStyle = '#ec4899';
        ctx.beginPath();
        ctx.ellipse(cx + pos[0], cy + pos[1], headR, headR * 0.75, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Tail (grows)
        if (phase2 > 0.2) {
          const tailLen = phase2 * 50;
          ctx.strokeStyle = '#ec4899';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cx + pos[0] + headR, cy + pos[1]);
          ctx.quadraticCurveTo(cx + pos[0] + headR + tailLen * 0.5, cy + pos[1] + Math.sin(phase * 4 + i) * 5, cx + pos[0] + headR + tailLen, cy + pos[1]);
          ctx.stroke();
        }
      });
    } else {
      // Mature spermatozoa - swimming
      const positions = [[-60, -30], [60, -30], [-60, 30], [60, 30]];
      positions.forEach((pos, i) => {
        const swim = Math.sin(phase * 3 + i) * 5;
        const headX = cx + pos[0] + swim;
        const headY = cy + pos[1] + Math.cos(phase * 2 + i) * 3;
        // Head (oval, pointed)
        ctx.fillStyle = '#ec4899';
        ctx.beginPath();
        ctx.ellipse(headX, headY, 10, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Acrosome cap
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.ellipse(headX - 6, headY, 4, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        // Tail (wavy)
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(headX + 10, headY);
        for (let s = 0; s < 15; s++) {
          const tx = headX + 10 + s * 4;
          const ty = headY + Math.sin(phase * 4 + s * 0.8 + i) * 4;
          ctx.lineTo(tx, ty);
        }
        ctx.stroke();
      });
    }

    // Stage label
    ctx.fillStyle = 'rgba(148,163,184,0.9)';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Seminiferous Tubule (T.S.)', W / 2, H - 15);
  }

  function loop(t) {
    const dt = Math.min(0.05, (t - lastT) / 1000);
    lastT = t;
    phase += 0.02;
    if (playing) {
      progress += dt * 0.18;
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
    playing = !playing;
    setPlay(playing);
    updateUI();
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
