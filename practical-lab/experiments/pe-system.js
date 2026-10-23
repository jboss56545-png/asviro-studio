export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">Potential Energy of System</div><div class="text-[9px] text-slate-500 truncate">Class 12 Physics - Ch 2</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">U (system)</div>
        <div class="text-[10px] font-black text-emerald-300" id="rU">0</div>
      </div>
      <div class="absolute top-2 right-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Type</div>
        <div class="text-[10px] font-black text-cyan-300" id="rT">Repulsive</div>
      </div>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 space-y-2" style="backdrop-filter:blur(20px);">
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-emerald-400 uppercase">q₁ (nC)</label><span class="text-[11px] font-black text-emerald-400" id="q1V">+2</span></div>
        <input type="range" id="q1S" min="-5" max="5" step="0.5" value="2" class="w-full accent-emerald-500">
      </div>
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-cyan-400 uppercase">q₂ (nC)</label><span class="text-[11px] font-black text-cyan-400" id="q2V">-2</span></div>
        <input type="range" id="q2S" min="-5" max="5" step="0.5" value="-2" class="w-full accent-cyan-500">
      </div>
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-amber-400 uppercase">Distance r</label><span class="text-[11px] font-black text-amber-400" id="rV">1.0</span></div>
        <input type="range" id="rS" min="0.5" max="3" step="0.05" value="1" class="w-full accent-amber-500">
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[9px] text-slate-400 leading-relaxed">
        <b class="text-emerald-400">U = kq₁q₂/r</b> — Do point charges ke system ki PE. Same signs → positive U (repulsive), opposite signs → negative U (attractive).
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
  let q1 = 2, q2 = -2, r = 1;
  let animId = null, phase = 0;

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#0f172a'); bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const cy = H/2;
    const scale = Math.min(W, H) * 0.13;
    const cx1 = W/2 - scale * r * 1.5;
    const cx2 = W/2 + scale * r * 1.5;

    // Attraction/repulsion arrows
    const attractive = q1 * q2 < 0;
    if (Math.abs(q1) > 0.1 && Math.abs(q2) > 0.1) {
      const dx = cx2 - cx1;
      const dy = 0;
      const d = Math.hypot(dx, dy);
      const ux = dx / d, uy = dy / d;
      const len = Math.min(80, Math.abs(q1 * q2) * 15);
      if (attractive) {
        // arrows toward each other
        ctx.strokeStyle = '#f43f5e';
        ctx.fillStyle = '#f43f5e';
        ctx.lineWidth = 2.5;
        // from left charge
        ctx.beginPath(); ctx.moveTo(cx1 + ux * 20, cy); ctx.lineTo(cx1 + ux * (20 + len), cy); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx1 + ux * (20 + len), cy, 6, 0, Math.PI * 2); ctx.fill();
        // from right charge
        ctx.beginPath(); ctx.moveTo(cx2 - ux * 20, cy); ctx.lineTo(cx2 - ux * (20 + len), cy); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx2 - ux * (20 + len), cy, 6, 0, Math.PI * 2); ctx.fill();
      } else {
        // arrows away
        ctx.strokeStyle = '#22d3ee';
        ctx.fillStyle = '#22d3ee';
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(cx1 - ux * 20, cy); ctx.lineTo(cx1 - ux * (20 + len), cy); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx1 - ux * (20 + len), cy, 6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx2 + ux * 20, cy); ctx.lineTo(cx2 + ux * (20 + len), cy); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx2 + ux * (20 + len), cy, 6, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Charges
    [{ x: cx1, y: cy, q: q1, label: 'q₁' }, { x: cx2, y: cy, q: q2, label: 'q₂' }].forEach(c => {
      const isPos = c.q > 0;
      const col = isPos ? '244,63,94' : '34,211,238';
      const glow = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, 35);
      glow.addColorStop(0, `rgba(${col},0.5)`);
      glow.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(c.x, c.y, 35, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = isPos ? '#e11d48' : '#0891b2';
      ctx.beginPath(); ctx.arc(c.x, c.y, 20, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(isPos ? '+' : (c.q < 0 ? '−' : '0'), c.x, c.y + 1);
      // Label
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(c.label, c.x, c.y + 40);
    });

    // Distance line
    ctx.strokeStyle = 'rgba(251,191,36,0.6)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx1, cy + 30); ctx.lineTo(cx2, cy + 30); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('r = ' + r.toFixed(2), (cx1 + cx2) / 2, cy + 48);

    // Energy indicator at top
    const U = q1 * q2 / r;
    const energyColor = U > 0.01 ? '#f43f5e' : U < -0.01 ? '#22d3ee' : '#94a3b8';
    ctx.fillStyle = energyColor;
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('U = ' + U.toFixed(2) + ' k-units', W / 2, 25);
  }

  function loop() { phase += 0.02; draw(); animId = requestAnimationFrame(loop); }

  function update() {
    const U = q1 * q2 / r;
    const attractive = q1 * q2 < 0;
    wrap.querySelector('#rU').textContent = U.toFixed(2);
    wrap.querySelector('#rT').textContent = Math.abs(U) < 0.05 ? 'Neutral' : (attractive ? 'Attractive' : 'Repulsive');
    wrap.querySelector('#q1V').textContent = (q1 >= 0 ? '+' : '') + q1.toFixed(1);
    wrap.querySelector('#q2V').textContent = (q2 >= 0 ? '+' : '') + q2.toFixed(1);
    wrap.querySelector('#rV').textContent = r.toFixed(2);
  }

  wrap.querySelector('#q1S').addEventListener('input', e => { q1 = parseFloat(e.target.value); update(); });
  wrap.querySelector('#q2S').addEventListener('input', e => { q2 = parseFloat(e.target.value); update(); });
  wrap.querySelector('#rS').addEventListener('input', e => { r = parseFloat(e.target.value); update(); });
  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    q1 = 2; q2 = -2; r = 1;
    wrap.querySelector('#q1S').value = 2;
    wrap.querySelector('#q2S').value = -2;
    wrap.querySelector('#rS').value = 1;
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
