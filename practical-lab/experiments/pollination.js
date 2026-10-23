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
        <div class="text-xs font-black text-slate-100 truncate">Pollination Types</div>
        <div class="text-[9px] text-slate-500 truncate">Class 12 Bio - Ch 1</div>
      </div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 flex items-center justify-center">
        <i class="fa-solid fa-rotate-left text-xs"></i>
      </button>
    </div>

    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full" style="touch-action:none"></canvas>

      <div class="absolute top-2 left-2 bg-slate-900/90 border border-slate-800 rounded-xl px-2 py-1.5 pointer-events-none">
        <div class="text-[7px] text-pink-400 uppercase font-black">Autogamy</div>
        <div class="text-[12px] font-black text-pink-300" id="cntA">0</div>
      </div>
      <div class="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-slate-800 rounded-xl px-2 py-1.5 pointer-events-none">
        <div class="text-[7px] text-amber-400 uppercase font-black">Geitonogamy</div>
        <div class="text-[12px] font-black text-amber-300" id="cntG">0</div>
      </div>
      <div class="absolute top-2 right-2 bg-slate-900/90 border border-slate-800 rounded-xl px-2 py-1.5 pointer-events-none">
        <div class="text-[7px] text-emerald-400 uppercase font-black">Xenogamy</div>
        <div class="text-[12px] font-black text-emerald-300" id="cntX">0</div>
      </div>

      <div class="hint absolute bottom-2 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-slate-800 rounded-xl px-3 py-1.5 text-[10px] text-slate-300 pointer-events-none whitespace-nowrap">
        <i class="fa-solid fa-hand-pointer text-emerald-400 mr-1"></i> Drag bee to anther → stigma
      </div>
    </div>

    <div class="bg-slate-900 border-t border-slate-800 p-3 shrink-0 max-h-[42vh] overflow-y-auto space-y-2.5">
      <div class="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800 space-y-1.5">
        <div class="flex items-start gap-2">
          <div class="w-2 h-2 rounded-full mt-1.5 shrink-0" style="background:#ec4899"></div>
          <div class="text-[9.5px] text-slate-400 leading-relaxed">
            <b class="text-pink-400">Autogamy:</b> Same flower (self-pollination)
          </div>
        </div>
        <div class="flex items-start gap-2">
          <div class="w-2 h-2 rounded-full mt-1.5 shrink-0" style="background:#f59e0b"></div>
          <div class="text-[9.5px] text-slate-400 leading-relaxed">
            <b class="text-amber-400">Geitonogamy:</b> Different flowers, same plant
          </div>
        </div>
        <div class="flex items-start gap-2">
          <div class="w-2 h-2 rounded-full mt-1.5 shrink-0" style="background:#10b981"></div>
          <div class="text-[9.5px] text-slate-400 leading-relaxed">
            <b class="text-emerald-400">Xenogamy:</b> Flowers of different plants (true cross-pollination)
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-1.5">
        <button type="button" class="tog tog-auto py-2.5 rounded-xl text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-300">
          <i class="fa-solid fa-robot mr-1"></i> Auto Bee
        </button>
        <button type="button" class="tog tog-labels py-2.5 rounded-xl text-[10px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
          <i class="fa-solid fa-tag mr-1"></i> Labels
        </button>
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
    W = rect.width;
    H = rect.height;
  }

  // ----- Colour utils -----
  function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');
  }
  function shade(hex, amt) {
    const c = hexToRgb(hex);
    return rgbToHex(c.r + amt, c.g + amt, c.b + amt);
  }

  // ----- Flowers -----
  const flowers = [
    { id: 'A1', plant: 'A', label: 'A1', cx: 0, cy: 0, size: 50, petal: '#ec4899', pollen: '#fbbf24', phase: 0 },
    { id: 'A2', plant: 'A', label: 'A2', cx: 0, cy: 0, size: 50, petal: '#ec4899', pollen: '#fbbf24', phase: 1.5 },
    { id: 'B1', plant: 'B', label: 'B1', cx: 0, cy: 0, size: 50, petal: '#f97316', pollen: '#eab308', phase: 3 }
  ];

  const bee = { x: 0, y: 0, size: 16, carrying: [], dragging: false, ox: 0, oy: 0, wingPhase: 0 };

  let cntA = 0, cntG = 0, cntX = 0;
  let showLabels = true;
  let autoMode = false;
  let autoState = 'to-anther';
  let autoTarget = null;

  function layout() {
    flowers[0].cx = W * 0.24; flowers[0].cy = H * 0.3;
    flowers[1].cx = W * 0.24; flowers[1].cy = H * 0.72;
    flowers[2].cx = W * 0.78; flowers[2].cy = H * 0.5;
    if (!bee.dragging) {
      bee.x = W * 0.5; bee.y = H * 0.9;
    }
  }

  function getAnther(f) {
    return { x: f.cx - f.size * 0.34, y: f.cy - f.size * 0.16 };
  }
  function getStigma(f) {
    return { x: f.cx + f.size * 0.34, y: f.cy - f.size * 0.16 };
  }

  // ----- Drawing: Background -----
  function drawBackground() {
    // Warm sky gradient
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0a1220');
    g.addColorStop(0.6, '#0a0f1a');
    g.addColorStop(1, '#050a14');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Soft ground
    const gg = ctx.createLinearGradient(0, H * 0.88, 0, H);
    gg.addColorStop(0, 'rgba(20,40,25,0)');
    gg.addColorStop(1, 'rgba(20,40,25,0.4)');
    ctx.fillStyle = gg;
    ctx.fillRect(0, H * 0.88, W, H * 0.12);
  }

  // ----- Drawing: Plant stems -----
  function drawStems() {
    // Plant A: two flowers joined
    const f1 = flowers[0], f2 = flowers[1];
    const jointX = f1.cx;
    const jointY = (f1.cy + f2.cy) / 2 + 20;

    ctx.strokeStyle = '#166534';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';

    // From A1 down to joint
    ctx.beginPath();
    ctx.moveTo(f1.cx, f1.cy + 20);
    ctx.quadraticCurveTo(f1.cx + 6, f1.cy + 60, jointX, jointY);
    ctx.stroke();

    // From A2 up to joint
    ctx.beginPath();
    ctx.moveTo(f2.cx, f2.cy - 20);
    ctx.quadraticCurveTo(f2.cx + 6, f2.cy - 60, jointX, jointY);
    ctx.stroke();

    // From joint down to ground
    ctx.beginPath();
    ctx.moveTo(jointX, jointY);
    ctx.quadraticCurveTo(jointX - 8, jointY + 60, jointX - 5, H * 0.95);
    ctx.stroke();

    // Plant A small leaf
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(jointX + 18, jointY + 10, 16, 7, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Plant B: single flower
    const f3 = flowers[2];
    ctx.strokeStyle = '#166534';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(f3.cx, f3.cy + 20);
    ctx.quadraticCurveTo(f3.cx + 10, f3.cy + 80, f3.cx - 3, H * 0.95);
    ctx.stroke();

    // Plant B small leaf
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(f3.cx + 22, f3.cy + 70, 16, 7, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Ground line
    ctx.strokeStyle = 'rgba(34,197,94,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, H * 0.95);
    ctx.lineTo(W, H * 0.95);
    ctx.stroke();
  }

  // ----- Drawing: Petal -----
  function drawPetal(cx, cy, angle, length, width, color, isInner) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(
      length * 0.15, -width * 1.15,
      length * 0.72, -width * 1.22,
      length * 0.94, -width * 0.35
    );
    ctx.bezierCurveTo(
      length * 1.06, 0,
      length * 1.06, 0,
      length * 0.94, width * 0.35
    );
    ctx.bezierCurveTo(
      length * 0.72, width * 1.22,
      length * 0.15, width * 1.15,
      0, 0
    );
    ctx.closePath();

    const g = ctx.createLinearGradient(0, 0, length, 0);
    if (isInner) {
      g.addColorStop(0, shade(color, -40));
      g.addColorStop(0.5, color);
      g.addColorStop(1, shade(color, 50));
    } else {
      g.addColorStop(0, shade(color, -60));
      g.addColorStop(0.35, shade(color, -20));
      g.addColorStop(0.7, color);
      g.addColorStop(1, shade(color, 60));
    }
    ctx.fillStyle = g;
    ctx.fill();

    // Edge
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 0.9;
    ctx.stroke();

    // Veins
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 0.85;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(length * 0.5, -0.5, length * 0.95, 0);
    ctx.stroke();
    for (let i = 1; i <= 3; i++) {
      const t = i * 0.22;
      ctx.beginPath();
      ctx.moveTo(length * t, 0);
      ctx.quadraticCurveTo(length * (t + 0.12), -width * 0.55, length * (t + 0.3), -width * 0.78);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(length * t, 0);
      ctx.quadraticCurveTo(length * (t + 0.12), width * 0.55, length * (t + 0.3), width * 0.78);
      ctx.stroke();
    }
    ctx.restore();

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.beginPath();
    ctx.ellipse(length * 0.42, -width * 0.38, length * 0.3, width * 0.15, -0.1, 0, Math.PI * 2);
    ctx.fill();

    // Base shadow
    const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, width * 0.9);
    sg.addColorStop(0, 'rgba(40,0,20,0.5)');
    sg.addColorStop(1, 'rgba(40,0,20,0)');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(0, 0, width * 0.9, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // ----- Drawing: Anther -----
  function drawAnther(x, y, size, color) {
    // Glow
    const glow = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
    glow.addColorStop(0, 'rgba(251,191,36,0.4)');
    glow.addColorStop(1, 'rgba(251,191,36,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, size * 2, 0, Math.PI * 2);
    ctx.fill();

    // Two-lobed anther
    const g = ctx.createRadialGradient(x - size * 0.3, y - size * 0.3, 1, x, y, size);
    g.addColorStop(0, shade(color, 60));
    g.addColorStop(0.5, color);
    g.addColorStop(1, shade(color, -80));

    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y - size * 0.15, size * 0.75, size, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.15, size * 0.75, size, 0, 0, Math.PI * 2);
    ctx.fill();

    // Center line
    ctx.strokeStyle = 'rgba(120,53,15,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x, y + size);
    ctx.stroke();

    // Pollen dots
    ctx.fillStyle = '#fef3c7';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * size * 0.5, y + Math.sin(a) * size * 0.5, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.ellipse(x - size * 0.35, y - size * 0.4, size * 0.22, size * 0.13, -0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // ----- Drawing: Stigma -----
  function drawStigma(x, y, size) {
    // Stalk
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y + size * 1.5);
    ctx.lineTo(x, y + size * 0.3);
    ctx.stroke();

    // Head
    const g = ctx.createRadialGradient(x - size * 0.4, y - size * 0.4, size * 0.1, x, y, size);
    g.addColorStop(0, '#e9d5ff');
    g.addColorStop(0.5, '#a855f7');
    g.addColorStop(1, '#581c87');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();

    // Lobes
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const lx = x + Math.cos(a) * size * 0.85;
      const ly = y + Math.sin(a) * size * 0.85;
      const lg = ctx.createRadialGradient(lx - 1, ly - 1, 0.5, lx, ly, size * 0.4);
      lg.addColorStop(0, '#e9d5ff');
      lg.addColorStop(1, '#9333ea');
      ctx.fillStyle = lg;
      ctx.beginPath();
      ctx.arc(lx, ly, size * 0.32, 0, Math.PI * 2);
      ctx.fill();
    }

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath();
    ctx.ellipse(x - size * 0.35, y - size * 0.4, size * 0.35, size * 0.2, -0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // ----- Drawing: Single flower -----
  function drawFlower(f) {
    // Determine sway
    const sway = Math.sin(performance.now() * 0.001 + f.phase) * 0.04;

    // Outer 6 petals
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 2 + sway;
      drawPetal(f.cx, f.cy, a, f.size * 0.72, f.size * 0.35, f.petal, false);
    }
    // Inner 4 petals (rotated)
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 - Math.PI / 2 + Math.PI / 4 + sway;
      drawPetal(f.cx, f.cy, a, f.size * 0.55, f.size * 0.28, shade(f.petal, -20), true);
    }

    // Center
    const cg = ctx.createRadialGradient(f.cx - 3, f.cy - 3, 1, f.cx, f.cy, f.size * 0.28);
    cg.addColorStop(0, '#fef3c7');
    cg.addColorStop(0.6, '#f59e0b');
    cg.addColorStop(1, '#78350f');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(f.cx, f.cy, f.size * 0.28, 0, Math.PI * 2);
    ctx.fill();
    // Center dots
    ctx.fillStyle = 'rgba(120,53,15,0.5)';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(f.cx + Math.cos(a) * f.size * 0.15, f.cy + Math.sin(a) * f.size * 0.15, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Filament + Anther (left side)
    const ap = getAnther(f);
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(f.cx - f.size * 0.12, f.cy - f.size * 0.05);
    ctx.lineTo(ap.x, ap.y + f.size * 0.14);
    ctx.stroke();

    drawAnther(ap.x, ap.y, f.size * 0.16, f.pollen);

    // Style + Stigma (right side)
    const sp = getStigma(f);
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(f.cx + f.size * 0.12, f.cy - f.size * 0.05);
    ctx.lineTo(sp.x, sp.y + f.size * 0.2);
    ctx.stroke();

    drawStigma(sp.x, sp.y, f.size * 0.15);

    // Labels
    if (showLabels) {
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.fillStyle = 'rgba(251,191,36,0.95)';
      ctx.fillText('Anther', ap.x, ap.y - f.size * 0.35);
      ctx.fillStyle = 'rgba(192,132,252,0.95)';
      ctx.fillText('Stigma', sp.x, sp.y - f.size * 0.35);

      // Flower ID
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText(f.label, f.cx, f.cy + f.size * 1.15);
    }
  }

  // ----- Drawing: Bee -----
  function drawBee() {
    const s = bee.size;
    const wingOffset = Math.sin(bee.wingPhase) * 0.15;

    // Shadow under bee
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(bee.x, bee.y + s * 0.9, s * 0.9, s * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wings (behind body)
    ctx.fillStyle = 'rgba(200,220,255,0.5)';
    ctx.strokeStyle = 'rgba(200,220,255,0.8)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.ellipse(bee.x - s * 0.4, bee.y - s * 0.9 - wingOffset * 3, s * 0.5, s * 0.32, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(bee.x + s * 0.4, bee.y - s * 0.9 - wingOffset * 3, s * 0.5, s * 0.32, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Body (oval, gradient)
    const bg = ctx.createLinearGradient(bee.x, bee.y - s, bee.x, bee.y + s);
    bg.addColorStop(0, '#fcd34d');
    bg.addColorStop(1, '#d97706');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.ellipse(bee.x, bee.y, s * 1.2, s * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body stripes
    ctx.fillStyle = '#1f2937';
    for (let i = -1; i <= 1; i++) {
      const x = bee.x + i * s * 0.4;
      const yScale = 1 - Math.abs(i) * 0.15;
      ctx.beginPath();
      ctx.ellipse(x, bee.y, s * 0.11, s * 0.78 * yScale, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Head
    ctx.fillStyle = '#1f2937';
    ctx.beginPath();
    ctx.arc(bee.x - s * 1.25, bee.y, s * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(bee.x - s * 1.35, bee.y - 3, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(bee.x - s * 1.38, bee.y - 3, 1.1, 0, Math.PI * 2);
    ctx.fill();

    // Antennae
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 1.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(bee.x - s * 1.35, bee.y - s * 0.4);
    ctx.quadraticCurveTo(bee.x - s * 1.6, bee.y - s * 0.9, bee.x - s * 1.7, bee.y - s * 1.0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bee.x - s * 1.35, bee.y - s * 0.2);
    ctx.quadraticCurveTo(bee.x - s * 1.7, bee.y - s * 0.5, bee.x - s * 1.8, bee.y - s * 0.45);
    ctx.stroke();

    // Pollen particles on bee
    if (bee.carrying.length > 0) {
      bee.carrying.forEach((c, i) => {
        const angle = (i / Math.max(1, bee.carrying.length)) * Math.PI * 2 + 0.5;
        const r = s * 0.85;
        const px = bee.x + Math.cos(angle) * r;
        const py = bee.y + Math.sin(angle) * r * 0.55;
        const pg = ctx.createRadialGradient(px - 1, py - 1, 0.5, px, py, 4.5);
        pg.addColorStop(0, '#fef3c7');
        pg.addColorStop(1, c.color);
        ctx.fillStyle = pg;
        ctx.beginPath();
        ctx.arc(px, py, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }
  }

  // ----- Main render -----
  function render() {
    drawBackground();
    drawStems();
    flowers.forEach(drawFlower);
    drawBee();
  }

  // ----- Hint -----
  function showHint(text, type) {
    const h = wrap.querySelector('.hint');
    h.innerHTML = text;
    let bg = 'rgba(16,185,129,0.95)';
    if (type === 'pink') bg = 'rgba(236,72,153,0.95)';
    else if (type === 'amber') bg = 'rgba(245,158,11,0.95)';
    else if (type === 'error') bg = 'rgba(239,68,68,0.95)';
    h.style.background = bg;
    h.style.color = '#fff';
    h.style.borderColor = 'transparent';
    clearTimeout(window.__polHint);
    window.__polHint = setTimeout(() => {
      h.innerHTML = '<i class="fa-solid fa-hand-pointer text-emerald-400 mr-1"></i> Drag bee to anther → stigma';
      h.style.background = '';
      h.style.color = '';
      h.style.borderColor = '';
    }, 1800);
  }

  // ----- Interactions -----
  function checkInteractions() {
    // Pick up pollen
    flowers.forEach(f => {
      const ap = getAnther(f);
      const d = Math.hypot(bee.x - ap.x, bee.y - ap.y);
      if (d < 32 && bee.carrying.length < 3) {
        const already = bee.carrying.find(c => c.from === f.id);
        if (!already) {
          bee.carrying.push({ color: f.pollen, from: f.id, plant: f.plant });
          showHint('✓ Pollen from Flower ' + f.label);
        }
      }
    });

    // Deposit pollen
    flowers.forEach(f => {
      const sp = getStigma(f);
      const d = Math.hypot(bee.x - sp.x, bee.y - sp.y);
      if (d < 30 && bee.carrying.length > 0) {
        const pol = bee.carrying[0];
        const src = flowers.find(x => x.id === pol.from);
        if (!src) { bee.carrying = []; return; }

        if (src.id === f.id) {
          cntA++;
          showHint('🌸 <b>Autogamy</b> — Same flower!', 'pink');
        } else if (src.plant === f.plant) {
          cntG++;
          showHint('🌼 <b>Geitonogamy</b> — Same plant, diff flower!', 'amber');
        } else {
          cntX++;
          showHint('🌺 <b>Xenogamy</b> — Cross plant!', 'green');
        }

        bee.carrying = [];
        wrap.querySelector('#cntA').textContent = cntA;
        wrap.querySelector('#cntG').textContent = cntG;
        wrap.querySelector('#cntX').textContent = cntX;
      }
    });
  }

  // ----- Loop -----
  let animId = null;
  function loop() {
    bee.wingPhase += 0.6;
    if (autoMode && !bee.dragging) updateAuto();
    render();
    animId = requestAnimationFrame(loop);
  }

  // ----- Auto mode -----
  function updateAuto() {
    const speed = 2.4;

    if (autoState === 'to-anther') {
      if (!autoTarget) {
        const f = flowers[Math.floor(Math.random() * flowers.length)];
        autoTarget = getAnther(f);
      }
      moveToward(autoTarget, speed);
      if (Math.hypot(bee.x - autoTarget.x, bee.y - autoTarget.y) < 6) {
        checkInteractions();
        if (bee.carrying.length > 0) {
          autoState = 'to-stigma';
          autoTarget = null;
        }
      }
    } else if (autoState === 'to-stigma') {
      if (!autoTarget) {
        const f = flowers[Math.floor(Math.random() * flowers.length)];
        autoTarget = getStigma(f);
      }
      moveToward(autoTarget, speed);
      if (Math.hypot(bee.x - autoTarget.x, bee.y - autoTarget.y) < 6) {
        checkInteractions();
        if (bee.carrying.length === 0) {
          autoState = 'wait';
          autoTarget = null;
          setTimeout(() => { autoState = 'to-anther'; }, 400);
        }
      }
    }
  }

  function moveToward(t, sp) {
    const dx = t.x - bee.x;
    const dy = t.y - bee.y;
    const d = Math.hypot(dx, dy);
    if (d < 1) return;
    bee.x += (dx / d) * Math.min(sp, d);
    bee.y += (dy / d) * Math.min(sp, d);
    checkInteractions();
  }

  // ----- Pointer -----
  function getPointer(e) {
    const rect = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX - rect.left, y: t.clientY - rect.top };
  }

  function onDown(e) {
    if (autoMode) return;
    const p = getPointer(e);
    if (Math.hypot(p.x - bee.x, p.y - bee.y) < 50) {
      bee.dragging = true;
      bee.ox = p.x - bee.x;
      bee.oy = p.y - bee.y;
      if (e.cancelable) e.preventDefault();
    }
  }
  function onMove(e) {
    if (!bee.dragging) return;
    if (e.cancelable) e.preventDefault();
    const p = getPointer(e);
    bee.x = p.x - bee.ox;
    bee.y = p.y - bee.oy;
    checkInteractions();
  }
  function onUp() { bee.dragging = false; }

  canvas.addEventListener('mousedown', onDown);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
  canvas.addEventListener('touchstart', onDown, { passive: false });
  window.addEventListener('touchmove', onMove, { passive: false });
  window.addEventListener('touchend', onUp);

  // ----- Toggles -----
  function bindTog(sel, init, fn) {
    const b = wrap.querySelector(sel);
    const setUI = (on) => {
      b.classList.toggle('bg-emerald-500/20', on);
      b.classList.toggle('border-emerald-500/40', on);
      b.classList.toggle('text-emerald-300', on);
      b.classList.toggle('bg-slate-800', !on);
      b.classList.toggle('border-slate-700', !on);
      b.classList.toggle('text-slate-300', !on);
    };
    setUI(init);
    b.addEventListener('click', () => {
      const on = !b.classList.contains('bg-emerald-500/20');
      setUI(on);
      fn(on);
    });
  }

  bindTog('.tog-auto', false, v => {
    autoMode = v;
    if (v) { autoState = 'to-anther'; autoTarget = null; }
  });
  bindTog('.tog-labels', true, v => showLabels = v);

  // ----- Reset -----
  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    cntA = cntG = cntX = 0;
    bee.carrying = [];
    bee.dragging = false;
    bee.x = W * 0.5; bee.y = H * 0.9;
    autoState = 'to-anther';
    autoTarget = null;
    wrap.querySelector('#cntA').textContent = '0';
    wrap.querySelector('#cntG').textContent = '0';
    wrap.querySelector('#cntX').textContent = '0';
  });

  wrap.querySelector('.back-btn').addEventListener('click', () => window.goBack());

  // ----- Resize -----
  let ro = null;
  if ('ResizeObserver' in window) {
    ro = new ResizeObserver(() => { resize(); layout(); });
    ro.observe(canvas);
  }
  resize();
  layout();
  animId = requestAnimationFrame(loop);

  return function cleanup() {
    if (animId) cancelAnimationFrame(animId);
    if (ro) ro.disconnect();
    canvas.removeEventListener('mousedown', onDown);
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
    canvas.removeEventListener('touchstart', onDown);
    window.removeEventListener('touchmove', onMove);
    window.removeEventListener('touchend', onUp);
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    document.body.style.overflow = prevOverflow;
  };
}
