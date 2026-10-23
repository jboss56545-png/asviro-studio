export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0">
        <div class="text-xs font-black text-slate-100 truncate">Pollination Agents</div>
        <div class="text-[9px] text-slate-500 truncate">Class 12 Bio - Ch 1</div>
      </div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-1/2 -translate-x-1/2 bg-white/10 border border-white/10 rounded-xl px-3 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[10px] font-black text-slate-100 text-center" id="flowerName">Tap a flower</div>
      </div>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 space-y-2.5" style="backdrop-filter:blur(20px);">
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10" id="infoBox">
        <div class="text-[10px] font-bold text-emerald-300 mb-1">Tap any flower to learn</div>
        <div class="text-[10px] text-slate-400 leading-relaxed">4 types of pollination agents: Wind (Anemophily), Water (Hydrophily), Insect (Entomophily), Bird (Ornithophily).</div>
      </div>
      <div class="grid grid-cols-4 gap-1.5">
        <button type="button" class="chip py-2 rounded-xl text-[9px] font-bold bg-white/5 border border-white/10 text-slate-300" data-idx="0">Wind</button>
        <button type="button" class="chip py-2 rounded-xl text-[9px] font-bold bg-white/5 border border-white/10 text-slate-300" data-idx="1">Water</button>
        <button type="button" class="chip py-2 rounded-xl text-[9px] font-bold bg-white/5 border border-white/10 text-slate-300" data-idx="2">Insect</button>
        <button type="button" class="chip py-2 rounded-xl text-[9px] font-bold bg-white/5 border border-white/10 text-slate-300" data-idx="3">Bird</button>
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

  const FLOWERS = [
    { key: 'wind', name: 'Wind — Anemophily', color: '#a16207', bg: '#854d0e', info: 'Small, dull, no nectar/fragrance. Huge pollen production. Feathery stigma to catch airborne pollen. Example: Maize, Grasses.' },
    { key: 'water', name: 'Water — Hydrophily', color: '#0e7490', bg: '#155e75', info: 'Ribbon-like pollen in Vallisneria. Pollen floats on water surface. Rare type — only ~30 plants. Example: Vallisneria, Zostera.' },
    { key: 'insect', name: 'Insect — Entomophily', color: '#be185d', bg: '#9d174d', info: 'Bright colored, scented, nectar-rich. Sticky pollen grains. Sticky stigma. Most common type. Example: Sunflower, Rose.' },
    { key: 'bird', name: 'Bird — Ornithophily', color: '#dc2626', bg: '#b91c1c', info: 'Red tubular flowers, lots of nectar, no scent (birds have weak smell). Sturdy structure for bird landing. Example: Bignonia, Silk cotton.' }
  ];

  let selected = -1;
  let hoverIdx = -1;
  let animId = null, lastT = 0;
  let particles = [];

  function initParticles() {
    particles = [];
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H * 0.6,
        vx: (Math.random() - 0.5) * 20 + 15,
        vy: (Math.random() - 0.5) * 5,
        r: 1.5 + Math.random() * 1.5,
        color: '#facc15'
      });
    }
  }

  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0a1628');
    g.addColorStop(0.6, '#0a0f1a');
    g.addColorStop(1, '#050a14');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Ground
    ctx.fillStyle = 'rgba(22,101,52,0.2)';
    ctx.beginPath();
    ctx.moveTo(0, H * 0.92);
    ctx.quadraticCurveTo(W * 0.5, H * 0.88, W, H * 0.92);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();
  }

  function flowerPos(i) {
    const cols = 2;
    const rows = 2;
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cellW = W / cols;
    const cellH = (H * 0.88) / rows;
    return {
      x: cellW * col + cellW / 2,
      y: cellH * row + cellH / 2 + 20,
      size: Math.min(cellW, cellH) * 0.35
    };
  }

  function drawWindFlower(cx, cy, size, isActive) {
    // Dull green/brown flower — small, no petals showy
    // Stem
    ctx.strokeStyle = '#4d7c0f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy + size * 0.8);
    ctx.lineTo(cx, cy + size * 1.6);
    ctx.stroke();

    // Small dull petals
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx.fillStyle = isActive ? '#d97706' : '#a16207';
      ctx.beginPath();
      ctx.ellipse(cx + Math.cos(a) * size * 0.35, cy + Math.sin(a) * size * 0.35, size * 0.25, size * 0.12, a, 0, Math.PI * 2);
      ctx.fill();
    }
    // Feathery stigma sticking out top
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 1.5;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * 3, cy - size * 0.5);
      ctx.lineTo(cx + i * 5, cy - size * 1.2);
      ctx.stroke();
    }
    // Small pollen dots floating
    if (isActive) {
      for (let i = 0; i < 8; i++) {
        const p = particles[i];
        if (p.x > W) p.x = 0;
        p.x += 0.5;
        ctx.fillStyle = 'rgba(250,204,21,0.7)';
        ctx.beginPath();
        ctx.arc(cx + Math.sin(performance.now() * 0.001 + i) * 30, cy - size * 1.3 + i * 3, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawWaterFlower(cx, cy, size, isActive) {
    // Underwater plant with flower
    // Water ripples
    ctx.strokeStyle = isActive ? 'rgba(34,211,238,0.6)' : 'rgba(34,211,238,0.25)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      const ry = cy + size * 0.3 + i * 12;
      ctx.beginPath();
      ctx.moveTo(cx - size * 1.5, ry);
      ctx.quadraticCurveTo(cx, ry + Math.sin(performance.now() * 0.002 + i) * 4, cx + size * 1.5, ry);
      ctx.stroke();
    }
    // Underwater stem
    ctx.strokeStyle = '#0891b2';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy + size * 1.6);
    ctx.stroke();
    // Flower (submerged)
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.fillStyle = isActive ? '#0e7490' : '#155e75';
      ctx.beginPath();
      ctx.ellipse(cx + Math.cos(a) * size * 0.4, cy + Math.sin(a) * size * 0.4, size * 0.3, size * 0.15, a, 0, Math.PI * 2);
      ctx.fill();
    }
    // Ribbon pollen floating
    if (isActive) {
      for (let i = 0; i < 3; i++) {
        const t = (performance.now() * 0.0005 + i) % 1;
        const px = cx - size * 1.5 + t * size * 3;
        const py = cy - size * 0.8;
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.quadraticCurveTo(px + 8, py - 4, px + 16, py);
        ctx.stroke();
      }
    }
  }

  function drawInsectFlower(cx, cy, size, isActive) {
    // Bright pink flower with lots of petals
    ctx.strokeStyle = '#166534';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy + size * 0.8);
    ctx.lineTo(cx, cy + size * 1.6);
    ctx.stroke();

    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const g = ctx.createRadialGradient(cx, cy, size * 0.2, cx, cy + size * 0.4, size * 0.5);
      g.addColorStop(0, isActive ? '#f9a8d4' : '#ec4899');
      g.addColorStop(1, isActive ? '#ec4899' : '#9d174d');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(cx + Math.cos(a) * size * 0.45, cy + Math.sin(a) * size * 0.45, size * 0.35, size * 0.18, a, 0, Math.PI * 2);
      ctx.fill();
    }
    // Center
    const cg = ctx.createRadialGradient(cx - 3, cy - 3, 1, cx, cy, size * 0.25);
    cg.addColorStop(0, '#fef3c7');
    cg.addColorStop(1, '#d97706');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.25, 0, Math.PI * 2);
    ctx.fill();

    // Bee visitor
    if (isActive) {
      const t = (performance.now() * 0.001) % 1;
      const beeX = cx + Math.cos(t * Math.PI * 2) * size * 0.9;
      const beeY = cy + Math.sin(t * Math.PI * 2) * size * 0.5 - size * 0.5;
      // wings
      ctx.fillStyle = 'rgba(200,220,255,0.6)';
      ctx.beginPath();
      ctx.ellipse(beeX - 4, beeY - 4, 4, 3, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(beeX + 4, beeY - 4, 4, 3, 0.5, 0, Math.PI * 2);
      ctx.fill();
      // body
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.ellipse(beeX, beeY, 7, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1f2937';
      for (let s = -1; s <= 1; s++) {
        ctx.beginPath();
        ctx.ellipse(beeX + s * 2.5, beeY, 1, 5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawBirdFlower(cx, cy, size, isActive) {
    // Red tubular flower
    ctx.strokeStyle = '#166534';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy + size * 0.8);
    ctx.lineTo(cx, cy + size * 1.6);
    ctx.stroke();

    // Tube
    const tg = ctx.createLinearGradient(cx, cy - size, cx, cy + size);
    tg.addColorStop(0, isActive ? '#ef4444' : '#b91c1c');
    tg.addColorStop(1, isActive ? '#7f1d1d' : '#7f1d1d');
    ctx.fillStyle = tg;
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.2, cy + size * 0.3);
    ctx.quadraticCurveTo(cx - size * 0.3, cy - size * 0.5, cx, cy - size * 1.0);
    ctx.quadraticCurveTo(cx + size * 0.3, cy - size * 0.5, cx + size * 0.2, cy + size * 0.3);
    ctx.closePath();
    ctx.fill();

    // Petals opening at top
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i - 2) * 0.5;
      ctx.fillStyle = isActive ? '#dc2626' : '#991b1b';
      ctx.beginPath();
      ctx.ellipse(cx + Math.cos(a) * size * 0.25, cy - size * 0.9 + Math.sin(a) * size * 0.15, size * 0.18, size * 0.1, a, 0, Math.PI * 2);
      ctx.fill();
    }

    // Hummingbird visitor
    if (isActive) {
      const t = (performance.now() * 0.0008) % 1;
      const bx = cx + Math.sin(t * Math.PI * 2) * size * 0.6;
      const by = cy - size * 0.8;
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.ellipse(bx, by, size * 0.3, size * 0.15, -0.3, 0, Math.PI * 2);
      ctx.fill();
      // Beak
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(bx - size * 0.25, by + 2);
      ctx.lineTo(bx - size * 0.5, by + 8);
      ctx.stroke();
      // Wing
      ctx.fillStyle = 'rgba(16,185,129,0.7)';
      ctx.beginPath();
      ctx.ellipse(bx, by - 3, size * 0.15, size * 0.08, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawBackground();

    FLOWERS.forEach((f, i) => {
      const pos = flowerPos(i);
      const isActive = (i === selected);
      // Card background
      ctx.fillStyle = isActive ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)';
      const cellW = W / 2;
      const cellH = (H * 0.88) / 2;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(pos.x - cellW / 2 + 8, pos.y - cellH / 2 + 8, cellW - 16, cellH - 16, 16);
      else ctx.rect(pos.x - cellW / 2 + 8, pos.y - cellH / 2 + 8, cellW - 16, cellH - 16);
      ctx.fill();
      if (isActive) {
        ctx.strokeStyle = 'rgba(16,185,129,0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      switch (f.key) {
        case 'wind': drawWindFlower(pos.x, pos.y, pos.size, isActive); break;
        case 'water': drawWaterFlower(pos.x, pos.y, pos.size, isActive); break;
        case 'insect': drawInsectFlower(pos.x, pos.y, pos.size, isActive); break;
        case 'bird': drawBirdFlower(pos.x, pos.y, pos.size, isActive); break;
      }

      // Label
      ctx.fillStyle = isActive ? '#34d399' : '#94a3b8';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(f.key.toUpperCase(), pos.x, pos.y + pos.size * 1.9);
    });
  }

  function loop(t) {
    lastT = t;
    draw();
    animId = requestAnimationFrame(loop);
  }

  function setInfo(idx) {
    selected = idx;
    if (idx < 0) {
      wrap.querySelector('#flowerName').textContent = 'Tap a flower';
      wrap.querySelector('#infoBox').innerHTML = '<div class="text-[10px] font-bold text-emerald-300 mb-1">Tap any flower to learn</div><div class="text-[10px] text-slate-400 leading-relaxed">4 types of pollination agents: Wind (Anemophily), Water (Hydrophily), Insect (Entomophily), Bird (Ornithophily).</div>';
    } else {
      const f = FLOWERS[idx];
      wrap.querySelector('#flowerName').textContent = f.name;
      wrap.querySelector('#infoBox').innerHTML = `<div class="text-[10px] font-bold text-emerald-300 mb-1">${f.name}</div><div class="text-[10px] text-slate-400 leading-relaxed">${f.info}</div>`;
    }
    // Update chip styling
    wrap.querySelectorAll('.chip').forEach((c, i) => {
      const on = i === idx;
      c.classList.toggle('bg-emerald-500/20', on);
      c.classList.toggle('border-emerald-500/40', on);
      c.classList.toggle('text-emerald-300', on);
      c.classList.toggle('bg-white/5', !on);
      c.classList.toggle('border-white/10', !on);
      c.classList.toggle('text-slate-300', !on);
    });
  }

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }
  function onDown(e) {
    const p = getPos(e);
    for (let i = 0; i < 4; i++) {
      const pos = flowerPos(i);
      const cellW = W / 2, cellH = (H * 0.88) / 2;
      if (Math.abs(p.x - pos.x) < cellW / 2 && Math.abs(p.y - pos.y) < cellH / 2) {
        setInfo(i === selected ? -1 : i);
        return;
      }
    }
  }
  canvas.addEventListener('pointerdown', onDown);

  wrap.querySelectorAll('.chip').forEach((c) => {
    c.addEventListener('click', () => {
      const idx = parseInt(c.dataset.idx, 10);
      setInfo(idx === selected ? -1 : idx);
    });
  });

  wrap.querySelector('.reset-btn').addEventListener('click', () => setInfo(-1));
  wrap.querySelector('.back-btn').addEventListener('click', () => window.goBack());

  let ro = null;
  if ('ResizeObserver' in window) {
    ro = new ResizeObserver(() => { resize(); initParticles(); });
    ro.observe(canvas);
  }
  resize();
  initParticles();
  lastT = performance.now();
  animId = requestAnimationFrame(loop);

  return function cleanup() {
    if (animId) cancelAnimationFrame(animId);
    if (ro) ro.disconnect();
    canvas.removeEventListener('pointerdown', onDown);
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    document.body.style.overflow = prevOverflow;
  };
}
