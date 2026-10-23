export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0">
        <div class="text-xs font-black text-slate-100 truncate">Outbreeding Devices</div>
        <div class="text-[9px] text-slate-500 truncate">Class 12 Bio - Ch 1</div>
      </div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-1/2 -translate-x-1/2 bg-white/10 border border-white/10 rounded-xl px-3 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[11px] font-black text-slate-100 text-center" id="nameBar">Tap any mechanism</div>
      </div>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 space-y-2.5" style="backdrop-filter:blur(20px);">
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10" id="descBox">
        <div class="text-[10px] font-bold text-emerald-300 mb-1">Why prevent self-pollination?</div>
        <div class="text-[10px] text-slate-400 leading-relaxed">Continuous self-pollination causes inbreeding depression. Plants evolved 5 mechanisms to promote cross-pollination.</div>
      </div>
      <div class="grid grid-cols-5 gap-1.5">
        <button type="button" class="mbtn py-2 rounded-xl text-[8px] font-bold bg-white/5 border border-white/10 text-slate-300" data-i="0">Self<br>Incomp.</button>
        <button type="button" class="mbtn py-2 rounded-xl text-[8px] font-bold bg-white/5 border border-white/10 text-slate-300" data-i="1">Dicho<br>gamy</button>
        <button type="button" class="mbtn py-2 rounded-xl text-[8px] font-bold bg-white/5 border border-white/10 text-slate-300" data-i="2">Herko<br>gamy</button>
        <button type="button" class="mbtn py-2 rounded-xl text-[8px] font-bold bg-white/5 border border-white/10 text-slate-300" data-i="3">Uni<br>sexual</button>
        <button type="button" class="mbtn py-2 rounded-xl text-[8px] font-bold bg-white/5 border border-white/10 text-slate-300" data-i="4">Avoid<br>ance</button>
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

  const MECHANISMS = [
    { key: 'self-inc', title: 'Self-Incompatibility', desc: 'Pollen from same flower fails to germinate on stigma. Genetic recognition system (S-alleles). Example: Potato, Tobacco, Crucifers.' },
    { key: 'dicho', title: 'Dichogamy', desc: 'Anther and stigma mature at different times. Protandry — anther matures first (Sunflower, Salvia). Protogyny — stigma matures first (Ficus, Aristolochia).' },
    { key: 'herko', title: 'Herkogamy', desc: 'Physical barrier between anther and stigma — different heights, positions, or structures. Pollen cannot reach own stigma. Example: Pansy, Gloriosa.' },
    { key: 'unisex', title: 'Unisexuality', desc: 'Male and female flowers on separate plants (Dioecy) or same plant (Monoecy). Dioecy prevents self-pollination entirely. Example: Papaya, Mulberry.' },
    { key: 'avoid', title: 'Avoidance of Self-Pollination', desc: 'Different maturation times or spatial separation. Even if anther and stigma are close, timing or position prevents contact.' }
  ];

  let selected = -1;
  let animId = null, lastT = 0;
  let phase = 0;

  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0a1628');
    g.addColorStop(1, '#050a14');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function drawFlowerBase(cx, cy, size, petalColor) {
    // Petals
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const pg = ctx.createRadialGradient(cx, cy, size * 0.2, cx + Math.cos(a) * size * 0.4, cy + Math.sin(a) * size * 0.4, size * 0.5);
      pg.addColorStop(0, petalColor + 'CC');
      pg.addColorStop(1, petalColor + '66');
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.ellipse(cx + Math.cos(a) * size * 0.45, cy + Math.sin(a) * size * 0.45, size * 0.32, size * 0.15, a, 0, Math.PI * 2);
      ctx.fill();
    }
    // Center
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawSelfIncompatibility(cx, cy, size) {
    // Flower with pollen being rejected
    drawFlowerBase(cx, cy, size, '#ec4899');

    // Stigma top
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.arc(cx, cy - size * 0.5, size * 0.13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#581c87';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Pollen grain falling and bouncing off
    const t = (phase * 0.3) % 1;
    const py = cy - size * 1.5 + t * size * 0.95;
    if (t < 0.99) {
      const pg = ctx.createRadialGradient(cx, py, 1, cx, py, size * 0.08);
      pg.addColorStop(0, '#fef3c7');
      pg.addColorStop(1, '#d97706');
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.arc(cx, py, size * 0.07, 0, Math.PI * 2);
      ctx.fill();
    }
    // Block signal at stigma
    if (t > 0.5) {
      ctx.strokeStyle = `rgba(239,68,68,${(t - 0.5) * 2})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - size * 0.2, cy - size * 0.55);
      ctx.lineTo(cx + size * 0.2, cy - size * 0.45);
      ctx.moveTo(cx + size * 0.2, cy - size * 0.55);
      ctx.lineTo(cx - size * 0.2, cy - size * 0.45);
      ctx.stroke();
    }

    ctx.fillStyle = '#f0abfc';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Pollen rejected', cx, cy + size * 1.3);
  }

  function drawDichogamy(cx, cy, size) {
    drawFlowerBase(cx, cy, size, '#f59e0b');

    // Two timelines: protandry (left) and protogyny (right)
    const shift = size * 0.9;

    // Protandry: anther first
    drawFlowerBase(cx - shift, cy + shift * 0.3, size * 0.5, '#f59e0b');
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(cx - shift, cy + shift * 0.3 - size * 0.2, size * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.arc(cx - shift + size * 0.2, cy + shift * 0.3 - size * 0.15, size * 0.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Anther first', cx - shift, cy + shift * 0.3 + size * 0.6);
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('(Protandry)', cx - shift, cy + shift * 0.3 + size * 0.75);

    // Protogyny: stigma first
    drawFlowerBase(cx + shift, cy + shift * 0.3, size * 0.5, '#f59e0b');
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.arc(cx + shift, cy + shift * 0.3 - size * 0.2, size * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(cx + shift + size * 0.2, cy + shift * 0.3 - size * 0.15, size * 0.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c084fc';
    ctx.font = 'bold 8px sans-serif';
    ctx.fillText('Stigma first', cx + shift, cy + shift * 0.3 + size * 0.6);
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('(Protogyny)', cx + shift, cy + shift * 0.3 + size * 0.75);
  }

  function drawHerkogamy(cx, cy, size) {
    drawFlowerBase(cx, cy, size, '#8b5cf6');

    // Anther positioned away from stigma — physical barrier
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(cx - size * 0.6, cy - size * 0.3, size * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.arc(cx + size * 0.6, cy - size * 0.5, size * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Height difference arrow
    ctx.strokeStyle = '#64748b';
    ctx.setLineDash([4, 3]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.6, cy - size * 0.3);
    ctx.lineTo(cx + size * 0.6, cy - size * 0.3);
    ctx.moveTo(cx + size * 0.6, cy - size * 0.5);
    ctx.lineTo(cx + size * 0.6, cy - size * 0.3);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#a78bfa';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Physical barrier', cx, cy + size * 1.2);
  }

  function drawUnisexuality(cx, cy, size) {
    // Male flower (left) + Female flower (right)
    // Male
    drawFlowerBase(cx - size * 0.8, cy, size * 0.55, '#3b82f6');
    ctx.fillStyle = '#fbbf24';
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx - size * 0.8 + Math.cos(a) * size * 0.15, cy + Math.sin(a) * size * 0.15, size * 0.05, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#60a5fa';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Male', cx - size * 0.8, cy + size * 0.75);

    // Female
    drawFlowerBase(cx + size * 0.8, cy, size * 0.55, '#ec4899');
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.arc(cx + size * 0.8, cy, size * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f0abfc';
    ctx.fillText('Female', cx + size * 0.8, cy + size * 0.75);

    // X between them
    ctx.strokeStyle = 'rgba(239,68,68,0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(cx, cy - size * 0.5);
    ctx.lineTo(cx, cy + size * 0.5);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawAvoidance(cx, cy, size) {
    // Two flowers, offset timing
    drawFlowerBase(cx - size * 0.6, cy, size * 0.5, '#10b981');
    drawFlowerBase(cx + size * 0.6, cy, size * 0.5, '#10b981');

    // Clock arrows showing different timing
    const t = (phase * 0.5) % 1;
    ctx.strokeStyle = 'rgba(16,185,129,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx - size * 0.6, cy + size * 0.4, size * 0.2, -Math.PI / 2, -Math.PI / 2 + t * Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + size * 0.6, cy + size * 0.4, size * 0.2, -Math.PI / 2, -Math.PI / 2 + (1 - t) * Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#6ee7b7';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Different timing', cx, cy + size * 1.3);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawBackground();
    const cx = W / 2, cy = H / 2;
    const size = Math.min(W, H) * 0.14;

    if (selected < 0) {
      // Show all 5 mechanisms as cards
      const cols = 3;
      const rows = 2;
      const cellW = W / cols, cellH = H / rows;
      for (let i = 0; i < 5; i++) {
        const col = i % cols, row = Math.floor(i / cols);
        const px = cellW * col + cellW / 2;
        const py = cellH * row + cellH / 2 + 10;
        drawIconOnly(i, px, py, Math.min(cellW, cellH) * 0.25);
      }
    } else {
      switch (selected) {
        case 0: drawSelfIncompatibility(cx, cy, size); break;
        case 1: drawDichogamy(cx, cy, size); break;
        case 2: drawHerkogamy(cx, cy, size); break;
        case 3: drawUnisexuality(cx, cy, size); break;
        case 4: drawAvoidance(cx, cy, size); break;
      }
    }
  }

  function drawIconOnly(idx, x, y, size) {
    // Small icon representation
    ctx.save();
    ctx.translate(x, y - 10);
    const scale = size / 50;
    ctx.scale(scale, scale);
    switch (idx) {
      case 0:
        // Flower with X
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          ctx.fillStyle = '#ec4899';
          ctx.beginPath();
          ctx.ellipse(Math.cos(a) * 18, Math.sin(a) * 18, 12, 6, a, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-15, -15); ctx.lineTo(15, 15);
        ctx.moveTo(15, -15); ctx.lineTo(-15, 15);
        ctx.stroke();
        break;
      case 1:
        // Two clocks
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(-14, 0, 14, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(14, 0, 14, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-14, -10); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(20, 8); ctx.stroke();
        break;
      case 2:
        // Arrows with offset
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath(); ctx.arc(-15, -8, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#a855f7';
        ctx.beginPath(); ctx.arc(15, -15, 8, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(-15, -8); ctx.lineTo(15, -15);
        ctx.stroke();
        ctx.setLineDash([]);
        break;
      case 3:
        // Male + female
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath(); ctx.arc(-12, 0, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ec4899';
        ctx.beginPath(); ctx.arc(12, 0, 10, 0, Math.PI * 2); ctx.fill();
        break;
      case 4:
        // Clock with different segments
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 12, 0, Math.PI / 2);
        ctx.closePath();
        ctx.fill();
        break;
    }
    ctx.restore();

    // Label
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(MECHANISMS[idx].title.split(' ')[0], x, y + size + 14);
  }

  function loop(t) {
    const dt = Math.min(0.05, (t - lastT) / 1000);
    lastT = t;
    phase = (phase + dt * 0.5) % 2;
    draw();
    animId = requestAnimationFrame(loop);
  }

  function setSelected(i) {
    selected = i;
    if (i < 0) {
      wrap.querySelector('#nameBar').textContent = 'Tap any mechanism';
      wrap.querySelector('#descBox').innerHTML = '<div class="text-[10px] font-bold text-emerald-300 mb-1">Why prevent self-pollination?</div><div class="text-[10px] text-slate-400 leading-relaxed">Continuous self-pollination causes inbreeding depression. Plants evolved 5 mechanisms to promote cross-pollination.</div>';
    } else {
      const m = MECHANISMS[i];
      wrap.querySelector('#nameBar').textContent = m.title;
      wrap.querySelector('#descBox').innerHTML = `<div class="text-[10px] font-bold text-emerald-300 mb-1">${m.title}</div><div class="text-[10px] text-slate-400 leading-relaxed">${m.desc}</div>`;
    }
    wrap.querySelectorAll('.mbtn').forEach((b, k) => {
      const on = k === i;
      b.classList.toggle('bg-emerald-500/20', on);
      b.classList.toggle('border-emerald-500/40', on);
      b.classList.toggle('text-emerald-300', on);
      b.classList.toggle('bg-white/5', !on);
      b.classList.toggle('border-white/10', !on);
      b.classList.toggle('text-slate-300', !on);
    });
  }

  wrap.querySelectorAll('.mbtn').forEach(b => {
    b.addEventListener('click', () => {
      const i = parseInt(b.dataset.i, 10);
      setSelected(i === selected ? -1 : i);
    });
  });

  wrap.querySelector('.reset-btn').addEventListener('click', () => setSelected(-1));
  wrap.querySelector('.back-btn').addEventListener('click', () => window.goBack());

  let ro = null;
  if ('ResizeObserver' in window) { ro = new ResizeObserver(resize); ro.observe(canvas); }
  resize();
  lastT = performance.now();
  animId = requestAnimationFrame(loop);

  return function cleanup() {
    if (animId) cancelAnimationFrame(animId);
    if (ro) ro.disconnect();
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    document.body.style.overflow = prevOverflow;
  };
}
