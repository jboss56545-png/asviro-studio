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
        <div class="text-xs font-black text-slate-100 truncate">Gauss's Law Visualizer</div>
        <div class="text-[9px] text-slate-500 truncate">Class 12 Physics - Ch 1</div>
      </div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 flex items-center justify-center">
        <i class="fa-solid fa-rotate-left text-xs"></i>
      </button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full" style="touch-action:none"></canvas>
      <div class="absolute top-2 left-2 bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1.5 pointer-events-none">
        <div class="text-[8px] text-slate-500 uppercase font-bold">Enclosed Q</div>
        <div class="text-[11px] font-black text-amber-300" id="rQin">2.0 nC</div>
      </div>
      <div class="absolute top-2 right-2 bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1.5 pointer-events-none">
        <div class="text-[8px] text-slate-500 uppercase font-bold">Net Flux F</div>
        <div class="text-[11px] font-black text-emerald-300" id="rFlux">226</div>
      </div>
      <div class="absolute bottom-2 left-2 bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1.5 pointer-events-none">
        <div class="text-[8px] text-slate-500 uppercase font-bold">Outward</div>
        <div class="text-[11px] font-black text-emerald-400" id="rOut">16</div>
      </div>
      <div class="absolute bottom-2 right-2 bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1.5 pointer-events-none">
        <div class="text-[8px] text-slate-500 uppercase font-bold">Inward</div>
        <div class="text-[11px] font-black text-rose-400" id="rIn">0</div>
      </div>
    </div>
    <div class="bg-slate-900 border-t border-slate-800 p-3 shrink-0 space-y-2.5">
      <div>
        <div class="flex justify-between mb-1">
          <label class="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Charge Q</label>
          <span class="text-[11px] font-black text-amber-400" id="qVal">+2.0 nC</span>
        </div>
        <input type="range" id="qSlider" min="-5" max="5" step="0.5" value="2" class="w-full accent-amber-500">
      </div>
      <div>
        <div class="flex justify-between mb-1">
          <label class="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Charge Position</label>
          <span class="text-[11px] font-black text-cyan-400" id="posVal">Inside</span>
        </div>
        <input type="range" id="posSlider" min="-180" max="180" step="5" value="0" class="w-full accent-cyan-500">
      </div>
      <div class="grid grid-cols-2 gap-1.5">
        <button type="button" class="tog tog-sphere py-2 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">Sphere Surface</button>
        <button type="button" class="tog tog-lines py-2 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">Field Lines</button>
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

  let chargeQ = 2;
  let chargeOffset = 0;
  let showSphere = true;
  let showLines = true;
  let animId = null;

  const SPHERE_R_FRAC = 0.28;

  function sphereRadius() {
    return Math.min(W, H) * SPHERE_R_FRAC;
  }

  function drawGrid() {
    ctx.strokeStyle = 'rgba(100,116,139,0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  }

  function drawSphere() {
    if (!showSphere) return;
    const sx = W / 2, sy = H / 2;
    const R = sphereRadius();

    // Fill
    const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, R);
    g.addColorStop(0, 'rgba(16,185,129,0.03)');
    g.addColorStop(1, 'rgba(16,185,129,0.12)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(sx, sy, R, 0, Math.PI * 2);
    ctx.fill();

    // Dashed border
    ctx.strokeStyle = 'rgba(16,185,129,0.65)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 5]);
    ctx.beginPath();
    ctx.arc(sx, sy, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Label
    ctx.fillStyle = 'rgba(16,185,129,0.75)';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Gaussian Surface', sx, sy - R - 12);
  }

  function countCrossings(chargeX, chargeY, q) {
    if (!showSphere) return { out: 0, in: 0, total: 0 };
    const sx = W / 2, sy = H / 2, R = sphereRadius();
    const dx = chargeX - sx, dy = chargeY - sy;
    const distFromCenter = Math.hypot(dx, dy);

    // Charge inside?
    const isInside = distFromCenter < R;

    const numLines = Math.max(8, Math.round(Math.abs(q) * 8));
    let out = 0, in_ = 0;
    for (let i = 0; i < numLines; i++) {
      const a = (i / numLines) * Math.PI * 2;
      const dx2 = Math.cos(a), dy2 = Math.sin(a);
      const b = 2 * (dx * dx2 + dy * dy2);
      const c = dx * dx + dy * dy - R * R;
      const disc = b * b - 4 * c;
      if (disc >= 0) {
        const t1 = (-b - Math.sqrt(disc)) / 2;
        const t2 = (-b + Math.sqrt(disc)) / 2;
        if (t1 > 0 || t2 > 0) {
          if (q > 0) out++; else in_++;
        }
      }
    }
    return { out, in: in_, total: numLines, isInside };
  }

  function drawFieldLines(cx, cy, q) {
    if (!showLines || Math.abs(q) < 0.05) return;
    const numLines = Math.max(8, Math.round(Math.abs(q) * 8));
    const sx = W / 2, sy = H / 2, R = sphereRadius();
    const lineColorIn = q > 0 ? 'rgba(251,191,36,0.55)' : 'rgba(251,191,36,0.55)';
    const lineColorOut = q > 0 ? 'rgba(244,63,94,0.5)' : 'rgba(244,63,94,0.5)';

    for (let i = 0; i < numLines; i++) {
      const a = (i / numLines) * Math.PI * 2;
      const dx = Math.cos(a), dy = Math.sin(a);
      const far = Math.max(W, H) * 1.4;
      // Find intersection with sphere
      const ex = cx - sx, ey = cy - sy;
      const b = 2 * (ex * dx + ey * dy);
      const c = ex * ex + ey * ey - R * R;
      const disc = b * b - 4 * c;

      let hitT = null;
      if (disc >= 0) {
        const t1 = (-b - Math.sqrt(disc)) / 2;
        const t2 = (-b + Math.sqrt(disc)) / 2;
        if (t1 > 0) hitT = t1;
        else if (t2 > 0) hitT = t2;
      }

      ctx.lineWidth = 1.3;

      if (hitT !== null && hitT < far) {
        // Inside segment (before sphere)
        ctx.strokeStyle = 'rgba(148,163,184,0.4)';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + dx * hitT, cy + dy * hitT);
        ctx.stroke();

        // Crossing marker
        const px = cx + dx * hitT;
        const py = cy + dy * hitT;
        ctx.fillStyle = q > 0 ? 'rgba(16,185,129,0.85)' : 'rgba(244,63,94,0.85)';
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();

        // Outside segment
        ctx.strokeStyle = q > 0 ? 'rgba(16,185,129,0.45)' : 'rgba(244,63,94,0.45)';
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(cx + dx * far, cy + dy * far);
        ctx.stroke();

        // Arrowhead
        const ax = cx + dx * (hitT + 30);
        const ay = cy + dy * (hitT + 30);
        const ang = Math.atan2(dy, dx);
        ctx.fillStyle = q > 0 ? 'rgba(16,185,129,0.7)' : 'rgba(244,63,94,0.7)';
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax - 8 * Math.cos(ang - 0.5), ay - 8 * Math.sin(ang - 0.5));
        ctx.lineTo(ax - 8 * Math.cos(ang + 0.5), ay - 8 * Math.sin(ang + 0.5));
        ctx.closePath();
        ctx.fill();
      } else {
        // Line doesn't cross sphere
        ctx.strokeStyle = 'rgba(148,163,184,0.3)';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + dx * far, cy + dy * far);
        ctx.stroke();
      }
    }
  }

  function drawCharge(cx, cy, q) {
    if (Math.abs(q) < 0.05) return;
    const isPos = q > 0;
    const r = 18;
    const col = isPos ? '244,63,94' : '34,211,238';
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2);
    glow.addColorStop(0, `rgba(${col},0.5)`);
    glow.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isPos ? '#e11d48' : '#0891b2';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isPos ? '+' : '-', cx, cy + 1);
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    drawGrid();
    drawSphere();

    const cx = W / 2 + chargeOffset;
    const cy = H / 2;

    drawFieldLines(cx, cy, chargeQ);
    drawCharge(cx, cy, chargeQ);

    // Update readouts
    const sx = W / 2, sy = H / 2, R = sphereRadius();
    const inside = Math.hypot(cx - sx, cy - sy) < R;
    const qIn = inside ? chargeQ : 0;
    const flux = qIn * 113; // arbitrary scale for display (Q/ε₀ style)
    const crossings = countCrossings(cx, cy, chargeQ);

    wrap.querySelector('#rQin').textContent = qIn.toFixed(1) + ' nC';
    wrap.querySelector('#rFlux').textContent = flux.toFixed(0);
    wrap.querySelector('#rOut').textContent = inside && chargeQ > 0 ? crossings.total : (inside && chargeQ < 0 ? 0 : Math.round(crossings.total / 2));
    wrap.querySelector('#rIn').textContent = inside && chargeQ < 0 ? crossings.total : (inside && chargeQ > 0 ? 0 : Math.round(crossings.total / 2));

    // Color-coded flux
    const fluxEl = wrap.querySelector('#rFlux');
    if (Math.abs(flux) < 0.01) {
      fluxEl.className = 'text-[11px] font-black text-slate-500';
    } else {
      fluxEl.className = 'text-[11px] font-black ' + (flux > 0 ? 'text-emerald-300' : 'text-rose-300');
    }
  }

  function loop() {
    render();
    animId = requestAnimationFrame(loop);
  }

  // Controls
  const qSlider = wrap.querySelector('#qSlider');
  const posSlider = wrap.querySelector('#posSlider');

  qSlider.addEventListener('input', () => {
    chargeQ = parseFloat(qSlider.value);
    const v = chargeQ;
    wrap.querySelector('#qVal').textContent = (v >= 0 ? '+' : '') + v.toFixed(1) + ' nC';
  });
  posSlider.addEventListener('input', () => {
    chargeOffset = parseFloat(posSlider.value);
    const R = sphereRadius();
    const inside = Math.abs(chargeOffset) < R;
    wrap.querySelector('#posVal').textContent = inside ? 'Inside' : 'Outside';
  });

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

  wrap.querySelector('.tog-sphere').addEventListener('click', () => {
    showSphere = !showSphere;
    setTogUI('.tog-sphere', showSphere);
  });
  wrap.querySelector('.tog-lines').addEventListener('click', () => {
    showLines = !showLines;
    setTogUI('.tog-lines', showLines);
  });
  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    chargeQ = 2; chargeOffset = 0;
    qSlider.value = 2; posSlider.value = 0;
    wrap.querySelector('#qVal').textContent = '+2.0 nC';
    wrap.querySelector('#posVal').textContent = 'Inside';
  });
  wrap.querySelector('.back-btn').addEventListener('click', () => window.goBack());

  let ro = null;
  if ('ResizeObserver' in window) {
    ro = new ResizeObserver(() => resize());
    ro.observe(canvas);
  }
  resize();
  animId = requestAnimationFrame(loop);

  return function cleanup() {
    if (animId) cancelAnimationFrame(animId);
    if (ro) ro.disconnect();
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    document.body.style.overflow = prevOverflow;
  };
}
