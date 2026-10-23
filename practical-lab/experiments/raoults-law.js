export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">Raoult's Law</div><div class="text-[9px] text-slate-500 truncate">Class 12 Chem - Ch 1</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2.5 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Total VP</div>
        <div class="text-[11px] font-black text-amber-300" id="rTotal">0 kPa</div>
      </div>
      <div class="absolute top-2 right-2 bg-white/10 border border-white/10 rounded-xl px-2.5 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">x(A)</div>
        <div class="text-[11px] font-black text-cyan-300" id="rXa">0.50</div>
      </div>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 max-h-[46vh] overflow-y-auto space-y-2.5" style="backdrop-filter:blur(20px);">
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-cyan-400 uppercase">Mole fraction of A (x<span class="normal-case">A</span>)</label><span class="text-[11px] font-black text-cyan-400" id="xaV">0.50</span></div>
        <input type="range" id="xaSlider" min="0" max="1" step="0.01" value="0.5" class="w-full accent-cyan-500">
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <div class="flex justify-between mb-1"><label class="text-[9px] font-bold text-emerald-400 uppercase">P°(A) kPa</label><span class="text-[10px] font-black text-emerald-400" id="paV">20</span></div>
          <input type="range" id="paSlider" min="5" max="40" step="1" value="20" class="w-full accent-emerald-500">
        </div>
        <div>
          <div class="flex justify-between mb-1"><label class="text-[9px] font-bold text-rose-400 uppercase">P°(B) kPa</label><span class="text-[10px] font-black text-rose-400" id="pbV">10</span></div>
          <input type="range" id="pbSlider" min="5" max="40" step="1" value="10" class="w-full accent-rose-500">
        </div>
      </div>
      <div class="grid grid-cols-3 gap-1.5">
        <div class="bg-white/5 rounded-xl p-2 border border-white/10"><div class="text-[8px] text-slate-500 uppercase font-bold">P(A)</div><div class="text-xs font-black text-emerald-300" id="rPa">0</div></div>
        <div class="bg-white/5 rounded-xl p-2 border border-white/10"><div class="text-[8px] text-slate-500 uppercase font-bold">P(B)</div><div class="text-xs font-black text-rose-300" id="rPb">0</div></div>
        <div class="bg-white/5 rounded-xl p-2 border border-white/10"><div class="text-[8px] text-slate-500 uppercase font-bold">P(Total)</div><div class="text-xs font-black text-amber-300" id="rPtot">0</div></div>
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[9px] text-slate-400 leading-relaxed">
        <b class="text-amber-400">Raoult's Law:</b> P(A) = x(A) × P°(A). Total VP = P(A) + P(B). Higher vapour pressure = more volatile.
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

  let xa = 0.5, pa = 20, pb = 10;
  let animId = null, phase = 0;
  let vapors = [];

  function initVapors() {
    vapors = [];
    for (let i = 0; i < 30; i++) {
      vapors.push({
        x: Math.random() * W, y: Math.random() * H * 0.5,
        vy: -0.2 - Math.random() * 0.4, r: 2 + Math.random() * 2,
        color: Math.random() < xa ? '#22d3ee' : '#fb7185'
      });
    }
  }

  function drawVessel() {
    const bx = W * 0.15, by = H * 0.45, bw = W * 0.7, bh = H * 0.45;

    // Container
    ctx.strokeStyle = 'rgba(148,163,184,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx, by + bh);
    ctx.lineTo(bx + bw, by + bh);
    ctx.lineTo(bx + bw, by);
    ctx.stroke();

    // Piston (lid)
    const pistonY = by - 5 + Math.sin(phase * 0.02) * 1;
    ctx.fillStyle = 'rgba(148,163,184,0.4)';
    ctx.fillRect(bx - 5, pistonY - 8, bw + 10, 10);
    ctx.fillStyle = 'rgba(100,116,139,0.5)';
    ctx.fillRect(W / 2 - 15, pistonY - 25, 30, 18);

    // Liquid
    const liquidY = by + bh * 0.55;
    const lg = ctx.createLinearGradient(bx, liquidY, bx + bw, liquidY);
    const ratioA = xa;
    lg.addColorStop(0, `rgba(34, 211, 238, ${0.5 + ratioA * 0.3})`);
    lg.addColorStop(1, `rgba(251, 113, 133, ${0.5 + (1 - ratioA) * 0.3})`);
    ctx.fillStyle = lg;
    ctx.fillRect(bx + 2, liquidY, bw - 4, by + bh - liquidY - 2);

    // Liquid surface
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = bx + 2; x < bx + bw; x += 4) {
      const y = liquidY + Math.sin((x + phase * 20) * 0.08) * 1.5;
      if (x === bx + 2) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Molecule count in liquid based on ratio
    const molecA = Math.round(20 * xa);
    const molecB = 20 - molecA;
    for (let i = 0; i < molecA + molecB; i++) {
      const seed = i * 3.7;
      const px = bx + 15 + ((Math.sin(seed) * 0.5 + 0.5) * (bw - 30));
      const py = liquidY + 15 + ((Math.cos(seed * 1.3) * 0.5 + 0.5) * (by + bh - liquidY - 30));
      ctx.fillStyle = i < molecA ? 'rgba(34,211,238,0.85)' : 'rgba(251,113,133,0.85)';
      ctx.beginPath();
      ctx.arc(px, py + Math.sin(phase * 2 + i) * 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Labels
    ctx.fillStyle = '#22d3ee';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('A', bx + 8, liquidY - 10);
    ctx.fillStyle = '#fb7185';
    ctx.textAlign = 'right';
    ctx.fillText('B', bx + bw - 8, liquidY - 10);
  }

  function drawVapor() {
    const intensity = (pa * xa + pb * (1 - xa)) / 80;
    const count = Math.round(15 + intensity * 25);
    for (let i = 0; i < count; i++) {
      const v = vapors[i];
      if (!v) continue;
      v.y += v.vy;
      if (v.y < H * 0.1) { v.y = H * 0.42; v.x = W * 0.18 + Math.random() * W * 0.64; }
      ctx.fillStyle = v.color + 'CC';
      ctx.beginPath();
      ctx.arc(v.x, v.y, v.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = v.color + 'AA';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function drawGraph() {
    const gx = 20, gy = 20, gw = 90, gh = 70;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(gx - 6, gy - 6, gw + 12, gh + 20, 8);
    else ctx.rect(gx - 6, gy - 6, gw + 12, gh + 20);
    ctx.fill();
    // Axes
    ctx.strokeStyle = 'rgba(148,163,184,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + gh); ctx.lineTo(gx + gw, gy + gh);
    ctx.stroke();
    // Line P(A)
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(gx, gy + gh);
    ctx.lineTo(gx + gw, gy + gh - pa / 40 * gh);
    ctx.stroke();
    // Line P(B)
    ctx.strokeStyle = '#fb7185';
    ctx.beginPath();
    ctx.moveTo(gx + gw, gy + gh);
    ctx.lineTo(gx, gy + gh - pb / 40 * gh);
    ctx.stroke();
    // Total line
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 20; i++) {
      const x = i / 20;
      const total = x * pa + (1 - x) * pb;
      const px = gx + x * gw;
      const py = gy + gh - total / 40 * gh;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    // Current point
    const cur = xa * pa + (1 - xa) * pb;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(gx + xa * gw, gy + gh - cur / 40 * gh, 3, 0, Math.PI * 2);
    ctx.fill();
    // Legend
    ctx.font = '7px sans-serif';
    ctx.fillStyle = '#22d3ee'; ctx.textAlign = 'left';
    ctx.fillText('P(A)', gx + gw + 4, gy + 8);
    ctx.fillStyle = '#fb7185';
    ctx.fillText('P(B)', gx + gw + 4, gy + 20);
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('Total', gx + gw + 4, gy + 32);
  }

  function loop() {
    phase += 0.016;
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#0f172a'); bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    drawVessel();
    drawVapor();
    drawGraph();
    animId = requestAnimationFrame(loop);
  }

  function update() {
    const pA = xa * pa;
    const pB = (1 - xa) * pb;
    const total = pA + pB;
    wrap.querySelector('#rTotal').textContent = total.toFixed(1) + ' kPa';
    wrap.querySelector('#rXa').textContent = xa.toFixed(2);
    wrap.querySelector('#xaV').textContent = xa.toFixed(2);
    wrap.querySelector('#rPa').textContent = pA.toFixed(1) + ' kPa';
    wrap.querySelector('#rPb').textContent = pB.toFixed(1) + ' kPa';
    wrap.querySelector('#rPtot').textContent = total.toFixed(1) + ' kPa';
  }

  wrap.querySelector('#xaSlider').addEventListener('input', e => { xa = parseFloat(e.target.value); update(); });
  wrap.querySelector('#paSlider').addEventListener('input', e => { pa = parseFloat(e.target.value); wrap.querySelector('#paV').textContent = pa; update(); });
  wrap.querySelector('#pbSlider').addEventListener('input', e => { pb = parseFloat(e.target.value); wrap.querySelector('#pbV').textContent = pb; update(); });

  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    xa = 0.5; pa = 20; pb = 10;
    wrap.querySelector('#xaSlider').value = 0.5;
    wrap.querySelector('#paSlider').value = 20;
    wrap.querySelector('#pbSlider').value = 10;
    wrap.querySelector('#paV').textContent = '20';
    wrap.querySelector('#pbV').textContent = '10';
    update();
  });
  wrap.querySelector('.back-btn').addEventListener('click', () => window.goBack());

  let ro = null;
  if ('ResizeObserver' in window) { ro = new ResizeObserver(() => { resize(); initVapors(); }); ro.observe(canvas); }
  resize(); initVapors(); update();
  animId = requestAnimationFrame(loop);

  return function cleanup() {
    if (animId) cancelAnimationFrame(animId);
    if (ro) ro.disconnect();
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    document.body.style.overflow = prevOverflow;
  };
}
