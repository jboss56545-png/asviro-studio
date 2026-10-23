export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">Galvanic Cell</div><div class="text-[9px] text-slate-500 truncate">Class 12 Chem - Ch 2</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">E°cell</div>
        <div class="text-[10px] font-black text-emerald-300" id="rE">1.10 V</div>
      </div>
      <div class="absolute top-2 right-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">ΔG°</div>
        <div class="text-[10px] font-black text-rose-300" id="rG">-212 kJ/mol</div>
      </div>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 max-h-[40vh] overflow-y-auto space-y-2" style="backdrop-filter:blur(20px);">
      <div class="grid grid-cols-3 gap-1.5">
        <button type="button" class="ctog py-2 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300" data-c="0">Zn/Cu</button>
        <button type="button" class="ctog py-2 rounded-xl text-[9px] font-bold bg-white/5 border border-white/10 text-slate-300" data-c="1">Mg/Cu</button>
        <button type="button" class="ctog py-2 rounded-xl text-[9px] font-bold bg-white/5 border border-white/10 text-slate-300" data-c="2">Cu/Ag</button>
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[9px] text-slate-400 leading-relaxed">
        <b class="text-emerald-400">Galvanic Cell:</b> Spontaneous redox reaction → electrical energy. Anode = oxidation (−), Cathode = reduction (+). E°cell = E°cath − E°anode.
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

  const CELLS = [
    { left: 'Zn', right: 'Cu', rightIon: 'Cu²⁺', E: 1.10, color: '#3b82f6' },
    { left: 'Mg', right: 'Cu', rightIon: 'Cu²⁺', E: 2.71, color: '#3b82f6' },
    { left: 'Cu', right: 'Ag', rightIon: 'Ag⁺', E: 0.46, color: '#a855f7' }
  ];
  let ci = 0;
  let animId = null, phase = 0;
  let electrons = [];

  function initE() {
    electrons = [];
    for (let i = 0; i < 12; i++) electrons.push({ t: i / 12 });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#0f172a'); bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const cell = CELLS[ci];
    const cy = H / 2 + 10;
    const leftX = W * 0.25, rightX = W * 0.75;
    const bw = 100, bh = 130;

    // Beakers
    ctx.strokeStyle = 'rgba(148,163,184,0.5)'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(leftX - bw/2, cy - bh/2); ctx.lineTo(leftX - bw/2, cy + bh/2);
    ctx.lineTo(leftX + bw/2, cy + bh/2); ctx.lineTo(leftX + bw/2, cy - bh/2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(rightX - bw/2, cy - bh/2); ctx.lineTo(rightX - bw/2, cy + bh/2);
    ctx.lineTo(rightX + bw/2, cy + bh/2); ctx.lineTo(rightX + bw/2, cy - bh/2);
    ctx.stroke();

    // Solutions
    const sol1 = ctx.createLinearGradient(0, cy - bh/4, 0, cy + bh/2);
    sol1.addColorStop(0, 'rgba(200,210,220,0.25)');
    sol1.addColorStop(1, 'rgba(150,160,170,0.5)');
    ctx.fillStyle = sol1;
    ctx.fillRect(leftX - bw/2 + 2, cy - bh/4, bw - 4, bh*0.75 - 2);

    const sol2 = ctx.createLinearGradient(0, cy - bh/4, 0, cy + bh/2);
    sol2.addColorStop(0, cell.color + '55');
    sol2.addColorStop(1, cell.color + 'CC');
    ctx.fillStyle = sol2;
    ctx.fillRect(rightX - bw/2 + 2, cy - bh/4, bw - 4, bh*0.75 - 2);

    // Electrodes
    const colors = { 'Zn': '#94a3b8', 'Cu': '#d97706', 'Mg': '#cbd5e1', 'Ag': '#e5e7eb' };
    ctx.fillStyle = colors[cell.left] || '#94a3b8';
    ctx.fillRect(leftX - 8, cy - bh/2 + 10, 16, bh * 0.7);
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.5;
    ctx.strokeRect(leftX - 8, cy - bh/2 + 10, 16, bh * 0.7);

    ctx.fillStyle = colors[cell.right] || '#d97706';
    ctx.fillRect(rightX - 8, cy - bh/2 + 10, 16, bh * 0.7);
    ctx.strokeRect(rightX - 8, cy - bh/2 + 10, 16, bh * 0.7);

    // Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(cell.left, leftX, cy + bh/2 + 15);
    ctx.fillText(cell.right, rightX, cy + bh/2 + 15);
    ctx.fillStyle = '#22d3ee';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('Anode (−)', leftX, cy - bh/2 - 12);
    ctx.fillStyle = '#f43f5e';
    ctx.fillText('Cathode (+)', rightX, cy - bh/2 - 12);

    // Wire
    const topY = cy - bh/2 - 35;
    ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(leftX, cy - bh/2 + 10); ctx.lineTo(leftX, topY);
    ctx.lineTo(rightX, topY); ctx.lineTo(rightX, cy - bh/2 + 10);
    ctx.stroke();

    // Voltmeter
    const vmx = (leftX + rightX) / 2;
    ctx.fillStyle = 'rgba(15,23,42,0.9)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(vmx - 24, topY - 18, 48, 36, 6);
    else ctx.rect(vmx - 24, topY - 18, 48, 36);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 13px sans-serif';
    ctx.fillText('V', vmx, topY - 2);
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText(cell.E.toFixed(2), vmx, topY + 12);

    // Electrons moving
    electrons.forEach(e => {
      e.t += 0.008;
      if (e.t > 1) e.t = 0;
      let px, py;
      if (e.t < 0.4) {
        const tt = e.t / 0.4;
        px = leftX; py = (cy - bh/2 + 10) + (topY - (cy - bh/2 + 10)) * tt;
      } else if (e.t < 0.6) {
        const tt = (e.t - 0.4) / 0.2;
        px = leftX + (rightX - leftX) * tt; py = topY;
      } else {
        const tt = (e.t - 0.6) / 0.4;
        px = rightX; py = topY + ((cy - bh/2 + 10) - topY) * tt;
      }
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath(); ctx.arc(px, py, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1; ctx.stroke();
    });

    // Salt bridge
    const bridgeY = cy + 25;
    ctx.strokeStyle = 'rgba(168,85,247,0.85)';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(leftX + 10, bridgeY);
    ctx.quadraticCurveTo((leftX + rightX) / 2, bridgeY - 22, rightX - 10, bridgeY);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(200,150,250,0.6)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(leftX + 10, bridgeY);
    ctx.quadraticCurveTo((leftX + rightX) / 2, bridgeY - 22, rightX - 10, bridgeY);
    ctx.stroke();
  }

  function loop() { phase += 0.02; draw(); animId = requestAnimationFrame(loop); }

  wrap.querySelectorAll('.ctog').forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      ci = idx;
      const cell = CELLS[ci];
      wrap.querySelectorAll('.ctog').forEach((b, i) => {
        const on = i === idx;
        b.classList.toggle('bg-emerald-500/20', on);
        b.classList.toggle('border-emerald-500/40', on);
        b.classList.toggle('text-emerald-300', on);
        b.classList.toggle('bg-white/5', !on);
        b.classList.toggle('border-white/10', !on);
        b.classList.toggle('text-slate-300', !on);
      });
      wrap.querySelector('#rE').textContent = cell.E.toFixed(2) + ' V';
      wrap.querySelector('#rG').textContent = (-cell.E * 96.5).toFixed(0) + ' kJ/mol';
    });
  });
  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    ci = 0;
    wrap.querySelectorAll('.ctog').forEach((b, i) => {
      const on = i === 0;
      b.classList.toggle('bg-emerald-500/20', on);
      b.classList.toggle('border-emerald-500/40', on);
      b.classList.toggle('text-emerald-300', on);
      b.classList.toggle('bg-white/5', !on);
      b.classList.toggle('border-white/10', !on);
      b.classList.toggle('text-slate-300', !on);
    });
    wrap.querySelector('#rE').textContent = '1.10 V';
    wrap.querySelector('#rG').textContent = '-106 kJ/mol';
  });
  wrap.querySelector('.back-btn').addEventListener('click', () => window.goBack());

  let ro = null;
  if ('ResizeObserver' in window) { ro = new ResizeObserver(resize); ro.observe(canvas); }
  resize(); initE();
  animId = requestAnimationFrame(loop);
  return function cleanup() {
    if (animId) cancelAnimationFrame(animId);
    if (ro) ro.disconnect();
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    document.body.style.overflow = prevOverflow;
  };
}
