export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">Osmosis & Osmotic Pressure</div><div class="text-[9px] text-slate-500 truncate">Class 12 Chem - Ch 1</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2.5 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">π (osmotic)</div>
        <div class="text-[11px] font-black text-emerald-300" id="rPi">0.00 atm</div>
      </div>
      <div class="absolute top-2 right-2 bg-white/10 border border-white/10 rounded-xl px-2.5 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Height diff</div>
        <div class="text-[11px] font-black text-cyan-300" id="rH">0 cm</div>
      </div>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 space-y-2.5" style="backdrop-filter:blur(20px);">
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-emerald-400 uppercase">Concentration (M)</label><span class="text-[11px] font-black text-emerald-400" id="cV">0.10</span></div>
        <input type="range" id="cSlider" min="0.01" max="1" step="0.01" value="0.1" class="w-full accent-emerald-500">
      </div>
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-amber-400 uppercase">Temperature (K)</label><span class="text-[11px] font-black text-amber-400" id="tV">298</span></div>
        <input type="range" id="tSlider" min="273" max="373" step="1" value="298" class="w-full accent-amber-500">
      </div>
      <div class="grid grid-cols-2 gap-1.5">
        <button type="button" class="tog tog-flow py-2 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">Show Flow</button>
        <button type="button" class="tog tog-pressure py-2 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">Applied Pressure</button>
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[9px] text-slate-400 leading-relaxed">
        <b class="text-emerald-400">Osmosis:</b> Solvent moves from low → high concentration through semipermeable membrane. <b>π = CRT</b> where C = molarity, R = 0.0821 L·atm/mol·K.
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

  let conc = 0.1, temp = 298;
  let showFlow = true, showPressure = false;
  let animId = null, phase = 0;

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#0f172a'); bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const cx = W / 2;
    const tubeW = W * 0.35;
    const tubeH = H * 0.7;
    const tubeY = H * 0.15;
    const memY = tubeY + tubeH * 0.6; // membrane position

    // U-tube outer
    ctx.strokeStyle = 'rgba(148,163,184,0.5)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx - tubeW / 2, tubeY);
    ctx.lineTo(cx - tubeW / 2, tubeY + tubeH);
    ctx.quadraticCurveTo(cx, tubeY + tubeH + 30, cx + tubeW / 2, tubeY + tubeH);
    ctx.lineTo(cx + tubeW / 2, tubeY);
    ctx.stroke();

    // Right side solution (higher concentration)
    const rightLevel = tubeY + tubeH * (1 - Math.min(0.75, 0.3 + conc * 0.5)) - 30;
    const rg = ctx.createLinearGradient(0, rightLevel, 0, tubeY + tubeH);
    rg.addColorStop(0, 'rgba(244,63,94,0.5)');
    rg.addColorStop(1, 'rgba(190,24,93,0.85)');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.moveTo(cx + 4, rightLevel);
    ctx.lineTo(cx + 4, tubeY + tubeH);
    ctx.quadraticCurveTo(cx + tubeW / 4, tubeY + tubeH + 25, cx + tubeW / 2, tubeY + tubeH);
    ctx.lineTo(cx + tubeW / 2, rightLevel);
    ctx.closePath();
    ctx.fill();

    // Left side water
    const leftLevel = tubeY + tubeH * 0.55;
    const lg = ctx.createLinearGradient(0, leftLevel, 0, tubeY + tubeH);
    lg.addColorStop(0, 'rgba(34,211,238,0.5)');
    lg.addColorStop(1, 'rgba(6,182,212,0.85)');
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.moveTo(cx - tubeW / 2, leftLevel);
    ctx.lineTo(cx - tubeW / 2, tubeY + tubeH);
    ctx.quadraticCurveTo(cx - tubeW / 4, tubeY + tubeH + 25, cx - 4, tubeY + tubeH);
    ctx.lineTo(cx - 4, leftLevel);
    ctx.closePath();
    ctx.fill();

    // Membranes (semipermeable - shown as dashed line)
    ctx.strokeStyle = 'rgba(148,163,184,0.9)';
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(cx, memY);
    ctx.lineTo(cx, tubeY + tubeH + 15);
    ctx.stroke();
    ctx.setLineDash([]);

    // Membrane label
    ctx.fillStyle = 'rgba(148,163,184,0.7)';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.save();
    ctx.translate(cx + 12, memY + 20);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Semipermeable', 0, 0);
    ctx.restore();

    // Solvent particles moving left → right
    if (showFlow) {
      for (let i = 0; i < 15; i++) {
        const seed = i * 3.7;
        const t = ((phase * 0.5 + seed) % 1);
        const px = cx - tubeW / 2 + 15 + t * (tubeW / 2 - 15);
        const py = tubeY + tubeH * 0.5 + Math.sin(phase + i) * 20;
        if (px < cx - 5) {
          ctx.fillStyle = 'rgba(34,211,238,0.9)';
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fill();
          // Arrow showing direction
          if (t > 0.7) {
            ctx.strokeStyle = 'rgba(34,211,238,0.6)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px + 8, py);
            ctx.stroke();
          }
        }
      }
    }

    // Height difference arrow
    const diff = rightLevel - leftLevel;
    if (Math.abs(diff) > 5) {
      ctx.strokeStyle = 'rgba(251,191,36,0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - tubeW / 2 - 15, leftLevel);
      ctx.lineTo(cx - tubeW / 2 - 15, rightLevel);
      ctx.stroke();
      // arrow head
      ctx.beginPath();
      ctx.moveTo(cx - tubeW / 2 - 18, rightLevel);
      ctx.lineTo(cx - tubeW / 2 - 12, rightLevel);
      ctx.moveTo(cx - tubeW / 2 - 18, leftLevel);
      ctx.lineTo(cx - tubeW / 2 - 12, leftLevel);
      ctx.stroke();
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('h', cx - tubeW / 2 - 25, (leftLevel + rightLevel) / 2);
    }

    // Applied pressure arrows (if toggled)
    if (showPressure && conc > 0.05) {
      ctx.strokeStyle = 'rgba(251,191,36,0.9)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        const ax = cx + tubeW / 4 + (i - 1) * 15;
        const ay = rightLevel - 40;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax, rightLevel - 5);
        ctx.stroke();
        // arrow head
        ctx.fillStyle = 'rgba(251,191,36,0.9)';
        ctx.beginPath();
        ctx.moveTo(ax, rightLevel - 3);
        ctx.lineTo(ax - 5, rightLevel - 10);
        ctx.lineTo(ax + 5, rightLevel - 10);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(251,191,36,0.9)';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Applied P', cx + tubeW / 4, rightLevel - 50);
    }

    // Labels
    ctx.fillStyle = '#22d3ee';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Pure water', cx - tubeW / 2 - 30, tubeY + tubeH * 0.5);
    ctx.fillStyle = '#f43f5e';
    ctx.fillText('Solution', cx + tubeW / 2 + 35, tubeY + tubeH * 0.5);
  }

  function loop() { phase += 0.016; draw(); animId = requestAnimationFrame(loop); }

  function update() {
    const pi = conc * 0.0821 * temp;
    const height = pi * 1030; // rough cm conversion
    wrap.querySelector('#rPi').textContent = pi.toFixed(3) + ' atm';
    wrap.querySelector('#rH').textContent = Math.round(height) + ' cm';
    wrap.querySelector('#cV').textContent = conc.toFixed(2);
    wrap.querySelector('#tV').textContent = temp;
  }

  wrap.querySelector('#cSlider').addEventListener('input', e => { conc = parseFloat(e.target.value); update(); });
  wrap.querySelector('#tSlider').addEventListener('input', e => { temp = parseFloat(e.target.value); update(); });

  function setTogUI(sel, on) {
    const b = wrap.querySelector(sel);
    b.classList.toggle('bg-emerald-500/20', on);
    b.classList.toggle('border-emerald-500/40', on);
    b.classList.toggle('text-emerald-300', on);
    b.classList.toggle('bg-white/5', !on);
    b.classList.toggle('border-white/10', !on);
    b.classList.toggle('text-slate-300', !on);
  }
  wrap.querySelector('.tog-flow').addEventListener('click', () => { showFlow = !showFlow; setTogUI('.tog-flow', showFlow); });
  wrap.querySelector('.tog-pressure').addEventListener('click', () => { showPressure = !showPressure; setTogUI('.tog-pressure', showPressure); });

  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    conc = 0.1; temp = 298;
    wrap.querySelector('#cSlider').value = 0.1;
    wrap.querySelector('#tSlider').value = 298;
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
