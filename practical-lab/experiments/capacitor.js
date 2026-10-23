export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">Parallel Plate Capacitor</div><div class="text-[9px] text-slate-500 truncate">Class 12 Physics - Ch 2</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">C</div>
        <div class="text-[10px] font-black text-emerald-300" id="rC">0.00 pF</div>
      </div>
      <div class="absolute top-2 right-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">E (field)</div>
        <div class="text-[10px] font-black text-cyan-300" id="rE">0.00</div>
      </div>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 space-y-2" style="backdrop-filter:blur(20px);">
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-emerald-400 uppercase">Plate area A</label><span class="text-[11px] font-black text-emerald-400" id="aV">1.0</span></div>
        <input type="range" id="aSlider" min="0.3" max="3" step="0.1" value="1" class="w-full accent-emerald-500">
      </div>
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-amber-400 uppercase">Separation d</label><span class="text-[11px] font-black text-amber-400" id="dV">1.0</span></div>
        <input type="range" id="dSlider" min="0.3" max="3" step="0.1" value="1" class="w-full accent-amber-500">
      </div>
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-cyan-400 uppercase">Voltage V</label><span class="text-[11px] font-black text-cyan-400" id="vV">5.0</span></div>
        <input type="range" id="vSlider" min="0" max="20" step="0.5" value="5" class="w-full accent-cyan-500">
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[9px] text-slate-400 leading-relaxed">
        <b class="text-emerald-400">C = ε₀A/d</b> — Area badhao → C badhta. Distance badhao → C ghatta. E = V/d uniform field between plates.
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
  let A = 1, d = 1, V = 5;
  let animId = null, phase = 0;

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#0f172a'); bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const cx = W/2, cy = H/2;
    const plateW = 60 + A * 50;
    const gapPix = 40 + d * 30;

    // Top plate (+)
    const tg = ctx.createLinearGradient(0, cy - gapPix/2 - 6, 0, cy - gapPix/2 + 6);
    tg.addColorStop(0, '#fb7185');
    tg.addColorStop(1, '#e11d48');
    ctx.fillStyle = tg;
    ctx.fillRect(cx - plateW/2, cy - gapPix/2 - 6, plateW, 12);
    ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - plateW/2, cy - gapPix/2 - 6, plateW, 12);

    // Bottom plate (−)
    const bgd = ctx.createLinearGradient(0, cy + gapPix/2 - 6, 0, cy + gapPix/2 + 6);
    bgd.addColorStop(0, '#67e8f9');
    bgd.addColorStop(1, '#0891b2');
    ctx.fillStyle = bgd;
    ctx.fillRect(cx - plateW/2, cy + gapPix/2 - 6, plateW, 12);
    ctx.strokeStyle = '#0f172a';
    ctx.strokeRect(cx - plateW/2, cy + gapPix/2 - 6, plateW, 12);

    // + and − symbols
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const numSym = Math.floor(plateW / 30);
    for (let i = 0; i < numSym; i++) {
      const px = cx - plateW/2 + (i + 0.5) * (plateW / numSym);
      ctx.fillText('+', px, cy - gapPix/2);
      ctx.fillText('−', px, cy + gapPix/2 + 1);
    }

    // Field lines between plates
    const intensity = Math.min(1, V / 20);
    const numLines = Math.floor(plateW / 25);
    for (let i = 1; i < numLines; i++) {
      const px = cx - plateW/2 + (i / numLines) * plateW;
      ctx.strokeStyle = `rgba(34,211,238,${0.15 + intensity * 0.55})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px, cy - gapPix/2 + 6);
      ctx.lineTo(px, cy + gapPix/2 - 6);
      ctx.stroke();
      // Arrowhead
      ctx.fillStyle = `rgba(34,211,238,${0.3 + intensity * 0.6})`;
      ctx.beginPath();
      ctx.moveTo(px, cy + gapPix/2 - 6);
      ctx.lineTo(px - 4, cy + gapPix/2 - 14);
      ctx.lineTo(px + 4, cy + gapPix/2 - 14);
      ctx.closePath(); ctx.fill();
    }

    // Labels
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('A = ' + A.toFixed(1), cx, cy - gapPix/2 - 20);
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('d = ' + d.toFixed(1), cx + plateW/2 + 30, cy);
  }

  function loop() { phase += 0.02; draw(); animId = requestAnimationFrame(loop); }

  function update() {
    const C = A / d; // simplified (ε₀ = 1 for display)
    const E = V / d;
    wrap.querySelector('#rC').textContent = (C * 8.85).toFixed(2) + ' pF';
    wrap.querySelector('#rE').textContent = E.toFixed(2);
    wrap.querySelector('#aV').textContent = A.toFixed(1);
    wrap.querySelector('#dV').textContent = d.toFixed(1);
    wrap.querySelector('#vV').textContent = V.toFixed(1);
  }

  wrap.querySelector('#aSlider').addEventListener('input', e => { A = parseFloat(e.target.value); update(); });
  wrap.querySelector('#dSlider').addEventListener('input', e => { d = parseFloat(e.target.value); update(); });
  wrap.querySelector('#vSlider').addEventListener('input', e => { V = parseFloat(e.target.value); update(); });
  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    A = 1; d = 1; V = 5;
    wrap.querySelector('#aSlider').value = 1;
    wrap.querySelector('#dSlider').value = 1;
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
