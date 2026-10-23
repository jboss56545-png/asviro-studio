export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">Potential from Dipole</div><div class="text-[9px] text-slate-500 truncate">Class 12 Physics - Ch 2</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Angle θ</div>
        <div class="text-[10px] font-black text-emerald-300" id="rTheta">0°</div>
      </div>
      <div class="absolute top-2 right-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">V (V)</div>
        <div class="text-[10px] font-black text-cyan-300" id="rV">0.00</div>
      </div>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 space-y-2" style="backdrop-filter:blur(20px);">
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-emerald-400 uppercase">Distance r</label><span class="text-[11px] font-black text-emerald-400" id="rVal">1.0</span></div>
        <input type="range" id="rSlider" min="0.5" max="3" step="0.1" value="1" class="w-full accent-emerald-500">
      </div>
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-amber-400 uppercase">Angle θ from axis</label><span class="text-[11px] font-black text-amber-400" id="tVal">0°</span></div>
        <input type="range" id="tSlider" min="0" max="180" step="1" value="0" class="w-full accent-amber-500">
      </div>
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-cyan-400 uppercase">Dipole moment p</label><span class="text-[11px] font-black text-cyan-400" id="pVal">1.0</span></div>
        <input type="range" id="pSlider" min="0.2" max="3" step="0.1" value="1" class="w-full accent-cyan-500">
      </div>
      <div class="grid grid-cols-2 gap-1.5">
        <div class="bg-white/5 rounded-xl p-2 border border-white/10">
          <div class="text-[8px] text-slate-500 uppercase font-bold">Axial (θ=0°)</div>
          <div class="text-xs font-black text-rose-300" id="rAxial">0.00</div>
        </div>
        <div class="bg-white/5 rounded-xl p-2 border border-white/10">
          <div class="text-[8px] text-slate-500 uppercase font-bold">Equatorial (θ=90°)</div>
          <div class="text-xs font-black text-purple-300" id="rEq">0.00</div>
        </div>
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[9px] text-slate-400 leading-relaxed">
        <b class="text-emerald-400">V = kp·cosθ / r²</b> — Axial pe max (positive side pe +V, negative pe −V), equatorial pe V = 0.
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

  let rVal = 1, thetaDeg = 0, pVal = 1;
  let animId = null, phase = 0;

  function computeV() {
    const theta = thetaDeg * Math.PI / 180;
    return (pVal * Math.cos(theta)) / (rVal * rVal);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#0f172a'); bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const cx = W / 2, cy = H / 2;
    const scale = Math.min(W, H) * 0.32;

    // Equipotential-like rings
    for (let i = 1; i <= 4; i++) {
      ctx.strokeStyle = `rgba(34,211,238,${0.10 - i * 0.015})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, scale * i * 0.35, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Axis dashed lines
    ctx.strokeStyle = 'rgba(148,163,184,0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(cx - scale * 1.15, cy); ctx.lineTo(cx + scale * 1.15, cy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy - scale * 1.15); ctx.lineTo(cx, cy + scale * 1.15);
    ctx.stroke();
    ctx.setLineDash([]);

    // Dipole charges
    const d = scale * 0.35;
    // +q (right)
    const g1 = ctx.createRadialGradient(cx + d - 3, cy - 3, 1, cx + d, cy, 16);
    g1.addColorStop(0, '#fb7185');
    g1.addColorStop(1, '#e11d48');
    ctx.fillStyle = g1;
    ctx.beginPath(); ctx.arc(cx + d, cy, 14, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('+', cx + d, cy + 1);

    // −q (left)
    const g2 = ctx.createRadialGradient(cx - d - 3, cy - 3, 1, cx - d, cy, 16);
    g2.addColorStop(0, '#67e8f9');
    g2.addColorStop(1, '#0891b2');
    ctx.fillStyle = g2;
    ctx.beginPath(); ctx.arc(cx - d, cy, 14, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#0f172a'; ctx.stroke();
    ctx.fillStyle = '#0f172a';
    ctx.fillText('−', cx - d, cy - 1);

    // p vector
    ctx.strokeStyle = '#fbbf24';
    ctx.fillStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    const pLen = 30 + pVal * 25;
    ctx.beginPath(); ctx.moveTo(cx - d, cy); ctx.lineTo(cx - d + pLen, cy); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - d + pLen, cy);
    ctx.lineTo(cx - d + pLen - 8, cy - 5);
    ctx.lineTo(cx - d + pLen - 8, cy + 5);
    ctx.closePath(); ctx.fill();

    // Test point
    const theta = thetaDeg * Math.PI / 180;
    const pr = scale * rVal * 0.55;
    const px = cx + Math.cos(theta) * pr;
    const py = cy - Math.sin(theta) * pr;

    ctx.strokeStyle = 'rgba(16,185,129,0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py); ctx.stroke();
    ctx.setLineDash([]);

    // Angle arc
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, -theta, theta > 0);
    ctx.stroke();

    // Test point
    const V = computeV();
    const vColor = V > 0.01 ? '#10b981' : V < -0.01 ? '#f43f5e' : '#94a3b8';
    const glow = ctx.createRadialGradient(px - 3, py - 3, 1, px, py, 18);
    glow.addColorStop(0, vColor + '80');
    glow.addColorStop(1, vColor + '00');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(px, py, 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = vColor;
    ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke();

    // Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Axial', cx + scale * 1.05, cy - 8);
    ctx.fillText('Equatorial', cx - 8, cy - scale * 1.08);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('p', cx - d + pLen / 2, cy - 12);

    ctx.fillStyle = vColor;
    ctx.fillText('V=' + V.toFixed(3), px, py - 20);
  }

  function loop() { phase += 0.02; draw(); animId = requestAnimationFrame(loop); }

  function update() {
    const V = computeV();
    wrap.querySelector('#rTheta').textContent = thetaDeg + '°';
    wrap.querySelector('#rV').textContent = V.toFixed(3);
    wrap.querySelector('#tVal').textContent = thetaDeg + '°';
    wrap.querySelector('#pVal').textContent = pVal.toFixed(1);
    wrap.querySelector('#rVal').textContent = rVal.toFixed(1);
    wrap.querySelector('#rAxial').textContent = (pVal / (rVal * rVal)).toFixed(3);
    wrap.querySelector('#rEq').textContent = '0.000';
  }

  wrap.querySelector('#rSlider').addEventListener('input', e => { rVal = parseFloat(e.target.value); update(); });
  wrap.querySelector('#tSlider').addEventListener('input', e => { thetaDeg = parseFloat(e.target.value); update(); });
  wrap.querySelector('#pSlider').addEventListener('input', e => { pVal = parseFloat(e.target.value); update(); });

  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    rVal = 1; thetaDeg = 0; pVal = 1;
    wrap.querySelector('#rSlider').value = 1;
    wrap.querySelector('#tSlider').value = 0;
    wrap.querySelector('#pSlider').value = 1;
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
