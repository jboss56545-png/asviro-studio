export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">Electrolysis</div><div class="text-[9px] text-slate-500 truncate">Class 12 Chem - Ch 2</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Cathode</div>
        <div class="text-[10px] font-black text-emerald-300" id="rC">H₂ gas</div>
      </div>
      <div class="absolute top-2 right-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Anode</div>
        <div class="text-[10px] font-black text-cyan-300" id="rA">O₂ gas</div>
      </div>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 max-h-[40vh] overflow-y-auto space-y-2" style="backdrop-filter:blur(20px);">
      <div class="grid grid-cols-3 gap-1.5">
        <button type="button" class="etog py-2 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300" data-m="0">Water</button>
        <button type="button" class="etog py-2 rounded-xl text-[9px] font-bold bg-white/5 border border-white/10 text-slate-300" data-m="1">CuSO₄</button>
        <button type="button" class="etog py-2 rounded-xl text-[9px] font-bold bg-white/5 border border-white/10 text-slate-300" data-m="2">NaCl (conc)</button>
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[9px] text-slate-400 leading-relaxed" id="infoBox">
        <b class="text-emerald-400">Water electrolysis:</b> Cathode: 2H₂O + 2e⁻ → H₂ + 2OH⁻ (H₂ gas). Anode: 2H₂O → O₂ + 4H⁺ + 4e⁻ (O₂ gas). Ratio 2:1 (H₂:O₂).
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

  let mode = 0;
  let animId = null, phase = 0;
  let bubbles = [];

  function initBubbles() {
    bubbles = [];
    for (let i = 0; i < 40; i++) {
      bubbles.push({
        x: Math.random(), y: Math.random(),
        r: 1 + Math.random() * 3,
        speed: 0.002 + Math.random() * 0.004,
        side: Math.random() < 0.5 ? 'cathode' : 'anode'
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#0f172a'); bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const cx = W / 2, cy = H / 2 + 10;
    const cw = Math.min(W * 0.7, 280);
    const chh = Math.min(H * 0.7, 200);
    const bx = cx - cw / 2, by = cy - chh / 2;

    // Container
    ctx.strokeStyle = 'rgba(148,163,184,0.5)'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bx, by); ctx.lineTo(bx, by + chh);
    ctx.lineTo(bx + cw, by + chh); ctx.lineTo(bx + cw, by);
    ctx.stroke();

    // Solution color per mode
    const solColors = [
      ['rgba(200,220,255,0.3)', 'rgba(100,140,200,0.6)'],
      ['rgba(59,130,246,0.35)', 'rgba(30,64,175,0.8)'],
      ['rgba(220,240,180,0.3)', 'rgba(160,200,80,0.6)']
    ];
    const liquidTop = by + chh * 0.2;
    const lg = ctx.createLinearGradient(0, liquidTop, 0, by + chh);
    lg.addColorStop(0, solColors[mode][0]);
    lg.addColorStop(1, solColors[mode][1]);
    ctx.fillStyle = lg;
    ctx.fillRect(bx + 3, liquidTop, cw - 6, chh - (liquidTop - by) - 3);

    // Surface
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = bx + 3; x < bx + cw; x += 4) {
      const y = liquidTop + Math.sin((x + phase * 20) * 0.08) * 1.5;
      if (x === bx + 3) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Electrodes
    const eW = 14;
    const eH = chh * 0.75;
    const eY = by + chh * 0.1;
    const catX = bx + cw * 0.25;
    const anoX = bx + cw * 0.75;

    // Cathode (negative)
    ctx.fillStyle = '#334155';
    ctx.fillRect(catX - eW/2, eY, eW, eH);
    ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.5;
    ctx.strokeRect(catX - eW/2, eY, eW, eH);

    // Anode (positive)
    ctx.fillStyle = '#334155';
    ctx.fillRect(anoX - eW/2, eY, eW, eH);
    ctx.strokeRect(anoX - eW/2, eY, eW, eH);

    // Labels
    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('−', catX, by + 20);
    ctx.fillStyle = '#22d3ee';
    ctx.fillText('+', anoX, by + 20);
    ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 9px sans-serif';
    ctx.fillText('Cathode', catX, by + chh + 15);
    ctx.fillText('Anode', anoX, by + chh + 15);

    // Battery wires
    const topY = by - 25;
    ctx.strokeStyle = 'rgba(148,163,184,0.6)'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(catX, by); ctx.lineTo(catX, topY);
    ctx.lineTo(anoX, topY); ctx.lineTo(anoX, by);
    ctx.stroke();
    // Battery
    const midX = (catX + anoX) / 2;
    ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(midX - 12, topY - 8); ctx.lineTo(midX - 12, topY + 8);
    ctx.moveTo(midX - 3, topY - 4); ctx.lineTo(midX - 3, topY + 4);
    ctx.moveTo(midX + 3, topY - 8); ctx.lineTo(midX + 3, topY + 8);
    ctx.moveTo(midX + 12, topY - 4); ctx.lineTo(midX + 12, topY + 4);
    ctx.stroke();

    // Bubbles rising
    bubbles.forEach(b => {
      b.y -= b.speed;
      if (b.y < 0) { b.y = 1; b.x = Math.random(); }
      const elec = b.side === 'cathode' ? catX : anoX;
      const px = elec + (b.x - 0.5) * (cw * 0.15);
      const py = liquidTop + b.y * (chh * 0.7);
      const isH2 = b.side === 'cathode';
      const color = isH2 ? 'rgba(200,220,255,0.7)' : 'rgba(250,200,150,0.7)';
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(px, py, b.r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    });

    // Gas labels on top
    ctx.fillStyle = 'rgba(200,220,255,0.85)';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('H₂', catX - eW/2 - 15, eY + 20);
    ctx.fillStyle = 'rgba(250,200,150,0.85)';
    ctx.fillText('O₂', anoX + eW/2 + 15, eY + 20);
  }

  function loop() { phase += 0.02; draw(); animId = requestAnimationFrame(loop); }

  const INFOS = [
    '<b class="text-emerald-400">Water:</b> Cathode → H₂, Anode → O₂. Ratio 2:1. H₂SO₄ add karte hain conductivity ke liye.',
    '<b class="text-emerald-400">CuSO₄:</b> Cathode → Cu deposits (red), Anode → O₂ gas. Blue color fade hote jaata hai.',
    '<b class="text-emerald-400">NaCl (concentrated):</b> Cathode → H₂, Anode → Cl₂ gas (yellowish-green).'
  ];

  wrap.querySelectorAll('.etog').forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      mode = idx;
      wrap.querySelectorAll('.etog').forEach((b, i) => {
        const on = i === idx;
        b.classList.toggle('bg-emerald-500/20', on);
        b.classList.toggle('border-emerald-500/40', on);
        b.classList.toggle('text-emerald-300', on);
        b.classList.toggle('bg-white/5', !on);
        b.classList.toggle('border-white/10', !on);
        b.classList.toggle('text-slate-300', !on);
      });
      wrap.querySelector('#infoBox').innerHTML = INFOS[idx];
      wrap.querySelector('#rC').textContent = ['H₂ gas', 'Cu deposit', 'H₂ gas'][idx];
      wrap.querySelector('#rA').textContent = ['O₂ gas', 'O₂ gas', 'Cl₂ gas'][idx];
    });
  });
  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    mode = 0;
    wrap.querySelectorAll('.etog').forEach((b, i) => {
      const on = i === 0;
      b.classList.toggle('bg-emerald-500/20', on);
      b.classList.toggle('border-emerald-500/40', on);
      b.classList.toggle('text-emerald-300', on);
      b.classList.toggle('bg-white/5', !on);
      b.classList.toggle('border-white/10', !on);
      b.classList.toggle('text-slate-300', !on);
    });
    wrap.querySelector('#infoBox').innerHTML = INFOS[0];
    wrap.querySelector('#rC').textContent = 'H₂ gas';
    wrap.querySelector('#rA').textContent = 'O₂ gas';
  });
  wrap.querySelector('.back-btn').addEventListener('click', () => window.goBack());

  let ro = null;
  if ('ResizeObserver' in window) { ro = new ResizeObserver(resize); ro.observe(canvas); }
  resize(); initBubbles();
  animId = requestAnimationFrame(loop);
  return function cleanup() {
    if (animId) cancelAnimationFrame(animId);
    if (ro) ro.disconnect();
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    document.body.style.overflow = prevOverflow;
  };
}
