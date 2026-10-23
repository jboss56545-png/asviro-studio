export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">Potential from Point Charge</div><div class="text-[9px] text-slate-500 truncate">Class 12 Physics - Ch 2</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">V</div>
        <div class="text-[10px] font-black text-emerald-300" id="rV">0.00 V</div>
      </div>
      <div class="absolute top-2 right-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">E</div>
        <div class="text-[10px] font-black text-cyan-300" id="rE">0.00</div>
      </div>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 space-y-2" style="backdrop-filter:blur(20px);">
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-emerald-400 uppercase">Charge q</label><span class="text-[11px] font-black text-emerald-400" id="qV">+2.0 nC</span></div>
        <input type="range" id="qSlider" min="-5" max="5" step="0.5" value="2" class="w-full accent-emerald-500">
      </div>
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-amber-400 uppercase">Distance r</label><span class="text-[11px] font-black text-amber-400" id="rVd">1.0</span></div>
        <input type="range" id="rSlider" min="0.5" max="3" step="0.05" value="1" class="w-full accent-amber-500">
      </div>
      <div class="grid grid-cols-2 gap-1.5">
        <button type="button" class="tog tog-ring py-2 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">Equipotentials</button>
        <button type="button" class="tog tog-arrows py-2 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">E Arrows</button>
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[9px] text-slate-400 leading-relaxed">
        <b class="text-emerald-400">V = kq/r</b> — Point charge se distance r pe potential. Positive charge → positive V, negative charge → negative V.
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
  let q = 2, r = 1;
  let showRings = true, showArrows = true;
  let animId = null, phase = 0;

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#0f172a'); bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const cx = W/2, cy = H/2, scale = Math.min(W, H) * 0.15;

    // Equipotential rings
    if (showRings) {
      for (let i = 1; i <= 6; i++) {
        const rad = scale * i * 0.5;
        const alpha = Math.max(0.05, 0.25 / i);
        ctx.strokeStyle = `rgba(16,185,129,${alpha})`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        // Label V value
        ctx.fillStyle = `rgba(16,185,129,${alpha + 0.2})`;
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('V=' + (q / (i * 0.5)).toFixed(1), cx + rad + 4, cy - 6);
      }
    }

    // E field arrows
    if (showArrows) {
      const count = 12;
      const intensity = Math.min(1, Math.abs(q) / 5);
      const color = q > 0 ? '244,63,94' : '34,211,238';
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        const r1 = scale * 0.7;
        const r2 = scale * 0.7 + 40 + intensity * 30;
        const x1 = cx + Math.cos(a) * r1;
        const y1 = cy + Math.sin(a) * r1;
        const x2 = cx + Math.cos(a) * r2;
        const y2 = cy + Math.sin(a) * r2;
        ctx.strokeStyle = `rgba(${color},${0.4 + intensity * 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        // Arrowhead direction depends on charge sign
        const dir = q > 0 ? 1 : -1;
        const hx = dir > 0 ? x2 : x1;
        const hy = dir > 0 ? y2 : y1;
        const ang = dir > 0 ? a : a + Math.PI;
        ctx.fillStyle = `rgba(${color},${0.7})`;
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(hx - 8 * Math.cos(ang - 0.4), hy - 8 * Math.sin(ang - 0.4));
        ctx.lineTo(hx - 8 * Math.cos(ang + 0.4), hy - 8 * Math.sin(ang + 0.4));
        ctx.closePath(); ctx.fill();
      }
    }

    // Charge
    const col = q > 0 ? '244,63,94' : '34,211,238';
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 40);
    glow.addColorStop(0, `rgba(${col},0.6)`);
    glow.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(cx, cy, 40, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = q > 0 ? '#e11d48' : '#0891b2';
    ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(q > 0 ? '+' : (q < 0 ? '−' : '0'), cx, cy + 1);

    // Test point
    const px = cx + scale * r * 2.5;
    const py = cy;
    ctx.strokeStyle = 'rgba(251,191,36,0.5)';
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('r', (cx + px) / 2, cy - 10);
  }

  function loop() { phase += 0.02; draw(); animId = requestAnimationFrame(loop); }

  function update() {
    const V = q / r;
    const E = q / (r * r);
    wrap.querySelector('#rV').textContent = V.toFixed(2) + ' V';
    wrap.querySelector('#rE').textContent = E.toFixed(2);
    wrap.querySelector('#qV').textContent = (q >= 0 ? '+' : '') + q.toFixed(1) + ' nC';
    wrap.querySelector('#rVd').textContent = r.toFixed(2);
  }

  wrap.querySelector('#qSlider').addEventListener('input', e => { q = parseFloat(e.target.value); update(); });
  wrap.querySelector('#rSlider').addEventListener('input', e => { r = parseFloat(e.target.value); update(); });
  function setTog(sel, on) {
    const b = wrap.querySelector(sel);
    b.classList.toggle('bg-emerald-500/20', on);
    b.classList.toggle('border-emerald-500/40', on);
    b.classList.toggle('text-emerald-300', on);
    b.classList.toggle('bg-white/5', !on);
    b.classList.toggle('border-white/10', !on);
    b.classList.toggle('text-slate-300', !on);
  }
  wrap.querySelector('.tog-ring').addEventListener('click', () => { showRings = !showRings; setTog('.tog-ring', showRings); });
  wrap.querySelector('.tog-arrows').addEventListener('click', () => { showArrows = !showArrows; setTog('.tog-arrows', showArrows); });
  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    q = 2; r = 1;
    wrap.querySelector('#qSlider').value = 2;
    wrap.querySelector('#rSlider').value = 1;
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
