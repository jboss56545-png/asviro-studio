export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">Composition of Functions</div><div class="text-[9px] text-slate-500 truncate">Class 12 Math - Ch 1</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2.5 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Result</div>
        <div class="text-[11px] font-black text-emerald-300" id="rVal">0</div>
      </div>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 space-y-2.5" style="backdrop-filter:blur(20px);">
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-emerald-400 uppercase">Input x</label><span class="text-[11px] font-black text-emerald-400" id="xV">2.0</span></div>
        <input type="range" id="xSlider" min="-3" max="3" step="0.1" value="2" class="w-full accent-emerald-500">
      </div>
      <div class="grid grid-cols-2 gap-1.5">
        <button type="button" class="ctog py-2.5 rounded-xl text-[10px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300" data-c="0">f(g(x))</button>
        <button type="button" class="ctog py-2.5 rounded-xl text-[10px] font-bold bg-white/5 border border-white/10 text-slate-300" data-c="1">g(f(x))</button>
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[9px] text-slate-400 leading-relaxed" id="formulaBox">
        <b class="text-emerald-400">f(x) = x², g(x) = x + 1</b><br>f(g(x)) = (x+1)²
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[9px] text-slate-400 leading-relaxed">
        <b class="text-cyan-400">Composition:</b> (f∘g)(x) = f(g(x)). Pehle g apply karo, uska result f mein daalo. Order matters — generally f(g(x)) ≠ g(f(x)).
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

  // f(x) = x^2, g(x) = x + 1
  const f = x => x * x;
  const g = x => x + 1;

  let x = 2;
  let order = 0; // 0 = fog, 1 = gof
  let animId = null;
  let t = 0;

  function drawMachine(cx, cy, w, h, label, expr, inVal, outVal, color) {
    // Machine box
    const g1 = ctx.createLinearGradient(cx - w/2, cy - h/2, cx + w/2, cy + h/2);
    g1.addColorStop(0, color + '33');
    g1.addColorStop(1, color + '11');
    ctx.fillStyle = g1;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(cx - w/2, cy - h/2, w, h, 12);
    else ctx.rect(cx - w/2, cy - h/2, w, h);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Label
    ctx.fillStyle = color;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, cx, cy - h/2 + 18);
    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText(expr, cx, cy - h/2 + 34);

    // Input arrow
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx - w/2 - 50, cy + 10);
    ctx.lineTo(cx - w/2, cy + 10);
    ctx.stroke();
    ctx.fillStyle = '#22d3ee';
    ctx.beginPath();
    ctx.moveTo(cx - w/2, cy + 10);
    ctx.lineTo(cx - w/2 - 8, cy + 5);
    ctx.lineTo(cx - w/2 - 8, cy + 15);
    ctx.closePath();
    ctx.fill();

    // Input value
    ctx.fillStyle = 'rgba(15,23,42,0.9)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(cx - w/2 - 70, cy - 8, 60, 32, 6);
    else ctx.rect(cx - w/2 - 70, cy - 8, 60, 32);
    ctx.fill();
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#22d3ee';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(inVal.toFixed(2), cx - w/2 - 40, cy + 8);

    // Output arrow
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx + w/2, cy + 10);
    ctx.lineTo(cx + w/2 + 50, cy + 10);
    ctx.stroke();
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(cx + w/2 + 50, cy + 10);
    ctx.lineTo(cx + w/2 + 42, cy + 5);
    ctx.lineTo(cx + w/2 + 42, cy + 15);
    ctx.closePath();
    ctx.fill();

    // Output value
    ctx.fillStyle = 'rgba(15,23,42,0.9)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(cx + w/2 + 10, cy - 8, 60, 32, 6);
    else ctx.rect(cx + w/2 + 10, cy - 8, 60, 32);
    ctx.fill();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(outVal.toFixed(2), cx + w/2 + 40, cy + 8);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#0f172a'); bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const machineW = Math.min(W * 0.35, 200);
    const machineH = 90;
    const cy = H / 2;

    if (order === 0) {
      // fog: g first then f
      const gOut = g(x);
      const fOut = f(gOut);
      drawMachine(W * 0.35, cy - 60, machineW, machineH, 'g', 'x + 1', x, gOut, '#a855f7');
      // Connect
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(W * 0.35 + machineW/2 + 70, cy - 60 + 10);
      ctx.lineTo(W * 0.35 - machineW/2 - 70, cy + 60 + 10);
      ctx.stroke();
      ctx.setLineDash([]);
      drawMachine(W * 0.35, cy + 60, machineW, machineH, 'f', 'x²', gOut, fOut, '#10b981');
      wrap.querySelector('#rVal').textContent = fOut.toFixed(2);
      wrap.querySelector('#formulaBox').innerHTML = '<b class="text-emerald-400">f(x) = x², g(x) = x + 1</b><br>f(g(' + x.toFixed(1) + ')) = f(' + gOut.toFixed(2) + ') = ' + fOut.toFixed(2);
    } else {
      // gof: f first then g
      const fOut = f(x);
      const gOut = g(fOut);
      drawMachine(W * 0.35, cy - 60, machineW, machineH, 'f', 'x²', x, fOut, '#10b981');
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(W * 0.35 + machineW/2 + 70, cy - 60 + 10);
      ctx.lineTo(W * 0.35 - machineW/2 - 70, cy + 60 + 10);
      ctx.stroke();
      ctx.setLineDash([]);
      drawMachine(W * 0.35, cy + 60, machineW, machineH, 'g', 'x + 1', fOut, gOut, '#a855f7');
      wrap.querySelector('#rVal').textContent = gOut.toFixed(2);
      wrap.querySelector('#formulaBox').innerHTML = '<b class="text-emerald-400">f(x) = x², g(x) = x + 1</b><br>g(f(' + x.toFixed(1) + ')) = g(' + fOut.toFixed(2) + ') = ' + gOut.toFixed(2);
    }

    // Title
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(order === 0 ? 'f(g(x)) — first g, then f' : 'g(f(x)) — first f, then g', W / 2, 20);
  }

  function loop() { draw(); animId = requestAnimationFrame(loop); }

  wrap.querySelector('#xSlider').addEventListener('input', e => {
    x = parseFloat(e.target.value);
    wrap.querySelector('#xV').textContent = x.toFixed(1);
  });

  wrap.querySelectorAll('.ctog').forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      order = idx;
      wrap.querySelectorAll('.ctog').forEach((b, i) => {
        const on = i === idx;
        b.classList.toggle('bg-emerald-500/20', on);
        b.classList.toggle('border-emerald-500/40', on);
        b.classList.toggle('text-emerald-300', on);
        b.classList.toggle('bg-white/5', !on);
        b.classList.toggle('border-white/10', !on);
        b.classList.toggle('text-slate-300', !on);
      });
    });
  });

  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    x = 2; order = 0;
    wrap.querySelector('#xSlider').value = 2;
    wrap.querySelector('#xV').textContent = '2.0';
    wrap.querySelectorAll('.ctog').forEach((b, i) => {
      const on = i === 0;
      b.classList.toggle('bg-emerald-500/20', on);
      b.classList.toggle('border-emerald-500/40', on);
      b.classList.toggle('text-emerald-300', on);
      b.classList.toggle('bg-white/5', !on);
      b.classList.toggle('border-white/10', !on);
      b.classList.toggle('text-slate-300', !on);
    });
  });
  wrap.querySelector('.back-btn').addEventListener('click', () => window.goBack());

  let ro = null;
  if ('ResizeObserver' in window) { ro = new ResizeObserver(resize); ro.observe(canvas); }
  resize();
  animId = requestAnimationFrame(loop);

  return function cleanup() {
    if (animId) cancelAnimationFrame(animId);
    if (ro) ro.disconnect();
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    document.body.style.overflow = prevOverflow;
  };
}
