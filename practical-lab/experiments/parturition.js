export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">Parturition (Birth)</div><div class="text-[9px] text-slate-500 truncate">Class 12 Bio - Ch 2</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Stage</div>
        <div class="text-[10px] font-black text-pink-300" id="rStage">Dilation</div>
      </div>
      <div class="absolute top-2 right-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Cervix</div>
        <div class="text-[10px] font-black text-cyan-300" id="rCervix">0 cm</div>
      </div>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 space-y-2" style="backdrop-filter:blur(20px);">
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-pink-400 uppercase">Progress</label><span class="text-[11px] font-black text-pink-400" id="sliderV">0%</span></div>
        <input type="range" id="stageSlider" min="0" max="100" step="1" value="0" class="w-full accent-pink-500">
      </div>
      <div class="grid grid-cols-2 gap-1.5">
        <button type="button" class="btn-play py-2.5 rounded-xl text-[10px] font-black bg-gradient-to-r from-pink-500 to-rose-500 text-slate-950">▶ Play</button>
        <button type="button" class="btn-step py-2.5 rounded-xl text-[10px] font-bold bg-white/5 border border-white/10 text-slate-300">⏭ Step</button>
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[9px] text-slate-400 leading-relaxed">
        <b class="text-pink-400">3 Stages:</b> <span class="text-emerald-400">Dilation</span> (cervix 0→10 cm) → <span class="text-amber-400">Expulsion</span> (baby delivery) → <span class="text-purple-400">Placental</span> (afterbirth). Oxytocin + Relaxin drive it. Positive feedback loop.
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
    { t: 0.00, label: 'Dilation begins', cervix: 0 },
    { t: 0.30, label: 'Dilation mid', cervix: 5 },
    { t: 0.50, label: 'Full dilation', cervix: 10 },
    { t: 0.65, label: 'Crowning', cervix: 10 },
    { t: 0.80, label: 'Expulsion', cervix: 10 },
    { t: 0.90, label: 'Baby delivered', cervix: 10 },
    { t: 1.00, label: 'Placental stage', cervix: 5 }
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

    const cx = W / 2, cy = H * 0.4;
    const uW = Math.min(W * 0.55, 200);
    const uH = Math.min(H * 0.5, 200);
    const t = progress;

    // Uterus (contracting)
    const contraction = Math.sin(phase * 3 + t * 10) * 0.05 + 1;
    // Wall thickness
    ctx.strokeStyle = 'rgba(236,72,153,0.7)';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.ellipse(cx, cy, uW * contraction * 0.8, uH * contraction * 0.6, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Myometrium texture
    ctx.strokeStyle = 'rgba(190,24,93,0.4)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * uW * 0.8, cy + Math.sin(a) * uH * 0.6);
      ctx.lineTo(cx + Math.cos(a) * uW * 0.7, cy + Math.sin(a) * uH * 0.5);
      ctx.stroke();
    }

    // Cervix (opens with dilation)
    const cervixY = cy + uH * 0.6;
    const cervixW = 30;
    const dilation = (stageInfo(t).cervix / 10);
    const openW = cervixW * (1 - dilation) + 4;
    // Left side
    ctx.fillStyle = '#a855f7';
    ctx.fillRect(cx - cervixW - 4, cervixY - 4, cervixW, 18);
    // Right side
    ctx.fillRect(cx + 4, cervixY - 4, cervixW, 18);

    // Vaginal canal
    ctx.fillStyle = 'rgba(217,70,239,0.35)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(cx - cervixW - 4, cervixY + 14, (cervixW + 4) * 2, 90, 8);
    else ctx.rect(cx - cervixW - 4, cervixY + 14, (cervixW + 4) * 2, 90);
    ctx.fill();

    // Baby (moves down through cervix during expulsion)
    let babyY = cy + uH * 0.1;
    let babyScale = 1;
    if (t > 0.5 && t < 0.8) {
      // Descending
      const bt = (t - 0.5) / 0.3;
      babyY = cy + uH * 0.1 + bt * (cervixY + 40 - (cy + uH * 0.1));
      babyScale = 1 - bt * 0.15;
    } else if (t >= 0.8) {
      // Delivered
      babyY = cervixY + 70;
      babyScale = 0.85;
    }

    drawBaby(cx, babyY, babyScale, t > 0.8);

    // Contraction waves
    if (t < 0.8) {
      const waveAlpha = 0.3 + Math.sin(phase * 3) * 0.3;
      ctx.strokeStyle = `rgba(244,63,94,${waveAlpha})`;
      ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        const waveT = ((phase * 0.8 + i * 0.33) % 1);
        const waveR = uW * 0.4 + waveT * uW * 0.4;
        ctx.beginPath();
        ctx.arc(cx, cy, waveR, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Labels
    ctx.fillStyle = 'rgba(148,163,184,0.8)';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('Uterus', cx - uW * 0.9 - 5, cy);
    ctx.fillStyle = '#c084fc';
    ctx.textAlign = 'left';
    ctx.fillText('Cervix', cx + cervixW + 10, cervixY + 5);
    ctx.fillStyle = '#f0abfc';
    ctx.fillText('Vagina', cx + cervixW + 10, cervixY + 50);
  }

  function drawBaby(cx, cy, scale, delivered) {
    const r = 25 * scale;
    ctx.save();
    ctx.translate(cx, cy);
    // Head (largest part in fetal position)
    const bg = ctx.createRadialGradient(-r*0.3, -r*0.2, r*0.1, 0, 0, r);
    bg.addColorStop(0, '#fed7aa');
    bg.addColorStop(0.7, '#fb923c');
    bg.addColorStop(1, '#c2410c');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();

    // Face
    ctx.fillStyle = '#7c2d12';
    // Eyes
    ctx.beginPath(); ctx.arc(-r*0.3, -r*0.1, r*0.08, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(r*0.3, -r*0.1, r*0.08, 0, Math.PI * 2); ctx.fill();
    // Mouth
    ctx.strokeStyle = '#7c2d12';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, r*0.25, r*0.2, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Body (behind)
    if (!delivered) {
      ctx.fillStyle = '#fb923c';
      ctx.beginPath();
      ctx.ellipse(0, r * 1.2, r * 0.8, r * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function loop(t) {
    const dt = Math.min(0.05, (t - lastT) / 1000);
    lastT = t;
    phase += 0.03;
    if (playing) {
      progress += dt * 0.13;
      if (progress >= 1) { progress = 1; playing = false; setPlay(false); }
      updateUI();
    }
    draw();
    animId = requestAnimationFrame(loop);
  }

  function updateUI() {
    const info = stageInfo(progress);
    wrap.querySelector('#rStage').textContent = info.label;
    wrap.querySelector('#rCervix').textContent = info.cervix + ' cm';
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
