export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">Female Reproductive System</div><div class="text-[9px] text-slate-500 truncate">Class 12 Bio - Ch 2</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Selected</div>
        <div class="text-[10px] font-black text-pink-300" id="rSel">Tap organ</div>
      </div>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 max-h-[42vh] overflow-y-auto" style="backdrop-filter:blur(20px);">
      <div class="bg-white/5 rounded-xl p-3 border border-white/10">
        <div class="flex items-start gap-2">
          <div id="iColor" class="w-3 h-3 rounded-full mt-1.5 shrink-0" style="background:#ec4899"></div>
          <div class="flex-1 min-w-0">
            <div id="iName" class="text-xs font-black text-slate-100 mb-1">Tap any organ to learn</div>
            <div id="iDesc" class="text-[10px] text-slate-400 leading-relaxed">Female reproductive organs — ovaries, fallopian tubes, uterus, cervix, vagina.</div>
          </div>
        </div>
      </div>
      <div class="grid grid-cols-3 gap-1.5 mt-2">
        <button type="button" class="tog tog-labels py-2 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">Labels</button>
        <button type="button" class="tog tog-cycle py-2 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">Ovulation</button>
        <button type="button" class="tog tog-realism py-2 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">Realism</button>
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

  const ORGANS = [
    { id: 'ovary', name: 'Ovary (Female Gonad)', color: '#f472b6', info: 'Pair of almond-shaped organs on either side of uterus. Produce ova (oogenesis) + secrete estrogen & progesterone. Contains follicles at different maturation stages.', x: 0.18, y: 0.55, r: 32 },
    { id: 'oviduct', name: 'Fallopian Tube (Oviduct)', color: '#fb7185', info: 'Funnel-shaped tube (~10 cm). 4 parts: Infundibulum (fimbriae), Ampulla (fertilization site), Isthmus, Uterine part. Cilia + peristalsis move egg.', x: 0.32, y: 0.45, r: 18 },
    { id: 'uterus', name: 'Uterus (Womb)', color: '#a855f7', info: 'Pear-shaped muscular organ. 3 layers: Perimetrium, Myometrium (muscular), Endometrium (inner lining). Site of implantation + fetal development.', x: 0.5, y: 0.55, r: 45 },
    { id: 'cervix', name: 'Cervix', color: '#8b5cf6', info: 'Narrow lower part of uterus. Opens into vagina. Produces cervical mucus that helps/hinders sperm. Dilates during childbirth.', x: 0.5, y: 0.75, r: 20 },
    { id: 'vagina', name: 'Vagina', color: '#d946ef', info: 'Muscular tube from cervix to outside. Receives penis during coitus, passage for menstrual flow + childbirth (birth canal).', x: 0.5, y: 0.87, r: 22 }
  ];

  let selected = null, showLabels = true, showOvulation = true, realism = true;
  let animId = null, phase = 0;

  function w2s(x, y) { return { x: x * W, y: y * H }; }

  function drawBody() {
    // Pelvis outline
    ctx.strokeStyle = 'rgba(148,163,184,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const bx = W * 0.1, by = H * 0.05, bw = W * 0.8, bh = H * 0.9;
    ctx.moveTo(bx + bw * 0.2, by + bh * 0.1);
    ctx.quadraticCurveTo(bx, by + bh * 0.35, bx + bw * 0.1, by + bh * 0.65);
    ctx.quadraticCurveTo(bx + bw * 0.15, by + bh * 0.9, bx + bw * 0.5, by + bh);
    ctx.quadraticCurveTo(bx + bw * 0.85, by + bh * 0.9, bx + bw * 0.9, by + bh * 0.65);
    ctx.quadraticCurveTo(bx + bw, by + bh * 0.35, bx + bw * 0.8, by + bh * 0.1);
    ctx.stroke();

    // Bladder hint
    const bladder = w2s(0.5, 0.18);
    ctx.fillStyle = 'rgba(251,191,36,0.15)';
    ctx.beginPath();
    ctx.ellipse(bladder.x, bladder.y, 28, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(251,191,36,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    if (showLabels) {
      ctx.fillStyle = 'rgba(251,191,36,0.9)';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Bladder', bladder.x, bladder.y - 30);
    }

    // Rectum hint
    const rectum = w2s(0.5, 0.7);
    ctx.fillStyle = 'rgba(120,53,15,0.2)';
    ctx.beginPath();
    ctx.ellipse(rectum.x + 100, rectum.y, 25, 60, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawUterus() {
    const u = w2s(0.5, 0.55);
    const w = 90, h = 100;
    const isSel = selected && selected.id === 'uterus';

    // Uterus shape (pear)
    const g = ctx.createRadialGradient(u.x - 15, u.y - 15, 5, u.x, u.y, w);
    g.addColorStop(0, '#fbcfe8');
    g.addColorStop(0.5, '#ec4899');
    g.addColorStop(1, '#9d174d');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(u.x - w * 0.55, u.y - h * 0.5);
    ctx.quadraticCurveTo(u.x - w * 0.6, u.y + h * 0.2, u.x - w * 0.35, u.y + h * 0.5);
    ctx.lineTo(u.x + w * 0.35, u.y + h * 0.5);
    ctx.quadraticCurveTo(u.x + w * 0.6, u.y + h * 0.2, u.x + w * 0.55, u.y - h * 0.5);
    ctx.quadraticCurveTo(u.x, u.y - h * 0.7, u.x - w * 0.55, u.y - h * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = isSel ? '#f0abfc' : 'rgba(157,23,77,0.7)';
    ctx.lineWidth = isSel ? 3 : 2;
    ctx.stroke();

    // Endometrium (inner)
    if (realism) {
      ctx.fillStyle = 'rgba(220,38,38,0.3)';
      ctx.beginPath();
      ctx.moveTo(u.x - w * 0.42, u.y - h * 0.4);
      ctx.quadraticCurveTo(u.x - w * 0.45, u.y + h * 0.15, u.x - w * 0.28, u.y + h * 0.42);
      ctx.lineTo(u.x + w * 0.28, u.y + h * 0.42);
      ctx.quadraticCurveTo(u.x + w * 0.45, u.y + h * 0.15, u.x + w * 0.42, u.y - h * 0.4);
      ctx.quadraticCurveTo(u.x, u.y - h * 0.55, u.x - w * 0.42, u.y - h * 0.4);
      ctx.closePath();
      ctx.fill();
    }

    if (showLabels) {
      ctx.fillStyle = '#f472b6';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Uterus', u.x, u.y);
    }
  }

  function drawOviduct(side) {
    // side: 1 (left), -1 (right)
    const start = w2s(side === 1 ? 0.18 : 0.82, 0.55);
    const end = w2s(side === 1 ? 0.42 : 0.58, 0.35);
    const ctrl = w2s(side === 1 ? 0.22 : 0.78, 0.3);
    const isSel = selected && selected.id === 'oviduct';

    ctx.strokeStyle = isSel ? '#f0abfc' : '#fb7185';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.quadraticCurveTo(ctrl.x, ctrl.y, end.x, end.y);
    ctx.stroke();

    // Fimbriae at ovary end
    for (let i = 0; i < 5; i++) {
      const ang = -Math.PI * 0.2 + (i / 4) * Math.PI * 0.4;
      const fx = start.x + Math.cos(ang + Math.PI) * 15;
      const fy = start.y + Math.sin(ang + Math.PI) * 15;
      ctx.strokeStyle = '#fb7185';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(fx, fy);
      ctx.stroke();
    }

    if (showLabels) {
      ctx.fillStyle = '#fb7185';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      const lx = side === 1 ? W * 0.14 : W * 0.86;
      ctx.fillText('Oviduct', lx, H * 0.35);
    }
  }

  function drawOvary(side) {
    const o = w2s(side === 1 ? 0.18 : 0.82, 0.55);
    const r = 32;
    const isSel = selected && selected.id === 'ovary';

    const g = ctx.createRadialGradient(o.x - r*0.3, o.y - r*0.3, r*0.1, o.x, o.y, r);
    g.addColorStop(0, '#fce7f3');
    g.addColorStop(0.5, '#f472b6');
    g.addColorStop(1, '#be185d');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(o.x, o.y, r * 0.85, r, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isSel ? '#f0abfc' : '#9d174d';
    ctx.lineWidth = isSel ? 3 : 2;
    ctx.stroke();

    // Follicles (different stages)
    if (realism) {
      const follicles = [
        { dx: -10, dy: -10, r: 5, stage: 'primary' },
        { dx: 8, dy: -5, r: 7, stage: 'secondary' },
        { dx: -5, dy: 12, r: 9, stage: 'graafian' },
        { dx: 12, dy: 12, r: 4, stage: 'primordial' }
      ];
      follicles.forEach(f => {
        ctx.fillStyle = f.stage === 'graafian' ? 'rgba(251,191,36,0.85)' : 'rgba(254,240,138,0.7)';
        ctx.beginPath();
        ctx.arc(o.x + f.dx, o.y + f.dy, f.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#a16207';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      });
    }

    if (showLabels) {
      ctx.fillStyle = '#f472b6';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Ovary', o.x, o.y - r - 10);
    }
  }

  function drawCervixVagina() {
    const c = w2s(0.5, 0.75);
    const isC = selected && selected.id === 'cervix';
    // Cervix
    ctx.fillStyle = isC ? 'rgba(240,171,252,0.9)' : '#8b5cf6';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(c.x - 22, c.y - 18, 44, 32, 6);
    else ctx.rect(c.x - 22, c.y - 18, 44, 32);
    ctx.fill();
    ctx.strokeStyle = 'rgba(76,29,149,0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Vagina
    const v = w2s(0.5, 0.87);
    const isV = selected && selected.id === 'vagina';
    ctx.fillStyle = isV ? 'rgba(240,171,252,0.9)' : '#d946ef';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(v.x - 20, v.y - 15, 40, 45, 8);
    else ctx.rect(v.x - 20, v.y - 15, 40, 45);
    ctx.fill();
    ctx.strokeStyle = 'rgba(112,26,117,0.7)';
    ctx.stroke();

    if (showLabels) {
      ctx.fillStyle = '#c084fc';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Cervix', c.x + 55, c.y);
      ctx.fillText('Vagina', v.x + 55, v.y + 8);
    }
  }

  function drawOvulation() {
    if (!showOvulation) return;
    // Egg traveling from ovary to uterus
    const t = (phase * 0.3) % 2;
    let px, py;
    if (t < 1) {
      // Left ovary to uterus
      const tt = t;
      const start = w2s(0.18, 0.55);
      const end = w2s(0.42, 0.35);
      const ctrl = w2s(0.22, 0.3);
      px = (1 - tt) * (1 - tt) * start.x + 2 * (1 - tt) * tt * ctrl.x + tt * tt * end.x;
      py = (1 - tt) * (1 - tt) * start.y + 2 * (1 - tt) * tt * ctrl.y + tt * tt * end.y;
    } else {
      const tt = t - 1;
      const start = w2s(0.82, 0.55);
      const end = w2s(0.58, 0.35);
      const ctrl = w2s(0.78, 0.3);
      px = (1 - tt) * (1 - tt) * start.x + 2 * (1 - tt) * tt * ctrl.x + tt * tt * end.x;
      py = (1 - tt) * (1 - tt) * start.y + 2 * (1 - tt) * tt * ctrl.y + tt * tt * end.y;
    }
    // Egg cell
    const glow = ctx.createRadialGradient(px, py, 0, px, py, 12);
    glow.addColorStop(0, 'rgba(251,191,36,0.9)');
    glow.addColorStop(1, 'rgba(251,191,36,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(px, py, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Corona radiata
    ctx.strokeStyle = 'rgba(251,191,36,0.6)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + phase;
      ctx.beginPath();
      ctx.moveTo(px + Math.cos(a) * 8, py + Math.sin(a) * 8);
      ctx.lineTo(px + Math.cos(a) * 12, py + Math.sin(a) * 12);
      ctx.stroke();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#0f172a'); bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    drawBody();
    drawOviduct(1);
    drawOviduct(-1);
    drawUterus();
    drawCervixVagina();
    drawOvary(1);
    drawOvary(-1);
    drawOvulation();
  }

  function loop() { phase += 0.02; draw(); animId = requestAnimationFrame(loop); }

  function findOrgan(px, py) {
    for (let i = ORGANS.length - 1; i >= 0; i--) {
      const o = ORGANS[i];
      const s = w2s(o.x, o.y);
      if (o.id === 'ovary') {
        if (Math.hypot(px - s.x, py - s.y) < o.r + 5 || Math.hypot(px - (W - s.x), py - s.y) < o.r + 5) return o;
      } else {
        if (Math.hypot(px - s.x, py - s.y) < o.r + 20) return o;
      }
    }
    return null;
  }

  function onDown(e) {
    const rect = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    const px = t.clientX - rect.left, py = t.clientY - rect.top;
    const o = findOrgan(px, py);
    if (o) {
      selected = o;
      wrap.querySelector('#rSel').textContent = o.name.split(' ')[0];
      wrap.querySelector('#iName').textContent = o.name;
      wrap.querySelector('#iDesc').textContent = o.info;
      wrap.querySelector('#iColor').style.background = o.color;
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
  wrap.querySelector('.tog-labels').addEventListener('click', () => { showLabels = !showLabels; setTog('.tog-labels', showLabels); });
  wrap.querySelector('.tog-cycle').addEventListener('click', () => { showOvulation = !showOvulation; setTog('.tog-cycle', showOvulation); });
  wrap.querySelector('.tog-realism').addEventListener('click', () => { realism = !realism; setTog('.tog-realism', realism); });

  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    selected = null;
    wrap.querySelector('#rSel').textContent = 'Tap organ';
    wrap.querySelector('#iName').textContent = 'Tap any organ to learn';
    wrap.querySelector('#iDesc').textContent = 'Female reproductive organs — ovaries, fallopian tubes, uterus, cervix, vagina.';
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
