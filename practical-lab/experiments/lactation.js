export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">Lactation & Mammary Gland</div><div class="text-[9px] text-slate-500 truncate">Class 12 Bio - Ch 2</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Day</div>
        <div class="text-[10px] font-black text-pink-300" id="rDays">Day 1</div>
      </div>
      <div class="absolute top-2 right-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Milk</div>
        <div class="text-[10px] font-black text-cyan-300" id="rMilk">Colostrum</div>
      </div>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 max-h-[42vh] overflow-y-auto space-y-2" style="backdrop-filter:blur(20px);">
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-pink-400 uppercase">Time after birth</label><span class="text-[11px] font-black text-pink-400" id="tV">Day 1</span></div>
        <input type="range" id="tSlider" min="1" max="30" step="1" value="1" class="w-full accent-pink-500">
      </div>
      <div class="grid grid-cols-3 gap-1.5">
        <button type="button" class="tog tog-mam py-2 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">Alveoli</button>
        <button type="button" class="tog tog-duct py-2 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">Ducts</button>
        <button type="button" class="tog tog-flow py-2 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">Milk Flow</button>
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[9px] text-slate-400 leading-relaxed" id="infoBox">
        <b class="text-pink-400">Day 1-3:</b> Colostrum secreted — rich in antibodies (IgA), proteins. Low fat. Yellow color.
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

  const PHASES = [
    { d: 1, label: 'Colostrum', info: '<b class="text-pink-400">Day 1-3:</b> Colostrum secreted — rich in antibodies (IgA), proteins. Low fat. Yellow color.' },
    { d: 5, label: 'Transitional', info: '<b class="text-pink-400">Day 4-10:</b> Transitional milk — mix of colostrum & mature milk. Increasing fat & lactose.' },
    { d: 15, label: 'Mature milk', info: '<b class="text-pink-400">Day 10+:</b> Mature milk — balanced fat, lactose, proteins. Foremilk (watery) + Hindmilk (creamy).' },
    { d: 30, label: 'Established', info: '<b class="text-pink-400">Day 30+:</b> Established lactation — supply = demand. ~750-800 mL/day.' }
  ];

  let days = 1;
  let showMam = true, showDuct = true, showFlow = true;
  let animId = null, phase = 0;

  function getPhaseInfo() {
    if (days <= 3) return PHASES[0];
    if (days <= 10) return PHASES[1];
    if (days <= 25) return PHASES[2];
    return PHASES[3];
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#1e1b2e'); bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const cx = W / 2;
    const cy = H * 0.48;
    const R = Math.min(W * 0.42, H * 0.55);

    // === BREAST OUTLINE (sagittal cross-section style) ===
    // Fat tissue (background base)
    const fatGrad = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R);
    fatGrad.addColorStop(0, 'rgba(251,207,232,0.15)');
    fatGrad.addColorStop(1, 'rgba(190,24,93,0.25)');
    ctx.fillStyle = fatGrad;
    ctx.beginPath();
    // Breast shape — rounded on right, chest wall on left
    ctx.moveTo(cx - R * 0.9, cy - R * 0.5);
    ctx.quadraticCurveTo(cx + R * 1.1, cy - R * 0.7, cx + R * 1.0, cy);
    ctx.quadraticCurveTo(cx + R * 1.1, cy + R * 0.7, cx - R * 0.9, cy + R * 0.5);
    ctx.closePath();
    ctx.fill();

    // Outline
    ctx.strokeStyle = 'rgba(236,72,153,0.5)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // === CHEST WALL (muscle + ribs) ===
    const wallX = cx - R * 0.9;
    // Pectoral muscle layer
    ctx.fillStyle = 'rgba(190,24,93,0.35)';
    ctx.fillRect(wallX - 12, cy - R * 0.55, 14, R * 1.1);
    ctx.strokeStyle = 'rgba(157,23,77,0.7)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(wallX - 12, cy - R * 0.55, 14, R * 1.1);
    // Ribs hint
    ctx.strokeStyle = 'rgba(148,163,184,0.5)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(wallX - 5, cy - R * 0.35 + i * R * 0.22, 30, -Math.PI * 0.6, Math.PI * 0.6);
      ctx.stroke();
    }
    if (showMam) {
      ctx.fillStyle = 'rgba(148,163,184,0.8)';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.save();
      ctx.translate(wallX - 25, cy);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('Chest wall', 0, 0);
      ctx.restore();
    }

    // === NIPPLE + AREOLA (at right edge) ===
    const nippleX = cx + R * 0.95;
    const nippleY = cy;
    // Areola (darker ring)
    ctx.fillStyle = 'rgba(157,23,77,0.6)';
    ctx.beginPath();
    ctx.ellipse(nippleX - 5, nippleY, 18, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,20,60,0.8)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Nipple (protruding)
    ctx.fillStyle = '#be185d';
    ctx.beginPath();
    ctx.moveTo(nippleX - 8, nippleY - 14);
    ctx.quadraticCurveTo(nippleX + 18, nippleY - 8, nippleX + 15, nippleY);
    ctx.quadraticCurveTo(nippleX + 18, nippleY + 8, nippleX - 8, nippleY + 14);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,20,60,0.9)';
    ctx.stroke();
    // Nipple opening (multiple small pores)
    ctx.fillStyle = 'rgba(60,10,30,0.7)';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(nippleX + 15, nippleY - 6 + i * 3, 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
    if (showMam) {
      ctx.fillStyle = '#f472b6';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('Nipple', nippleX, nippleY + 30);
      ctx.fillStyle = 'rgba(190,24,93,0.9)';
      ctx.fillText('Areola', nippleX - 30, nippleY + 50);
    }

    // === LOBULES with ALVEOLI (grape-like clusters) ===
    // 15-20 lobules arranged in the breast, each with many alveoli
    if (showMam) {
      const lobulePositions = [
        // Top ring
        { x: -0.55, y: -0.55 }, { x: -0.15, y: -0.65 }, { x: 0.25, y: -0.55 }, { x: 0.6, y: -0.35 },
        // Middle ring
        { x: -0.65, y: -0.15 }, { x: -0.25, y: -0.15 }, { x: 0.15, y: -0.15 }, { x: 0.55, y: -0.05 }, { x: 0.75, y: 0.1 },
        // Bottom ring
        { x: -0.65, y: 0.25 }, { x: -0.25, y: 0.25 }, { x: 0.15, y: 0.25 }, { x: 0.55, y: 0.15 },
        // Bottom
        { x: -0.55, y: 0.55 }, { x: -0.15, y: 0.6 }, { x: 0.25, y: 0.5 }, { x: 0.6, y: 0.35 }
      ];

      const milkFill = Math.min(1, days / 20) * 0.7 + 0.3;

      lobulePositions.forEach((pos, idx) => {
        const lx = cx + pos.x * R * 0.85;
        const ly = cy + pos.y * R * 0.85;
        const lobuleScale = 0.85 + Math.abs(Math.sin(idx)) * 0.3;

        // Alveoli within lobule (grape cluster)
        const numAlveoli = 7;
        for (let a = 0; a < numAlveoli; a++) {
          const seed = a * 2.7 + idx * 0.9;
          const ax = lx + Math.cos(seed) * 14 * lobuleScale;
          const ay = ly + Math.sin(seed) * 14 * lobuleScale;
          const ar = 5.5 + Math.abs(Math.sin(seed * 1.3)) * 2;

          // Alveolus (balloon-like)
          const g = ctx.createRadialGradient(ax - ar*0.3, ay - ar*0.3, ar*0.1, ax, ay, ar);
          g.addColorStop(0, '#fce7f3');
          g.addColorStop(0.4, `rgba(251,191,36,${milkFill})`);
          g.addColorStop(1, 'rgba(180,83,9,0.9)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(ax, ay, ar, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(120,53,15,0.6)';
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }

        // Lobule outline (faint)
        ctx.strokeStyle = 'rgba(190,24,93,0.25)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.arc(lx, ly, 20 * lobuleScale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Labels
      if (days > 2) {
        ctx.fillStyle = 'rgba(251,191,36,0.9)';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Alveoli (milk sacs)', cx - R * 0.3, cy - R * 0.72);
        ctx.strokeStyle = 'rgba(251,191,36,0.5)';
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(cx - R * 0.3, cy - R * 0.68);
        ctx.lineTo(cx - R * 0.15, cy - R * 0.55);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // === LACTIFEROUS DUCTS (converging to nipple) ===
    if (showDuct) {
      // 15-20 ducts converge to nipple
      const numDucts = 16;
      for (let i = 0; i < numDucts; i++) {
        const startAngle = (i / numDucts) * Math.PI * 1.8 - Math.PI * 0.9;
        const startR = R * 0.75;
        const sx = cx + Math.cos(startAngle) * startR * 0.5;
        const sy = cy + Math.sin(startAngle) * startR * 0.85;

        // Duct path with slight curve
        const endX = nippleX - 5;
        const endY = nippleY + (i - numDucts/2) * 1.2;

        ctx.strokeStyle = 'rgba(220,38,38,0.55)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        // Bezier curve
        const ctrlX = (sx + endX) / 2 + Math.cos(startAngle) * 15;
        const ctrlY = (sy + endY) / 2;
        ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
        ctx.stroke();
      }

      // Lactiferous sinus (ampulla) — dilated portion near nipple
      ctx.fillStyle = 'rgba(220,38,38,0.5)';
      ctx.beginPath();
      ctx.ellipse(cx + R * 0.7, cy, 25, 30, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(120,20,20,0.7)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (days > 3) {
        ctx.fillStyle = 'rgba(248,113,113,0.95)';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Lactiferous', cx + R * 0.7, cy - 38);
        ctx.fillText('sinus', cx + R * 0.7, cy - 28);
      }
    }

    // === MILK FLOW ANIMATION ===
    if (showFlow && days > 2) {
      const numFlow = 20;
      for (let i = 0; i < numFlow; i++) {
        const t = ((phase * 0.4 + i / numFlow) % 1);
        // Path from lobule → duct → nipple
        const startAngle = (i % 16 / 16) * Math.PI * 1.8 - Math.PI * 0.9;
        const startR = R * 0.6;
        const sx = cx + Math.cos(startAngle) * startR * 0.5;
        const sy = cy + Math.sin(startAngle) * startR * 0.85;
        const endX = nippleX + 10;
        const endY = nippleY + (i % 16 - 8) * 1;

        // Bezier point at t
        const ctrlX = (sx + endX) / 2 + Math.cos(startAngle) * 15;
        const ctrlY = (sy + endY) / 2;
        const px = (1-t)*(1-t)*sx + 2*(1-t)*t*ctrlX + t*t*endX;
        const py = (1-t)*(1-t)*sy + 2*(1-t)*t*ctrlY + t*t*endY;

        // Milk droplet
        ctx.fillStyle = `rgba(253,224,71,${0.6 + (1-t) * 0.4})`;
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // === MYOEPITHELIAL CELLS (oxytocin action) — only during flow ===
    if (showFlow && days > 2) {
      // Small "squeezing" indicators around alveoli
      const numInd = 8;
      for (let i = 0; i < numInd; i++) {
        const a = (i / numInd) * Math.PI * 2 + phase;
        const ix = cx + Math.cos(a) * R * 0.5;
        const iy = cy + Math.sin(a) * R * 0.5;
        // Pulse ring
        const pulse = (Math.sin(phase * 3 + i) * 0.5 + 0.5);
        ctx.strokeStyle = `rgba(34,211,238,${0.3 + pulse * 0.4})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(ix, iy, 8 + pulse * 4, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // === HORMONE LABELS ===
    // Prolactin (top)
    ctx.fillStyle = 'rgba(34,211,238,0.9)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(cx - 70, 12, 140, 22, 8);
    else ctx.rect(cx - 70, 12, 140, 22);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Prolactin → Alveoli (milk synthesis)', cx, 23);

    // Oxytocin (bottom)
    ctx.fillStyle = 'rgba(168,85,247,0.9)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(cx - 80, H - 44, 160, 22, 8);
    else ctx.rect(cx - 80, H - 44, 160, 22);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText('Oxytocin → Myoepithelial (milk ejection)', cx, H - 33);

    // Bottom phase label
    ctx.fillStyle = 'rgba(148,163,184,0.85)';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(getPhaseInfo().label + ' — Day ' + days, cx, H - 4);
  }

  function loop() { phase += 0.03; draw(); animId = requestAnimationFrame(loop); }

  function update() {
    const info = getPhaseInfo();
    wrap.querySelector('#tV').textContent = 'Day ' + days;
    wrap.querySelector('#rDays').textContent = 'Day ' + days;
    wrap.querySelector('#rMilk').textContent = info.label;
    wrap.querySelector('#infoBox').innerHTML = info.info;
  }

  wrap.querySelector('#tSlider').addEventListener('input', e => { days = parseInt(e.target.value, 10); update(); });

  function setTog(sel, on) {
    const b = wrap.querySelector(sel);
    b.classList.toggle('bg-emerald-500/20', on);
    b.classList.toggle('border-emerald-500/40', on);
    b.classList.toggle('text-emerald-300', on);
    b.classList.toggle('bg-white/5', !on);
    b.classList.toggle('border-white/10', !on);
    b.classList.toggle('text-slate-300', !on);
  }
  wrap.querySelector('.tog-mam').addEventListener('click', () => { showMam = !showMam; setTog('.tog-mam', showMam); });
  wrap.querySelector('.tog-duct').addEventListener('click', () => { showDuct = !showDuct; setTog('.tog-duct', showDuct); });
  wrap.querySelector('.tog-flow').addEventListener('click', () => { showFlow = !showFlow; setTog('.tog-flow', showFlow); });
  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    days = 1; wrap.querySelector('#tSlider').value = 1;
    showMam = showDuct = showFlow = true;
    setTog('.tog-mam', true); setTog('.tog-duct', true); setTog('.tog-flow', true);
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
