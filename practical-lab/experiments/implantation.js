export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">Implantation</div><div class="text-[9px] text-slate-500 truncate">Class 12 Bio - Ch 2</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Stage</div>
        <div class="text-[10px] font-black text-pink-300" id="stageText">Free blastocyst</div>
      </div>
      <div class="absolute top-2 right-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Day</div>
        <div class="text-[10px] font-black text-cyan-300" id="dayText">Day 6</div>
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
        <b class="text-pink-400">Implantation:</b> Blastocyst attaches to endometrium (Day 6-7). Trophoblast differentiates into cytotrophoblast + syncytiotrophoblast. Implantation completes by Day 10.
      </div>
    </div>
  `;
  host.appendChild(wrap);
  const canvas = wrap.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    let w = rect.width;
    let h = rect.height;
    if (w < 10 || h < 10) {
      const p = canvas.parentElement.getBoundingClientRect();
      if (p.width > 10) w = p.width;
      if (p.height > 10) h = p.height;
    }
    if (w < 10 || h < 10) return false;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    W = w; H = h;
    return true;
  }

  let progress = 0, playing = false;
  let animId = null, lastT = 0, phase = 0;

  const STAGES = [
    { t: 0.00, label: 'Free blastocyst', day: 'Day 5' },
    { t: 0.20, label: 'Zona hatching', day: 'Day 5' },
    { t: 0.35, label: 'Attachment', day: 'Day 6' },
    { t: 0.55, label: 'Trophoblast invasion', day: 'Day 7' },
    { t: 0.75, label: 'Implantation begins', day: 'Day 8' },
    { t: 0.90, label: 'Complete embedding', day: 'Day 10' },
    { t: 1.00, label: 'Implantation complete', day: 'Day 11' }
  ];

  function stageInfo(p) {
    for (let i = STAGES.length - 1; i >= 0; i--) if (p >= STAGES[i].t) return STAGES[i];
    return STAGES[0];
  }

  function drawEndometrium() {
    const startY = H * 0.55;
    const layerH = H * 0.4;
    const grad = ctx.createLinearGradient(0, startY, 0, startY + layerH);
    grad.addColorStop(0, 'rgba(190,24,93,0.35)');
    grad.addColorStop(0.5, 'rgba(157,23,77,0.55)');
    grad.addColorStop(1, 'rgba(120,53,15,0.7)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, startY, W, layerH);
    // Glands
    ctx.strokeStyle = 'rgba(190,24,93,0.6)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 12; i++) {
      const x = (i / 12) * W + 15;
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.quadraticCurveTo(x + Math.sin(i) * 15, startY + layerH * 0.5, x + Math.sin(i * 2) * 10, startY + layerH * 0.9);
      ctx.stroke();
    }
    // Surface cells
    ctx.fillStyle = 'rgba(244,114,182,0.8)';
    for (let i = 0; i < 40; i++) {
      const x = (i / 40) * W;
      ctx.beginPath();
      ctx.arc(x, startY, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    // Blood vessels
    ctx.strokeStyle = 'rgba(220,38,38,0.5)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const x = (i / 8) * W + 20;
      ctx.beginPath();
      ctx.moveTo(x, startY + layerH * 0.7);
      ctx.quadraticCurveTo(x + 20, startY + layerH * 0.8, x + 10, startY + layerH);
      ctx.stroke();
    }
  }

  function drawBlastocyst(x, y, r, progress2) {
    const numT = 24;
    for (let i = 0; i < numT; i++) {
      const a = (i / numT) * Math.PI * 2;
      const tr = r - 6;
      const tx = x + Math.cos(a) * tr;
      const ty = y + Math.sin(a) * tr;
      const invasive = progress2 > 0.5 && a > Math.PI * 0.3 && a < Math.PI * 0.7;
      const migY = invasive ? (progress2 - 0.5) * 2 * 25 : 0;
      ctx.fillStyle = invasive ? '#dc2626' : '#db2777';
      ctx.beginPath();
      ctx.arc(tx, ty + migY, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    const blastGrad = ctx.createRadialGradient(x, y, 3, x, y, r - 10);
    blastGrad.addColorStop(0, 'rgba(59,130,246,0.35)');
    blastGrad.addColorStop(1, 'rgba(30,64,175,0.15)');
    ctx.fillStyle = blastGrad;
    ctx.beginPath();
    ctx.arc(x, y, r - 10, 0, Math.PI * 2);
    ctx.fill();
    const icmX = x + Math.cos(-Math.PI * 0.5) * (r - 22);
    const icmY = y + Math.sin(-Math.PI * 0.5) * (r - 22);
    for (let i = 0; i < 8; i++) {
      const ia = (i / 8) * Math.PI * 2;
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(icmX + Math.cos(ia) * 10, icmY + Math.sin(ia) * 7, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.stroke();
    }
  }

  function draw() {
    if (W < 10 || H < 10) return;
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#1e1b2e'); bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    drawEndometrium();

    const cx = W / 2;
    const startY = H * 0.12;
    const blastR = Math.min(W, H) * 0.13;
    const t = progress;

    let blastY;
    if (t < 0.35) {
      blastY = startY + (t / 0.35) * (H * 0.15);
    } else if (t < 0.75) {
      blastY = startY + H * 0.15 + ((t - 0.35) / 0.4) * H * 0.18;
    } else {
      const embed = Math.min(1, (t - 0.75) / 0.25);
      blastY = startY + H * 0.33 + embed * blastR * 0.7;
    }

    if (t < 0.3) {
      const zonaAlpha = t < 0.2 ? 1 : 1 - (t - 0.2) / 0.1;
      ctx.strokeStyle = `rgba(251,191,36,${zonaAlpha * 0.6})`;
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(cx, blastY, blastR + 12, 0, Math.PI * 2); ctx.stroke();
    } else if (t < 0.5) {
      const bt = (t - 0.3) / 0.2;
      const pieces = 6;
      for (let i = 0; i < pieces; i++) {
        const a = (i / pieces) * Math.PI * 2 + bt * 0.5;
        const px = cx + Math.cos(a) * (blastR + 12 + bt * 30);
        const py = blastY + Math.sin(a) * (blastR + 12 + bt * 30) + bt * 20;
        ctx.strokeStyle = `rgba(251,191,36,${1 - bt})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(px, py, 8, a, a + Math.PI * 0.7);
        ctx.stroke();
      }
    }

    drawBlastocyst(cx, blastY, blastR, t);

    if (t > 0.4 && t < 0.75) {
      const at = (t - 0.4) / 0.35;
      ctx.strokeStyle = `rgba(244,63,94,${at})`;
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const x1 = cx - 40 + i * 16;
        const y1 = blastY + blastR - 5;
        const y2 = H * 0.55;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        for (let k = 0; k < 4; k++) {
          const t2 = k / 3;
          ctx.lineTo(x1 + Math.sin(k * 3) * 4, y1 + (y2 - y1) * t2);
        }
        ctx.stroke();
      }
    }

    // Labels — position so they don't overlap
    ctx.fillStyle = 'rgba(148,163,184,0.7)';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Endometrium', 12, H * 0.72);
    ctx.fillText('Myometrium', 12, H * 0.92);

    if (t > 0.75) {
      const ht = (t - 0.75) / 0.25;
      ctx.fillStyle = `rgba(34,211,238,${ht})`;
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('hCG secreted →', W - 12, H * 0.45);
      ctx.fillText('maintains corpus luteum', W - 12, H * 0.48);
    }
  }

  function loop() { phase += 0.03; draw(); animId = requestAnimationFrame(loop); }

  function updateUI() {
    const info = stageInfo(progress);
    wrap.querySelector('#stageText').textContent = info.label;
    wrap.querySelector('#dayText').textContent = info.day;
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
  if ('ResizeObserver' in window) { ro = new ResizeObserver(() => resize()); ro.observe(canvas); }
  window.addEventListener('resize', resize);

  resize();
  requestAnimationFrame(() => resize());
  setTimeout(() => resize(), 100);
  setTimeout(() => { resize(); updateUI(); }, 300);

  animId = requestAnimationFrame(loop);

  return function cleanup() {
    if (animId) cancelAnimationFrame(animId);
    if (ro) ro.disconnect();
    window.removeEventListener('resize', resize);
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    document.body.style.overflow = prevOverflow;
  };
                     }
