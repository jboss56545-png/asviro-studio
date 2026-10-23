export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">Energy Stored in Capacitor</div><div class="text-[9px] text-slate-500 truncate">Class 12 Physics - Ch 2</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">U (energy)</div>
        <div class="text-[10px] font-black text-emerald-300" id="rU">0.00 J</div>
      </div>
      <div class="absolute top-2 right-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Charge Q</div>
        <div class="text-[10px] font-black text-cyan-300" id="rQ">0.00</div>
      </div>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 space-y-2" style="backdrop-filter:blur(20px);">
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-emerald-400 uppercase">Capacitance C (μF)</label><span class="text-[11px] font-black text-emerald-400" id="cV">10.0</span></div>
        <input type="range" id="cSlider" min="1" max="50" step="1" value="10" class="w-full accent-emerald-500">
      </div>
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-amber-400 uppercase">Voltage V (V)</label><span class="text-[11px] font-black text-amber-400" id="vV">5.0</span></div>
        <input type="range" id="vSlider" min="0" max="20" step="0.5" value="5" class="w-full accent-amber-500">
      </div>
      <div class="grid grid-cols-3 gap-1.5">
        <div class="bg-white/5 rounded-xl p-2 border border-white/10">
          <div class="text-[8px] text-slate-500 uppercase font-bold">Q = CV</div>
          <div class="text-xs font-black text-cyan-300" id="rQ2">0</div>
          <div class="text-[7px] text-slate-500">μC</div>
        </div>
        <div class="bg-white/5 rounded-xl p-2 border border-white/10">
          <div class="text-[8px] text-slate-500 uppercase font-bold">U = ½CV²</div>
          <div class="text-xs font-black text-emerald-300" id="rU2">0</div>
          <div class="text-[7px] text-slate-500">μJ</div>
        </div>
        <div class="bg-white/5 rounded-xl p-2 border border-white/10">
          <div class="text-[8px] text-slate-500 uppercase font-bold">Q²/2C</div>
          <div class="text-xs font-black text-purple-300" id="rU3">0</div>
          <div class="text-[7px] text-slate-500">μJ ✓</div>
        </div>
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[9px] text-slate-400 leading-relaxed">
        <b class="text-emerald-400">Energy:</b> U = ½CV² = ½QV = Q²/2C. Energy electric field mein store hoti hai, capacitor ke plates ke beech.
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

  let C = 10, V = 5;
  let animId = null, phase = 0;

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#0f172a'); bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const cx = W / 2, cy = H / 2;
    const plateW = Math.min(W * 0.45, 220);
    const gap = 50;

    // Wires
    ctx.strokeStyle = 'rgba(148,163,184,0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - plateW/2 - 40, cy - gap/2); ctx.lineTo(cx - plateW/2, cy - gap/2);
    ctx.moveTo(cx + plateW/2, cy - gap/2); ctx.lineTo(cx + plateW/2 + 40, cy - gap/2);
    ctx.moveTo(cx - plateW/2 - 40, cy + gap/2); ctx.lineTo(cx - plateW/2, cy + gap/2);
    ctx.moveTo(cx + plateW/2, cy + gap/2); ctx.lineTo(cx + plateW/2 + 40, cy + gap/2);
    ctx.stroke();

    // Battery
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    const bx = cx - plateW/2 - 40;
    ctx.beginPath(); ctx.moveTo(bx, cy - gap/2 - 15); ctx.lineTo(bx, cy + gap/2 + 15); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx - 12, cy - 15); ctx.lineTo(bx + 12, cy - 15); ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(bx - 6, cy + 15); ctx.lineTo(bx + 6, cy + 15); ctx.stroke();
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('V=' + V + 'V', bx - 30, cy);

    // Plates
    const topY = cy - gap/2, botY = cy + gap/2;
    const tg = ctx.createLinearGradient(0, topY - 4, 0, topY + 4);
    tg.addColorStop(0, '#fb7185'); tg.addColorStop(1, '#e11d48');
    ctx.fillStyle = tg;
    ctx.fillRect(cx - plateW/2, topY - 4, plateW, 8);
    ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - plateW/2, topY - 4, plateW, 8);

    const bgd = ctx.createLinearGradient(0, botY - 4, 0, botY + 4);
    bgd.addColorStop(0, '#67e8f9'); bgd.addColorStop(1, '#0891b2');
    ctx.fillStyle = bgd;
    ctx.fillRect(cx - plateW/2, botY - 4, plateW, 8);
    ctx.strokeStyle = '#0f172a';
    ctx.strokeRect(cx - plateW/2, botY - 4, plateW, 8);

    // + − signs
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px sans-serif';
    for (let i = 0; i < 5; i++) {
      const px = cx - plateW/2 + (i + 0.5) * (plateW / 5);
      ctx.fillText('+', px, topY);
      ctx.fillText('−', px, botY + 2);
    }

    // Field lines
    const intensity = V / 20;
    ctx.strokeStyle = `rgba(34,211,238,${0.2 + intensity * 0.6})`;
    ctx.lineWidth = 1.5;
    for (let i = 1; i < 7; i++) {
      const px = cx - plateW/2 + (i / 7) * plateW;
      ctx.beginPath();
      ctx.moveTo(px, topY + 6);
      ctx.lineTo(px, botY - 6);
      ctx.stroke();
      ctx.fillStyle = `rgba(34,211,238,${0.3 + intensity * 0.6})`;
      ctx.beginPath();
      ctx.moveTo(px, botY - 6);
      ctx.lineTo(px - 4, botY - 14);
      ctx.lineTo(px + 4, botY - 14);
      ctx.closePath(); ctx.fill();
    }

    // Energy bar
    const energyPct = Math.min(1, (0.5 * C * V * V) / 5000);
    const barY = H - 40;
    const barX = W * 0.15;
    const barW = W * 0.7;
    const barH = 14;

    ctx.fillStyle = 'rgba(148,163,184,0.15)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(barX, barY, barW, barH, 7);
    else ctx.rect(barX, barY, barW, barH);
    ctx.fill();

    const eg = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    eg.addColorStop(0, '#10b981');
    eg.addColorStop(1, '#22d3ee');
    ctx.fillStyle = eg;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(barX, barY, barW * energyPct, barH, 7);
    else ctx.rect(barX, barY, barW * energyPct, barH);
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Energy Storage', W / 2, barY - 4);
  }

  function loop() { phase += 0.02; draw(); animId = requestAnimationFrame(loop); }

  function update() {
    const U = 0.5 * C * V * V; // μJ
    const Q = C * V; // μC
    wrap.querySelector('#rU').textContent = (U / 1e6).toFixed(4) + ' J';
    wrap.querySelector('#rQ').textContent = Q.toFixed(1) + ' μC';
    wrap.querySelector('#cV').textContent = C.toFixed(1);
    wrap.querySelector('#vV').textContent = V.toFixed(1);
    wrap.querySelector('#rQ2').textContent = Q.toFixed(1);
    wrap.querySelector('#rU2').textContent = U.toFixed(1);
    wrap.querySelector('#rU3').textContent = U.toFixed(1);
  }

  wrap.querySelector('#cSlider').addEventListener('input', e => { C = parseFloat(e.target.value); update(); });
  wrap.querySelector('#vSlider').addEventListener('input', e => { V = parseFloat(e.target.value); update(); });

  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    C = 10; V = 5;
    wrap.querySelector('#cSlider').value = 10;
    wrap.querySelector('#vSlider').value = 5;
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
