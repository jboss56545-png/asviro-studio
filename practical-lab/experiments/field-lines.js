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
        <div class="text-xs font-black text-slate-100 truncate">Field Lines Sandbox</div>
        <div class="text-[9px] text-slate-500 truncate">Class 12 Physics - Ch 1</div>
      </div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 flex items-center justify-center">
        <i class="fa-solid fa-rotate-left text-xs"></i>
      </button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full" style="touch-action:none"></canvas>
      <div class="absolute top-2 left-2 bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1.5 pointer-events-none">
        <div class="text-[8px] text-slate-500 uppercase font-bold">Positive</div>
        <div class="text-[11px] font-black text-rose-400" id="rPos">0</div>
      </div>
      <div class="absolute top-2 right-2 bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1.5 pointer-events-none">
        <div class="text-[8px] text-slate-500 uppercase font-bold">Negative</div>
        <div class="text-[11px] font-black text-cyan-400" id="rNeg">0</div>
      </div>
      <div class="absolute bottom-2 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-slate-800 rounded-xl px-3 py-1.5 text-[10px] text-slate-300 pointer-events-none whitespace-nowrap" id="hintBar">
        Tap to add charges - Drag to move
      </div>
    </div>
    <div class="bg-slate-900 border-t border-slate-800 p-3 shrink-0 space-y-2.5">
      <div class="grid grid-cols-3 gap-1.5">
        <button type="button" class="tog tog-mode-pos py-2.5 rounded-xl text-[10px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
          <i class="fa-solid fa-plus mr-1"></i> Positive
        </button>
        <button type="button" class="tog tog-mode-neg py-2.5 rounded-xl text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-300">
          <i class="fa-solid fa-minus mr-1"></i> Negative
        </button>
        <button type="button" class="tog tog-mode-del py-2.5 rounded-xl text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-300">
          <i class="fa-solid fa-trash mr-1"></i> Delete
        </button>
      </div>
      <div class="grid grid-cols-2 gap-1.5">
        <button type="button" class="tog tog-lines py-2 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">Field Lines</button>
        <button type="button" class="tog tog-clear py-2 rounded-xl text-[9px] font-bold bg-rose-500/20 border border-rose-500/40 text-rose-300">Clear All</button>
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

  // State
  let charges = [];
  let mode = 'pos'; // 'pos' | 'neg' | 'del'
  let showLines = true;
  let animId = null;
  let dragCharge = null;
  let dragStart = null;
  let dragOffset = { x: 0, y: 0 };

  const CHARGE_R = 16;

  function drawGrid() {
    ctx.strokeStyle = 'rgba(100,116,139,0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  }

  function fieldAt(x, y, skip) {
    let ex = 0, ey = 0;
    charges.forEach(c => {
      if (c === skip) return;
      const dx = x - c.x;
      const dy = y - c.y;
      const r2 = dx * dx + dy * dy;
      const r = Math.sqrt(r2);
      if (r < 5) return;
      const sign = c.q > 0 ? 1 : -1;
      const mag = 40 * Math.abs(c.q) / (r2 + 25);
      ex += sign * mag * dx / r;
      ey += sign * mag * dy / r;
    });
    return { x: ex, y: ey };
  }

  function drawFieldLines() {
    if (!showLines || charges.length === 0) return;

    // Generate field lines from each positive charge
    charges.forEach(c => {
      if (c.q <= 0) return;
      const numLines = Math.max(8, Math.round(c.q * 8));
      for (let i = 0; i < numLines; i++) {
        const a = (i / numLines) * Math.PI * 2;
        let x = c.x + Math.cos(a) * (CHARGE_R + 2);
        let y = c.y + Math.sin(a) * (CHARGE_R + 2);
        const step = 6;
        const maxSteps = 220;

        ctx.strokeStyle = 'rgba(244,63,94,0.4)';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(x, y);

        for (let s = 0; s < maxSteps; s++) {
          const f = fieldAt(x, y, null);
          const len = Math.hypot(f.x, f.y);
          if (len < 0.001) break;
          x += (f.x / len) * step;
          y += (f.y / len) * step;

          // Out of bounds?
          if (x < -20 || x > W + 20 || y < -20 || y > H + 20) break;

          // Near a negative charge?
          let hit = false;
          for (const nc of charges) {
            if (nc.q >= 0) continue;
            if (Math.hypot(x - nc.x, y - nc.y) < CHARGE_R) {
              ctx.lineTo(nc.x, nc.y);
              hit = true;
              break;
            }
          }
          if (hit) break;

          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    });

    // From negative charges (draw lines going backward from them)
    charges.forEach(c => {
      if (c.q >= 0) return;
      const numLines = Math.max(8, Math.round(Math.abs(c.q) * 8));
      for (let i = 0; i < numLines; i++) {
        const a = (i / numLines) * Math.PI * 2;
        // Trace backward from negative charge
        let x = c.x + Math.cos(a) * (CHARGE_R + 2);
        let y = c.y + Math.sin(a) * (CHARGE_R + 2);
        const step = 6;
        const maxSteps = 220;

        ctx.strokeStyle = 'rgba(34,211,238,0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(x, y);

        for (let s = 0; s < maxSteps; s++) {
          const f = fieldAt(x, y, null);
          const len = Math.hypot(f.x, f.y);
          if (len < 0.001) break;
          // Backward
          x -= (f.x / len) * step;
          y -= (f.y / len) * step;
          if (x < -20 || x > W + 20 || y < -20 || y > H + 20) break;
          let hit = false;
          for (const pc of charges) {
            if (pc.q <= 0) continue;
            if (Math.hypot(x - pc.x, y - pc.y) < CHARGE_R) { hit = true; break; }
          }
          if (hit) break;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    });
  }

  function drawCharge(c) {
    const isPos = c.q > 0;
    const col = isPos ? '244,63,94' : '34,211,238';
    // Glow
    const glow = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, CHARGE_R * 2);
    glow.addColorStop(0, `rgba(${col},0.45)`);
    glow.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(c.x, c.y, CHARGE_R * 2, 0, Math.PI * 2);
    ctx.fill();

    // Body
    const bg = ctx.createRadialGradient(c.x - CHARGE_R * 0.3, c.y - CHARGE_R * 0.3, 2, c.x, c.y, CHARGE_R);
    bg.addColorStop(0, isPos ? '#fb7185' : '#67e8f9');
    bg.addColorStop(1, isPos ? '#e11d48' : '#0891b2');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(c.x, c.y, CHARGE_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Symbol
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isPos ? '+' : '-', c.x, c.y + 1);
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    drawGrid();
    drawFieldLines();
    charges.forEach(drawCharge);

    // Update counts
    const pos = charges.filter(c => c.q > 0).length;
    const neg = charges.filter(c => c.q < 0).length;
    wrap.querySelector('#rPos').textContent = pos;
    wrap.querySelector('#rNeg').textContent = neg;
  }

  function loop() {
    render();
    animId = requestAnimationFrame(loop);
  }

  // Pointer events
  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onPointerDown(e) {
    const p = getPos(e);
    // Check if tapping an existing charge
    for (let i = charges.length - 1; i >= 0; i--) {
      const c = charges[i];
      if (Math.hypot(p.x - c.x, p.y - c.y) < CHARGE_R + 8) {
        if (mode === 'del') {
          charges.splice(i, 1);
          canvas.setPointerCapture(e.pointerId);
          return;
        }
        dragCharge = c;
        dragOffset.x = p.x - c.x;
        dragOffset.y = p.y - c.y;
        dragStart = { t: Date.now(), x: p.x, y: p.y };
        canvas.setPointerCapture(e.pointerId);
        e.preventDefault();
        return;
      }
    }
    // Empty space tap
    if (mode === 'del') return;
    // Create new charge
    const q = mode === 'pos' ? 1 : -1;
    charges.push({ x: p.x, y: p.y, q });
    dragCharge = charges[charges.length - 1];
    dragOffset.x = 0;
    dragOffset.y = 0;
    dragStart = { t: Date.now(), x: p.x, y: p.y };
    canvas.setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!dragCharge) return;
    const p = getPos(e);
    dragCharge.x = p.x - dragOffset.x;
    dragCharge.y = p.y - dragOffset.y;
    e.preventDefault();
  }

  function onPointerUp(e) {
    dragCharge = null;
    dragStart = null;
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);

  // Controls
  function setMode(m) {
    mode = m;
    ['.tog-mode-pos', '.tog-mode-neg', '.tog-mode-del'].forEach(sel => {
      const b = wrap.querySelector(sel);
      if (!b) return;
      const on = sel === '.tog-mode-' + (m === 'pos' ? 'pos' : m === 'neg' ? 'neg' : 'del');
      b.classList.toggle('bg-emerald-500/20', on && m !== 'del');
      b.classList.toggle('border-emerald-500/40', on && m !== 'del');
      b.classList.toggle('text-emerald-300', on && m !== 'del');
      b.classList.toggle('bg-rose-500/20', on && m === 'del');
      b.classList.toggle('border-rose-500/40', on && m === 'del');
      b.classList.toggle('text-rose-300', on && m === 'del');
      b.classList.toggle('bg-slate-800', !on);
      b.classList.toggle('border-slate-700', !on);
      b.classList.toggle('text-slate-300', !on);
    });
    // Update hint
    const hints = {
      pos: 'Tap empty space to add + charge',
      neg: 'Tap empty space to add - charge',
      del: 'Tap a charge to delete it'
    };
    wrap.querySelector('#hintBar').textContent = hints[m];
  }

  wrap.querySelector('.tog-mode-pos').addEventListener('click', () => setMode('pos'));
  wrap.querySelector('.tog-mode-neg').addEventListener('click', () => setMode('neg'));
  wrap.querySelector('.tog-mode-del').addEventListener('click', () => setMode('del'));

  function setTogUI(sel, on) {
    const b = wrap.querySelector(sel);
    if (!b) return;
    b.classList.toggle('bg-emerald-500/20', on);
    b.classList.toggle('border-emerald-500/40', on);
    b.classList.toggle('text-emerald-300', on);
    b.classList.toggle('bg-slate-800', !on);
    b.classList.toggle('border-slate-700', !on);
    b.classList.toggle('text-slate-300', !on);
  }

  wrap.querySelector('.tog-lines').addEventListener('click', () => {
    showLines = !showLines;
    setTogUI('.tog-lines', showLines);
  });

  wrap.querySelector('.tog-clear').addEventListener('click', () => {
    charges = [];
  });

  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    charges = [];
    setMode('pos');
  });

  wrap.querySelector('.back-btn').addEventListener('click', () => window.goBack());

  let ro = null;
  if ('ResizeObserver' in window) {
    ro = new ResizeObserver(() => resize());
    ro.observe(canvas);
  }
  resize();
  setMode('pos');
  animId = requestAnimationFrame(loop);

  return function cleanup() {
    if (animId) cancelAnimationFrame(animId);
    if (ro) ro.disconnect();
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('pointercancel', onPointerUp);
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    document.body.style.overflow = prevOverflow;
  };
}
