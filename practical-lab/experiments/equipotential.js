export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">Equipotential Surfaces</div><div class="text-[9px] text-slate-500 truncate">Class 12 Physics - Ch 2</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Config</div>
        <div class="text-[10px] font-black text-emerald-300" id="rCfg">Single</div>
      </div>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 space-y-2" style="backdrop-filter:blur(20px);">
      <div class="grid grid-cols-3 gap-1.5">
        <button type="button" class="mtog py-2.5 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300" data-m="0">+Q</button>
        <button type="button" class="mtog py-2.5 rounded-xl text-[9px] font-bold bg-white/5 border border-white/10 text-slate-300" data-m="1">+Q −Q</button>
        <button type="button" class="mtog py-2.5 rounded-xl text-[9px] font-bold bg-white/5 border border-white/10 text-slate-300" data-m="2">+Q +Q</button>
      </div>
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-emerald-400 uppercase">Charge magnitude</label><span class="text-[11px] font-black text-emerald-400" id="qV">1.0</span></div>
        <input type="range" id="qSlider" min="0.3" max="2" step="0.1" value="1" class="w-full accent-emerald-500">
      </div>
      <div class="grid grid-cols-2 gap-1.5">
        <button type="button" class="tog tog-eq py-2 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">Equipotentials</button>
        <button type="button" class="tog tog-field py-2 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">Field Lines</button>
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[9px] text-slate-400 leading-relaxed">
        <b class="text-emerald-400">Equipotential surfaces</b> are always perpendicular to field lines. No work is done moving charge along equipotential surface.
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

  let mode = 0, q = 1;
  let showEq = true, showField = true;
  let animId = null;

  function chargesForMode() {
    const cx = W/2, cy = H/2;
    const d = Math.min(W, H) * 0.13;
    if (mode === 0) return [{ x: cx, y: cy, q: q }];
    if (mode === 1) return [{ x: cx - d, y: cy, q: q }, { x: cx + d, y: cy, q: -q }];
    return [{ x: cx - d, y: cy, q: q }, { x: cx + d, y: cy, q: q }];
  }

  function potentialAt(x, y, charges) {
    let V = 0;
    charges.forEach(c => {
      const r = Math.max(12, Math.hypot(x - c.x, y - c.y));
      V += c.q * 100 / r;
    });
    return V;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#0f172a'); bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const charges = chargesForMode();

    // Equipotential contours using marching squares (simplified - draw radial arcs)
    if (showEq) {
      const levels = mode === 0 ? [30, 50, 80, 120, 180, 260] : [-80, -40, -15, 15, 40, 80];
      const step = 6;
      levels.forEach((lv, idx) => {
        const color = lv > 0 ? '16,185,129' : '244,63,94';
        const alpha = Math.max(0.05, 0.28 - idx * 0.03);
        ctx.strokeStyle = `rgba(${color},${alpha})`;
        ctx.lineWidth = 1.5;
        for (let y = 0; y < H; y += step) {
          for (let x = 0; x < W; x += step) {
            const v = potentialAt(x, y, charges);
            const v2 = potentialAt(x + step, y, charges);
            const v3 = potentialAt(x, y + step, charges);
            if ((v - lv) * (v2 - lv) < 0) {
              ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + step, y); ctx.stroke();
            }
            if ((v - lv) * (v3 - lv) < 0) {
              ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + step); ctx.stroke();
            }
          }
        }
      });
    }

    // Field lines (from positive charges)
    if (showField) {
      charges.forEach(c => {
        if (c.q <= 0) return;
        const numLines = 10;
        for (let i = 0; i < numLines; i++) {
          const a = (i / numLines) * Math.PI * 2;
          let x = c.x + Math.cos(a) * 18;
          let y = c.y + Math.sin(a) * 18;
          ctx.strokeStyle = 'rgba(251,191,36,0.4)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(x, y);
          for (let s = 0; s < 200; s++) {
            let ex = 0, ey = 0;
            charges.forEach(o => {
              const rx = x - o.x, ry = y - o.y;
              const r2 = rx * rx + ry * ry;
              const r = Math.sqrt(r2);
              if (r < 8) return;
              const sign = o.q > 0 ? 1 : -1;
              const mag = Math.abs(o.q) * 60 / (r2 + 30);
              ex += sign * mag * rx / (r + 0.1);
              ey += sign * mag * ry / (r + 0.1);
            });
            const len = Math.hypot(ex, ey);
            if (len < 0.001) break;
            x += (ex / len) * 6;
            y += (ey / len) * 6;
            if (x < 0 || x > W || y < 0 || y > H) break;
            ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      });
    }

    // Charges
    charges.forEach(c => {
      const isPos = c.q > 0;
      const col = isPos ? '244,63,94' : '34,211,238';
      const glow = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, 30);
      glow.addColorStop(0, `rgba(${col},0.5)`);
      glow.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(c.x, c.y, 30, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = isPos ? '#e11d48' : '#0891b2';
      ctx.beginPath(); ctx.arc(c.x, c.y, 16, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(isPos ? '+' : '−', c.x, c.y + 1);
    });
  }

  function loop() { draw(); animId = requestAnimationFrame(loop); }

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
      wrap.querySelector('#rCfg').textContent = ['Single', 'Dipole', 'Like Charges'][idx];
    });
  });
  wrap.querySelector('#qSlider').addEventListener('input', e => {
    q = parseFloat(e.target.value);
    wrap.querySelector('#qV').textContent = q.toFixed(1);
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
  wrap.querySelector('.tog-eq').addEventListener('click', () => { showEq = !showEq; setTog('.tog-eq', showEq); });
  wrap.querySelector('.tog-field').addEventListener('click', () => { showField = !showField; setTog('.tog-field', showField); });
  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    mode = 0; q = 1;
    wrap.querySelector('#qSlider').value = 1;
    wrap.querySelector('#qV').textContent = '1.0';
    wrap.querySelectorAll('.mtog').forEach((b, i) => {
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
