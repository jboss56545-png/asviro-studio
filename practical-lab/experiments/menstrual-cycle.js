export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">Menstrual Cycle</div><div class="text-[9px] text-slate-500 truncate">Class 12 Bio - Ch 2</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Day</div>
        <div class="text-[10px] font-black text-pink-300" id="rDay">1</div>
      </div>
      <div class="absolute top-2 right-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Phase</div>
        <div class="text-[10px] font-black text-cyan-300" id="rPhase">Menstrual</div>
      </div>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 space-y-2" style="backdrop-filter:blur(20px);">
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-pink-400 uppercase">Day of cycle</label><span class="text-[11px] font-black text-pink-400" id="dayV">Day 1</span></div>
        <input type="range" id="daySlider" min="1" max="28" step="1" value="1" class="w-full accent-pink-500">
      </div>
      <div class="grid grid-cols-2 gap-1.5">
        <button type="button" class="btn-play py-2.5 rounded-xl text-[10px] font-black bg-gradient-to-r from-pink-500 to-rose-500 text-slate-950">▶ Play</button>
        <button type="button" class="tog tog-thick py-2.5 rounded-xl text-[10px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">Endometrium</button>
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[9px] text-slate-400 leading-relaxed">
        <b class="text-pink-400">Phases:</b> Menstrual (1-5) → Follicular (6-13) → Ovulation (14) → Luteal (15-28). FSH rises → follicle matures → estrogen peak → LH surge → ovulation.
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

  let day = 1, playing = false, showThick = true;
  let animId = null, lastT = 0, phase = 0;

  function FSH(d) { return 3 + 4 * Math.exp(-Math.pow((d - 5) / 3, 2)) + 2 * Math.exp(-Math.pow((d - 13) / 2, 2)); }
  function LH(d) { return 3 + 25 * Math.exp(-Math.pow((d - 14) / 1.2, 2)); }
  function Estrogen(d) { return 20 + 180 * Math.exp(-Math.pow((d - 13) / 3, 2)) + 80 * Math.exp(-Math.pow((d - 21) / 4, 2)); }
  function Progesterone(d) { return 2 + 18 * Math.exp(-Math.pow((d - 21) / 4, 2)); }

  function getPhase(d) {
    if (d <= 5) return 'Menstrual';
    if (d <= 13) return 'Follicular';
    if (d === 14) return 'Ovulation';
    return 'Luteal';
  }

  function draw() {
    if (W < 10 || H < 10) return;
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#1e1b2e'); bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Chart area — leave room for labels & uterus strip
    const padX = 30;
    const padTop = 30;
    const padBot = 55;
    const uterusW = showThick ? 20 : 0;
    const cW = W - padX * 2 - uterusW;
    const cH = H - padTop - padBot;
    const maxH = 220;

    // Phase backgrounds
    const phases = [
      { s: 1, e: 5, c: 'rgba(244,63,94,0.08)', label: 'Menstrual', color: '#f43f5e' },
      { s: 6, e: 13, c: 'rgba(34,211,238,0.06)', label: 'Follicular', color: '#22d3ee' },
      { s: 14, e: 14, c: 'rgba(251,191,36,0.15)', label: 'Ovul.', color: '#fbbf24' },
      { s: 15, e: 28, c: 'rgba(168,85,247,0.08)', label: 'Luteal', color: '#a855f7' }
    ];
    phases.forEach(p => {
      const x1 = padX + ((p.s - 1) / 27) * cW;
      const x2 = padX + ((p.e - 1) / 27) * cW;
      ctx.fillStyle = p.c;
      ctx.fillRect(x1, padTop, x2 - x1, cH);
      ctx.fillStyle = p.color + 'cc';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(p.label, (x1 + x2) / 2, padTop + 4);
    });

    // Grid
    ctx.strokeStyle = 'rgba(148,163,184,0.08)';
    ctx.lineWidth = 1;
    for (let d = 1; d <= 28; d += 2) {
      const x = padX + ((d - 1) / 27) * cW;
      ctx.beginPath(); ctx.moveTo(x, padTop); ctx.lineTo(x, padTop + cH); ctx.stroke();
    }

    // X axis labels — bottom, clean spacing
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let d = 1; d <= 28; d += 4) {
      const x = padX + ((d - 1) / 27) * cW;
      ctx.fillText('D' + d, x, padTop + cH + 6);
    }

    // Curves
    const curves = [
      { fn: FSH, color: '#10b981', label: 'FSH' },
      { fn: LH, color: '#f43f5e', label: 'LH' },
      { fn: Estrogen, color: '#f59e0b', label: 'Estrogen' },
      { fn: Progesterone, color: '#a855f7', label: 'Prog' }
    ];
    curves.forEach(c => {
      ctx.strokeStyle = c.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let d = 1; d <= 28; d += 0.2) {
        const x = padX + ((d - 1) / 27) * cW;
        const y = padTop + cH - (Math.min(maxH, c.fn(d)) / maxH) * cH;
        if (d === 1) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });

    // Curve legend — top left, clean
    let lx = padX + 4;
    let ly = padTop + cH - 8;
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    curves.forEach(c => {
      ctx.fillStyle = c.color;
      ctx.beginPath(); ctx.arc(lx + 3, ly, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = c.color;
      ctx.fillText(c.label, lx + 9, ly);
      lx += 55;
    });

    // Current day marker
    const cx = padX + ((day - 1) / 27) * cW;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(cx, padTop); ctx.lineTo(cx, padTop + cH);
    ctx.stroke();
    ctx.setLineDash([]);

    // Day bubble at top
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(cx, padTop - 12, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(day), cx, padTop - 12);

    // Endometrium strip (right side, separate)
    if (showThick) {
      const ux = W - 12;
      const uH = cH;
      const uY = padTop;
      ctx.strokeStyle = 'rgba(244,114,182,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(ux - 8, uY, 16, uH, 4);
      else ctx.rect(ux - 8, uY, 16, uH);
      ctx.stroke();

      let thickness;
      if (day <= 5) thickness = 0.15 + (1 - day / 5) * 0.05;
      else if (day <= 14) thickness = 0.15 + (day - 5) / 9 * 0.65;
      else thickness = 0.8 + (day - 14) / 14 * 0.15;
      const fillH = uH * thickness;
      const grad = ctx.createLinearGradient(0, uY + uH - fillH, 0, uY + uH);
      grad.addColorStop(0, '#f43f5e');
      grad.addColorStop(1, '#be185d');
      ctx.fillStyle = grad;
      ctx.fillRect(ux - 7, uY + uH - fillH, 14, fillH);

      // Rotated label
      ctx.fillStyle = '#f472b6';
      ctx.font = 'bold 7px sans-serif';
      ctx.save();
      ctx.translate(ux - 14, uY + uH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Endometrium', 0, 0);
      ctx.restore();
    }
  }

  function loop() {
    phase += 0.02;
    if (playing) {
      day += 0.05;
      if (day > 28) day = 1;
      updateUI();
      const sl = wrap.querySelector('#daySlider');
      if (sl) sl.value = Math.round(day);
    }
    draw();
    animId = requestAnimationFrame(loop);
  }

  function updateUI() {
    const d = Math.round(day);
    const ph = getPhase(d);
    wrap.querySelector('#rDay').textContent = d;
    wrap.querySelector('#dayV').textContent = 'Day ' + d;
    wrap.querySelector('#rPhase').textContent = ph;
  }

  wrap.querySelector('#daySlider').addEventListener('input', e => {
    day = parseInt(e.target.value, 10);
    playing = false;
    wrap.querySelector('.btn-play').textContent = '▶ Play';
    updateUI();
  });
  wrap.querySelector('.btn-play').addEventListener('click', () => {
    playing = !playing;
    wrap.querySelector('.btn-play').textContent = playing ? '⏸ Pause' : '▶ Play';
  });
  function setTog(sel, on) {
    const b = wrap.querySelector(sel);
    b.classList.toggle('bg-emerald-500/20', on);
    b.classList.toggle('border-emerald-500/40', on);
    b.classList.toggle('text-emerald-300', on);
    b.classList.toggle('bg-white/5', !on);
    b.classList.toggle('border-white/10', !on);
    b.classList.toggle('text-slate-300', !on);
  }
  wrap.querySelector('.tog-thick').addEventListener('click', () => { showThick = !showThick; setTog('.tog-thick', showThick); });
  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    day = 1; playing = false;
    wrap.querySelector('#daySlider').value = 1;
    wrap.querySelector('.btn-play').textContent = '▶ Play';
    updateUI();
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
