export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">Inverse Trig Visualizer</div><div class="text-[9px] text-slate-500 truncate">Class 12 Math - Ch 2</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2.5 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">x</div>
        <div class="text-[11px] font-black text-emerald-300" id="rX">0.00</div>
      </div>
      <div class="absolute top-2 right-2 bg-white/10 border border-white/10 rounded-xl px-2.5 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">θ = sin⁻¹(x)</div>
        <div class="text-[11px] font-black text-cyan-300" id="rTheta">0°</div>
      </div>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 max-h-[42vh] overflow-y-auto space-y-2.5" style="backdrop-filter:blur(20px);">
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-emerald-400 uppercase">x value</label><span class="text-[11px] font-black text-emerald-400" id="xV">0.00</span></div>
        <input type="range" id="xSlider" min="-1" max="1" step="0.01" value="0" class="w-full accent-emerald-500">
      </div>
      <div class="grid grid-cols-3 gap-1.5">
        <button type="button" class="mtog py-2 rounded-xl text-[10px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300" data-m="0">sin⁻¹</button>
        <button type="button" class="mtog py-2 rounded-xl text-[10px] font-bold bg-white/5 border border-white/10 text-slate-300" data-m="1">cos⁻¹</button>
        <button type="button" class="mtog py-2 rounded-xl text-[10px] font-bold bg-white/5 border border-white/10 text-slate-300" data-m="2">tan⁻¹</button>
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[9px] text-slate-400 leading-relaxed" id="infoBox">
        <b class="text-emerald-400">sin⁻¹(x):</b> Returns angle θ whose sin is x. Range: [−π/2, π/2]. Sirf isi range mein result milta hai (principal value).
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

  let xVal = 0, mode = 0;
  let animId = null, phase = 0;

  function w2s(x, y) {
    const scale = Math.min(W, H) / 3;
    return { x: W/2 + x * scale, y: H/2 - y * scale };
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#0f172a'); bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const scale = Math.min(W, H) / 3;

    // Grid
    ctx.strokeStyle = 'rgba(148,163,184,0.08)';
    ctx.lineWidth = 1;
    for (let i = -1; i <= 1; i += 0.5) {
      const p1 = w2s(i, -1), p2 = w2s(i, 1);
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
      const q1 = w2s(-1, i), q2 = w2s(1, i);
      ctx.beginPath(); ctx.moveTo(q1.x, q1.y); ctx.lineTo(q2.x, q2.y); ctx.stroke();
    }

    // Axes
    const o = w2s(0, 0);
    ctx.strokeStyle = 'rgba(148,163,184,0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(o.x - scale * 1.3, o.y); ctx.lineTo(o.x + scale * 1.3, o.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(o.x, o.y - scale * 1.3); ctx.lineTo(o.x, o.y + scale * 1.3); ctx.stroke();

    // Unit circle
    ctx.strokeStyle = 'rgba(148,163,184,0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(o.x, o.y, scale, 0, Math.PI * 2);
    ctx.stroke();

    // Compute angle based on mode
    let theta, ptX, ptY, label;
    if (mode === 0) {
      theta = Math.asin(Math.max(-1, Math.min(1, xVal)));
      ptX = xVal; ptY = Math.sin(theta);
      label = 'sin⁻¹(' + xVal.toFixed(2) + ') = ' + (theta * 180 / Math.PI).toFixed(1) + '°';
    } else if (mode === 1) {
      theta = Math.acos(Math.max(-1, Math.min(1, xVal)));
      ptX = Math.cos(theta); ptY = xVal;
      label = 'cos⁻¹(' + xVal.toFixed(2) + ') = ' + (theta * 180 / Math.PI).toFixed(1) + '°';
    } else {
      theta = Math.atan(xVal);
      ptX = Math.cos(theta); ptY = Math.sin(theta);
      label = 'tan⁻¹(' + xVal.toFixed(2) + ') = ' + (theta * 180 / Math.PI).toFixed(1) + '°';
    }

    // Angle arc
    ctx.strokeStyle = 'rgba(251,191,36,0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(o.x, o.y, scale * 0.35, 0, -theta, theta > 0);
    ctx.stroke();

    // Sin/Cos/Tan line on unit circle
    const pt = w2s(ptX, ptY);
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(pt.x, pt.y); ctx.stroke();

    // Dashed reference lines
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = 'rgba(244,63,94,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pt.x, pt.y); ctx.lineTo(pt.x, o.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pt.x, pt.y); ctx.lineTo(o.x, pt.y); ctx.stroke();
    ctx.setLineDash([]);

    // Point
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath(); ctx.arc(pt.x, pt.y, 7, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('(1,0)', o.x + scale + 20, o.y + 12);
    ctx.fillText('(0,1)', o.x - 20, o.y - scale - 8);
    ctx.fillText('(-1,0)', o.x - scale - 22, o.y + 12);
    ctx.fillText('(0,-1)', o.x - 20, o.y + scale + 14);

    // Angle info at top
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(label, W / 2, 20);

    // x-axis value on circle
    if (mode === 0) {
      ctx.fillStyle = '#22d3ee';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(xVal.toFixed(2), o.x, o.y + scale * 0.15);
    } else if (mode === 1) {
      ctx.fillStyle = '#22d3ee';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(xVal.toFixed(2), o.x + scale * 0.15, o.y);
    }
  }

  function loop() { phase += 0.02; draw(); animId = requestAnimationFrame(loop); }

  function update() {
    wrap.querySelector('#rX').textContent = xVal.toFixed(2);
    wrap.querySelector('#xV').textContent = xVal.toFixed(2);
    let theta;
    if (mode === 0) theta = Math.asin(Math.max(-1, Math.min(1, xVal)));
    else if (mode === 1) theta = Math.acos(Math.max(-1, Math.min(1, xVal)));
    else theta = Math.atan(xVal);
    wrap.querySelector('#rTheta').textContent = (theta * 180 / Math.PI).toFixed(1) + '°';
  }

  wrap.querySelector('#xSlider').addEventListener('input', e => { xVal = parseFloat(e.target.value); update(); });

  wrap.querySelectorAll('.mtog').forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      mode = idx;
      wrap.querySelectorAll('.mtog').forEach((b, i) => {
        const on = i === idx;
        b.classList.toggle('bg-emerald-500/20', on);
        b.classList.toggle('border-emerald-500/40', on);
        b.classList.toggle('text-emerald-300', on);
        b.classList.toggle('bg-white/5', !on);
        b.classList.toggle('border-white/10', !on);
        b.classList.toggle('text-slate-300', !on);
      });
      const infos = [
        '<b class="text-emerald-400">sin⁻¹(x):</b> Returns angle θ whose sin is x. Range: [−π/2, π/2]. Sirf isi range mein result milta hai (principal value).',
        '<b class="text-cyan-400">cos⁻¹(x):</b> Returns angle θ whose cos is x. Range: [0, π]. x ∈ [−1, 1].',
        '<b class="text-purple-400">tan⁻¹(x):</b> Returns angle θ whose tan is x. Range: (−π/2, π/2). x ∈ ℝ (any real number).'
      ];
      wrap.querySelector('#infoBox').innerHTML = infos[idx];
      // Reset x if needed
      if (idx === 2 && (xVal < -1 || xVal > 1)) { xVal = 0; wrap.querySelector('#xSlider').value = 0; }
      update();
    });
  });

  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    xVal = 0; mode = 0;
    wrap.querySelector('#xSlider').value = 0;
    wrap.querySelectorAll('.mtog').forEach((b, i) => {
      const on = i === 0;
      b.classList.toggle('bg-emerald-500/20', on);
      b.classList.toggle('border-emerald-500/40', on);
      b.classList.toggle('text-emerald-300', on);
      b.classList.toggle('bg-white/5', !on);
      b.classList.toggle('border-white/10', !on);
      b.classList.toggle('text-slate-300', !on);
    });
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
