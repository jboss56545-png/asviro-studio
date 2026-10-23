export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">Dielectric Effect</div><div class="text-[9px] text-slate-500 truncate">Class 12 Physics - Ch 2</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">C / C₀</div>
        <div class="text-[10px] font-black text-emerald-300" id="rC">1.00</div>
      </div>
      <div class="absolute top-2 right-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">E / E₀</div>
        <div class="text-[10px] font-black text-cyan-300" id="rE">1.00</div>
      </div>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 space-y-2" style="backdrop-filter:blur(20px);">
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-emerald-400 uppercase">Dielectric constant K</label><span class="text-[11px] font-black text-emerald-400" id="kV">1.0</span></div>
        <input type="range" id="kSlider" min="1" max="8" step="0.1" value="1" class="w-full accent-emerald-500">
      </div>
      <div class="grid grid-cols-2 gap-1.5">
        <button type="button" class="dtog py-2 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300" data-d="0">Air</button>
        <button type="button" class="dtog py-2 rounded-xl text-[9px] font-bold bg-white/5 border border-white/10 text-slate-300" data-d="1">Glass</button>
        <button type="button" class="dtog py-2 rounded-xl text-[9px] font-bold bg-white/5 border border-white/10 text-slate-300" data-d="2">Mica</button>
        <button type="button" class="dtog py-2 rounded-xl text-[9px] font-bold bg-white/5 border border-white/10 text-slate-300" data-d="3">Water</button>
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[9px] text-slate-400 leading-relaxed">
        <b class="text-emerald-400">Dielectric:</b> Insulator inserted between plates → C increases by factor K. E decreases (Kx) kyunki dipoles align hoke opposing field banate hain.
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
  const DIELECTRICS = [
    { name: 'Air', K: 1.0 },
    { name: 'Glass', K: 6.0 },
    { name: 'Mica', K: 5.0 },
    { name: 'Water', K: 8.0 }
  ];
  let K = 1;
  let animId = null, phase = 0;

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#0f172a'); bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const cx = W/2, cy = H/2;
    const plateW = 220, gapPix = 90;

    // Top plate
    const tg = ctx.createLinearGradient(0, cy - gapPix/2 - 6, 0, cy - gapPix/2 + 6);
    tg.addColorStop(0, '#fb7185');
    tg.addColorStop(1, '#e11d48');
    ctx.fillStyle = tg;
    ctx.fillRect(cx - plateW/2, cy - gapPix/2 - 6, plateW, 12);
    ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - plateW/2, cy - gapPix/2 - 6, plateW, 12);

    // Bottom plate
    const bgd = ctx.createLinearGradient(0, cy + gapPix/2 - 6, 0, cy + gapPix/2 + 6);
    bgd.addColorStop(0, '#67e8f9');
    bgd.addColorStop(1, '#0891b2');
    ctx.fillStyle = bgd;
    ctx.fillRect(cx - plateW/2, cy + gapPix/2 - 6, plateW, 12);
    ctx.strokeStyle = '#0f172a';
    ctx.strokeRect(cx - plateW/2, cy + gapPix/2 - 6, plateW, 12);

    // Dielectric slab
    if (K > 1.05) {
      const dg = ctx.createLinearGradient(0, cy - gapPix/2 + 6, 0, cy + gapPix/2 - 6);
      dg.addColorStop(0, `rgba(168,85,247,${0.15 + (K-1) * 0.06})`);
      dg.addColorStop(0.5, `rgba(217,119,6,${0.20 + (K-1) * 0.05})`);
      dg.addColorStop(1, `rgba(168,85,247,${0.15 + (K-1) * 0.06})`);
      ctx.fillStyle = dg;
      ctx.fillRect(cx - plateW/2 + 5, cy - gapPix/2 + 6, plateW - 10, gapPix - 12);
      // Dielectric label
      ctx.fillStyle = 'rgba(251,191,36,0.9)';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('Dielectric (K=' + K.toFixed(1) + ')', cx, cy);

      // Dipole alignment arrows (small)
      const numDipoles = 4;
      for (let i = 0; i < numDipoles; i++) {
        const px = cx - plateW/2 + 30 + i * (plateW - 60) / numDipoles;
        const py = cy - 22;
        ctx.strokeStyle = 'rgba(251,191,36,0.7)';
        ctx.lineWidth = 1.5;
        // Dipole: − + pattern
        ctx.beginPath();
        ctx.moveTo(px - 8, py); ctx.lineTo(px + 8, py);
        ctx.stroke();
        ctx.fillStyle = '#22d3ee';
        ctx.beginPath(); ctx.arc(px - 8, py, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath(); ctx.arc(px + 8, py, 2.5, 0, Math.PI * 2); ctx.fill();

        const py2 = cy + 22;
        ctx.strokeStyle = 'rgba(251,191,36,0.7)';
        ctx.beginPath();
        ctx.moveTo(px - 8, py2); ctx.lineTo(px + 8, py2);
        ctx.stroke();
        ctx.fillStyle = '#22d3ee';
        ctx.beginPath(); ctx.arc(px - 8, py2, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath(); ctx.arc(px + 8, py2, 2.5, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Field lines (thinner if dielectric)
    const fieldIntensity = 1 / K;
    const numLines = 8;
    for (let i = 1; i < numLines; i++) {
      const px = cx - plateW/2 + (i / numLines) * plateW;
      ctx.strokeStyle = `rgba(34,211,238,${0.3 + fieldIntensity * 0.5})`;
      ctx.lineWidth = 1.5 + fieldIntensity;
      ctx.beginPath();
      ctx.moveTo(px, cy - gapPix/2 + 6);
      ctx.lineTo(px, cy + gapPix/2 - 6);
      ctx.stroke();
      // arrowhead
      ctx.fillStyle = `rgba(34,211,238,${0.4 + fieldIntensity * 0.5})`;
      ctx.beginPath();
      ctx.moveTo(px, cy + gapPix/2 - 6);
      ctx.lineTo(px - 4, cy + gapPix/2 - 14);
      ctx.lineTo(px + 4, cy + gapPix/2 - 14);
      ctx.closePath(); ctx.fill();
    }
  }

  function loop() { phase += 0.02; draw(); animId = requestAnimationFrame(loop); }

  function update() {
    wrap.querySelector('#rC').textContent = K.toFixed(2);
    wrap.querySelector('#rE').textContent = (1/K).toFixed(2);
    wrap.querySelector('#kV').textContent = K.toFixed(1);
  }

  wrap.querySelector('#kSlider').addEventListener('input', e => { K = parseFloat(e.target.value); update(); });
  wrap.querySelectorAll('.dtog').forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      K = DIELECTRICS[idx].K;
      wrap.querySelector('#kSlider').value = K;
      wrap.querySelectorAll('.dtog').forEach((b, i) => {
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
  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    K = 1;
    wrap.querySelector('#kSlider').value = 1;
    wrap.querySelectorAll('.dtog').forEach((b, i) => {
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
