export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">Daniell Cell & Salt Bridge</div><div class="text-[9px] text-slate-500 truncate">Class 12 Chem - Ch 2</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">EMF</div>
        <div class="text-[10px] font-black text-emerald-300" id="rEMF">1.10 V</div>
      </div>
      <div class="absolute top-2 right-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">e⁻ direction</div>
        <div class="text-[10px] font-black text-cyan-300" id="rDir">Zn → Cu</div>
      </div>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 max-h-[42vh] overflow-y-auto space-y-2" style="backdrop-filter:blur(20px);">
      <div class="grid grid-cols-2 gap-1.5">
        <button type="button" class="mtog py-2 rounded-xl text-[10px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300" data-m="0">With Salt Bridge</button>
        <button type="button" class="mtog py-2 rounded-xl text-[10px] font-bold bg-white/5 border border-white/10 text-slate-300" data-m="1">No Bridge</button>
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[9px] text-slate-400 leading-relaxed">
        <b class="text-emerald-400">Daniell Cell:</b> Zn | ZnSO₄ || CuSO₄ | Cu. Zn oxidizes (anode), Cu²⁺ reduces (cathode). Salt bridge completes circuit aur charge balance karta hai.
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

  let withBridge = true;
  let animId = null, phase = 0;
  let electrons = [];

  function initElectrons() {
    electrons = [];
    for (let i = 0; i < 15; i++) electrons.push({ t: i / 15 });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#0f172a'); bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const cy = H / 2 + 10;
    const leftX = W * 0.25;
    const rightX = W * 0.75;
    const beakerW = 110;
    const beakerH = 140;

    // Zn beaker
    ctx.strokeStyle = 'rgba(148,163,184,0.5)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(leftX - beakerW/2, cy - beakerH/2);
    ctx.lineTo(leftX - beakerW/2, cy + beakerH/2);
    ctx.lineTo(leftX + beakerW/2, cy + beakerH/2);
    ctx.lineTo(leftX + beakerW/2, cy - beakerH/2);
    ctx.stroke();
    // ZnSO4 solution (colorless/light)
    const lg1 = ctx.createLinearGradient(0, cy - beakerH/4, 0, cy + beakerH/2);
    lg1.addColorStop(0, 'rgba(200,210,220,0.25)');
    lg1.addColorStop(1, 'rgba(150,160,170,0.5)');
    ctx.fillStyle = lg1;
    ctx.fillRect(leftX - beakerW/2 + 2, cy - beakerH/4, beakerW - 4, beakerH*0.75 - 2);

    // Cu beaker
    ctx.strokeStyle = 'rgba(148,163,184,0.5)';
    ctx.beginPath();
    ctx.moveTo(rightX - beakerW/2, cy - beakerH/2);
    ctx.lineTo(rightX - beakerW/2, cy + beakerH/2);
    ctx.lineTo(rightX + beakerW/2, cy + beakerH/2);
    ctx.lineTo(rightX + beakerW/2, cy - beakerH/2);
    ctx.stroke();
    // CuSO4 solution (blue)
    const lg2 = ctx.createLinearGradient(0, cy - beakerH/4, 0, cy + beakerH/2);
    lg2.addColorStop(0, 'rgba(59,130,246,0.4)');
    lg2.addColorStop(1, 'rgba(30,64,175,0.75)');
    ctx.fillStyle = lg2;
    ctx.fillRect(rightX - beakerW/2 + 2, cy - beakerH/4, beakerW - 4, beakerH*0.75 - 2);

    // Zn electrode
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(leftX - 8, cy - beakerH/2 + 10, 16, beakerH * 0.7);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(leftX - 8, cy - beakerH/2 + 10, 16, beakerH * 0.7);

    // Cu electrode
    ctx.fillStyle = '#d97706';
    ctx.fillRect(rightX - 8, cy - beakerH/2 + 10, 16, beakerH * 0.7);
    ctx.strokeStyle = '#78350f';
    ctx.strokeRect(rightX - 8, cy - beakerH/2 + 10, 16, beakerH * 0.7);

    // Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Zn', leftX, cy + beakerH/2 + 15);
    ctx.fillText('Cu', rightX, cy + beakerH/2 + 15);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('ZnSO₄', leftX, cy + beakerH/2 + 28);
    ctx.fillStyle = '#93c5fd';
    ctx.fillText('CuSO₄', rightX, cy + beakerH/2 + 28);

    // Anode/Cathode labels
    ctx.fillStyle = '#22d3ee';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('Anode (−)', leftX, cy - beakerH/2 - 12);
    ctx.fillStyle = '#f43f5e';
    ctx.fillText('Cathode (+)', rightX, cy - beakerH/2 - 12);

    // Wire on top
    const topY = cy - beakerH/2 - 30;
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(leftX, cy - beakerH/2 + 10);
    ctx.lineTo(leftX, topY);
    ctx.lineTo(rightX, topY);
    ctx.lineTo(rightX, cy - beakerH/2 + 10);
    ctx.stroke();

    // Voltmeter in middle
    const vmx = (leftX + rightX) / 2;
    ctx.fillStyle = 'rgba(15,23,42,0.9)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(vmx - 22, topY - 18, 44, 34, 6);
    else ctx.rect(vmx - 22, topY - 18, 44, 34);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('V', vmx, topY - 2);
    ctx.font = 'bold 8px sans-serif';
    ctx.fillText('1.10V', vmx, topY + 10);

    // Electrons moving (Zn → Cu through wire)
    if (withBridge) {
      electrons.forEach(e => {
        e.t += 0.008;
        if (e.t > 1) e.t = 0;
        let px, py;
        if (e.t < 0.4) {
          // up from Zn
          const tt = e.t / 0.4;
          px = leftX;
          py = (cy - beakerH/2 + 10) + (topY - (cy - beakerH/2 + 10)) * tt;
        } else if (e.t < 0.6) {
          // across
          const tt = (e.t - 0.4) / 0.2;
          px = leftX + (rightX - leftX) * tt;
          py = topY;
        } else {
          // down to Cu
          const tt = (e.t - 0.6) / 0.4;
          px = rightX;
          py = topY + ((cy - beakerH/2 + 10) - topY) * tt;
        }
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath(); ctx.arc(px, py, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1; ctx.stroke();
      });

      // Salt bridge
      const bridgeY = cy + 30;
      ctx.strokeStyle = 'rgba(168,85,247,0.85)';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(leftX + 10, bridgeY);
      ctx.quadraticCurveTo((leftX + rightX) / 2, bridgeY - 25, rightX - 10, bridgeY);
      ctx.stroke();
      // Inner gradient
      ctx.strokeStyle = 'rgba(200,150,250,0.6)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(leftX + 10, bridgeY);
      ctx.quadraticCurveTo((leftX + rightX) / 2, bridgeY - 25, rightX - 10, bridgeY);
      ctx.stroke();
      // Salt bridge label
      ctx.fillStyle = '#c084fc';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('Salt Bridge', (leftX + rightX) / 2, bridgeY - 28);

      // KCl ions in bridge
      for (let k = 0; k < 5; k++) {
        const t = ((phase * 0.3 + k / 5) % 1);
        const bx2 = leftX + 10 + (rightX - leftX - 20) * t;
        const by2 = bridgeY - 25 * (1 - Math.pow(2*t - 1, 2));
        ctx.fillStyle = k % 2 === 0 ? '#fbbf24' : '#22d3ee';
        ctx.beginPath(); ctx.arc(bx2, by2, 2, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      // No bridge - show arrows breaking
      ctx.strokeStyle = 'rgba(244,63,94,0.8)';
      ctx.lineWidth = 3;
      const bx = (leftX + rightX) / 2;
      const by2 = cy + 30;
      ctx.beginPath();
      ctx.moveTo(bx - 12, by2 - 12); ctx.lineTo(bx + 12, by2 + 12);
      ctx.moveTo(bx + 12, by2 - 12); ctx.lineTo(bx - 12, by2 + 12);
      ctx.stroke();
      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('Circuit incomplete', bx, by2 + 28);
    }
  }

  function loop() { phase += 0.02; draw(); animId = requestAnimationFrame(loop); }

  wrap.querySelectorAll('.mtog').forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      withBridge = idx === 0;
      wrap.querySelectorAll('.mtog').forEach((b, i) => {
        const on = i === idx;
        b.classList.toggle('bg-emerald-500/20', on);
        b.classList.toggle('border-emerald-500/40', on);
        b.classList.toggle('text-emerald-300', on);
        b.classList.toggle('bg-white/5', !on);
        b.classList.toggle('border-white/10', !on);
        b.classList.toggle('text-slate-300', !on);
      });
      wrap.querySelector('#rEMF').textContent = withBridge ? '1.10 V' : '0.00 V';
      wrap.querySelector('#rDir').textContent = withBridge ? 'Zn → Cu' : 'No flow';
    });
  });
  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    withBridge = true;
    wrap.querySelectorAll('.mtog').forEach((b, i) => {
      const on = i === 0;
      b.classList.toggle('bg-emerald-500/20', on);
      b.classList.toggle('border-emerald-500/40', on);
      b.classList.toggle('text-emerald-300', on);
      b.classList.toggle('bg-white/5', !on);
      b.classList.toggle('border-white/10', !on);
      b.classList.toggle('text-slate-300', !on);
    });
    wrap.querySelector('#rEMF').textContent = '1.10 V';
    wrap.querySelector('#rDir').textContent = 'Zn → Cu';
  });
  wrap.querySelector('.back-btn').addEventListener('click', () => window.goBack());

  let ro = null;
  if ('ResizeObserver' in window) { ro = new ResizeObserver(resize); ro.observe(canvas); }
  resize(); initElectrons();
  animId = requestAnimationFrame(loop);
  return function cleanup() {
    if (animId) cancelAnimationFrame(animId);
    if (ro) ro.disconnect();
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    document.body.style.overflow = prevOverflow;
  };
}
