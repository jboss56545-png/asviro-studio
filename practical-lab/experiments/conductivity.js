export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">Conductivity of Solutions</div><div class="text-[9px] text-slate-500 truncate">Class 12 Chem - Ch 2</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">κ</div>
        <div class="text-[10px] font-black text-emerald-300" id="rK">0 S/cm</div>
      </div>
      <div class="absolute top-2 right-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Λm</div>
        <div class="text-[10px] font-black text-cyan-300" id="rL">0 S·cm²/mol</div>
      </div>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 max-h-[40vh] overflow-y-auto space-y-2" style="backdrop-filter:blur(20px);">
      <div class="grid grid-cols-2 gap-1.5">
        <button type="button" class="stog py-2 rounded-xl text-[10px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300" data-s="0">Strong (NaCl)</button>
        <button type="button" class="stog py-2 rounded-xl text-[10px] font-bold bg-white/5 border border-white/10 text-slate-300" data-s="1">Weak (CH₃COOH)</button>
      </div>
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-amber-400 uppercase">Concentration (M)</label><span class="text-[11px] font-black text-amber-400" id="cV">0.1</span></div>
        <input type="range" id="cSlider" min="0.001" max="1" step="0.001" value="0.1" class="w-full accent-amber-500">
      </div>
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-cyan-400 uppercase">Temp (°C)</label><span class="text-[11px] font-black text-cyan-400" id="tV">25</span></div>
        <input type="range" id="tSlider" min="0" max="100" step="1" value="25" class="w-full accent-cyan-500">
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[9px] text-slate-400 leading-relaxed">
        <b class="text-emerald-400">κ = 1/R × l/A.</b> Λm = 1000·κ/C. Strong electrolyte: high Λm, less change with conc. Weak: low Λm, drops rapidly on dilution.
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

  let solType = 0, conc = 0.1, temp = 25;
  let animId = null, phase = 0;

  function computeLambda() {
    const tc = 1 + (temp - 25) * 0.02;
    if (solType === 0) return 126 * Math.pow(1 - 0.3 * Math.sqrt(conc), 1) * tc;
    return 39 * Math.sqrt(conc / 0.1) * tc; // weak: less dissociation
  }

  function computeKappa() {
    return computeLambda() * conc / 1000;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#0f172a'); bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Conductivity cell
    const cx = W / 2, cy = H / 2 + 10;
    const cellW = Math.min(W * 0.55, 220);
    const cellH = Math.min(H * 0.7, 180);
    const bx = cx - cellW / 2, by = cy - cellH / 2;

    ctx.strokeStyle = 'rgba(148,163,184,0.5)'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bx, by); ctx.lineTo(bx, by + cellH);
    ctx.lineTo(bx + cellW, by + cellH); ctx.lineTo(bx + cellW, by);
    ctx.stroke();

    // Liquid
    const liquidTop = by + cellH * 0.25;
    const color = solType === 0 ? ['rgba(100,180,255,0.3)', 'rgba(60,120,220,0.8)'] : ['rgba(200,150,100,0.3)', 'rgba(160,100,60,0.7)'];
    const lg = ctx.createLinearGradient(0, liquidTop, 0, by + cellH);
    lg.addColorStop(0, color[0]); lg.addColorStop(1, color[1]);
    ctx.fillStyle = lg;
    ctx.fillRect(bx + 3, liquidTop, cellW - 6, cellH - (liquidTop - by) - 3);

    // Ions
    const numIons = Math.min(50, Math.floor(conc * 100) + 5);
    for (let i = 0; i < numIons; i++) {
      const seed = i * 7.13;
      const px = bx + 12 + ((Math.sin(seed) * 0.5 + 0.5) * (cellW - 24));
      const py = liquidTop + 10 + ((Math.cos(seed * 1.4) * 0.5 + 0.5) * (cellH - (liquidTop - by) - 20));
      const r = 2 + Math.sin(phase * 2 + i) * 0.5;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(251,191,36,0.9)' : 'rgba(34,211,238,0.9)';
      ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
    }

    // Electrodes
    const eW = 12, eH = cellH * 0.6, eY = by + cellH * 0.15;
    const e1x = bx + cellW * 0.28;
    const e2x = bx + cellW * 0.72;

    ctx.fillStyle = '#334155';
    ctx.fillRect(e1x - eW/2, eY, eW, eH);
    ctx.fillRect(e2x - eW/2, eY, eW, eH);
    ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.5;
    ctx.strokeRect(e1x - eW/2, eY, eW, eH);
    ctx.strokeRect(e2x - eW/2, eY, eW, eH);

    // Wires
    const topY = by - 30;
    ctx.strokeStyle = 'rgba(148,163,184,0.6)'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(e1x, by); ctx.lineTo(e1x, topY);
    ctx.lineTo(e2x, topY); ctx.lineTo(e2x, by);
    ctx.stroke();

    // Battery
    const midX = (e1x + e2x) / 2;
    ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(midX - 8, topY - 6); ctx.lineTo(midX - 8, topY + 6);
    ctx.moveTo(midX + 8, topY - 4); ctx.lineTo(midX + 8, topY + 4);
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Conductivity Cell', cx, by + cellH + 20);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('κ = ' + computeKappa().toFixed(4) + ' S/cm', cx, cy - cellH/2 - 45);
  }

  function loop() { phase += 0.02; draw(); animId = requestAnimationFrame(loop); }

  function update() {
    const k = computeKappa();
    const l = computeLambda();
    wrap.querySelector('#rK').textContent = k.toFixed(4) + ' S/cm';
    wrap.querySelector('#rL').textContent = l.toFixed(1) + ' S·cm²/mol';
    wrap.querySelector('#cV').textContent = conc.toFixed(3);
    wrap.querySelector('#tV').textContent = temp;
  }

  wrap.querySelectorAll('.stog').forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      solType = idx;
      wrap.querySelectorAll('.stog').forEach((b, i) => {
        const on = i === idx;
        b.classList.toggle('bg-emerald-500/20', on);
        b.classList.toggle('border-emerald-500/40', on);
        b.classList.toggle('text-emerald-300', on);
        b.classList.toggle('bg-white/5', !on);
        b.classList.toggle('border-white/10', !on);
        b.classList.toggle('text-slate-300', !on);
      });
      update();
    });
  });
  wrap.querySelector('#cSlider').addEventListener('input', e => { conc = parseFloat(e.target.value); update(); });
  wrap.querySelector('#tSlider').addEventListener('input', e => { temp = parseFloat(e.target.value); update(); });
  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    solType = 0; conc = 0.1; temp = 25;
    wrap.querySelector('#cSlider').value = 0.1;
    wrap.querySelector('#tSlider').value = 25;
    wrap.querySelectorAll('.stog').forEach((b, i) => {
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
