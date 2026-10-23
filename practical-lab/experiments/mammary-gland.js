export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">Mammary Gland Anatomy</div><div class="text-[9px] text-slate-500 truncate">Class 12 Bio - Ch 2</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Selected</div>
        <div class="text-[10px] font-black text-pink-300" id="rSel">Tap any part</div>
      </div>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 max-h-[42vh] overflow-y-auto space-y-2" style="backdrop-filter:blur(20px);">
      <div class="bg-white/5 rounded-xl p-3 border border-white/10">
        <div class="flex items-start gap-2">
          <div id="iColor" class="w-3 h-3 rounded-full mt-1.5 shrink-0" style="background:#ec4899"></div>
          <div class="flex-1 min-w-0">
            <div id="iName" class="text-xs font-black text-slate-100 mb-1">Tap any structure to learn</div>
            <div id="iDesc" class="text-[10px] text-slate-400 leading-relaxed">Mammary glands are modified sweat glands. Present in both sexes but functional only in females after pregnancy. Structures: alveoli, lobules, ducts, sinus, nipple, areola.</div>
          </div>
        </div>
      </div>
      <div class="grid grid-cols-4 gap-1.5">
        <button type="button" class="tog tog-alv py-2 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">Alveoli</button>
        <button type="button" class="tog tog-lob py-2 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">Lobules</button>
        <button type="button" class="tog tog-duct py-2 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">Ducts</button>
        <button type="button" class="tog tog-label py-2 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">Labels</button>
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

  // Anatomy structure list with tap positions (in relative coords)
  const PARTS = [
    { id: 'alveoli', name: 'Alveoli (Milk Sacs)', color: '#fbbf24', info: 'Small balloon-like sacs (~0.1 mm) lined with milk-secreting epithelial cells. Surrounded by myoepithelial cells that contract to squeeze milk out. Cluster of 10-100 alveoli forms a lobule.', pos: [-0.55, -0.35] },
    { id: 'lobule', name: 'Lobule', color: '#f59e0b', info: 'Cluster of alveoli draining into a single duct. 15-20 lobules per breast, each with its own duct. Separated by fat and connective tissue.' },
    { id: 'lobe', name: 'Lobe', color: '#dc2626', info: 'Group of lobules forming a larger section. 15-20 lobes per breast arranged radially. Each lobe drains via one lactiferous duct.' },
    { id: 'duct', name: 'Lactiferous Duct', color: '#ef4444', info: 'Tube carrying milk from lobule to nipple. 15-20 ducts per breast. Each duct has a dilated portion called lactiferous sinus (ampulla) near the nipple.' },
    { id: 'sinus', name: 'Lactiferous Sinus', color: '#b91c1c', info: 'Dilated (ampulla) portion of the duct near the nipple where milk accumulates before ejection. Stimulated by oxytocin during let-down reflex.', pos: [0.55, 0] },
    { id: 'nipple', name: 'Nipple', color: '#be185d', info: 'Conical projection at the tip. Contains 15-20 openings (one per duct) through which milk is ejected. Rich nerve supply — suckling triggers oxytocin release.', pos: [0.9, 0] },
    { id: 'areola', name: 'Areola', color: '#831843', info: 'Dark pigmented circular area around nipple. Contains modified sebaceous (Montgomery) glands that secrete oil to lubricate + protect. Becomes darker during pregnancy.', pos: [0.78, 0] },
    { id: 'fat', name: 'Adipose (Fat) Tissue', color: '#fef3c7', info: 'Fat tissue fills the space between lobules. Amount of fat determines breast size — NOT milk-producing capacity. Milk capacity depends on glandular tissue.', pos: [0.3, 0.5] },
    { id: 'ct', name: 'Connective Tissue', color: '#a78bfa', info: 'Fibrous tissue (Cooper\'s ligaments) suspends the breast from chest wall. Provides structural support. Stretches during pregnancy/nursing.' },
    { id: 'chest', name: 'Chest Wall (Pectoral Muscle)', color: '#64748b', info: 'Pectoralis major muscle behind the breast. Provides base support. Breast is NOT a muscle — it sits on top of the muscle.', pos: [-0.85, 0] }
  ];

  let selected = null;
  let showAlveoli = true, showLobules = true, showDucts = true, showLabels = true;
  let animId = null, phase = 0;

  function w2s(rx, ry) {
    const cx = W / 2, cy = H * 0.5;
    const R = Math.min(W * 0.42, H * 0.55);
    return { x: cx + rx * R, y: cy + ry * R, R };
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#1e1b2e'); bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const cx = W / 2;
    const cy = H * 0.5;
    const R = Math.min(W * 0.42, H * 0.55);

    // === CHEST WALL ===
    const wallX = cx - R * 0.9;
    const isChest = selected && selected.id === 'chest';
    ctx.fillStyle = isChest ? 'rgba(100,116,139,0.6)' : 'rgba(100,116,139,0.3)';
    ctx.fillRect(wallX - 14, cy - R * 0.55, 16, R * 1.1);
    ctx.strokeStyle = 'rgba(100,116,139,0.8)';
    ctx.lineWidth = isChest ? 3 : 1.5;
    ctx.strokeRect(wallX - 14, cy - R * 0.55, 16, R * 1.1);
    // Ribs
    ctx.strokeStyle = 'rgba(148,163,184,0.4)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(wallX - 5, cy - R * 0.35 + i * R * 0.22, 30, -Math.PI * 0.6, Math.PI * 0.6);
      ctx.stroke();
    }

    // === BREAST OUTLINE ===
    const isFat = selected && selected.id === 'fat';
    const fatGrad = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R);
    fatGrad.addColorStop(0, isFat ? 'rgba(251,207,232,0.35)' : 'rgba(251,207,232,0.15)');
    fatGrad.addColorStop(1, isFat ? 'rgba(190,24,93,0.4)' : 'rgba(190,24,93,0.25)');
    ctx.fillStyle = fatGrad;
    ctx.beginPath();
    ctx.moveTo(cx - R * 0.9, cy - R * 0.5);
    ctx.quadraticCurveTo(cx + R * 1.1, cy - R * 0.7, cx + R * 1.0, cy);
    ctx.quadraticCurveTo(cx + R * 1.1, cy + R * 0.7, cx - R * 0.9, cy + R * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = isFat ? '#fbbf24' : 'rgba(236,72,153,0.5)';
    ctx.lineWidth = isFat ? 3 : 2.5;
    ctx.stroke();

    // === CONNECTIVE TISSUE (Cooper's ligaments) ===
    const isCT = selected && selected.id === 'ct';
    ctx.strokeStyle = isCT ? 'rgba(167,139,250,0.9)' : 'rgba(167,139,250,0.3)';
    ctx.lineWidth = isCT ? 2.5 : 1.5;
    for (let i = 0; i < 6; i++) {
      const y = cy - R * 0.5 + (i / 5) * R;
      ctx.beginPath();
      ctx.moveTo(cx - R * 0.85, y);
      ctx.quadraticCurveTo(cx, y + Math.sin(i) * 15, cx + R * 0.85, cy + (y - cy) * 0.6);
      ctx.stroke();
    }

    // === NIPPLE + AREOLA ===
    const nippleX = cx + R * 0.95;
    const nippleY = cy;
    // Areola
    const isAreola = selected && selected.id === 'areola';
    ctx.fillStyle = isAreola ? 'rgba(190,24,93,0.9)' : 'rgba(157,23,77,0.6)';
    ctx.beginPath();
    ctx.ellipse(nippleX - 5, nippleY, 20, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,20,60,0.8)';
    ctx.lineWidth = isAreola ? 3 : 1.5;
    ctx.stroke();
    // Montgomery glands (small bumps on areola)
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.fillStyle = 'rgba(120,20,60,0.7)';
      ctx.beginPath();
      ctx.arc(nippleX - 5 + Math.cos(a) * 15, nippleY + Math.sin(a) * 20, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Nipple
    const isNipple = selected && selected.id === 'nipple';
    ctx.fillStyle = isNipple ? '#ec4899' : '#be185d';
    ctx.beginPath();
    ctx.moveTo(nippleX - 8, nippleY - 15);
    ctx.quadraticCurveTo(nippleX + 20, nippleY - 9, nippleX + 17, nippleY);
    ctx.quadraticCurveTo(nippleX + 20, nippleY + 9, nippleX - 8, nippleY + 15);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = isNipple ? '#fbcfe8' : 'rgba(120,20,60,0.9)';
    ctx.lineWidth = isNipple ? 3 : 2;
    ctx.stroke();
    // Nipple pores
    ctx.fillStyle = 'rgba(30,10,20,0.9)';
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.arc(nippleX + 14, nippleY - 9 + i * 3.6, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // === LOBULES + ALVEOLI ===
    if (showLobules) {
      const lobulePositions = [
        { x: -0.6, y: -0.5 }, { x: -0.2, y: -0.6 }, { x: 0.2, y: -0.5 }, { x: 0.55, y: -0.35 },
        { x: -0.7, y: -0.15 }, { x: -0.3, y: -0.15 }, { x: 0.1, y: -0.15 }, { x: 0.5, y: -0.05 }, { x: 0.7, y: 0.1 },
        { x: -0.7, y: 0.2 }, { x: -0.3, y: 0.2 }, { x: 0.1, y: 0.2 }, { x: 0.5, y: 0.15 },
        { x: -0.6, y: 0.5 }, { x: -0.2, y: 0.55 }, { x: 0.2, y: 0.45 }, { x: 0.55, y: 0.3 }
      ];

      const isLobule = selected && selected.id === 'lobule';
      const isAlveoli = selected && selected.id === 'alveoli';

      lobulePositions.forEach((pos, idx) => {
        const lx = cx + pos.x * R * 0.85;
        const ly = cy + pos.y * R * 0.85;
        const sc = 0.85 + Math.abs(Math.sin(idx * 0.7)) * 0.3;

        if (showAlveoli) {
          // Draw alveoli
          const numA = 7;
          for (let a = 0; a < numA; a++) {
            const seed = a * 2.7 + idx * 0.9;
            const ax = lx + Math.cos(seed) * 14 * sc;
            const ay = ly + Math.sin(seed) * 14 * sc;
            const ar = 5.5 + Math.abs(Math.sin(seed * 1.3)) * 2;

            const g = ctx.createRadialGradient(ax - ar*0.3, ay - ar*0.3, ar*0.1, ax, ay, ar);
            if (isAlveoli) {
              g.addColorStop(0, '#fef3c7');
              g.addColorStop(0.4, '#fbbf24');
              g.addColorStop(1, '#92400e');
            } else {
              g.addColorStop(0, 'rgba(254,243,199,0.85)');
              g.addColorStop(0.4, 'rgba(251,191,36,0.75)');
              g.addColorStop(1, 'rgba(146,64,14,0.85)');
            }
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(ax, ay, ar, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = isAlveoli ? '#fef3c7' : 'rgba(120,53,15,0.6)';
            ctx.lineWidth = isAlveoli ? 1.5 : 0.8;
            ctx.stroke();
          }
        }

        // Lobule outline
        ctx.strokeStyle = isLobule ? 'rgba(245,158,11,0.9)' : 'rgba(190,24,93,0.25)';
        ctx.lineWidth = isLobule ? 2.5 : 1;
        ctx.setLineDash([3, 2]);
        ctx.beginPath();
        ctx.arc(lx, ly, 20 * sc, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    }

    // === LACTIFEROUS DUCTS + SINUS ===
    if (showDucts) {
      const isDuct = selected && selected.id === 'duct';
      const isSinus = selected && selected.id === 'sinus';
      const numD = 16;
      for (let i = 0; i < numD; i++) {
        const startAngle = (i / numD) * Math.PI * 1.8 - Math.PI * 0.9;
        const sx = cx + Math.cos(startAngle) * R * 0.4;
        const sy = cy + Math.sin(startAngle) * R * 0.8;
        const endX = nippleX - 5;
        const endY = nippleY + (i - numD/2) * 1.2;
        ctx.strokeStyle = isDuct ? '#f87171' : 'rgba(220,38,38,0.55)';
        ctx.lineWidth = isDuct ? 2.5 : 2;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        const ctrlX = (sx + endX) / 2 + Math.cos(startAngle) * 15;
        const ctrlY = (sy + endY) / 2;
        ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
        ctx.stroke();
      }

      // Lactiferous sinus (ampulla)
      const sinusX = cx + R * 0.7;
      const sinusY = cy;
      ctx.fillStyle = isSinus ? 'rgba(248,113,113,0.9)' : 'rgba(220,38,38,0.5)';
      ctx.beginPath();
      ctx.ellipse(sinusX, sinusY, 25, 32, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isSinus ? '#fef3c7' : 'rgba(120,20,20,0.7)';
      ctx.lineWidth = isSinus ? 3 : 1.5;
      ctx.stroke();
    }

    // === LABELS ===
    if (showLabels) {
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Alveoli label
      if (showAlveoli) {
        ctx.fillStyle = '#fbbf24';
        ctx.fillText('Alveoli', cx - R * 0.35, cy - R * 0.85);
        ctx.strokeStyle = 'rgba(251,191,36,0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(cx - R * 0.35, cy - R * 0.82);
        ctx.lineTo(cx - R * 0.3, cy - R * 0.6);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Lobule label
      if (showLobules) {
        ctx.fillStyle = '#f59e0b';
        ctx.fillText('Lobule', cx - R * 0.65, cy - R * 0.85);
      }

      // Duct label
      if (showDucts) {
        ctx.fillStyle = '#f87171';
        ctx.textAlign = 'left';
        ctx.fillText('Lactiferous duct', cx + R * 0.15, cy - R * 0.7);
      }

      // Sinus label
      ctx.fillStyle = '#f87171';
      ctx.textAlign = 'center';
      ctx.fillText('Sinus', cx + R * 0.7, cy - 45);

      // Nipple label
      ctx.fillStyle = '#f472b6';
      ctx.fillText('Nipple', nippleX, nippleY + 42);

      // Areola
      ctx.fillStyle = 'rgba(190,24,93,0.9)';
      ctx.fillText('Areola', nippleX - 40, nippleY + 55);

      // Chest wall
      ctx.fillStyle = 'rgba(148,163,184,0.9)';
      ctx.save();
      ctx.translate(wallX - 30, cy);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('Chest wall', 0, 0);
      ctx.restore();

      // Fat
      ctx.fillStyle = '#fef3c7';
      ctx.textAlign = 'left';
      ctx.fillText('Fat tissue', cx - R * 0.85, cy + R * 0.55);
    }
  }

  function loop() { phase += 0.02; draw(); animId = requestAnimationFrame(loop); }

  function findPart(px, py) {
    // Simple nearest-part detection
    const cx = W / 2, cy = H * 0.5;
    const R = Math.min(W * 0.42, H * 0.55);
    const relX = (px - cx) / R;
    const relY = (py - cy) / R;

    // Check for nipple/areola first (rightmost)
    if (relX > 0.88 && Math.abs(relY) < 0.2) return PARTS.find(p => p.id === 'nipple');
    if (relX > 0.72 && Math.abs(relY) < 0.25) return PARTS.find(p => p.id === 'areola');
    if (relX > 0.6 && relX < 0.85 && Math.abs(relY) < 0.3) return PARTS.find(p => p.id === 'sinus');
    // Chest wall (leftmost)
    if (relX < -0.8) return PARTS.find(p => p.id === 'chest');
    // Fat (outer ring)
    const dist = Math.sqrt(relX * relX + relY * relY);
    if (dist < 0.4) {
      // Near center — could be alveoli/lobule
      if (Math.abs(relX) < 0.8 && Math.abs(relY) < 0.7) return PARTS.find(p => p.id === 'alveoli');
    }
    if (dist > 0.6 && Math.abs(relY) > 0.4) return PARTS.find(p => p.id === 'fat');
    // Ducts spread all over
    return PARTS.find(p => p.id === 'duct');
  }

  function onDown(e) {
    const rect = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    const px = t.clientX - rect.left, py = t.clientY - rect.top;
    const p = findPart(px, py);
    if (p) {
      selected = p;
      wrap.querySelector('#rSel').textContent = p.name.split(' ')[0];
      wrap.querySelector('#iName').textContent = p.name;
      wrap.querySelector('#iDesc').textContent = p.info;
      wrap.querySelector('#iColor').style.background = p.color;
    }
  }
  canvas.addEventListener('pointerdown', onDown);

  function setTog(sel, on) {
    const b = wrap.querySelector(sel);
    b.classList.toggle('bg-emerald-500/20', on);
    b.classList.toggle('border-emerald-500/40', on);
    b.classList.toggle('text-emerald-300', on);
    b.classList.toggle('bg-white/5', !on);
    b.classList.toggle('border-white/10', !on);
    b.classList.toggle('text-slate-300', !on);
  }
  wrap.querySelector('.tog-alv').addEventListener('click', () => { showAlveoli = !showAlveoli; setTog('.tog-alv', showAlveoli); });
  wrap.querySelector('.tog-lob').addEventListener('click', () => { showLobules = !showLobules; setTog('.tog-lob', showLobules); });
  wrap.querySelector('.tog-duct').addEventListener('click', () => { showDucts = !showDucts; setTog('.tog-duct', showDucts); });
  wrap.querySelector('.tog-label').addEventListener('click', () => { showLabels = !showLabels; setTog('.tog-label', showLabels); });

  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    selected = null;
    wrap.querySelector('#rSel').textContent = 'Tap any part';
    wrap.querySelector('#iName').textContent = 'Tap any structure to learn';
    wrap.querySelector('#iDesc').textContent = 'Mammary glands are modified sweat glands. Present in both sexes but functional only in females after pregnancy. Structures: alveoli, lobules, ducts, sinus, nipple, areola.';
    showAlveoli = showLobules = showDucts = showLabels = true;
    setTog('.tog-alv', true); setTog('.tog-lob', true); setTog('.tog-duct', true); setTog('.tog-label', true);
  });
  wrap.querySelector('.back-btn').addEventListener('click', () => window.goBack());

  let ro = null;
  if ('ResizeObserver' in window) { ro = new ResizeObserver(resize); ro.observe(canvas); }
  resize();
  animId = requestAnimationFrame(loop);
  return function cleanup() {
    if (animId) cancelAnimationFrame(animId);
    if (ro) ro.disconnect();
    canvas.removeEventListener('pointerdown', onDown);
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    document.body.style.overflow = prevOverflow;
  };
}
