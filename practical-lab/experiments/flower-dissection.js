export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-slate-800 bg-slate-900 shrink-0">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-slate-950 border border-slate-800 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold">
        <i class="fa-solid fa-arrow-left text-[10px]"></i> Back
      </button>
      <div class="flex-1 text-center min-w-0">
        <div class="text-xs font-black text-slate-100 truncate">Flower Dissection</div>
        <div class="text-[9px] text-slate-500 truncate">Class 12 Bio - Ch 1</div>
      </div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 flex items-center justify-center">
        <i class="fa-solid fa-rotate-left text-xs"></i>
      </button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full" style="touch-action:none"></canvas>
      <div class="hint absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 text-[10px] text-slate-300 pointer-events-none whitespace-nowrap">
        <i class="fa-solid fa-hand-pointer text-emerald-400 mr-1"></i> Drag to rotate - Tap parts
      </div>
      <div class="info-panel absolute left-2 right-2 bottom-2 bg-slate-900/95 border border-emerald-500/30 rounded-2xl p-3" style="transform: translateY(140px); opacity: 0; pointer-events: none; transition: all 0.3s ease;">
        <div class="flex items-start gap-3">
          <div class="info-color w-3 h-3 rounded-full mt-1.5 shrink-0" style="background:#10b981"></div>
          <div class="flex-1 min-w-0">
            <div class="info-name text-xs font-black text-slate-100 mb-1">Part Name</div>
            <div class="info-desc text-[10px] text-slate-400 leading-relaxed"></div>
          </div>
          <button type="button" class="info-close w-6 h-6 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center shrink-0">
            <i class="fa-solid fa-xmark text-[10px]"></i>
          </button>
        </div>
      </div>
    </div>
    <div class="bg-slate-900 border-t border-slate-800 shrink-0 p-3 space-y-2.5">
      <div>
        <div class="flex justify-between mb-1">
          <label class="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Dissect / Explode</label>
          <span class="text-[11px] font-black text-emerald-400" id="dissectVal">0%</span>
        </div>
        <input type="range" id="dissectSlider" min="0" max="100" step="1" value="0" class="w-full accent-emerald-500">
      </div>
      <div class="grid grid-cols-3 gap-1.5">
        <button type="button" class="tog tog-auto py-2 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">Auto-Rotate</button>
        <button type="button" class="tog tog-labels py-2 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">Labels</button>
        <button type="button" class="tog tog-reset py-2 rounded-xl text-[9px] font-bold bg-slate-800 border border-slate-700 text-slate-300">Reset View</button>
      </div>
    </div>
  `;
  host.appendChild(wrap);

  const canvas = wrap.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0;
  let rotation = 0.6;
  let autoRotate = true;
  let showLabels = true;
  let dissect = 0;
  let isDragging = false;
  let prevX = 0;
  let animId = null;
  let lastT = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    W = rect.width;
    H = rect.height;
  }

  // Build flower parts
  const parts = [];
  parts.push({ type: 'pedicel', x: 0, y: -155, z: 0, info: 'pedicel' });
  parts.push({ type: 'receptacle', x: 0, y: -92, z: 0, info: 'receptacle' });
  parts.push({ type: 'ovary', x: 0, y: -62, z: 0, info: 'ovary' });
  parts.push({ type: 'style', x: 0, y: 22, z: 0, info: 'carpel' });
  parts.push({ type: 'stigma', x: 0, y: 105, z: 0, info: 'carpel' });

  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const x = Math.cos(a) * 32;
    const z = Math.sin(a) * 32;
    parts.push({ type: 'filament', x, y: 32, z, info: 'stamen', angle: a });
    parts.push({ type: 'anther', x: x * 1.45, y: 92, z: z * 1.45, info: 'stamen', angle: a });
  }

  // Outer petals (5 large)
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    parts.push({
      type: 'petal',
      x: Math.cos(a) * 68, y: 12, z: Math.sin(a) * 68,
      info: 'petal', angle: a, layer: 'outer'
    });
  }
  // Inner petals (3 smaller, offset)
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 5;
    parts.push({
      type: 'petal',
      x: Math.cos(a) * 42, y: 22, z: Math.sin(a) * 42,
      info: 'petal', angle: a, layer: 'inner'
    });
  }

  // Sepals
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.5;
    parts.push({
      type: 'sepal',
      x: Math.cos(a) * 62, y: -52, z: Math.sin(a) * 62,
      info: 'sepal', angle: a
    });
  }

  const INFO = {
    petal: { name: 'Petal (Corolla)', color: '#ec4899', desc: 'Brightly coloured scented structures that attract pollinators like bees and butterflies. Collectively called Corolla.' },
    sepal: { name: 'Sepal (Calyx)', color: '#22c55e', desc: 'Green leafy structures that protect the flower bud before it opens. Collectively called Calyx.' },
    stamen: { name: 'Stamen (Androecium)', color: '#fbbf24', desc: 'Male reproductive organ. Anther (produces pollen) + Filament (stalk). Collective term: Androecium.' },
    carpel: { name: 'Carpel / Pistil (Gynoecium)', color: '#a855f7', desc: 'Female reproductive organ. Stigma (receives pollen) + Style (tube) + Ovary (contains ovules).' },
    ovary: { name: 'Ovary', color: '#16a34a', desc: 'Swollen base of pistil. Contains ovules which become seeds after fertilisation. Ovary develops into fruit.' },
    receptacle: { name: 'Receptacle', color: '#78350f', desc: 'The swollen tip of the pedicel where all floral parts (sepals, petals, stamens, carpels) are attached.' },
    pedicel: { name: 'Pedicel', color: '#78350f', desc: 'The stalk that attaches the flower to the plant. Supports the flower and connects it to the main stem.' }
  };

  function project(x, y, z) {
    const c = Math.cos(rotation);
    const s = Math.sin(rotation);
    const xr = x * c + z * s;
    const zr = -x * s + z * c;
    return {
      x: W / 2 + xr,
      y: H * 0.5 - y - zr * 0.18,
      depth: zr,
      scale: 1 - zr * 0.0008
    };
  }

  function getScreen(p) {
    const ex = p.x * (1 + dissect * 1.9);
    const ey = p.y * (1 + dissect * 0.75);
    const ez = p.z * (1 + dissect * 1.9);
    return project(ex, ey, ez);
  }

  function center() { return project(0, 0, 0); }

  function drawBackground() {
    // Warm radial vignette
    const c = center();
    const g = ctx.createRadialGradient(c.x, c.y, 20, c.x, c.y, Math.max(W, H) * 0.75);
    g.addColorStop(0, '#1e1b2e');
    g.addColorStop(0.45, '#0a0f1a');
    g.addColorStop(1, '#030712');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Subtle grid
    ctx.strokeStyle = 'rgba(100,116,139,0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  }

  function drawDropShadow() {
    const c = project(0, -180, 0);
    const g = ctx.createRadialGradient(c.x, c.y, 5, c.x, c.y, 130);
    g.addColorStop(0, 'rgba(0,0,0,0.55)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(c.x, c.y + 30, 130, 32, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPedicel(p) {
    const s = getScreen(p);
    const c = center();
    // Cylindrical gradient
    const g = ctx.createLinearGradient(s.x - 10, 0, s.x + 10, 0);
    g.addColorStop(0, '#451a03');
    g.addColorStop(0.4, '#92400e');
    g.addColorStop(0.7, '#78350f');
    g.addColorStop(1, '#3f1b04');
    ctx.strokeStyle = g;
    ctx.lineWidth = 14 * s.scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(c.x, c.y + 78);
    ctx.lineTo(s.x, s.y + 22);
    ctx.stroke();

    // Small leaf on stem
    const lx = s.x + 22;
    const ly = s.y + 42;
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(-0.6);
    const lg = ctx.createLinearGradient(0, -10, 30, 10);
    lg.addColorStop(0, '#166534');
    lg.addColorStop(1, '#22c55e');
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.ellipse(14, 0, 18, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(20,83,45,0.6)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(28, 0);
    ctx.stroke();
    // Small veins
    ctx.strokeStyle = 'rgba(20,83,45,0.4)';
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 6, 0);
      ctx.lineTo(i * 6 + 3, -4);
      ctx.moveTo(i * 6, 0);
      ctx.lineTo(i * 6 + 3, 4);
      ctx.stroke();
    }
    ctx.restore();

    if (showLabels) {
      ctx.fillStyle = 'rgba(251,191,36,0.9)';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Pedicel', s.x - 20, s.y + 50);
    }
  }

  function drawReceptacle(p) {
    const s = getScreen(p);
    const g = ctx.createRadialGradient(s.x - 10, s.y - 6, 2, s.x, s.y, 34);
    g.addColorStop(0, '#a16207');
    g.addColorStop(0.6, '#78350f');
    g.addColorStop(1, '#451a03');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(s.x, s.y, 32 * s.scale, 14 * s.scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  function drawOvary(p) {
    const s = getScreen(p);
    const r = 32 * s.scale;

    // 3D sphere shading
    const g = ctx.createRadialGradient(s.x - r * 0.35, s.y - r * 0.4, r * 0.15, s.x, s.y, r);
    g.addColorStop(0, '#4ade80');
    g.addColorStop(0.5, '#22c55e');
    g.addColorStop(1, '#14532d');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
    ctx.fill();

    // Soft edge
    ctx.strokeStyle = 'rgba(5,46,22,0.8)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.beginPath();
    ctx.ellipse(s.x - r * 0.4, s.y - r * 0.5, r * 0.35, r * 0.22, -0.5, 0, Math.PI * 2);
    ctx.fill();

    // Ovules (seeds inside)
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + rotation * 0.3;
      const ox = s.x + Math.cos(a) * r * 0.45;
      const oy = s.y + Math.sin(a) * r * 0.45;
      const og = ctx.createRadialGradient(ox - 2, oy - 2, 0.5, ox, oy, 6 * s.scale);
      og.addColorStop(0, '#fef3c7');
      og.addColorStop(0.7, '#84cc16');
      og.addColorStop(1, '#365314');
      ctx.fillStyle = og;
      ctx.beginPath();
      ctx.arc(ox, oy, 5.5 * s.scale, 0, Math.PI * 2);
      ctx.fill();
    }

    if (showLabels) {
      ctx.fillStyle = 'rgba(34,197,94,0.95)';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Ovary', s.x - 50, s.y - 14);
      ctx.strokeStyle = 'rgba(34,197,94,0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(s.x - 32, s.y - 12);
      ctx.lineTo(s.x - r, s.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function drawStyle(p) {
    const s = getScreen(p);
    const c = center();

    // Cylindrical gradient for style tube
    const g = ctx.createLinearGradient(c.x - 8, 0, c.x + 8, 0);
    g.addColorStop(0, '#15803d');
    g.addColorStop(0.35, '#4ade80');
    g.addColorStop(0.65, '#22c55e');
    g.addColorStop(1, '#14532d');

    ctx.strokeStyle = g;
    ctx.lineWidth = 9 * s.scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(c.x, c.y - 38);
    ctx.lineTo(s.x, s.y + 10);
    ctx.stroke();

    // Highlight line
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(c.x - 2, c.y - 38);
    ctx.lineTo(s.x - 2, s.y + 10);
    ctx.stroke();
  }

  function drawStigma(p) {
    const s = getScreen(p);
    const r = 15 * s.scale;

    // Main head - 3D shaded
    const g = ctx.createRadialGradient(s.x - r * 0.4, s.y - r * 0.4, r * 0.1, s.x, s.y, r);
    g.addColorStop(0, '#d8b4fe');
    g.addColorStop(0.5, '#a855f7');
    g.addColorStop(1, '#581c87');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
    ctx.fill();

    // Lobes (bumps around stigma)
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const lx = s.x + Math.cos(a) * r * 0.85;
      const ly = s.y + Math.sin(a) * r * 0.85;
      const lg = ctx.createRadialGradient(lx - 1, ly - 1, 0.5, lx, ly, 5 * s.scale);
      lg.addColorStop(0, '#e9d5ff');
      lg.addColorStop(1, '#9333ea');
      ctx.fillStyle = lg;
      ctx.beginPath();
      ctx.arc(lx, ly, 4 * s.scale, 0, Math.PI * 2);
      ctx.fill();
    }

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath();
    ctx.ellipse(s.x - r * 0.3, s.y - r * 0.4, r * 0.35, r * 0.22, -0.4, 0, Math.PI * 2);
    ctx.fill();

    if (showLabels) {
      ctx.fillStyle = 'rgba(192,132,252,0.95)';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Stigma', s.x + 45, s.y - 8);
      ctx.strokeStyle = 'rgba(192,132,252,0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(s.x + 30, s.y - 6);
      ctx.lineTo(s.x + r, s.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function drawFilament(p, antherP) {
    const s = getScreen(p);
    const as = getScreen(antherP);
    const c = center();

    const g = ctx.createLinearGradient(s.x - 3, 0, s.x + 3, 0);
    g.addColorStop(0, '#b45309');
    g.addColorStop(0.5, '#fcd34d');
    g.addColorStop(1, '#b45309');

    ctx.strokeStyle = g;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(c.x, c.y - 30);
    ctx.lineTo(as.x, as.y + 7);
    ctx.stroke();
  }

  function drawAnther(p) {
    const s = getScreen(p);
    const r = 11 * s.scale;

    // Glow
    const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 2);
    glow.addColorStop(0, 'rgba(251,191,36,0.35)');
    glow.addColorStop(1, 'rgba(251,191,36,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(s.x, s.y, r * 2, 0, Math.PI * 2);
    ctx.fill();

    // Body - two-lobed anther shape
    const g = ctx.createRadialGradient(s.x - r * 0.3, s.y - r * 0.3, 1, s.x, s.y, r);
    g.addColorStop(0, '#fde68a');
    g.addColorStop(0.5, '#f59e0b');
    g.addColorStop(1, '#92400e');

    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(s.x, s.y - 2, r * 0.75, r, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(s.x, s.y + 2, r * 0.75, r, 0, 0, Math.PI * 2);
    ctx.fill();

    // Central line
    ctx.strokeStyle = 'rgba(120,53,15,0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y - r);
    ctx.lineTo(s.x, s.y + r);
    ctx.stroke();

    // Pollen dots
    ctx.fillStyle = '#fef3c7';
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(s.x + Math.cos(a) * r * 0.55, s.y + Math.sin(a) * r * 0.55, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.ellipse(s.x - r * 0.35, s.y - r * 0.4, r * 0.25, r * 0.15, -0.4, 0, Math.PI * 2);
    ctx.fill();

    if (showLabels) {
      ctx.fillStyle = 'rgba(251,191,36,0.9)';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Anther', s.x, s.y - r - 8);
    }
  }

  function drawPetal(p) {
    const s = getScreen(p);
    const c = center();
    const dx = s.x - c.x;
    const dy = s.y - c.y;
    const angle = Math.atan2(dy, dx);
    const dist = Math.hypot(dx, dy);

    // Foreshortening - petals facing away appear narrower
    const worldAngle = p.angle + rotation;
    const foreshorten = 0.4 + 0.6 * Math.abs(Math.cos(worldAngle));

    const isInner = p.layer === 'inner';
    const scaleFactor = isInner ? 0.72 : 1.0;
    const petalLength = dist * 1.12 * scaleFactor;
    const petalWidth = dist * 0.48 * foreshorten * scaleFactor;

    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(angle);

    // Petal path with organic curves
    ctx.beginPath();
    ctx.moveTo(0, 0);
    // Right side - curves out to broad shoulder then tapers to rounded tip
    ctx.bezierCurveTo(
      petalLength * 0.15, -petalWidth * 1.15,
      petalLength * 0.72, -petalWidth * 1.20,
      petalLength * 0.94, -petalWidth * 0.35
    );
    // Rounded tip
    ctx.bezierCurveTo(
      petalLength * 1.08, 0,
      petalLength * 1.08, 0,
      petalLength * 0.94, petalWidth * 0.35
    );
    // Left side
    ctx.bezierCurveTo(
      petalLength * 0.72, petalWidth * 1.20,
      petalLength * 0.15, petalWidth * 1.15,
      0, 0
    );
    ctx.closePath();

    // Gradient: deep rose at base → vibrant pink → light pink tip
    const g = ctx.createLinearGradient(0, 0, petalLength, 0);
    if (isInner) {
      g.addColorStop(0, '#831843');
      g.addColorStop(0.3, '#be185d');
      g.addColorStop(0.7, '#ec4899');
      g.addColorStop(1, '#f9a8d4');
    } else {
      g.addColorStop(0, '#9d174d');
      g.addColorStop(0.3, '#db2777');
      g.addColorStop(0.65, '#ec4899');
      g.addColorStop(0.9, '#fbcfe8');
      g.addColorStop(1, '#fce7f3');
    }
    ctx.fillStyle = g;
    ctx.fill();

    // Soft outer edge
    ctx.strokeStyle = 'rgba(131,24,67,0.35)';
    ctx.lineWidth = 0.9;
    ctx.stroke();

    // Veins
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(157,23,77,0.35)';
    ctx.lineWidth = 0.85;
    // Central vein
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(petalLength * 0.5, -1, petalLength * 0.98, 0);
    ctx.stroke();
    // Side veins
    for (let i = 1; i <= 3; i++) {
      const t = i * 0.22;
      ctx.beginPath();
      ctx.moveTo(petalLength * t, 0);
      ctx.quadraticCurveTo(
        petalLength * (t + 0.15), -petalWidth * 0.5,
        petalLength * (t + 0.35), -petalWidth * 0.75
      );
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(petalLength * t, 0);
      ctx.quadraticCurveTo(
        petalLength * (t + 0.15), petalWidth * 0.5,
        petalLength * (t + 0.35), petalWidth * 0.75
      );
      ctx.stroke();
    }
    ctx.restore();

    // Highlight (top surface light)
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.beginPath();
    ctx.ellipse(petalLength * 0.42, -petalWidth * 0.42, petalLength * 0.32, petalWidth * 0.16, -0.15, 0, Math.PI * 2);
    ctx.fill();

    // Shadow at base (depth)
    const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, petalWidth * 0.85);
    sg.addColorStop(0, 'rgba(60,0,30,0.45)');
    sg.addColorStop(1, 'rgba(60,0,30,0)');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(0, 0, petalWidth * 0.85, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawSepal(p) {
    const s = getScreen(p);
    const c = center();
    const dx = s.x - c.x;
    const dy = s.y - c.y;
    const angle = Math.atan2(dy, dx);
    const dist = Math.hypot(dx, dy);

    const worldAngle = p.angle + rotation;
    const foreshorten = 0.45 + 0.55 * Math.abs(Math.cos(worldAngle));
    const len = dist * 1.05;
    const wd = dist * 0.42 * foreshorten;

    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(angle);

    // Sepal shape - pointed tip
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(
      len * 0.2, -wd * 1.1,
      len * 0.7, -wd * 1.15,
      len, -wd * 0.15
    );
    ctx.bezierCurveTo(len * 1.02, 0, len * 1.02, 0, len, wd * 0.15);
    ctx.bezierCurveTo(
      len * 0.7, wd * 1.15,
      len * 0.2, wd * 1.1,
      0, 0
    );
    ctx.closePath();

    const g = ctx.createLinearGradient(0, 0, len, 0);
    g.addColorStop(0, '#14532d');
    g.addColorStop(0.4, '#22c55e');
    g.addColorStop(0.8, '#4ade80');
    g.addColorStop(1, '#86efac');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(5,46,22,0.55)';
    ctx.lineWidth = 0.9;
    ctx.stroke();

    // Veins
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(20,83,45,0.5)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(len * 0.98, 0);
    ctx.stroke();
    for (let i = 1; i <= 3; i++) {
      const t = i * 0.22;
      ctx.beginPath();
      ctx.moveTo(len * t, 0);
      ctx.quadraticCurveTo(len * (t + 0.1), -wd * 0.6, len * (t + 0.28), -wd * 0.85);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(len * t, 0);
      ctx.quadraticCurveTo(len * (t + 0.1), wd * 0.6, len * (t + 0.28), wd * 0.85);
      ctx.stroke();
    }
    ctx.restore();

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.ellipse(len * 0.4, -wd * 0.35, len * 0.32, wd * 0.18, -0.1, 0, Math.PI * 2);
    ctx.fill();

    // Base shadow
    const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, wd * 0.7);
    sg.addColorStop(0, 'rgba(0,30,10,0.4)');
    sg.addColorStop(1, 'rgba(0,30,10,0)');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(0, 0, wd * 0.7, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawCenterCore() {
    // Small corona at flower center to hide petal bases
    const c = center();
    const r = 18;
    const g = ctx.createRadialGradient(c.x - 3, c.y - 3, 2, c.x, c.y, r);
    g.addColorStop(0, '#fda4af');
    g.addColorStop(0.5, '#db2777');
    g.addColorStop(1, '#831843');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(c.x, c.y - 15, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function render() {
    drawBackground();
    drawDropShadow();

    // Sort by depth (far first)
    const sorted = parts.map(p => ({ p, s: getScreen(p) })).sort((a, b) => a.s.depth - b.s.depth);

    // Group anthers with their filaments
    const anthers = sorted.filter(x => x.p.type === 'anther');
    let ai = 0;

    sorted.forEach(({ p }) => {
      switch (p.type) {
        case 'pedicel': drawPedicel(p); break;
        case 'receptacle': drawReceptacle(p); break;
        case 'ovary': drawOvary(p); break;
        case 'style': drawStyle(p); break;
        case 'stigma': drawStigma(p); break;
        case 'sepal': drawSepal(p); break;
        case 'filament': {
          const a = anthers[ai];
          if (a) drawFilament(p, a.p);
          break;
        }
        case 'anther': ai++; drawAnther(p); break;
        case 'petal': drawPetal(p); break;
      }
    });

    drawCenterCore();
  }

  function loop(t) {
    const dt = Math.min(0.05, (t - lastT) / 1000);
    lastT = t;
    if (autoRotate && !isDragging) rotation += dt * 0.55;
    render();
    animId = requestAnimationFrame(loop);
  }

  // --- Pointer events ---
  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  let tapStart = null;
  function onDown(e) {
    isDragging = true;
    autoRotate = false;
    setToggleUI('.tog-auto', false);
    prevX = getPos(e).x;
    tapStart = { t: Date.now(), p: getPos(e) };
    canvas.setPointerCapture(e.pointerId);
    e.preventDefault();
  }
  function onMove(e) {
    if (!isDragging) return;
    const x = getPos(e).x;
    rotation += (x - prevX) * 0.012;
    prevX = x;
    e.preventDefault();
  }
  function onUp(e) {
    isDragging = false;
    if (tapStart) {
      const dur = Date.now() - tapStart.t;
      const p = getPos(e);
      const d = Math.hypot(p.x - tapStart.p.x, p.y - tapStart.p.y);
      if (dur < 300 && d < 12) handleTap(p.x, p.y);
      tapStart = null;
    }
  }

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);

  function handleTap(px, py) {
    let best = null, bestD = 55;
    parts.forEach(p => {
      const s = getScreen(p);
      const d = Math.hypot(px - s.x, py - s.y);
      if (d < bestD) { bestD = d; best = p; }
    });
    if (best) showInfo(best.info);
  }

  const infoPanel = wrap.querySelector('.info-panel');
  const infoName = wrap.querySelector('.info-name');
  const infoDesc = wrap.querySelector('.info-desc');
  const infoColor = wrap.querySelector('.info-color');

  function showInfo(key) {
    const d = INFO[key];
    if (!d) return;
    infoName.textContent = d.name;
    infoDesc.textContent = d.desc;
    infoColor.style.background = d.color;
    infoPanel.style.transform = 'translateY(0)';
    infoPanel.style.opacity = '1';
    infoPanel.style.pointerEvents = 'auto';
    clearTimeout(window.__flowerTimer);
    window.__flowerTimer = setTimeout(hideInfo, 8000);
  }
  function hideInfo() {
    infoPanel.style.transform = 'translateY(140px)';
    infoPanel.style.opacity = '0';
    infoPanel.style.pointerEvents = 'none';
  }
  wrap.querySelector('.info-close').addEventListener('click', hideInfo);

  const dissectSlider = wrap.querySelector('#dissectSlider');
  const dissectVal = wrap.querySelector('#dissectVal');
  dissectSlider.addEventListener('input', () => {
    dissect = parseInt(dissectSlider.value, 10) / 100;
    dissectVal.textContent = dissectSlider.value + '%';
  });

  function setToggleUI(sel, on) {
    const b = wrap.querySelector(sel);
    if (!b) return;
    b.classList.toggle('bg-emerald-500/20', on);
    b.classList.toggle('border-emerald-500/40', on);
    b.classList.toggle('text-emerald-300', on);
    b.classList.toggle('bg-slate-800', !on);
    b.classList.toggle('border-slate-700', !on);
    b.classList.toggle('text-slate-300', !on);
  }

  wrap.querySelector('.tog-auto').addEventListener('click', () => {
    autoRotate = !autoRotate;
    setToggleUI('.tog-auto', autoRotate);
  });
  wrap.querySelector('.tog-labels').addEventListener('click', () => {
    showLabels = !showLabels;
    setToggleUI('.tog-labels', showLabels);
  });
  wrap.querySelector('.tog-reset').addEventListener('click', () => {
    rotation = 0.6;
    dissect = 0;
    dissectSlider.value = 0;
    dissectVal.textContent = '0%';
    autoRotate = true;
    setToggleUI('.tog-auto', true);
    hideInfo();
  });
  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    rotation = 0.6;
    dissect = 0;
    dissectSlider.value = 0;
    dissectVal.textContent = '0%';
    hideInfo();
  });
  wrap.querySelector('.back-btn').addEventListener('click', () => window.goBack());

  let ro = null;
  if ('ResizeObserver' in window) {
    ro = new ResizeObserver(() => { resize(); });
    ro.observe(canvas);
  }
  resize();
  lastT = performance.now();
  animId = requestAnimationFrame(loop);

  return function cleanup() {
    if (animId) cancelAnimationFrame(animId);
    if (ro) ro.disconnect();
    canvas.removeEventListener('pointerdown', onDown);
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerup', onUp);
    canvas.removeEventListener('pointercancel', onUp);
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    document.body.style.overflow = prevOverflow;
  };
               }
