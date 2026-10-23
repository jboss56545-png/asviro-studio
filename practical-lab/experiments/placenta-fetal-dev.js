export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">Placenta & Fetal Dev</div><div class="text-[9px] text-slate-500 truncate">Class 12 Bio - Ch 2</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Month</div>
        <div class="text-[10px] font-black text-pink-300" id="rMonth">Month 1</div>
      </div>
      <div class="absolute top-2 right-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Length</div>
        <div class="text-[10px] font-black text-cyan-300" id="rLen">0.4 cm</div>
      </div>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 max-h-[44vh] overflow-y-auto space-y-2" style="backdrop-filter:blur(20px);">
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-pink-400 uppercase">Month of pregnancy</label><span class="text-[11px] font-black text-pink-400" id="mV">1</span></div>
        <input type="range" id="mSlider" min="1" max="9" step="1" value="1" class="w-full accent-pink-500">
      </div>
      <div class="grid grid-cols-2 gap-1.5">
        <button type="button" class="btn-play py-2.5 rounded-xl text-[10px] font-black bg-gradient-to-r from-pink-500 to-rose-500 text-slate-950">▶ Play</button>
        <button type="button" class="tog tog-label py-2.5 rounded-xl text-[10px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">Labels</button>
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[9px] text-slate-400 leading-relaxed" id="infoBox">
        <b class="text-pink-400">Month 1:</b> Embryo ~0.4 cm. Heart begins to form. Neural tube developing.
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

  const MONTHS = [
    { m: 1, len: '0.4 cm', info: '<b class="text-pink-400">Month 1:</b> Embryo ~0.4 cm. Heart begins to form. Neural tube developing.' },
    { m: 2, len: '2.5 cm', info: '<b class="text-pink-400">Month 2:</b> ~2.5 cm. Limbs, eyes, ears forming. Heart beats detectable.' },
    { m: 3, len: '7 cm', info: '<b class="text-pink-400">Month 3:</b> ~7 cm. Now called fetus. All organs formed. Gender visible.' },
    { m: 4, len: '13 cm', info: '<b class="text-pink-400">Month 4:</b> ~13 cm. Fetal movements felt. Hair, eyelids developing.' },
    { m: 5, len: '25 cm', info: '<b class="text-pink-400">Month 5:</b> ~25 cm. Hearing develops. Quickening felt by mother.' },
    { m: 6, len: '32 cm', info: '<b class="text-pink-400">Month 6:</b> ~32 cm. Lungs developing. Eyes open.' },
    { m: 7, len: '38 cm', info: '<b class="text-pink-400">Month 7:</b> ~38 cm. Third trimester. Rapid brain development.' },
    { m: 8, len: '45 cm', info: '<b class="text-pink-400">Month 8:</b> ~45 cm. Weight increasing. Lungs maturing.' },
    { m: 9, len: '50 cm', info: '<b class="text-pink-400">Month 9:</b> ~50 cm. Full term. Ready for birth.' }
  ];

  let month = 1, playing = false, showLabels = true;
  let animId = null, lastT = 0, phase = 0;

  function getFetusSize() {
    // Relative scale from 1 to 9 months
    return 0.15 + (month - 1) / 8 * 0.85;
  }

  function drawUterus() {
    const cx = W / 2, cy = H / 2;
    const uW = Math.min(W * 0.7, 250);
    const uH = Math.min(H * 0.85, 320);

    // Uterus wall
    const grad = ctx.createRadialGradient(cx - uW*0.3, cy - uH*0.3, 20, cx, cy, uW);
    grad.addColorStop(0, 'rgba(251,207,232,0.35)');
    grad.addColorStop(0.6, 'rgba(236,72,153,0.35)');
    grad.addColorStop(1, 'rgba(157,23,77,0.65)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx - uW * 0.5, cy - uH * 0.35);
    ctx.quadraticCurveTo(cx - uW * 0.55, cy + uH * 0.3, cx - uW * 0.35, cy + uH * 0.5);
    ctx.lineTo(cx + uW * 0.35, cy + uH * 0.5);
    ctx.quadraticCurveTo(cx + uW * 0.55, cy + uH * 0.3, cx + uW * 0.5, cy - uH * 0.35);
    ctx.quadraticCurveTo(cx, cy - uH * 0.55, cx - uW * 0.5, cy - uH * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(157,23,77,0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Amniotic fluid
    const fluidGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, uW * 0.5);
    fluidGrad.addColorStop(0, 'rgba(251,191,36,0.15)');
    fluidGrad.addColorStop(1, 'rgba(251,191,36,0.05)');
    ctx.fillStyle = fluidGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, uW * 0.42, uH * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();

    // Placenta (attached to upper wall)
    const px = cx + uW * 0.18;
    const py = cy - uH * 0.28;
    const pGrad = ctx.createRadialGradient(px - 10, py - 10, 5, px, py, 45);
    pGrad.addColorStop(0, '#dc2626');
    pGrad.addColorStop(0.5, '#b91c1c');
    pGrad.addColorStop(1, '#7f1d1d');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.ellipse(px, py, 40, 32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(127,29,29,0.7)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Villi texture
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(px + Math.cos(a) * 18, py + Math.sin(a) * 12, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Umbilical cord (spiral)
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(px, py + 25);
    const fetusX = cx - uW * 0.1;
    const fetusY = cy + uH * 0.05;
    const steps = 30;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = px + (fetusX - px) * t + Math.sin(t * 12) * 8;
      const y = py + 25 + (fetusY - (py + 25)) * t + Math.cos(t * 12) * 4;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(190,24,93,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Fetus
    drawFetus(fetusX, fetusY);

    // Labels
    if (showLabels) {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#f87171';
      ctx.fillText('Placenta', px + 42, py - 20);
      ctx.fillStyle = '#fca5a5';
      ctx.fillText('Umbilical cord', cx + 55, cy - 30);
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('Amniotic fluid', cx - 90, cy + 45);
    }
  }

  function drawFetus(cx, cy) {
    const size = getFetusSize() * Math.min(W, H) * 0.2;
    ctx.save();
    ctx.translate(cx, cy);
    // Curled fetal position
    const r = size;

    // Body (curled oval)
    const bg = ctx.createRadialGradient(-r*0.3, -r*0.2, r*0.1, 0, 0, r);
    bg.addColorStop(0, '#fed7aa');
    bg.addColorStop(0.7, '#fb923c');
    bg.addColorStop(1, '#c2410c');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.7, r, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Head (relatively bigger in early months)
    const headR = r * (month <= 3 ? 0.75 : 0.55);
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(r * 0.1, -r * 0.85, headR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,53,15,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Eyes (dark dots)
    if (month >= 3) {
      ctx.fillStyle = '#1f2937';
      ctx.beginPath();
      ctx.arc(r * 0.0, -r * 0.9, headR * 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(r * 0.25, -r * 0.9, headR * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }

    // Limbs (folded)
    if (month >= 2) {
      ctx.strokeStyle = '#fb923c';
      ctx.lineWidth = r * 0.15;
      ctx.lineCap = 'round';
      // Arms
      ctx.beginPath();
      ctx.moveTo(-r * 0.4, -r * 0.3);
      ctx.quadraticCurveTo(-r * 0.8, 0, -r * 0.6, r * 0.3);
      ctx.stroke();
      // Legs
      ctx.beginPath();
      ctx.moveTo(-r * 0.2, r * 0.6);
      ctx.quadraticCurveTo(r * 0.2, r * 0.9, r * 0.5, r * 0.5);
      ctx.stroke();
    }

    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#1e1b2e'); bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    drawUterus();

    // Info panel
    ctx.fillStyle = 'rgba(148,163,184,0.85)';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Pregnancy — Month ' + month, W / 2, 12);
  }

  function loop(t) {
    const dt = Math.min(0.05, (t - lastT) / 1000);
    lastT = t;
    phase += 0.02;
    if (playing) {
      month += dt * 1.2;
      if (month > 9) { month = 9; playing = false; setPlay(false); }
      updateUI();
      wrap.querySelector('#mSlider').value = Math.round(month);
    }
    draw();
    animId = requestAnimationFrame(loop);
  }

  function updateUI() {
    const m = Math.max(1, Math.min(9, Math.round(month)));
    wrap.querySelector('#rMonth').textContent = 'Month ' + m;
    wrap.querySelector('#mV').textContent = m;
    wrap.querySelector('#rLen').textContent = MONTHS[m-1].len;
    wrap.querySelector('#infoBox').innerHTML = MONTHS[m-1].info;
  }

  function setPlay(on) {
    wrap.querySelector('.btn-play').textContent = on ? '⏸ Pause' : '▶ Play';
  }

  wrap.querySelector('#mSlider').addEventListener('input', e => {
    month = parseInt(e.target.value, 10);
    playing = false; setPlay(false); updateUI();
  });
  wrap.querySelector('.btn-play').addEventListener('click', () => {
    if (month >= 9) month = 1;
    playing = !playing; setPlay(playing); updateUI();
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
  wrap.querySelector('.tog-label').addEventListener('click', () => { showLabels = !showLabels; setTog('.tog-label', showLabels); });
  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    month = 1; playing = false;
    wrap.querySelector('#mSlider').value = 1;
    setPlay(false); updateUI();
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
