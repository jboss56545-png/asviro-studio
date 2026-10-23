/* ============================================================
   EXPERIMENT: Electron in Electric Field — FULLSCREEN
   Class 12 Physics — Ch 1: Electric Charges and Fields
   ============================================================ */

export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <!-- Top Bar -->
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-slate-800/80 bg-slate-900/95 shrink-0 backdrop-blur-xl">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-slate-950 border border-slate-800 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold active:scale-95 shrink-0">
        <i class="fa-solid fa-arrow-left text-[10px]"></i> Back
      </button>
      <div class="flex-1 text-center min-w-0 px-1">
        <div class="text-xs font-black text-slate-100 truncate leading-tight">Electron in E-Field</div>
        <div class="text-[9px] text-slate-500 font-semibold truncate leading-tight">Class 12 Physics • Ch 1</div>
      </div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 flex items-center justify-center active:scale-95 shrink-0">
        <i class="fa-solid fa-rotate-left text-xs"></i>
      </button>
    </div>

    <!-- Canvas Area -->
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>

      <!-- Readout overlays -->
      <div class="absolute top-2 left-2 bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-xl px-2.5 py-1.5 pointer-events-none">
        <div class="text-[8px] text-slate-500 uppercase font-bold tracking-wider leading-none mb-0.5">Speed</div>
        <div class="text-[11px] font-black text-cyan-300 leading-none" id="rVel">0</div>
      </div>
      <div class="absolute top-2 right-2 bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-xl px-2.5 py-1.5 pointer-events-none">
        <div class="text-[8px] text-slate-500 uppercase font-bold tracking-wider leading-none mb-0.5">Time</div>
        <div class="text-[11px] font-black text-amber-300 leading-none" id="rTime">0.0s</div>
      </div>
      <div class="absolute bottom-2 left-2 bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-xl px-2.5 py-1.5 pointer-events-none">
        <div class="text-[8px] text-slate-500 uppercase font-bold tracking-wider leading-none mb-0.5">Accel</div>
        <div class="text-[11px] font-black text-rose-300 leading-none" id="rAcc">0</div>
      </div>

      <!-- Tip toggle -->
      <button type="button" class="tip-toggle absolute bottom-2 right-2 w-8 h-8 rounded-xl bg-slate-900/85 backdrop-blur-md border border-emerald-500/30 text-emerald-300 flex items-center justify-center active:scale-95">
        <i class="fa-solid fa-lightbulb text-[11px]"></i>
      </button>

      <!-- Collapsible tip -->
      <div class="tip-panel absolute bottom-12 right-2 left-2 max-w-sm ml-auto bg-slate-900/95 backdrop-blur-xl border border-emerald-500/30 rounded-xl p-3 hidden">
        <div class="text-[10px] text-slate-300 leading-relaxed">
          <b class="text-emerald-300">Observe:</b> Electron ka charge negative hai, isliye woh field ke <b>opposite</b> direction mein accelerate hota hai. Horizontal velocity constant rehti hai — path clean <b>parabola</b> ban jaata hai (projectile motion jaisa).
        </div>
      </div>
    </div>

    <!-- Bottom Controls -->
    <div class="bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/80 shrink-0 max-h-[42vh] overflow-y-auto">
      <div class="p-3 space-y-3">
        <div>
          <div class="flex justify-between items-center mb-1">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">E-Field Strength</label>
            <span class="text-[11px] font-black text-cyan-400" id="eVal">+30 N/C</span>
          </div>
          <input type="range" id="eSlider" min="-100" max="100" value="30" step="1" class="w-full accent-emerald-500">
        </div>

        <div>
          <div class="flex justify-between items-center mb-1">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Initial Velocity (vx)</label>
            <span class="text-[11px] font-black text-cyan-400" id="vxVal">80 px/s</span>
          </div>
          <input type="range" id="vxSlider" min="20" max="200" value="80" step="5" class="w-full accent-cyan-500">
        </div>

        <div class="grid grid-cols-4 gap-1.5">
          <button type="button" class="tog toggle-field py-2 px-1 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center gap-1">
            <i class="fa-solid fa-arrows-down-to-line text-[10px]"></i><span>Field</span>
          </button>
          <button type="button" class="tog toggle-vectors py-2 px-1 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center gap-1">
            <i class="fa-solid fa-arrow-right text-[10px]"></i><span>Vectors</span>
          </button>
          <button type="button" class="tog toggle-trail py-2 px-1 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center gap-1">
            <i class="fa-solid fa-bezier-curve text-[10px]"></i><span>Trail</span>
          </button>
          <button type="button" class="tog toggle-slow py-2 px-1 rounded-xl text-[9px] font-bold bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center gap-1">
            <i class="fa-solid fa-gauge-simple text-[10px]"></i><span>0.5×</span>
          </button>
        </div>
      </div>
    </div>
  `;
  host.appendChild(wrap);

  // ---------- Canvas ----------
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

  // ---------- State ----------
  let E = 30;
  let v0x = 80;
  let slowMo = false;
  let showField = true;
  let showVectors = true;
  let showTrail = true;
  let elapsed = 0;
  let running = true;
  let animId = null;
  let lastT = 0;
  const TRAIL_MAX = 300;

  const p = { x: 0, y: 0, vx: 0, vy: 0, ax: 0, ay: 0 };
  let trail = [];

  function resetParticle() {
    p.x = 40;
    p.y = H / 2;
    p.vx = v0x;
    p.vy = 0;
    p.ax = 0;
    p.ay = 0;
    trail = [];
    elapsed = 0;
    running = true;
  }

  // ---------- Physics ----------
  function step(dt) {
    if (!running) return;
    const scale = 1.6;
    p.ay = -E * scale;
    p.ax = 0;
    p.vy += p.ay * dt;
    p.vx += p.ax * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    elapsed += dt;
    if (showTrail) {
      trail.push({ x: p.x, y: p.y });
      if (trail.length > TRAIL_MAX) trail.shift();
    }
    if (p.x > W + 30 || p.y < -30 || p.y > H + 30) running = false;
  }

  // ---------- Drawing ----------
  function drawGrid() {
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.10)';
    ctx.lineWidth = 1;
    const step = 36;
    for (let x = 0; x <= W; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y <= H; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
  }

  function drawFieldLines() {
    if (!showField) return;
    const intensity = Math.min(1, Math.abs(E) / 100);
    if (intensity === 0) return;
    const alpha = 0.12 + intensity * 0.4;
    const color = E >= 0 ? `rgba(34, 211, 238, ${alpha})` : `rgba(244, 63, 94, ${alpha})`;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.4;
    const spacing = 44;
    const arrowStep = 55;
    const aSize = 5;
    for (let x = spacing / 2; x < W; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
      for (let y = arrowStep / 2; y < H; y += arrowStep) {
        ctx.beginPath();
        if (E >= 0) {
          ctx.moveTo(x, y);
          ctx.lineTo(x - aSize, y - aSize);
          ctx.moveTo(x, y);
          ctx.lineTo(x + aSize, y - aSize);
        } else {
          ctx.moveTo(x, y);
          ctx.lineTo(x - aSize, y + aSize);
          ctx.moveTo(x, y);
          ctx.lineTo(x + aSize, y + aSize);
        }
        ctx.stroke();
      }
    }
  }

  function drawTrail() {
    if (!showTrail || trail.length < 2) return;
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    for (let i = 1; i < trail.length; i++) {
      const a = i / trail.length;
      ctx.strokeStyle = `rgba(16, 185, 129, ${a * 0.9})`;
      ctx.beginPath();
      ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
      ctx.lineTo(trail[i].x, trail[i].y);
      ctx.stroke();
    }
  }

  function drawParticle() {
    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 24);
    grad.addColorStop(0, 'rgba(34, 211, 238, 0.6)');
    grad.addColorStop(1, 'rgba(34, 211, 238, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#22d3ee';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(p.x - 3.5, p.y);
    ctx.lineTo(p.x + 3.5, p.y);
    ctx.stroke();
  }

  function drawArrow(x1, y1, x2, y2, color, width) {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len < 10) return;
    const ang = Math.atan2(dy, dx);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    const hLen = 9;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - hLen * Math.cos(ang - Math.PI / 6), y2 - hLen * Math.sin(ang - Math.PI / 6));
    ctx.lineTo(x2 - hLen * Math.cos(ang + Math.PI / 6), y2 - hLen * Math.sin(ang + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  }

  function drawVectors() {
    if (!showVectors) return;
    drawArrow(p.x, p.y, p.x + p.vx * 0.35, p.y + p.vy * 0.35, '#22d3ee', 2);
    const fLen = -E * 0.5;
    drawArrow(p.x, p.y, p.x, p.y + fLen, '#f43f5e', 2);
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    drawGrid();
    drawFieldLines();
    drawTrail();
    drawParticle();
    drawVectors();
  }

  // ---------- Loop ----------
  function loop(t) {
    const rawDt = (t - lastT) / 1000;
    lastT = t;
    const dt = Math.min(0.033, rawDt) * (slowMo ? 0.5 : 1);
    step(dt);
    render();
    updateReadouts();
    animId = requestAnimationFrame(loop);
  }

  const $vel = wrap.querySelector('#rVel');
  const $acc = wrap.querySelector('#rAcc');
  const $time = wrap.querySelector('#rTime');

  function updateReadouts() {
    const speed = Math.hypot(p.vx, p.vy);
    $vel.textContent = Math.round(speed) + ' px/s';
    $acc.textContent = Math.round(Math.abs(p.ay)) + ' px/s²';
    $time.textContent = elapsed.toFixed(1) + ' s';
  }

  // ---------- Controls ----------
  const eSlider = wrap.querySelector('#eSlider');
  const vxSlider = wrap.querySelector('#vxSlider');
  const eVal = wrap.querySelector('#eVal');
  const vxVal = wrap.querySelector('#vxVal');

  function refreshE() {
    E = parseFloat(eSlider.value);
    eVal.textContent = (E >= 0 ? '+' : '') + E + ' N/C';
    eVal.className = 'text-[11px] font-black ' + (E >= 0 ? 'text-cyan-400' : 'text-rose-400');
  }
  function refreshVx() {
    v0x = parseFloat(vxSlider.value);
    vxVal.textContent = v0x + ' px/s';
  }

  function onE() { refreshE(); }
  function onVx() { refreshVx(); resetParticle(); }
  eSlider.addEventListener('input', onE);
  vxSlider.addEventListener('input', onVx);

  const resetBtn = wrap.querySelector('.reset-btn');
  function onReset() { resize(); resetParticle(); }
  resetBtn.addEventListener('click', onReset);

  // Back button — uses index.html's goBack
  const backBtn = wrap.querySelector('.back-btn');
  function onBack() { window.goBack(); }
  backBtn.addEventListener('click', onBack);

  // Tip toggle
  const tipToggle = wrap.querySelector('.tip-toggle');
  const tipPanel = wrap.querySelector('.tip-panel');
  function onTipToggle() { tipPanel.classList.toggle('hidden'); }
  tipToggle.addEventListener('click', onTipToggle);

  function makeToggle(cls, getter, setter) {
    const btn = wrap.querySelector(cls);
    btn.addEventListener('click', () => {
      const newVal = !getter();
      setter(newVal);
      btn.classList.toggle('bg-emerald-500/20', newVal);
      btn.classList.toggle('border-emerald-500/40', newVal);
      btn.classList.toggle('text-emerald-300', newVal);
      btn.classList.toggle('bg-slate-800', !newVal);
      btn.classList.toggle('border-slate-700', !newVal);
      btn.classList.toggle('text-slate-300', !newVal);
    });
  }
  makeToggle('.toggle-field', () => showField, v => showField = v);
  makeToggle('.toggle-vectors', () => showVectors, v => showVectors = v);
  makeToggle('.toggle-trail', () => showTrail, v => showTrail = v);
  makeToggle('.toggle-slow', () => slowMo, v => slowMo = v);

  // ---------- Resize ----------
  let resizeObs = null;
  function handleResize() {
    resize();
    p.x = Math.min(p.x, W);
    p.y = Math.min(p.y, H);
  }
  if ('ResizeObserver' in window) {
    resizeObs = new ResizeObserver(handleResize);
    resizeObs.observe(canvas);
  } else {
    window.addEventListener('resize', handleResize);
  }

  // ---------- Init ----------
  resize();
  resetParticle();
  refreshE();
  refreshVx();
  lastT = performance.now();
  animId = requestAnimationFrame(loop);

  // ---------- Cleanup ----------
  return function cleanup() {
    if (animId) cancelAnimationFrame(animId);
    if (resizeObs) resizeObs.disconnect();
    else window.removeEventListener('resize', handleResize);
    eSlider.removeEventListener('input', onE);
    vxSlider.removeEventListener('input', onVx);
    resetBtn.removeEventListener('click', onReset);
    backBtn.removeEventListener('click', onBack);
    tipToggle.removeEventListener('click', onTipToggle);
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    document.body.style.overflow = prevOverflow;
  };
     }
