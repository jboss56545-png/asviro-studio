export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">Inverse Trig Identities</div><div class="text-[9px] text-slate-500 truncate">Class 12 Math - Ch 2</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2.5 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">LHS</div>
        <div class="text-[11px] font-black text-emerald-300" id="rLHS">0</div>
      </div>
      <div class="absolute top-2 right-2 bg-white/10 border border-white/10 rounded-xl px-2.5 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">RHS</div>
        <div class="text-[11px] font-black text-cyan-300" id="rRHS">0</div>
      </div>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 max-h-[46vh] overflow-y-auto space-y-2.5" style="backdrop-filter:blur(20px);">
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-emerald-400 uppercase">Input x</label><span class="text-[11px] font-black text-emerald-400" id="xV">0.50</span></div>
        <input type="range" id="xSlider" min="-0.99" max="0.99" step="0.01" value="0.5" class="w-full accent-emerald-500">
      </div>
      <div class="grid grid-cols-1 gap-1.5">
        <button type="button" class="itog py-2.5 rounded-xl text-[10px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300" data-i="0">sin⁻¹x + cos⁻¹x = π/2</button>
        <button type="button" class="itog py-2.5 rounded-xl text-[10px] font-bold bg-white/5 border border-white/10 text-slate-300" data-i="1">tan⁻¹x + cot⁻¹x = π/2</button>
        <button type="button" class="itog py-2.5 rounded-xl text-[10px] font-bold bg-white/5 border border-white/10 text-slate-300" data-i="2">sin⁻¹(−x) = −sin⁻¹(x)</button>
        <button type="button" class="itog py-2.5 rounded-xl text-[10px] font-bold bg-white/5 border border-white/10 text-slate-300" data-i="3">tan⁻¹x + tan⁻¹y = tan⁻¹((x+y)/(1−xy))</button>
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[9px] text-slate-400 leading-relaxed" id="infoBox">
        <b class="text-emerald-400">Identity:</b> sin⁻¹x + cos⁻¹x = π/2 — Complement angle property. Har x ∈ [−1, 1] ke liye valid.
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

  let xVal = 0.5, mode = 0;
  let animId = null;

  function drawBar(label, value, maxVal, color, x, y, w, h) {
    // Background bar
    ctx.fillStyle = 'rgba(148,163,184,0.1)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, 8);
    else ctx.rect(x, y, w, h);
    ctx.fill();

    // Filled bar
    const pct = Math.max(0, Math.min(1, value / maxVal));
    ctx.fillStyle = color;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w * pct, h, 8);
    else ctx.rect(x, y, w * pct, h);
    ctx.fill();

    // Label
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y - 12);

    // Value
    ctx.fillStyle = color;
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(value.toFixed(4), x + w, y - 12);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#0f172a'); bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    let lhs, rhs, lhsLabel, rhsLabel, formula;
    const PI2 = Math.PI / 2;

    if (mode === 0) {
      lhs = Math.asin(xVal) + Math.acos(xVal);
      rhs = PI2;
      lhsLabel = 'sin⁻¹x + cos⁻¹x';
      rhsLabel = 'π/2 ≈ ' + PI2.toFixed(4);
      formula = 'sin⁻¹(x) + cos⁻¹(x) = π/2';
    } else if (mode === 1) {
      lhs = Math.atan(xVal) + Math.atan(1 / xVal);
      // For x > 0, atan(x) + atan(1/x) = π/2; for x < 0, = -π/2
      rhs = xVal > 0 ? PI2 : -PI2;
      lhsLabel = 'tan⁻¹x + cot⁻¹x';
      rhsLabel = xVal > 0 ? 'π/2' : '-π/2';
      formula = 'tan⁻¹(x) + cot⁻¹(x) = π/2 (x > 0)';
    } else if (mode === 2) {
      lhs = Math.asin(-xVal);
      rhs = -Math.asin(xVal);
      lhsLabel = 'sin⁻¹(−x)';
      rhsLabel = '−sin⁻¹(x)';
      formula = 'sin⁻¹(−x) = −sin⁻¹(x)';
    } else {
      // Use a fixed y for demo: y = 0.3
      const y = 0.3;
      const xy = xVal * y;
      if (Math.abs(xy) < 0.999) {
        lhs = Math.atan(xVal) + Math.atan(y);
        rhs = Math.atan((xVal + y) / (1 - xy));
      } else {
        lhs = PI2;
        rhs = PI2;
      }
      lhsLabel = 'tan⁻¹x + tan⁻¹y';
      rhsLabel = 'tan⁻¹((x+y)/(1−xy))';
      formula = 'y = 0.3 fixed';
    }

    // Title
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(formula, W / 2, 20);

    // Bars
    const barX = W * 0.15;
    const barW = W * 0.7;
    const barH = 30;

    drawBar('LHS — ' + lhsLabel, lhs, PI2, '#10b981', barX, H * 0.28, barW, barH);
    drawBar('RHS — ' + rhsLabel, rhs, PI2, '#22d3ee', barX, H * 0.58, barW, barH);

    // Equal indicator
    const diff = Math.abs(lhs - rhs);
    const isEqual = diff < 0.0001;
    const eqY = H * 0.44;
    ctx.fillStyle = isEqual ? '#10b981' : '#f43f5e';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isEqual ? '=' : '≠', W / 2, eqY);

    if (!isEqual) {
      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('diff: ' + diff.toFixed(5), W / 2, eqY + 22);
    }

    // Output values
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LHS = ' + lhs.toFixed(6), W / 2, H * 0.82);
    ctx.fillText('RHS = ' + rhs.toFixed(6), W / 2, H * 0.87);
    ctx.fillStyle = isEqual ? '#10b981' : '#fbbf24';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(isEqual ? '✓ Identity Holds' : '⚠ Range Restriction', W / 2, H * 0.93);
  }

  function loop() { draw(); animId = requestAnimationFrame(loop); }

  function update() {
    const PI2 = Math.PI / 2;
    let lhs, rhs;
    if (mode === 0) { lhs = Math.asin(xVal) + Math.acos(xVal); rhs = PI2; }
    else if (mode === 1) { lhs = Math.atan(xVal) + Math.atan(1 / xVal); rhs = xVal > 0 ? PI2 : -PI2; }
    else if (mode === 2) { lhs = Math.asin(-xVal); rhs = -Math.asin(xVal); }
    else { const y = 0.3; const xy = xVal * y; if (Math.abs(xy) < 0.999) { lhs = Math.atan(xVal) + Math.atan(y); rhs = Math.atan((xVal + y) / (1 - xy)); } else { lhs = PI2; rhs = PI2; } }
    wrap.querySelector('#rLHS').textContent = lhs.toFixed(3);
    wrap.querySelector('#rRHS').textContent = rhs.toFixed(3);
    wrap.querySelector('#xV').textContent = xVal.toFixed(2);
  }

  wrap.querySelector('#xSlider').addEventListener('input', e => { xVal = parseFloat(e.target.value); update(); });

  const INFOS = [
    '<b class="text-emerald-400">Identity:</b> sin⁻¹x + cos⁻¹x = π/2 — Complement angle property. Har x ∈ [−1, 1] ke liye valid.',
    '<b class="text-emerald-400">Identity:</b> tan⁻¹x + cot⁻¹x = π/2 (x > 0). x < 0 ke liye π/2 − π = −π/2 ban jaata hai.',
    '<b class="text-emerald-400">Odd Function:</b> sin⁻¹(−x) = −sin⁻¹(x). Same property cos⁻¹ ke liye nahi — woh even nahi hai.',
    '<b class="text-emerald-400">Sum Formula:</b> tan⁻¹x + tan⁻¹y = tan⁻¹((x+y)/(1−xy)) jab xy < 1. y = 0.3 fix karke test kar rahe hain.'
  ];

  wrap.querySelectorAll('.itog').forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      mode = idx;
      wrap.querySelectorAll('.itog').forEach((b, i) => {
        const on = i === idx;
        b.classList.toggle('bg-emerald-500/20', on);
        b.classList.toggle('border-emerald-500/40', on);
        b.classList.toggle('text-emerald-300', on);
        b.classList.toggle('bg-white/5', !on);
        b.classList.toggle('border-white/10', !on);
        b.classList.toggle('text-slate-300', !on);
      });
      wrap.querySelector('#infoBox').innerHTML = INFOS[idx];
      update();
    });
  });

  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    xVal = 0.5; mode = 0;
    wrap.querySelector('#xSlider').value = 0.5;
    wrap.querySelectorAll('.itog').forEach((b, i) => {
      const on = i === 0;
      b.classList.toggle('bg-emerald-500/20', on);
      b.classList.toggle('border-emerald-500/40', on);
      b.classList.toggle('text-emerald-300', on);
      b.classList.toggle('bg-white/5', !on);
      b.classList.toggle('border-white/10', !on);
      b.classList.toggle('text-slate-300', !on);
    });
    wrap.querySelector('#infoBox').innerHTML = INFOS[0];
    update();
  });
  wrap.querySelector('.back-btn').addEventListener('click', () => window.goBack());

  let ro = null;
  if ('ResizeObserver' in window) { ro = new ResizeObserver(resize); ro.observe(canvas); }
  resize(); update();
  animId = requestAnimationFrame(loop);

  return function cleanup() {
    if (animId) cancelAnimationFrame(animId);
    if (ro) ro.disconnect();
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    document.body.style.overflow = prevOverflow;
  };
}
